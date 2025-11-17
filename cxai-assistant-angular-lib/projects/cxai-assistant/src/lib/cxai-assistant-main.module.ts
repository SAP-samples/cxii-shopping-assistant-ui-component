import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AssistantComponents, CxaiAssistantApiService, CxaiAssistantInitializer, defaultAssistantConfig } from '@cx-spartacus/cxai-assistant/root';
import {
  CmsConfig,
  ConfigInitializerService,
  I18nModule,
  MODULE_INITIALIZER,
  provideDefaultConfig,
  UrlModule,
} from '@spartacus/core';
import { IconModule, MediaModule, OutletModule, PageComponentModule, StarRatingModule } from '@spartacus/storefront';
import { ChatIconComponent } from './cms-components/chat-icon/chat-icon.component';
import { ChatProductCarouselComponent } from './cms-components/chat-product-carousel/chat-product-carousel.component';
import { AssistantChatWindowComponent } from './cms-components/assistant-chat-window/assistant-chat-window.component';
import { AssistantProductReferenceComponent } from './cms-components/assistant-product-reference/assistant-product-reference.component';
import { ChatMessagePipe } from './cms-components/chat-message.pipe';
import { ProductCardComponent } from './cms-components/product-card/product-card.component';
import { AssistantProductNamePipe } from './cms-components/product-name.pipe';
import { AssistantTokenComponent } from './cms-components/assistant-token/assistant-token.component';
import { AssistantOrderReferenceComponent } from './cms-components/assistant-order-reference/assistant-order-reference.component';
import { AssistantTrackingIdReferenceComponent } from './cms-components/assistant-tracking-id-reference/assistant-tracking-id-reference.component';
import { defaultOccAssistantConfig } from './config/assistant-endpoint.config';
import { CxaiAssistantService } from './cxai-assistant.service';
import { CxaiAssistantOccApiService } from './cxai-assistant-occ.api.service';

/**
 * @deprecated Please import lazy CxaiAskProductFeatureModule
 */
@NgModule({
  declarations: [
    AssistantChatWindowComponent,
    ChatProductCarouselComponent,
    ChatIconComponent,
    AssistantProductReferenceComponent,
    AssistantOrderReferenceComponent,
    AssistantTrackingIdReferenceComponent,
    ProductCardComponent,
    AssistantTokenComponent,
    ChatMessagePipe,
    AssistantProductNamePipe,
  ],
  imports: [
    CommonModule,
    I18nModule,
    ReactiveFormsModule,
    IconModule,
    MediaModule,
    StarRatingModule,
    RouterModule,
    UrlModule,
    PageComponentModule,
    OutletModule,
  ],
  providers: [
    provideDefaultConfig(defaultAssistantConfig),
    provideDefaultConfig(defaultOccAssistantConfig),
    provideDefaultConfig(<CmsConfig>{
      cmsComponents: {
        [AssistantComponents.AssistantChatWindowComponent]: {
          component: AssistantChatWindowComponent,
        },
        //components for chat-token (returned by ChatMessagePipe)
        [AssistantComponents.AssistantToken_product]: {
          component: AssistantProductReferenceComponent,
        },
        [AssistantComponents.AssistantToken_order]: {
          component: AssistantOrderReferenceComponent,
        },
        [AssistantComponents.AssistantToken_tracking_id]: {
          component: AssistantTrackingIdReferenceComponent,
        },
      },
    }),
    //we're creating private copy of ConfigInitializerService because root version can't be reused
    ConfigInitializerService,
    {
      provide: MODULE_INITIALIZER,
      useFactory: moduleConfigInitializer,
      deps: [CxaiAssistantInitializer, ConfigInitializerService],
      multi: true,
    },
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
  ],
})
export class CxaiAssistantMainModule {}

function moduleConfigInitializer(
  initializer: CxaiAssistantInitializer,
  configInitializerService: ConfigInitializerService,
) {
  return () => configInitializerService['initialize']([initializer]);
}
