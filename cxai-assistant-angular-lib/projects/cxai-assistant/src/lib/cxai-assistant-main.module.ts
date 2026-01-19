/* eslint-disable @typescript-eslint/no-empty-object-type */
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { AssistantComponents, AssistantOccEndpoints, CxaiAssistantApiService, CxaiAssistantConfig, CxaiAssistantInitializer, CxaiAssistantTokenComponentsConfigInternal, defaultAssistantConfig } from '@cx-spartacus/cxai-assistant/root';
import {
  CmsConfig,
  ConfigInitializerService,
  I18nModule,
  MODULE_INITIALIZER,
  provideDefaultConfig,
  UrlModule,
} from '@spartacus/core';
import { MediaModule, OutletModule, StarRatingModule } from '@spartacus/storefront';
import { ChatIconComponent } from './cms-components/chat-icon/chat-icon.component';
import { ChatProductCarouselComponent } from './cms-components/chat-product-carousel/chat-product-carousel.component';
import { AssistantChatWindowComponent } from './cms-components/assistant-chat-window/assistant-chat-window.component';
import { AssistantProductReferenceComponent } from './cms-components/assistant-product-reference/assistant-product-reference.component';
import { ChatMessagePipe } from './cms-components/chat-message.pipe';
import { ProductCardComponent } from './cms-components/product-card/product-card.component';
import { AssistantProductNamePipe } from './cms-components/product-name.pipe';
import { AssistantOrderReferenceComponent } from './cms-components/assistant-order-reference/assistant-order-reference.component';
import { AssistantTrackingIdReferenceComponent } from './cms-components/assistant-tracking-id-reference/assistant-tracking-id-reference.component';
import { defaultOccAssistantConfig } from './config/assistant-endpoint.config';
import { CxaiAssistantService } from './cxai-assistant.service';
import { CxaiAssistantOccApiService } from './cxai-assistant-occ.api.service';
import { CxaiAssistantMainBaseModule } from './cxai-assistant-main-base.module';
import { MiscSpartacusActionsService } from './misc-spartacus-actions.service';
import { IMiscSpartacusActionsService } from './i-cart-actions.service';
import { defaultAssistantTokenComponents } from './config/assistant-tokens.config';
import { RouterModule } from '@angular/router';

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
    ChatMessagePipe,
    AssistantProductNamePipe,
  ],
  imports: [
    CxaiAssistantMainBaseModule,
    I18nModule,
    MediaModule,
    StarRatingModule,
    UrlModule,
    OutletModule,
    RouterModule,
  ],
  providers: [
    provideDefaultConfig(defaultAssistantConfig),
    {
      provide: CxaiAssistantTokenComponentsConfigInternal,
      useValue: { assistantTokens: {
          ...defaultAssistantTokenComponents.assistantTokens,
          [AssistantComponents.AssistantToken_tracking_id]: AssistantTrackingIdReferenceComponent,
        }
      },
    },
    MiscSpartacusActionsService,
    {
      provide: IMiscSpartacusActionsService,
      useClass: MiscSpartacusActionsService,
    },
    provideDefaultConfig(defaultOccAssistantConfig),
    provideDefaultConfig(<CmsConfig>{
      cmsComponents: {
        [AssistantComponents.AssistantChatWindowComponent]: {
          component: AssistantChatWindowComponent,
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

declare module '@spartacus/core' {
  interface Config extends CxaiAssistantConfig {}
  interface OccEndpoints extends AssistantOccEndpoints {}
}
