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
  assistantConfigId?: string;
  configInitializerEndpoint?: string;
  //use sap-icon instead of font-awesome, this requires sap-icons font to be loaded
  //https://github.com/SAP/theming-base-content/tree/master/content/Base/baseLib/baseTheme/fonts
  useSapIcons?: boolean;
  //if product.name doesn't contain entire product name, you can provide a template like "{name} {summary}"
  productNameTemplate?: string;
  //returns additional context pasted into chat message
  chatMessageContextProvider?: ((context: AssistantContext) => string) | null;
}

declare module '@spartacus/core' {
  interface Config extends CxaiAssistantConfig {}
}
