import { CommonModule, NgComponentOutlet } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CxaiAssistantService } from './cxai-assistant.service';
import { CxaiAssistantApiService } from '@cx-spartacus/cxai-assistant/root';
import { CxaiAssistantOccApiService } from './cxai-assistant-occ.api.service';
import { AssistantTokenComponent } from './cms-components/assistant-token/assistant-token.component';

/**
 * Base module containing all common functionality for CxaiAskProduct
 * This module handles the component declarations, exports, and providers
 * but does not include any i18n setup - that should be provided by the consuming module
 */
@NgModule({
  declarations: [
    AssistantTokenComponent,
  ],
  imports: [
    CommonModule,
    NgComponentOutlet,
  ],
  exports: [
    CommonModule,
    NgComponentOutlet,
    AssistantTokenComponent,
  ],
  providers: [
    provideHttpClient(),
    {
      provide: CxaiAssistantApiService,
      useFactory: (rootCxaiAssistantApiService) => {
        return rootCxaiAssistantApiService ?? new CxaiAssistantOccApiService();
      },
      //hack to allow overwriting from root
      deps: [[new Optional(), new SkipSelf(), CxaiAssistantApiService]],
    },
    //this can't be providedIn root, because CxaiAssistantApiService won't be resolved
    //(spartacus lazy loading modules mechanism doesn't set proper injector hierarchy)
    CxaiAssistantService,
  ]
})
export class CxaiAssistantMainBaseModule { }
