import { inject, Injectable } from '@angular/core';
import { ASSISTANT_CONFIG_SCOPE, ASSISTANT_LOG_MARKER, AssistantAction, AssistantChatMessage, AssistantChatResponse, AssistantChatSession, AssistantChatSessionInternal, AssistantContext, AssistantUserInput, CxaiAssistantConfig, EMPTY_CHAT_SESSION, mapActionToTokenType } from '@cx-spartacus/cxai-assistant/root';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { BaseSiteService, LoggerService, OCC_USER_ID_ANONYMOUS, TranslationService, WindowRef } from '@spartacus/core';
import { CurrentProductService } from '@spartacus/storefront';
import { UserAccountFacade } from '@spartacus/user/account/root';
import { asyncScheduler, BehaviorSubject, catchError, combineLatest, defaultIfEmpty, distinctUntilChanged, EMPTY, filter, finalize, forkJoin, map, Observable, observeOn, of, skip, Subject, switchMap, take, tap, timeout } from 'rxjs';
import { CxaiAssistantApiService } from './cxai-assistant.api.service';

export const SESSION_STORAGE_KEY_PREFIX = 'cxai-assistant.sessionId';
export const ERROR_SESSION_ID = '';
const WELCOME_MESSAGE_TRANSLATION_KEY = 'cxaiAssistant.welcomeMessage';
@Injectable({
  providedIn: 'root'
})
export class CxaiAssistantService {
  protected sessionStorageKey: string | undefined;
  protected sessionId$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  protected chatWindowSize$ = new BehaviorSubject<{x: number, y: number} | undefined>(undefined);
  protected sessionIsBeingCreated = false;

  // reassigned in test cases
  protected config = inject(CxaiAssistantConfig)[ASSISTANT_CONFIG_SCOPE];
  private readonly winRef = inject(WindowRef);
  private readonly loggerService = inject(LoggerService);
  private readonly activeCartFacade = inject(ActiveCartFacade);
  private readonly currentProductService = inject(CurrentProductService);
  private readonly baseSiteService = inject(BaseSiteService);
  private readonly translationService = inject(TranslationService);
  private readonly apiService = inject(CxaiAssistantApiService);
  private readonly userAccountFacade = inject(UserAccountFacade);
  protected currentBaseSite;
  currentBaseSiteName;
  protected currentUser$ = this.userAccountFacade.get().pipe(
    distinctUntilChanged((prev, curr) => prev?.uid === curr?.uid),
  );

  protected customerId$ = this.currentUser$.pipe(
    map((user) => user?.customerId || user?.uid || null), 
    distinctUntilChanged(),
  );

  //notification with new sesssion id, when it changes
  readonly currentUserChange$ = new Subject<{ new_session_id: string | null }>();

  constructor() {
    combineLatest([
      this.currentUser$.pipe(
        map(user => user?.uid || OCC_USER_ID_ANONYMOUS),
      ),
      this.baseSiteService.getActive().pipe(filter(Boolean), distinctUntilChanged()),
    ]).pipe(
      tap(([userId, site]) => {
        this.currentBaseSite = site;
        this.sessionStorageKey = SESSION_STORAGE_KEY_PREFIX + '_' + site + '_' + userId;
        const sessionId = this.winRef.sessionStorage?.getItem(this.sessionStorageKey) || null;
        this.sessionId$.next(sessionId);

        //component can listen for this to create new session if conversation was in progress but user logged in/out
        //and have no session
        this.currentUserChange$.next({ new_session_id: sessionId });
      }),
      distinctUntilChanged((prev, curr) => prev[1] === curr[1]), //when site changes
      switchMap(([_, site]) => {
        return this.baseSiteService.getAll().pipe(
          filter(Boolean),
          map((sites) => sites.find((s) => s.uid === site)),
        )
      }),
    ).subscribe(site => {
      this.currentBaseSiteName = site?.name || '';
    })
  }

  getCurrentSessionId$(): Observable<string | null> {
    return this.sessionId$.asObservable().pipe(
      observeOn(asyncScheduler),
    );
  }

  sendQuestion(
    question: string,
  ): Observable<AssistantChatMessage> {

    const currentSessionId = this.sessionId$.value;
    if(!currentSessionId) {
      let observedCount = 0;
      return this.getCurrentSessionId$().pipe(
        take(2),
        tap(() => {
          if(++observedCount < 2) {
            this.startNewChatSession();
          }
        }),
        skip(1),
        switchMap(sessionId => sessionId ? this.sendQuestion(question) : of(assistantErrorMessage('Could not open session'))),
      );
    }

    const payload: AssistantUserInput = {
      user_input: question,
      session_id: currentSessionId,
    };

    return this.getPageContext().pipe(
      switchMap(context => {
        this.addContextToUserInput(payload, context);
        return this.apiService.postMessage(payload).pipe(
          map((response) => {

            const adaptedMessage = {
              content: response.response,
              role: 'assistant',
              recommendations: response.recommendations,
            } satisfies AssistantChatMessage;

            this.fillTokens(adaptedMessage, response.actions);
            this.parseChatMessage(adaptedMessage);
            this.processActions(response);
            return adaptedMessage;
          }),
          catchError((e) => {
            return of(assistantErrorMessage('Error loading response: ' + (e?.status || 0)));
          }),
        );
      }
    ));
  }

  /**
   * @param openIfNoSession if there is no session_id, or error loading session_id, open a new one, otherwise
   * it will return empty session with initial welcome message taken from translations
   */
  getChatSession(openIfNoSession = true): Observable<AssistantChatSession> {
    if(openIfNoSession && !this.sessionId$.value) {
      this.startNewChatSession();
    }

    //in case of error loading session we try to create a new one once
    let createAttempts = 1;

    return combineLatest([
      this.getCurrentSessionId$(),
      this.translationService.translate(WELCOME_MESSAGE_TRANSLATION_KEY, { context: this.currentBaseSite, siteName: this.currentBaseSiteName }, false).pipe(
        //in dev mode missing translation looks like [cxAiAssistant:cxAiAssistant.welcomeMessage], otherwise it is usually single character &nbsp;
        map(translation => translation?.length < 2 || translation?.startsWith('[') ? '' : translation),
        distinctUntilChanged(),
      ),
    ]).pipe(
      switchMap(([sessionId, welcomeMessageOverwrite]) => {
        if(sessionId) {
          return forkJoin([
            this.customerId$.pipe(take(1)),
            this.apiService.getChatSession(sessionId),
          ]).pipe(
            map(([customerId, session]) => {
              if(!this.validateSessionOwnership(session, customerId)) {
                throw new Error(`Session user_id ${session} does not belong to current customer`);
              }

              const adaptedSession = this.adaptInternalChatSession(session, welcomeMessageOverwrite);
              adaptedSession.session_id = sessionId;
              return adaptedSession;
            }),
            catchError((e) => {
              this.loggerService.error(ASSISTANT_LOG_MARKER, `Error loading chat session ${sessionId}`, e);
              if(this.sessionStorageKey) {
                this.winRef.sessionStorage?.removeItem(this.sessionStorageKey);
              }

              //if we can't load this session, try creating a new one
              if(createAttempts < 2 && openIfNoSession) {
                this.sessionId$.next(null);
                createAttempts += 1;
                if(openIfNoSession) {
                  this.startNewChatSession();
                }
              } else {
                this.sessionId$.next(ERROR_SESSION_ID);
              }

              //we emitted new sessionId, so here we return EMPTY observable
              //because it will be soon overwritten by new sessionId result
              return EMPTY;
            }),
          )
        } else if(sessionId === ERROR_SESSION_ID) {
          const result = Object.assign({}, EMPTY_CHAT_SESSION);
          result.chat_history = [assistantErrorMessage('Error creating chat session')];
          return of(result);
        } else {
          return of(this.getEmptyChatSession(openIfNoSession, welcomeMessageOverwrite));
        }
      }),
    );
  }

  protected validateSessionOwnership(session: AssistantChatSessionInternal, customerId: string | null): boolean {
    if(customerId) {
      //user is logged in, we accept both anonymous and sessions belonging to the user
      return session.user_id === customerId || !session.user_id;
    } else {
      //anonymous user, we accept only anonymous sessions
      return !session.user_id;
    }
  }

  protected getEmptyChatSession(loading: boolean, welcomeMessage: string): AssistantChatSession {
    if(!loading) {
      const result = Object.assign({}, EMPTY_CHAT_SESSION);
      result.chat_history = [
        {
          content: welcomeMessage, //|| `[${WELCOME_MESSAGE_TRANSLATION_KEY}]`,
          role: 'assistant',
        }
      ];
      result.status = 'unopened';
      return result;
    }

    return EMPTY_CHAT_SESSION;
  }

  isDummySession(session?: AssistantChatSession): boolean {
    return session?.status === 'unopened';
  }

  protected deleteChatSession(sessionId: string | null): void {
    if(sessionId) {
      this.apiService.deleteChatSession(sessionId).pipe(
        catchError((e) => {
          this.loggerService.debug(ASSISTANT_LOG_MARKER, `Error deleting session ${sessionId}`, e);
          return EMPTY;
        }),
      ).subscribe();
    }
  }

  /**
   * Open new chat session
   * @param initialUserMessage if provided it will use combined_chat_session endpoint and also validate
   * that sessonId is not already set, otherwise it will create a new session and if it already exists will
   * delete previous session after success
   */
  startNewChatSession(initialUserMessage?: string): void {
    if(!this.config?.assistantConfigId) {
      const errorMessage = 'Assistant configuration not specified';
      this.loggerService.error(ASSISTANT_LOG_MARKER, errorMessage, this.config);
      throw new Error(errorMessage);
    }

    if(initialUserMessage && this.sessionId$.value) {
      const errorMessage = 'startNewChatSession: initialUserMessage provided but session already exists';
      throw new Error(errorMessage);
    }

    if(this.sessionIsBeingCreated) {
      this.loggerService.warn(ASSISTANT_LOG_MARKER, 'startNewChatSession: already in progress');
      return;
    }

    this.sessionIsBeingCreated = true;

    const request = initialUserMessage ?
      this.apiService.postMessageAndCreateSession({
        user_input: initialUserMessage,
        config_id: this.config.assistantConfigId,
      }) :
      this.apiService.createChatSession(this.config.assistantConfigId);

    request.pipe(
      finalize(() => this.sessionIsBeingCreated = false),
      catchError((e) => {
        this.loggerService.error(ASSISTANT_LOG_MARKER, 'Error starting Assistant chat session', e);
        return of({ session_id: ERROR_SESSION_ID });
      }),
    ).subscribe((response) => {
      this.deleteChatSession(this.sessionId$.value);
      this.sessionId$.next(response.session_id);
      if(this.sessionStorageKey) {
        if(response.session_id) {
          this.winRef.sessionStorage?.setItem(this.sessionStorageKey, response.session_id);
        } else {
          this.winRef.sessionStorage?.removeItem(this.sessionStorageKey);
        }
      }
    });
  }

  /**
   * Convert session as returned via API into visible externally AssistantChatSession
   */
  protected adaptInternalChatSession(session: AssistantChatSessionInternal, welcomeMessageOverwrite): AssistantChatSession {
    if(welcomeMessageOverwrite && session.status) {
      if(session.chat_history.length > 0 && session.chat_history[0].role === 'assistant') {
        session.chat_history[0].content = welcomeMessageOverwrite;
      } else {
        session.chat_history.unshift({
          content: welcomeMessageOverwrite,
          role: 'assistant',
        });
      }
    }

    const adaptedSession: AssistantChatSession = {
      chat_history: [],
      status: session.status,
    };

    session.chat_history.forEach(message => {
      const adaptedMessage: AssistantChatMessage = {
        role: message.role,
        content: typeof message.content === 'string' ? message.content : message.content.response,
      };

      if(typeof message.content === 'object') {
        adaptedMessage.recommendations = message.content.recommendations;
        this.fillTokens(adaptedMessage, message.content.actions);
      }

      this.removeContextFromChatMessage(adaptedMessage);
      this.parseChatMessage(adaptedMessage);
      adaptedSession.chat_history.push(adaptedMessage);
    });

    return adaptedSession;
  }

  private fillTokens(message: AssistantChatMessage, actions: AssistantAction[] | undefined) {
    if (!actions?.length) return;
    
    message.tokens ??= {};
    actions
      .filter(action => action.codes?.length)
      .forEach(action => {
        const tokenType = mapActionToTokenType(action.action);
        message.tokens![tokenType] = (message.tokens![tokenType] ?? []).concat(action.codes!);
      });
  }

  /**
   * if chatbot did some backend modifications that require refreshing data 
   */
  protected processActions(message: AssistantChatResponse) {
    if(!message.actions) {
      return;
    }

    const processedActions = new Set<string>();
    message.actions.filter(action => 
      !processedActions.has(action.action) && processedActions.add(action.action)
    ).forEach(action => {
      switch (action.action) {
        case 'add_to_cart':
          this.reloadCart();
          break;
      }
    });
  }

  protected reloadCart() {
    this.activeCartFacade.getActiveCartId().pipe(
      switchMap(cartId => {
        if(cartId) {
          this.activeCartFacade.reloadActiveCart();
          return of(cartId);
        } else {
          return this.activeCartFacade.requireLoadedCart().pipe(
            filter(cart => !!cart?.code || !!cart?.guid),
            take(1),
            map(cart => cart.code || cart.guid || ''),
          )
        }
      }),
      take(1),
    ).subscribe(cartId => {
      this.loggerService.info(ASSISTANT_LOG_MARKER, 'Reloaded cart', cartId);
    });
  }

  protected parseChatMessage(message: AssistantChatMessage) {
    if(message.role === 'assistant') {
      if(message.recommendations?.length) {
        //merge all recommendations into one array and unify api
        const mergedRecommendations = new Set<string>();
        message.recommendations?.forEach(r => r.codes?.forEach(c => mergedRecommendations.add(c)));
        message.recommendations = [{ codes: Array.from(mergedRecommendations) } ];
      }
    }
  }

  protected addContextToUserInput(message: AssistantUserInput, context: AssistantContext): void {
    if(this.config?.chatMessageContextProvider) {
      const additionalContext = this.config.chatMessageContextProvider(context);
      if(additionalContext) {
        message.user_input = message.user_input + `\n\n[Additional Context:\n${additionalContext}\n]`;
      }
    }
  }

  protected removeContextFromChatMessage(message: AssistantChatMessage): void {
    const contextString = message.content.match(/\n\n\[Additional Context:.*\]$/s);
    if(contextString) {
      message.contextString = contextString[0];
      message.content = message.content.substring(0, message.content.length - message.contextString.length);
    }
  }

  getPageContext(): Observable<AssistantContext> {
    return combineLatest([
      this.activeCartFacade.getActive(),
      this.currentProductService.getProduct().pipe(
        defaultIfEmpty(null),
        timeout({ first: 1, with: () => of(undefined) }),
      )
    ]).pipe(map(([cart, pdpProduct]) => {
      return {
        cartProductCodes: cart.entries ? cart.entries.map(e => e.product?.code).filter(Boolean) as string[] : [],
        pdpProductCode: pdpProduct?.code,
      }
    }));
  }

  notifyResize(x: number, y: number) {
    this.chatWindowSize$.next({x, y});
  }

  getChatWindowSize$(): Observable<{x: number, y: number} | undefined> {
    return this.chatWindowSize$.asObservable();
  }
}

function assistantErrorMessage(message: string): AssistantChatMessage {
  return {
    content: message,
    role: 'assistant',
    error: true,
  }
}