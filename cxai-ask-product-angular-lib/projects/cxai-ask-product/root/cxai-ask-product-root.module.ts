import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CmsConfig,
  provideConfig,
  provideDefaultConfig,
} from '@spartacus/core';
import {
  askProductTranslations,
  askProductTranslationsChunksConfig,
} from './assets/translations/translations';
import { ASK_PRODUCT_FEATURE } from './feature-name';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [
    provideConfig({
      i18n: {
        resources: askProductTranslations,
        chunks: askProductTranslationsChunksConfig,
        fallbackLang: 'en',
      },
    }),
    provideDefaultConfig(<CmsConfig>{
      featureModules: {
        [ASK_PRODUCT_FEATURE]: {
          cmsComponents: ['CxaiAskProductChatComponent'],
        },
      },
    }),
  ],
})
export class CxaiAskProductRootModule {}
