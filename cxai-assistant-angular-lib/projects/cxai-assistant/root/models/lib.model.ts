import { Signal } from "@angular/core";

export interface AssistantChatWindowComponentInterface {
  focusInputAndSelectAll(): void;
  focusInput(): void;
  /** Put text into input field and focus */
  setInputText(text: string, select?: boolean): void;
  /** Append text to the end of input */
  appendInputText(text: string, select?: boolean): void;
  /** Insert text at the current cursor position, replace selection if sth selected */
  insertInputText(text: string, select?: boolean): void;
  /** Press "send" button */
  sendMessage(): void;
  hasValidSession: Signal<boolean>;
  inputTextDisabled: Signal<boolean>;
}

export declare type AssistantTokenType = 'html' | 'product' | 'order' | 'tracking_id' | 'unknown' | 'products_recommendation';

export declare type ChatMessageToken = {
  type: AssistantTokenType;
  content: string;
  data?: any;
};

export abstract class AssistantTokenContext {
  token!: ChatMessageToken;
  chatWindowComponent!: AssistantChatWindowComponentInterface;
}

export interface AssistantChatWindowOutletContext {
  chatWindowComponent: AssistantChatWindowComponentInterface;
}

export enum AssistantComponents {
  AssistantChatWindowComponent = 'AssistantChatWindowComponent',

  //this is needed here, otherwise components won't be visible in CmsComponentsService (it's declared in MainModule)
  AssistantToken_product = 'AssistantToken_product',
  AssistantToken_order = 'AssistantToken_order',
  AssistantToken_tracking_id = 'AssistantToken_tracking_id',

  //this is not a token inside message, but we use the same mechanism to customize product recommendations display
  AssistantToken_products_recommendation = 'AssistantToken_products_recommendation'
}
