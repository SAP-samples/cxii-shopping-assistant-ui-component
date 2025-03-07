import { ASSISTANT_CONFIG_SCOPE, CxaiAssistantConfig, CxaiAssistantConfigInternal } from './assistant.config';

export const defaultAssistantConfigInternal: CxaiAssistantConfigInternal = {
  configInitializerEndpoint: '/cxai/config',
  chatMessageContextProvider: (context) => {
    const cartProductCodes = (context.cartProductCodes?.length || 0) > 0 ? '[' + context.cartProductCodes + ']' : '[empty]';
    const pdpProductCode = context.pdpProductCode || '[none]';

    return `User's cart content: ${cartProductCodes}\nUser is viewing product: ${pdpProductCode}`;
  }
};

export const defaultAssistantConfig: CxaiAssistantConfig = {
  [ASSISTANT_CONFIG_SCOPE]: defaultAssistantConfigInternal,
};
