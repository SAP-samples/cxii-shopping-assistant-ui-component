import { importProvidersFrom } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { CxaiAskProductModule } from '@cx-spartacus/cxai-ask-product';
import { CxaiAssistantMainModule } from '@cx-spartacus/cxai-assistant';
import { AskProductChatWcComponent } from './app/ask-product-chat-wc/ask-product-chat-wc.component';
import { AssistantChatFloatWcComponent } from './app/assistant-chat-float-wc/assistant-chat-float-wc.component';
import { askProductSpaProviders } from './ask-product-spa-providers';
import { assistantSpaProviders } from './assistant-spa-providers';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { OccTokenInterceptor } from './app/assistant-chat-float-wc/occ-token.interceptor';

async function bootstrapWebComponent() {
  const app = await createApplication({
    providers: [
      ...askProductSpaProviders,
      ...assistantSpaProviders,
      importProvidersFrom(CxaiAskProductModule),
      importProvidersFrom(CxaiAssistantMainModule),
      provideHttpClient(withFetch(), withInterceptorsFromDi()),
      {
        provide: HTTP_INTERCEPTORS,
        useClass: OccTokenInterceptor,
        multi: true,
      },
    ],
  });

  // Create custom element
  const askProductChatElement = createCustomElement(AskProductChatWcComponent, {
    injector: app.injector,
  });


  const assistantChatElement = createCustomElement(AssistantChatFloatWcComponent, {
    injector: app.injector,
  });

  // you can comment out not used component registration to reduce bundle size
  customElements.define('cxai-ask-product-chat', askProductChatElement);
  customElements.define('cxai-assistant-chat', assistantChatElement);
}

bootstrapWebComponent().catch((err) => console.error(err));
