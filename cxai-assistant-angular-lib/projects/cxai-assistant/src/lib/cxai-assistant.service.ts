import { inject, Injectable } from '@angular/core';
import { ASSISTANT_CONFIG_SCOPE, ASSISTANT_LOG_MARKER, AssistantChatMessage, AssistantChatSession, AssistantChatSessionInternal, AssistantContext, AssistantUserInput, CxaiAssistantConfig, EMPTY_CHAT_SESSION } from '@cx-spartacus/cxai-assistant/root';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { BaseSiteService, LoggerService, TranslationService, WindowRef } from '@spartacus/core';
import { CurrentProductService } from '@spartacus/storefront';
import { asyncScheduler, BehaviorSubject, catchError, combineLatest, defaultIfEmpty, distinctUntilChanged, EMPTY, filter, finalize, map, Observable, observeOn, of, skip, switchMap, take, tap, timeout } from 'rxjs';
import { ChatMessagePipe } from './cms-components/chat-message.pipe';
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

  protected winRef = inject(WindowRef);
  protected config = inject(CxaiAssistantConfig)[ASSISTANT_CONFIG_SCOPE];
  protected loggerService = inject(LoggerService);
  protected activeCartFacade = inject(ActiveCartFacade);
  protected currentProductService = inject(CurrentProductService);
  protected chatMessagePipe = inject(ChatMessagePipe);
  protected baseSiteService = inject(BaseSiteService);
  protected translationService = inject(TranslationService);
  protected apiService = inject(CxaiAssistantApiService);
  protected currentBaseSite;
  currentBaseSiteName;

  constructor() {
    this.baseSiteService.getActive().pipe(
      filter(Boolean),
      distinctUntilChanged(),
      tap(site => {
        this.currentBaseSite = site;
        this.sessionStorageKey = SESSION_STORAGE_KEY_PREFIX + '_' + site;
        const sessionId = this.winRef.sessionStorage?.getItem(this.sessionStorageKey) || null;
        this.sessionId$.next(sessionId);
      }),
      switchMap((site) => {
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

            this.parseChatMessage(adaptedMessage);
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
          return this.apiService.getChatSession(sessionId).pipe(
            map(session => {
              let adaptedSession = this.adaptInternalChatSession(session, welcomeMessageOverwrite);
              adaptedSession.session_id = sessionId;
              return adaptedSession;
            }),
            catchError((e) => {
              this.loggerService.error(ASSISTANT_LOG_MARKER, `Error loading chat session ${sessionId}`, e);
              if(this.sessionStorageKey) {
                this.winRef.sessionStorage?.removeItem(this.sessionStorageKey);
              }

              this.sessionId$.next(null);

              //if we can't load this session, try creating a new one
              if(createAttempts < 2) {
                createAttempts += 1;
                if(openIfNoSession) {
                  this.startNewChatSession();
                }

                return of(this.getEmptyChatSession(openIfNoSession, welcomeMessageOverwrite));
              } else {
                const result = Object.assign({}, EMPTY_CHAT_SESSION);
                result.chat_history = [
                  assistantErrorMessage('Error loading chat session: ' + (e.status || e.message))
                ];
                return of(result);
              }
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
      }

      this.removeContextFromChatMessage(adaptedMessage);
      this.parseChatMessage(adaptedMessage);
      adaptedSession.chat_history.push(adaptedMessage);
    });

    return adaptedSession;
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