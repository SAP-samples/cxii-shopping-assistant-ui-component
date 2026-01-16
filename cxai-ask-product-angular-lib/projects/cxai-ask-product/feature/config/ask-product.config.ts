import { AskProductConfig } from '@cx-spartacus/cxai-ask-product/root';
import { Config } from '@spartacus/core';

declare module '@spartacus/core' {
  interface Config extends AskProductConfig {}
}
