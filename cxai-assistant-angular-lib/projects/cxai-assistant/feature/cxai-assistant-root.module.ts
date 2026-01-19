import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CmsConfig, I18nModule, provideConfig, provideDefaultConfigFactory } from '@spartacus/core';
import { OutletModule, OutletPosition, PageComponentModule, provideOutlet, SearchBoxOutlets } from '@spartacus/storefront';
import { libTranslations, libTranslationsChunksConfig } from './assets/translations/lib-translations';
import { AssistantChatFloatComponent } from '@cx-spartacus/cxai-assistant/root';
import { SearchBoxChatOutletComponent } from './cms-components/search-box-chat-outlet/search-box-chat-outlet.component';
import { CXAI_ASSISTANT_FEATURE } from '@cx-spartacus/cxai-assistant/root';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AssistantComponents } from '@cx-spartacus/cxai-assistant/root';
import { SpartacusProvidersModule } from './spartacus-providers.module';
import { AssistantChatFloatSpartacusComponent } from './cms-components/assistant-chat-float-spartacus/assistant-chat-float.component';


function defaultModuleConfigFactory(): CmsConfig {
  const config: CmsConfig = {
    featureModules: {
      [CXAI_ASSISTANT_FEATURE]: {
        cmsComponents: [
          ...Object.values(AssistantComponents),
        ],
      },
    },
  };

  return config;
}

@NgModule({
  declarations: [
    SearchBoxChatOutletComponent,
    AssistantChatFloatSpartacusComponent,
  ],
  imports: [
    CommonModule,
    PageComponentModule,
    BrowserAnimationsModule,
    I18nModule,
    OutletModule,
    SpartacusProvidersModule,
    AssistantChatFloatComponent,
  ],
  providers: [
    provideDefaultConfigFactory(defaultModuleConfigFactory),
    provideConfig({
      cmsComponents: {
        AssistantChatFloatComponent: {
          component: AssistantChatFloatSpartacusComponent,
        },
      },
    } satisfies CmsConfig),
    // translations must be provided from root
    provideConfig({
      i18n: {
        resources: libTranslations,
        chunks: libTranslationsChunksConfig,
        fallbackLang: 'en',
      },
    }),
    provideOutlet({
      id: SearchBoxOutlets.RECENT_SEARCHES,
      component: SearchBoxChatOutletComponent,
      position: OutletPosition.AFTER,
    }),
  ]
})
export class CxaiAssistantRootModule { }
