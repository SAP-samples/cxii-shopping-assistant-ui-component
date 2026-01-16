import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { CxaiAskProductModule } from '@cx-spartacus/cxai-ask-product';
import { AskProductChatWcComponent } from './app/ask-product-chat-wc/ask-product-chat-wc.component';
import {
  IBaseSiteService,
  ICurrentProductService,
  ILoggerService,
  IOccEndpointsService,
} from '@cx-spartacus/cxai-ask-product/root';
import { WcCurrentProductService } from './app/spartacus/wc-current-product-service';
import { WcLoggerService } from './app/spartacus/wc-logger-service';
import { WcOccEndpointsService } from './app/spartacus/wc-occ-endpoints-service';
import { WcBaseSiteService } from './app/spartacus/wc-base-site-service';

async function bootstrapWebComponent() {
  const app = await createApplication({
    providers: [
      importProvidersFrom(CxaiAskProductModule),
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
    ],
  });

  // Create custom element
  const askProductChatElement = createCustomElement(AskProductChatWcComponent, {
    injector: app.injector,
  });

  // Register the custom element
  customElements.define('cxai-ask-product-chat', askProductChatElement);
}

bootstrapWebComponent().catch((err) => console.error(err));
