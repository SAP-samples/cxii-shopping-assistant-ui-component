import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { LoggerService, OccEndpointsService } from '@spartacus/core';
import { Observable, catchError, delay, of } from 'rxjs';
import {
  ASK_PRODUCT_CONFIG_SCOPE,
  ASK_PRODUCT_LOG_MARKER,
  AskProductConfig,
} from '@cx-spartacus/cxai-ask-product/root';
import {
  AskProductChatMessage,
  AskProductQuestion,
  AskProductResponse,
} from '@cx-spartacus/cxai-ask-product/root';

@Injectable({
  providedIn: 'root',
})
export class CxaiAskProductService {
  protected http = inject(HttpClient);
  protected config = inject(AskProductConfig)[ASK_PRODUCT_CONFIG_SCOPE];
  protected endpointsService = inject(OccEndpointsService);
  protected loggerService = inject(LoggerService);
  
  private mock = false;

  protected tokens: {
    [key: string]: { token: string; expiration_timestamp: number };
  } = {};

  constructor() {
    this.loggerService.info(ASK_PRODUCT_LOG_MARKER, 'Final cxai ask product config', this.config);
  }

  sendQuestion(
    productCode: string,
    question: string,
    context?: AskProductChatMessage[]
  ): Observable<AskProductResponse> {
    const url = this.endpointsService.buildUrl('/cxai/ask-product');
    const payload: AskProductQuestion = {
      productCode,
      question: this.buildContextPrompt(question, context),
    };

    if (this.mock) {
      const mockResponse: AskProductResponse = {
        answer: 'ECHO: ' + question,
        sources: [],
      };
      return of(mockResponse).pipe(delay(2000));
    }

    return this.http.post<AskProductResponse>(url, payload).pipe(
      catchError((e) => {
        return of({
          answer: 'Error loading response: ' + (e?.status || 0),
          error: true,
        });
      })
    );
  }

  buildContextPrompt(question: string, context?: AskProductChatMessage[]) {
    if(!context?.length || this.config.contextMessageWindow <= 0) {
      return question;
    }

    let contextCharacterLimit = this.config.contextCharacterLimit;
    if(contextCharacterLimit <= 0 || contextCharacterLimit > 10_000) {
      contextCharacterLimit = 10_000;
    }
    if(contextCharacterLimit < 100) {
      contextCharacterLimit = 100;
    }

    let message = `\n\nUSER'S CURRENT QUESTION: ${question}`;
    let contextLength = 0;
    context = context.slice(-1 * this.config.contextMessageWindow);

    for(let i = context.length - 1; i >= 0; i--) {
      const contextMessage = context[i];
      let messageString = contextMessage.message || '<no_response>';
      //keep maximum 1000 characters...
      messageString = messageString.substring(0, contextCharacterLimit);
      const contextString = `${contextMessage.source.toUpperCase()}: ${messageString}\n`;
      contextLength += contextString.length;
      message = contextString + message;
      if(contextLength > contextCharacterLimit) {
        break;
      }
    }

    message = 'CONVERSATION CONTEXT:\n' + message;
    return message;
  }

  isConfigured() {
    return !!this.config?.url;
  }
}
