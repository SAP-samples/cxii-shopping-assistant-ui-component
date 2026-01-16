import { Injectable } from '@angular/core';
import { ASK_PRODUCT_FEATURE } from '../feature-name';

export const ASK_PRODUCT_CONFIG_SCOPE = ASK_PRODUCT_FEATURE;
export const ASK_PRODUCT_LOG_MARKER = '[cxai-ask-product]';

@Injectable({
  providedIn: 'root',
})
export abstract class AskProductConfig {
  [ASK_PRODUCT_CONFIG_SCOPE]?: AskProductConfigInternal;
}

export interface AskProductConfigInternal {
  url?: string;
  authUrl?: string;
  clientId?: string;
  clientSecret?: string;
  //how many previous messages pass as context, with character limit
  contextCharacterLimit?: number;
  contextMessageWindow?: number;
}

