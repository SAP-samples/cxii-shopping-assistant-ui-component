import { NgModule } from '@angular/core';
import { CxaiAssistantMainBaseModule } from '../cxai-assistant-main-base.module';
import { CxTranslatePipe } from './i18n/cx-translate.pipe';
import { StarRatingComponent } from './components/star-rating/star-rating.component';
import { CxUrlPipe } from './url.pipe';
import { MediaComponent } from './components/media/media.component';
import { CxaiAssistantTokenComponentsConfigInternal, ITranslationService } from '@cx-spartacus/cxai-assistant/root';
import { AcceleratorTranslationService } from './i18n/accelerator-translation.service';
import { IMiscSpartacusActionsService } from '../i-cart-actions.service';
import { MiscAcceleratorActionsService } from './misc-accelerator-actions.service';
import { AssistantChatWindowComponent } from '../cms-components/assistant-chat-window/assistant-chat-window.component';
import { ChatProductCarouselComponent } from '../cms-components/chat-product-carousel/chat-product-carousel.component';
import { ChatIconComponent } from '../cms-components/chat-icon/chat-icon.component';
import { AssistantProductReferenceComponent } from '../cms-components/assistant-product-reference/assistant-product-reference.component';
import { AssistantOrderReferenceComponent } from '../cms-components/assistant-order-reference/assistant-order-reference.component';
import { ProductCardComponent } from '../cms-components/product-card/product-card.component';
import { ChatMessagePipe } from '../cms-components/chat-message.pipe';
import { AssistantProductNamePipe } from '../cms-components/product-name.pipe';
import { defaultAssistantTokenComponents } from '../config/assistant-tokens.config';
import { RouterLinkDirective } from './i18n/router-link.directive';
import { OutletMockDirective } from './i18n/outlet-mock.directive';

/**
 * Module used for no-SPARTACUS build
 */
@NgModule({
  declarations: [
    AssistantChatWindowComponent,
    ChatProductCarouselComponent,
    ChatIconComponent,
    AssistantProductReferenceComponent,
    AssistantOrderReferenceComponent,
    // AssistantTrackingIdReferenceComponent,
    ProductCardComponent,
    ChatMessagePipe,
    AssistantProductNamePipe,
  ],
  imports: [
    CxaiAssistantMainBaseModule,
    CxTranslatePipe,
    MediaComponent,
    StarRatingComponent,
    CxUrlPipe,
    RouterLinkDirective,
    OutletMockDirective,
    //OutletModule ???
  ],
  exports: [
    AssistantChatWindowComponent,
  ],
  providers: [
    {
      provide: ITranslationService,
      useClass: AcceleratorTranslationService,
    },
    {
      provide: CxaiAssistantTokenComponentsConfigInternal,
      useValue: defaultAssistantTokenComponents,
    },
    MiscAcceleratorActionsService,
    {
      provide: IMiscSpartacusActionsService,
      useClass: MiscAcceleratorActionsService,
    }
  ],
})
export class CxaiAssistantMainModule {}

declare global {
  interface Window {
    ACC?: {
      spartacus?: {
        occToken?: string;
        occEndpoints?: { [key: string]: string };
        urls?: { [key: string]: string };
      },
      config?: {
        //standard ACC properties
        encodedContextPath?: string;
      },
      cxaiassistant?: {
        i18n?: any;
      },
    };
  }
}
