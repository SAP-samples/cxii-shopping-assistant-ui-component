import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, ReplaySubject, Subject } from 'rxjs';
import { ASSISTANT_CONFIG_SCOPE, CxaiAssistantConfig } from './config/assistant.config';
import { AssistantChatTextData } from './models/assistant.model';

@Injectable({
  providedIn: 'root'
})
export class CxaiAssistantRootService {
  readonly useSapIcons = !!inject(CxaiAssistantConfig)[ASSISTANT_CONFIG_SCOPE]?.useSapIcons;
  readonly moduleEnabled$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly chatTextToSend$: Subject<AssistantChatTextData> = new ReplaySubject<AssistantChatTextData>(1);
  //request to open/close chat window
  readonly chatOpenRequest$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  //mark that lazy loaded part is ready - to prevent chat button disapearing too early (called from chat window component)
  protected chatWindowLoaded$ = new BehaviorSubject<boolean>(false);

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
    this.chatOpenRequest$.next(true);
  }

  closeChat() {
    this.chatOpenRequest$.next(false);
  }

  /**
   * True if 1) chatOpenRequest = true and 2) chatWindowLoaded = true meaning that window component
   * is visible & js chunk is loaded
   */
  getChatOpenedStatus(): Observable<boolean> {
    return combineLatest([this.chatOpenRequest$, this.chatWindowLoaded$]).pipe(
      map(([opened, loaded]) => opened && loaded),
      distinctUntilChanged(),
    )
  }

  /** should be called from ngOnInit of lazy-loaded component */
  chatWindowLoaded() {
    this.chatWindowLoaded$.next(true);
  }
}
