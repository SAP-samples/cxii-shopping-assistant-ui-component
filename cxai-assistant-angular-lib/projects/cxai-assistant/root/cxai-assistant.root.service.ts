import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, ReplaySubject, Subject } from 'rxjs';
import { ASSISTANT_CONFIG_SCOPE, CxaiAssistantConfig } from './config/assistant.config';
import { AssistantChatTextData } from './models/assistant.model';
import { AssistantUiStatus } from './models/status.model';

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
  protected readonly chatWindowLoaded$ = new BehaviorSubject<boolean>(false);
  protected readonly storage = window?.sessionStorage;
  static readonly SESSION_STORAGE_CHAT_KEY = 'cxai-assistant.uiStatus';

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
    this.chatOpenRequest$.next(this.getChatUiStatus().opened ?? false);
  }

  openChat() {
    this.chatOpenRequest$.next(true);
    this.storeChatUiStatus({ opened: true });
  }

  closeChat() {
    this.chatOpenRequest$.next(false);
    this.storeChatUiStatus({ opened: false });
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

  getChatUiStatus(): Partial<AssistantUiStatus> {
    if(this.storage) {
      const data = this.storage.getItem(CxaiAssistantRootService.SESSION_STORAGE_CHAT_KEY);
      if(data) {
        try {
          return JSON.parse(data) as Partial<AssistantUiStatus>;
        } catch {
          this.storage.removeItem(CxaiAssistantRootService.SESSION_STORAGE_CHAT_KEY);
        }
      }
    }
    return { opened: false };
  }

  storeChatUiStatus(status: Partial<AssistantUiStatus>) {
    if(this.storage) {
      const currentStatus = this.getChatUiStatus();
      const mergedStatus = { ...currentStatus, ...status };
      this.storage.setItem(CxaiAssistantRootService.SESSION_STORAGE_CHAT_KEY, JSON.stringify(mergedStatus));
    }
  }
}
