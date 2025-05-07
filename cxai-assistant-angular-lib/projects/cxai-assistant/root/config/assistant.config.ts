import { Injectable } from '@angular/core';
import { Config } from '@spartacus/core';
import { CXAI_ASSISTANT_FEATURE } from '../feature-name';
import { AssistantContext } from '../models/assistant.model';

export const ASSISTANT_CONFIG_SCOPE = CXAI_ASSISTANT_FEATURE;
export const ASSISTANT_LOG_MARKER = '[cxai-assistant]';

@Injectable({
  providedIn: 'root',
  useExisting: Config,
})
export abstract class CxaiAssistantConfig {
  [ASSISTANT_CONFIG_SCOPE]?: CxaiAssistantConfigInternal;
}

export interface CxaiAssistantConfigInternal {
  //must be created via API, fetched from backend by default
  assistantConfigId?: string;
  //set to null to disable config initializer - then you must provide assistantConfigId locally
  configInitializerEndpoint?: string;
  //use sap-icon instead of font-awesome, this requires sap-icons font to be loaded
  //https://github.com/SAP/theming-base-content/tree/master/content/Base/baseLib/baseTheme/fonts
  useSapIcons?: boolean;
  /** open session only after first message is sent or immediately when window is opened.
  if set to true then you must provide cxaiAssistant.welcomeMessage via translations, otherwise you can
  rely on welcome message provided by the backend */
  openSessionOnlyAfterFirstMessage?: boolean;
  //in rare use case where product.name doesn't contain entire product name, you can provide a template like "{name} {summary}"
  //product codes in chat message will be replaced accordingly
  productNameTemplate?: string;
  //returns additional context pasted directly into chat message - see sampleAssistantContextProvider for example
  //context is not visible in the UI, it's appended into each message and stripped before displaying it in the chat
  //however it may allow the user to ask about current product, or cart contents etc
  //this is temporary solution until API is extended
  chatMessageContextProvider?: ((context: AssistantContext) => string) | null;
}

declare module '@spartacus/core' {
  interface Config extends CxaiAssistantConfig {}
}
