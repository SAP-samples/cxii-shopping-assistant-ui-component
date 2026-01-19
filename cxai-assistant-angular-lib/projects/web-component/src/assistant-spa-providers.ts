import {
  IBaseSiteService,
  ICurrentProductService,
  ILoggerService,
  IOccEndpointsService,
  IProductService,
  IWindowRef,
} from '@cx-spartacus/cxai-assistant/root';
import { WcBaseSiteService } from './app/spartacus/wc-base-site-service';
import { WcCurrentProductService } from './app/spartacus/wc-current-product-service';
import { WcLoggerService } from './app/spartacus/wc-logger-service';
import { WcOccEndpointsService } from './app/spartacus/wc-occ-endpoints-service';
import { WcWindowRef } from './app/spartacus/wc-window-ref';
import { WcProductService } from './app/spartacus/wc-product-service';

export const assistantSpaProviders = [
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
  {
    provide: IProductService,
    useExisting: WcProductService,
  },
  {
    provide: IWindowRef,
    useExisting: WcWindowRef,
  },
];
