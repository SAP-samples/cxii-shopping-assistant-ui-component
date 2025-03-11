import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CxaiAssistantInitializer, defaultAssistantConfig } from '@cx-spartacus/cxai-assistant/root';
import {
  CmsConfig,
  ConfigInitializerService,
  I18nModule,
  MODULE_INITIALIZER,
  provideDefaultConfig,
  UrlModule,
} from '@spartacus/core';
import { IconModule, MediaModule, StarRatingModule } from '@spartacus/storefront';
import { ChatIconComponent } from './cms-components/chat-icon/chat-icon.component';
import { ChatProductCarouselComponent } from './cms-components/chat-product-carousel/chat-product-carousel.component';
import { AssistantChatWindowComponent } from './cms-components/assistant-chat-window/assistant-chat-window.component';
import { AssistantProductReferenceComponent } from './cms-components/assistant-product-reference/assistant-product-reference.component';
import { ChatMessagePipe } from './cms-components/chat-message.pipe';
import { ProductCardComponent } from './cms-components/product-card/product-card.component';
import { AssistantProductNamePipe } from './cms-components/product-name.pipe';

/**
 * @deprecated Please use lazy CxaiAskProductFeatureModule
 */
@NgModule({
  declarations: [
    AssistantChatWindowComponent,
    ChatProductCarouselComponent,
    ChatIconComponent,
    AssistantProductReferenceComponent,
    ProductCardComponent,
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
  ],
  providers: [
    provideDefaultConfig(defaultAssistantConfig),
    provideDefaultConfig(<CmsConfig>{
      cmsComponents: {
        AssistantChatWindowComponent: {
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
  ],
})
export class CxaiAssistantMainModule {}

function moduleConfigInitializer(
  initializer: CxaiAssistantInitializer,
  configInitializerService: ConfigInitializerService,
) {
  return () => configInitializerService['initialize']([initializer]);
}
