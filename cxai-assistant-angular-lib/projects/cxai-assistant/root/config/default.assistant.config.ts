import { AssistantContext } from '../models/assistant.model';
import { ASSISTANT_CONFIG_SCOPE, CxaiAssistantConfig, CxaiAssistantConfigInternal } from './assistant.config';

//default config passed by the library
export const defaultAssistantConfigInternal: CxaiAssistantConfigInternal = {
  configInitializerEndpoint: '/cxai/config',
};

export const sampleAssistantContextProvider = (context: AssistantContext) => {
  const cartProductCodes = (context.cartProductCodes?.length || 0) > 0 ? '[' + context.cartProductCodes + ']' : '[empty]';
  const pdpProductCode = context.pdpProductCode || '[none]';

  return `User's cart content: ${cartProductCodes}\nUser is viewing product: ${pdpProductCode}`;
};

export const defaultAssistantConfig: CxaiAssistantConfig = {
  [ASSISTANT_CONFIG_SCOPE]: defaultAssistantConfigInternal,
};
