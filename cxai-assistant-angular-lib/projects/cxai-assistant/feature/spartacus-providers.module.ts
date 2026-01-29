import { NgModule } from '@angular/core';
import {
  CxaiAssistantConfig,
  IBaseSiteService,
  ICurrentProductService,
  ILoggerService,
  IOccEndpointsService,
  IProductService,
  ITranslationService,
  IWindowRef,
} from '@cx-spartacus/cxai-assistant/root';
import {
  BaseSiteService,
  Config,
  LoggerService,
  OccEndpointsService,
  ProductService,
  TranslationService,
  WindowRef,
} from '@spartacus/core';
import { CurrentProductService } from '@spartacus/storefront';

@NgModule({
  declarations: [],
  imports: [],
  providers: [
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
      provide: IProductService,
      useExisting: ProductService,
    },
    {
      provide: ITranslationService,
      useExisting: TranslationService,
    },
    {
      provide: CxaiAssistantConfig,
      useExisting: Config,
    },
    {
      provide: IWindowRef,
      useExisting: WindowRef,
    }
  ],
})
export class SpartacusProvidersModule {}
