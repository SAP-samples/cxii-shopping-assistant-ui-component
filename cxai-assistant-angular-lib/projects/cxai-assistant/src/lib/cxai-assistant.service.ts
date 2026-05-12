import { inject, Injectable } from '@angular/core';
import {
  ASSISTANT_CONFIG_SCOPE,
  ASSISTANT_LOG_MARKER,
  AssistantAction,
  AssistantChatMessage,
  AssistantChatResponse,
  AssistantChatSession,
  AssistantChatSessionInternal,
  AssistantContext,
  AssistantUserInput,
  CxaiAssistantApiService,
  CxaiAssistantConfig,
  EMPTY_CHAT_SESSION,
  mapActionToTokenType,
} from '@cx-spartacus/cxai-assistant/root';
import { IBaseSiteService, ILoggerService, ITranslationService, IWindowRef } from '@cx-spartacus/cxai-assistant/root';
import {
  asyncScheduler,
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  forkJoin,
  map,
  Observable,
  observeOn,
  of,
  skip,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { IMiscSpartacusActionsService } from './i-cart-actions.service';

//exported for testing purposes
export const ERROR_SESSION_ID = '';
const SESSION_STORAGE_KEY_PREFIX = 'cxai-assistant.sessionId';
const WELCOME_MESSAGE_TRANSLATION_KEY = 'cxaiAssistant.welcomeMessage';
@Injectable()
export class CxaiAssistantService {
  protected sessionStorageKey: string | undefined;
  protected sessionId$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  protected chatWindowSize$ = new BehaviorSubject<{x: number, y: number} | undefined>(undefined);
  protected sessionIsBeingCreated = false;

  // reassigned in test cases
  protected config = inject(CxaiAssistantConfig)[ASSISTANT_CONFIG_SCOPE];
  private readonly winRef = inject(IWindowRef);
  private readonly loggerService = inject(ILoggerService);
  private readonly baseSiteService = inject(IBaseSiteService);
  private readonly miscSpartacusActionsService = inject(IMiscSpartacusActionsService);
  private readonly translationService = inject(ITranslationService);
  private readonly apiService = inject(CxaiAssistantApiService);
  protected currentBaseSite;
  currentBaseSiteName;

  constructor() {
    combineLatest([
      this.baseSiteService.getActive().pipe(filter(Boolean), distinctUntilChanged()),
    ]).pipe(
      tap(([site]) => {
        this.currentBaseSite = site;
        this.sessionStorageKey = SESSION_STORAGE_KEY_PREFIX + '_' + site;// + '_' + userId;
        const sessionId = this.winRef.sessionStorage?.getItem(this.sessionStorageKey) || null;
        if(sessionId !== this.sessionId$.value) {
          this.sessionId$.next(sessionId);
        }
      }),
      distinctUntilChanged((prev, curr) => prev[0] === curr[0]), //when site changes
      switchMap(([site]) => {
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
      take(1),
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
            this.apiService.getChatSession(sessionId),
          ]).pipe(
            map(([session]) => {
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
   * @param initialUserMessage if provided it will create session and send message + also validate
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
      this.apiService.createChatSession(this.config.assistantConfigId, this.config.assistantProductFilters ?? []);

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
          this.miscSpartacusActionsService.reloadCart();
          break;
      }
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
    if(context.pdpProductCode) {
      message.product_id = context.pdpProductCode;
    }

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

  protected getPageContext(): Observable<AssistantContext> {
    return this.miscSpartacusActionsService.getPageContext();
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
