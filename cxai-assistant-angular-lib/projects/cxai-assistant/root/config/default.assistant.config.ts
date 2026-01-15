import { AssistantContext, AssistantProductFilter } from '../models/assistant.model';
import { ASSISTANT_CONFIG_SCOPE, CxaiAssistantConfig, CxaiAssistantConfigInternal } from './assistant.config';

/** Filters used only if backoffice json is empty string (not even []) */
const ASSISTANT_DEFAULT_PRODUCT_FILTERS: AssistantProductFilter[] = [
  {
    name: "approvalstatus.code",
    value: [ "approved" ],
  },
];

//default config passed by the library
export const defaultAssistantConfigInternal: CxaiAssistantConfigInternal = {
  configInitializerEndpoint: '/cxai/config',
  assistantProductFilters: [...ASSISTANT_DEFAULT_PRODUCT_FILTERS],
};

export const sampleAssistantContextProvider = (context: AssistantContext) => {
  const cartProductCodes = (context.cartProductCodes?.length || 0) > 0 ? '[' + context.cartProductCodes + ']' : '[empty]';
  const pdpProductCode = context.pdpProductCode || '[none]';

  return `User's cart content: ${cartProductCodes}\nUser is viewing product: ${pdpProductCode}`;
};

export const defaultAssistantConfig: CxaiAssistantConfig = {
  [ASSISTANT_CONFIG_SCOPE]: defaultAssistantConfigInternal,
};
