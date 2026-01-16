import { NgModule } from '@angular/core';
import { ASK_PRODUCT_FEATURE, AskProductConfig } from '@cx-spartacus/cxai-ask-product/root';
import { provideConfig, CmsConfig } from '@spartacus/core';
import { CxaiAskProductRootModule } from './cxai-ask-product-root.module';


declare module '@spartacus/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Config extends AskProductConfig {}
}

@NgModule({
  imports: [CxaiAskProductRootModule],
  providers: [
    provideConfig(<CmsConfig>{
      featureModules: {
        [ASK_PRODUCT_FEATURE]: {
          module: () =>
            import('@cx-spartacus/cxai-ask-product').then((m) => m.CxaiAskProductModule),
        },
      },
    }),
  ],
})
export class CxaiAskProductFeatureModule {}

