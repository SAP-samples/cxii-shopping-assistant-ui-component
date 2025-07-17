import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AssistantChatResponse, AssistantChatSessionInternal, EMPTY_CHAT_SESSION } from '@cx-spartacus/cxai-assistant/root';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { BaseSiteService, LoggerService, OCC_USER_ID_ANONYMOUS, OccEndpointsService, TranslationService, UserIdService, WindowRef } from "@spartacus/core";
import { CurrentProductService } from '@spartacus/storefront';
import { UserAccountFacade } from '@spartacus/user/account/root';
import { EMPTY, of, skip, take } from 'rxjs';
import { CxaiAssistantApiService } from "./cxai-assistant.api.service";
import { CxaiAssistantService, ERROR_SESSION_ID } from './cxai-assistant.service';
import { mockCreateSessionResponse, mockFreshChatSessionResponse, mockOldChatSessionResponse, mockPostMessageResponse } from './testing/mocks/mock-responses';
import { provideHttpClient } from '@angular/common/http';

describe('CxaiAssistantService', () => {
  const debug = false;
  let service: CxaiAssistantService;
  let apiService: CxaiAssistantApiService;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;
  let currentProductServiceSpy: jasmine.SpyObj<CurrentProductService>;
  let activeCartFacadeSpy: jasmine.SpyObj<ActiveCartFacade>;
  let baseServiceSpy: jasmine.SpyObj<BaseSiteService>;
  let translateServiceSpy: jasmine.SpyObj<TranslationService>;
  let occEndpointsServiceSpy: jasmine.SpyObj<OccEndpointsService>;
  let windowRefSpy: jasmine.SpyObj<WindowRef>;
  let userIdServiceSpy: jasmine.SpyObj<UserIdService>;
  let userAccountFacadeSpy: jasmine.SpyObj<UserAccountFacade>;
  let httpMock: HttpTestingController;
  beforeEach(() => {
    const storageSpy = jasmine.createSpyObj('Storage', ['setItem', 'removeItem', 'getItem']);

    loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['warn', 'error']);
    currentProductServiceSpy = jasmine.createSpyObj('CurrentProductService', ['getProduct']);
    baseServiceSpy = jasmine.createSpyObj('BaseSiteService', ['getActive', 'getAll']);
    translateServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    occEndpointsServiceSpy = jasmine.createSpyObj('OccEndpointsService', ['buildUrl']);
    activeCartFacadeSpy = jasmine.createSpyObj('ActiveCartFacade', ['getActive']);
    windowRefSpy = jasmine.createSpyObj('WindowRef', [], {'sessionStorage': storageSpy, 'localStorage': storageSpy});
    userIdServiceSpy = jasmine.createSpyObj('UserIdService', ['getUserId']);
    userAccountFacadeSpy = jasmine.createSpyObj('UserAccountFacade', ['get']);

    baseServiceSpy.getActive.and.returnValue(of('mock-spa'));
    baseServiceSpy.getAll.and.returnValue(of([]));
    occEndpointsServiceSpy.buildUrl.and.callFake((url) => 'http://nowhere:9002' + url);
    translateServiceSpy.translate.and.returnValue(of(''));

    if(debug) {
      loggerServiceSpy.error.and.callFake((...args) => console.error(...args));
      loggerServiceSpy.warn.and.callFake((...args) => console.warn(...args));
    }

    currentProductServiceSpy.getProduct.and.returnValue(EMPTY);
    activeCartFacadeSpy.getActive.and.returnValue(of({}));

    userIdServiceSpy.getUserId.and.returnValue(of(OCC_USER_ID_ANONYMOUS));
    userAccountFacadeSpy.get.and.returnValue(of({ customerId: 'test-customer-id' }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        CxaiAssistantService,
        { provide: LoggerService, useValue: loggerServiceSpy },
        { provide: CurrentProductService, useValue: currentProductServiceSpy },
        { provide: BaseSiteService, useValue: baseServiceSpy },
        { provide: TranslationService, useValue: translateServiceSpy },
        { provide: OccEndpointsService, useValue: occEndpointsServiceSpy },
        { provide: WindowRef, useValue: windowRefSpy },
        { provide: ActiveCartFacade, useValue: activeCartFacadeSpy },
        { provide: UserIdService, useValue: userIdServiceSpy },
        { provide: UserAccountFacade, useValue: userAccountFacadeSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    service = TestBed.inject(CxaiAssistantService);
    service["config"] = { assistantConfigId: 'config-mock' };
    apiService = TestBed.inject(CxaiAssistantApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('start chat session', () => {
    service.startNewChatSession();
    
    expectCreateSessionRequest();
    expect(service['sessionId$'].value).toBe(mockCreateSessionResponse.session_id);
    expect(windowRefSpy.sessionStorage?.setItem).withContext("sessionId saved to storage").toHaveBeenCalled();

    //start new session again, should delete previous session
    const secondSession = Object.assign({}, mockCreateSessionResponse, { session_id: 'second-session-id' });
    service.startNewChatSession();
    expectCreateSessionRequest(secondSession);

    expectSessionDeleteRequest(mockCreateSessionResponse.session_id);
    expect(service['sessionId$'].value).toBe(secondSession.session_id);
  });

  it('start chat session - handle error', fakeAsync(() => {
    expect(service['sessionId$'].value).toBeNull();
    service['sessionId$'].pipe(skip(1)).subscribe(sessionId => {
      expect(sessionId).toBeFalsy();
      expect(sessionId).toBe(ERROR_SESSION_ID);
    })

    //should result in just one request due to check if request in in progress
    service.startNewChatSession();
    service.startNewChatSession();

    expectCreateSessionRequest({ errorStatus: 500 });
    expect(loggerServiceSpy.error).toHaveBeenCalled();
  }));

  it('start session with initialMessage', fakeAsync(() => {
    let sessionSeen = 0;
    service.getChatSession(false).subscribe(session => {
      sessionSeen += 1;
      if(sessionSeen === 1) {
        //dummy session with welcome message that is used before user sends first message
        expect(session.status).toBeTruthy();
        expect(session.session_id).toBeUndefined();
        expect(service.isDummySession(session)).toBeTrue();
      } else {
        //after sending message session is created
        expect(session.status).toBeTruthy();
        expect(session.session_id).toBe(mockCreateSessionResponse.session_id);
        expect(service.isDummySession(session)).toBeFalse();
        //user's message + response
        expect(session.chat_history.length).withContext("New session loaded").toBe(mockOldChatSessionResponse.chat_history.length);
      }
    });

    tick();

    const userInput = <string>mockOldChatSessionResponse.chat_history[1].content;
    service.startNewChatSession(userInput);
    //second should be ignored while session creation is in progress
    service.startNewChatSession(userInput);
    tick();

    const req = expectSendMessageAndCreateSessionRequest({...mockCreateSessionResponse, response: mockPostMessageResponse.response });
    tick();

    expectGetChatSessionRequest(mockCreateSessionResponse.session_id, mockOldChatSessionResponse);
    tick();

    expect(() => service.startNewChatSession(userInput)).withContext("Cant provide initialMessage if session already exists").toThrow();
    tick();
    expect(sessionSeen).toBe(2);
  }));

  it('getChatSession return dummy if not already opened', fakeAsync(() => {
    let sessionSeen = 0;
    const welcomeMessageOverwrite = 'cxaiAssistant.welcomeMessage';
    translateServiceSpy.translate.and.returnValue(of(welcomeMessageOverwrite));

    service.getChatSession(false).subscribe(session => {
      sessionSeen += 1;
      //some status must be returned to mark that this is final (i.e. not loading) session
      expect(session.status).toBeTruthy();
      expect(session.chat_history[0].content).withContext("should return local welcome message").toBe(welcomeMessageOverwrite);
      expect(session.session_id).toBeUndefined();
    });

    httpMock.expectNone(apiService.buildUrl(`/chat_session`));
    tick();
    expect(sessionSeen).toBe(1);
    tick();
    expect(sessionSeen).toBe(1);
  }));

  it('getChatSession open a new session if not already opened', fakeAsync(() => {
    let sessionSeen = 0;
    const welcomeMessageOverwrite = 'cxaiAssistant.welcomeMessage';
    translateServiceSpy.translate.and.returnValue(of(welcomeMessageOverwrite));

    service.getChatSession().subscribe(session => {
      sessionSeen += 1;
      if(sessionSeen === 1) {
        expect(session).withContext("return empty dummy session until properly created").toEqual(EMPTY_CHAT_SESSION);
        expect(session.status).toBeUndefined();
        expect(session.session_id).toBeUndefined();
      } else {
        expect(session.status).withContext("valid session has status set").toBeTruthy();
        expect(session.session_id).withContext("session_id is attached to the object by the service").toBe(mockCreateSessionResponse.session_id);
        expect(session.chat_history[0].content).withContext("should overwrite welcome message").toBe(welcomeMessageOverwrite);
        expect(service['sessionId$'].value).toBe(session.session_id!);
      }
    });

    expectCreateSessionRequest(mockCreateSessionResponse);
    tick();

    expectGetChatSessionRequest(mockCreateSessionResponse.session_id, mockFreshChatSessionResponse);
    expect(sessionSeen).toBe(2);
  }));

  it('getChatSession load current session', fakeAsync(() => {
    service['sessionId$'].next(mockCreateSessionResponse.session_id);
    let sessionSeen = 0;
    service.getChatSession().subscribe(session => {
      sessionSeen += 1;
      if(sessionSeen === 1) {
        expect(session.session_id).withContext("Session loaded").toEqual(mockCreateSessionResponse.session_id);
        expect(session.chat_history.length).withContext("Non-empty session loaded").toBe(mockOldChatSessionResponse.chat_history.length);
      }
    });

    //should not try to create new session
    httpMock.expectNone(apiService.buildUrl(`/chat_session`));
    tick();

    //should load current session
    expectGetChatSessionRequest(mockCreateSessionResponse.session_id, mockOldChatSessionResponse);
    
    expect(sessionSeen).toBe(1);
  }));

  it('getChatSession discard current session if its personalized and user_id doesnt match', fakeAsync(() => {
    const otherUserSessionId = 'other-user-session-id';
    service['sessionId$'].next(otherUserSessionId);
    let sessionSeen = 0;
    service.getChatSession().subscribe(session => {
      sessionSeen += 1;
      if(sessionSeen === 1) {
        expect(session).withContext("Empty session during loading").toEqual(EMPTY_CHAT_SESSION);
        //expect to remove invalid session from storage
        expect(windowRefSpy.sessionStorage?.removeItem).toHaveBeenCalled();
      } else {
        expect(session.session_id).toEqual(mockCreateSessionResponse.session_id);
        expect(service['sessionId$'].value).toBe(session.session_id!);
      }
    });

    tick();
    //should load personalized session
    const personalizedSession = Object.assign({}, mockOldChatSessionResponse, { user_id: 'other-customer-id' });
    expectGetChatSessionRequest(otherUserSessionId, personalizedSession);
    tick();

    //session belongs to another user, don't delete it just create new one
    httpMock.expectNone(apiService.buildUrl(`/sessions`));
    expectCreateSessionRequest(mockCreateSessionResponse);
    tick();

    //and load new session
    expectGetChatSessionRequest(mockCreateSessionResponse.session_id, mockFreshChatSessionResponse);
    tick();

    expect(sessionSeen).toBe(2);
  }));

  it('getChatSession discard invalid session and open a new one', fakeAsync(() => {
    const invalidSessionId = 'invalid-session-id';
    service['sessionId$'].next(invalidSessionId);

    let sessionSeen = 0;
    service.getChatSession().subscribe(session => {
      sessionSeen += 1;
      if(sessionSeen === 1) {
        expect(session).withContext("Empty session during loading").toEqual(EMPTY_CHAT_SESSION);
        //expect to remove invalid session from storage
        expect(windowRefSpy.sessionStorage?.removeItem).toHaveBeenCalled();
      } else {
        expect(session.session_id).toEqual(mockCreateSessionResponse.session_id);
        expect(service['sessionId$'].value).toBe(session.session_id!);
      }
    });

    tick();

    expectGetChatSessionRequest(invalidSessionId, { errorStatus: 404 });
    tick();

    //received invalid session, send request to create new session
    //we dont do delete request for "invalid" session
    httpMock.expectNone(apiService.buildUrl(`/sessions`));
    expectCreateSessionRequest(mockCreateSessionResponse);
    tick();
    expectGetChatSessionRequest(mockCreateSessionResponse.session_id, mockFreshChatSessionResponse);
    tick();

    expect(sessionSeen).toBe(2);
  }));

  it('getChatSession discard invalid session and handle error creating new', fakeAsync(() => {
    const invalidSessionId = 'invalid-session-id';
    service['sessionId$'].next(invalidSessionId);

    let sessionSeen = 0;
    service.getChatSession().subscribe(session => {
      sessionSeen += 1;
      if(sessionSeen === 1) {
        expect(session).toEqual(EMPTY_CHAT_SESSION);
        //expect to remove invalid session from storage
        expect(windowRefSpy.sessionStorage?.removeItem).toHaveBeenCalled();
      } else {
        expect(session.status).toBeUndefined();
        expect(session.chat_history?.[0]?.error).toBeTrue();
      }
    });

    tick();

    expectGetChatSessionRequest(invalidSessionId, { errorStatus: 404 });
    tick();

    //try to create, but it fails
    expectCreateSessionRequest({ errorStatus: 500, statusText: 'Server Error' });
    tick();

    expect(service['sessionId$'].value).toBe(ERROR_SESSION_ID);
    expect(sessionSeen).toBe(2);
  }));

  it('postMessage', fakeAsync(() => {
    service.getChatSession().subscribe();
    expectCreateSessionRequest();
    tick();
    expectGetChatSessionRequest();
    tick();

    const userInput = <string>mockOldChatSessionResponse.chat_history[1].content;
    service.sendQuestion(userInput).pipe(take(1)).subscribe(response => {
      expect(response.content).toBe(mockPostMessageResponse.response);
      expect(response.error).toBeFalsy();
      //recommendations should be flattened
      expect(response.recommendations?.length).withContext("Recommendations are merged").toBe(1);
      const allRecommendedProductCodes = mockPostMessageResponse.recommendations?.map(r => r.codes).flat();
      expect(response.recommendations?.[0]?.codes).withContext("Recommendations are merged").toEqual(allRecommendedProductCodes);
    });
    tick();

    const req = expectSendMessageRequest(mockPostMessageResponse);
    expect(req.request.body).toEqual({ user_input: userInput, session_id: mockCreateSessionResponse.session_id });
    tick();

    //handle errors
    service.sendQuestion(userInput).pipe(take(1)).subscribe(response => {
      expect(response.error).toBeTrue();
    });
    expectSendMessageRequest({ errorStatus: 500 });
    tick();

    //but still should be able to send another message
    service.sendQuestion(userInput).pipe(take(1)).subscribe(response => {
      expect(response.error).toBeFalsy();
      expect(response.content).toBe(mockPostMessageResponse.response);
    });

    expectSendMessageRequest(mockPostMessageResponse);
    tick();
  }));

  function expectCreateSessionRequest(payload: any = mockCreateSessionResponse) {
    const req = httpMock.expectOne(apiService.buildUrl(`/chat_session`));
    expect(req.request.method).toBe('POST');
    flushErrorOrPayload(req, payload);
  }

  function expectSendMessageAndCreateSessionRequest(payload: any = mockCreateSessionResponse) {
    const req = httpMock.expectOne(apiService.buildUrl(`/combined_chat_session`));
    expect(req.request.method).toBe('POST');
    flushErrorOrPayload(req, payload);
  }

  function expectGetChatSessionRequest(
    sessionId: string = mockCreateSessionResponse.session_id, 
    payload: AssistantChatSessionInternal | { errorStatus: number, statusText?: string } = mockFreshChatSessionResponse) {
    const req = httpMock.expectOne(apiService.buildUrl(`/chat_session/${sessionId}`));
    expect(req.request.method).toBe('GET');
    flushErrorOrPayload(req, payload);
  }

  function expectSendMessageRequest(payload: AssistantChatResponse | { errorStatus: number, statusText?: string }) {
    const req = httpMock.expectOne(apiService.buildUrl(`/chat`));
    expect(req.request.method).toBe('POST');
    flushErrorOrPayload(req, payload);
    return req;
  }

  function expectSessionDeleteRequest(sessionId: string | { errorStatus: number, statusText?: string }) {
    const req = httpMock.expectOne(apiService.buildUrl(`/sessions`));
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ session_ids: [sessionId] });
    flushErrorOrPayload(req, {});
    return req;
  }

  function flushErrorOrPayload(req: TestRequest, payload: any) {
    const errorStatus = payload.errorStatus;
    const statusText = payload.statusText || `Error ${errorStatus}`;
    if(errorStatus > 200) {
      req.flush({}, { status: errorStatus, statusText });
    } else {
      req.flush(Object.assign({}, payload));
    }
  }
});
