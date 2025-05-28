import {
  AskProductConfig,
  AskProductConfigInternal,
  ASK_PRODUCT_CONFIG_SCOPE
} from '@cx-spartacus/cxai-ask-product/root';

export const defaultAskProductConfigInternal: AskProductConfigInternal = {
  contextCharacterLimit: 2000,
  contextMessageWindow: 4,
};

export const defaultAskProductConfig: AskProductConfig = {
  [ASK_PRODUCT_CONFIG_SCOPE]: defaultAskProductConfigInternal,
};
