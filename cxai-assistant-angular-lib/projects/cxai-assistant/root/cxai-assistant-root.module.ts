import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CmsConfig, I18nModule, provideConfig, provideDefaultConfigFactory } from '@spartacus/core';
import { OutletPosition, PageComponentModule, provideOutlet, SearchBoxOutlets } from '@spartacus/storefront';
import { libTranslations, libTranslationsChunksConfig } from './assets/translations/lib-translations';
import { AssistantChatFloatComponent } from './cms-components/assistant-chat-float/assistant-chat-float.component';
import { SearchBoxChatOutletComponent } from './cms-components/search-box-chat-outlet/search-box-chat-outlet.component';
import { CXAI_ASSISTANT_FEATURE } from './feature-name';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


function defaultModuleConfigFactory(): CmsConfig {
  const config: CmsConfig = {
    featureModules: {
      [CXAI_ASSISTANT_FEATURE]: {
        cmsComponents: ['AssistantChatWindowComponent'],
      },
    },
  };
 
  return config;
}

@NgModule({
  declarations: [
    AssistantChatFloatComponent,
    SearchBoxChatOutletComponent,
  ],
  imports: [
    CommonModule,
    PageComponentModule,
    BrowserAnimationsModule,
    I18nModule,
  ],
  providers: [
    provideDefaultConfigFactory(defaultModuleConfigFactory),
    provideConfig({
      cmsComponents: {
        AssistantChatFloatComponent: {
          component: AssistantChatFloatComponent,
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
