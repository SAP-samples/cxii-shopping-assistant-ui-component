import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  ASK_PRODUCT_CONFIG_SCOPE,
  AskProductChatMessage,
  AskProductConfig,
  AskProductQuestion,
  AskProductResponse,
  ILoggerService,
  IOccEndpointsService
} from '@cx-spartacus/cxai-ask-product/root';
import { Observable, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CxaiAskProductService {
  protected http = inject(HttpClient);
  protected config = inject(AskProductConfig)[ASK_PRODUCT_CONFIG_SCOPE];
  protected endpointsService = inject(IOccEndpointsService);
  protected loggerService = inject(ILoggerService);

  protected tokens: {
    [key: string]: { token: string; expiration_timestamp: number };
  } = {};

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
    if(!this.config || !context?.length || this.config.contextMessageWindow! <= 0) {
      return question;
    }

    let contextCharacterLimit = this.config.contextCharacterLimit ?? 0;
    if(contextCharacterLimit <= 0 || contextCharacterLimit > 10_000) {
      contextCharacterLimit = 10_000;
    }
    if(contextCharacterLimit < 100) {
      contextCharacterLimit = 100;
    }

    let message = `\n\nUSER'S CURRENT QUESTION: ${question}`;
    let contextLength = 0;
    context = context.slice(-1 * this.config.contextMessageWindow!);

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
