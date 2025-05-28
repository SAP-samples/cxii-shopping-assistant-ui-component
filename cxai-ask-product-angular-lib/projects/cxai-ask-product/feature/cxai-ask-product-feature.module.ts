import { NgModule } from '@angular/core';
import { CxaiAskProductRootModule } from '@cx-spartacus/cxai-ask-product/root';
import { ASK_PRODUCT_FEATURE } from '@cx-spartacus/cxai-ask-product/root';
import { provideConfig, CmsConfig } from '@spartacus/core';



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
