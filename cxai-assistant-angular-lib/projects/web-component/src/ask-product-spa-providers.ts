import {
  IBaseSiteService,
  ICurrentProductService,
  ILoggerService,
  IOccEndpointsService,
} from '@cx-spartacus/cxai-ask-product/root';
import { WcBaseSiteService } from './app/spartacus/wc-base-site-service';
import { WcCurrentProductService } from './app/spartacus/wc-current-product-service';
import { WcLoggerService } from './app/spartacus/wc-logger-service';
import { WcOccEndpointsService } from './app/spartacus/wc-occ-endpoints-service';

export const askProductSpaProviders = [
  {
    provide: ICurrentProductService,
    useExisting: WcCurrentProductService,
  },
  {
    provide: ILoggerService,
    useExisting: WcLoggerService,
  },
  {
    provide: IOccEndpointsService,
    useExisting: WcOccEndpointsService,
  },
  {
    provide: IBaseSiteService,
    useExisting: WcBaseSiteService,
  },
];
