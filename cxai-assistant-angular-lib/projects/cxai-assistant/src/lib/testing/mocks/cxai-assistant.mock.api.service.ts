import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AssistantUserInput,
  CxaiAssistantApiService
} from '@cx-spartacus/cxai-assistant/root';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  mockOldChatSessionResponse,
  mockCreateSessionResponse,
  mockPostMessageResponse,
} from './mock-responses';

@Injectable({
  providedIn: 'root',
})
export class CxaiAssistantMockApiService extends CxaiAssistantApiService {
  override postMessage(
    payload: AssistantUserInput,
    delayMs = 0,
    errorStatus = 0
  ) {
    return this.mockResponse(mockPostMessageResponse, delayMs, errorStatus);
  }

  override getChatSession(sessionId: string, delayMs = 0, errorStatus = 0) {
    return this.mockResponse(mockOldChatSessionResponse, delayMs, errorStatus);
  }

  override createChatSession(configId: string, delayMs = 0, errorStatus = 0) {
    return this.mockResponse(mockCreateSessionResponse, delayMs, errorStatus);
  }

  override deleteChatSession(sessionId: string, delayMs = 0, errorStatus = 0) {
    return this.mockResponse({}, delayMs, errorStatus);
  }

  protected mockResponse(
    response: any,
    delayMs: number,
    errorStatus: number = 0
  ) {
    let observable = of(response);
    if (errorStatus > 0) {
      observable = throwError(
        () => new HttpErrorResponse({ status: errorStatus })
      );
    }

    if (delayMs > 0) {
      observable = observable.pipe(delay(delayMs));
    }

    return observable;
  }
}
