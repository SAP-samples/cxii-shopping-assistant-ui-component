import { AskProductConfig } from '@cx-spartacus/cxai-ask-product/root';

declare module '@spartacus/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Config extends AskProductConfig {}
}
