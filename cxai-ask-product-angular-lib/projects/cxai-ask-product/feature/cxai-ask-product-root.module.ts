import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BaseSiteService,
  CmsConfig,
  LoggerService,
  OccEndpointsService,
  provideConfig,
  provideDefaultConfig,
  Config,
} from '@spartacus/core';
import {
  askProductTranslations,
  askProductTranslationsChunksConfig,
} from './assets/translations/translations';
import {
  ASK_PRODUCT_FEATURE,
  AskProductConfig,
  IBaseSiteService,
  ICurrentProductService,
  ILoggerService,
  IOccEndpointsService,
} from '@cx-spartacus/cxai-ask-product/root';
import { CurrentProductService } from '@spartacus/storefront';

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
    //provide all adapters
    {
      provide: ICurrentProductService,
      useExisting: CurrentProductService,
    },
    {
      provide: ILoggerService,
      useExisting: LoggerService,
    },
    {
      provide: IOccEndpointsService,
      useExisting: OccEndpointsService,
    },
    {
      provide: IBaseSiteService,
      useExisting: BaseSiteService,
    },
    {
      provide: AskProductConfig,
      useExisting: Config,
    }
  ],
})
export class CxaiAskProductRootModule {}
