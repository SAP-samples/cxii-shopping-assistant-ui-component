import { inject, Injectable } from '@angular/core';
import { WindowRef } from '@spartacus/core';
import { BehaviorSubject, distinct, distinctUntilChanged, Observable, ReplaySubject, Subject } from 'rxjs';
import { ASSISTANT_CONFIG_SCOPE, CxaiAssistantConfig } from './config/assistant.config';
import { AssistantChatTextData } from './models/assistant.model';

@Injectable({
  providedIn: 'root'
})
export class CxaiAssistantRootService {
  readonly useSapIcons = !!inject(CxaiAssistantConfig)[ASSISTANT_CONFIG_SCOPE]?.useSapIcons;
  readonly moduleEnabled$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly chatTextToSend$: Subject<AssistantChatTextData> = new ReplaySubject<AssistantChatTextData>(1);
  protected chatOpened$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  
  /**
   * @param text 
   * @param send if true then send immediately, otherwise only put it in the chat input
   */
  sendTextViaChat(text: string, send: boolean) {
    if(text) {
      this.chatTextToSend$.next(<AssistantChatTextData>{ text, send });
    }
  }

  enableModule() {
    this.moduleEnabled$.next(true);
  }
  
  openChat() {
    this.chatOpened$.next(true);
  }

  closeChat() {
    this.chatOpened$.next(false);
  }

  getChatOpenedStatus(): Observable<boolean> {
    return this.chatOpened$.asObservable().pipe(distinctUntilChanged());
  }
}
