import { AssistantComponents, CxaiAssistantTokenComponentsConfigInternal } from '@cx-spartacus/cxai-assistant/root';
import { AssistantOrderReferenceComponent } from '../cms-components/assistant-order-reference/assistant-order-reference.component';
import { AssistantProductReferenceComponent } from '../cms-components/assistant-product-reference/assistant-product-reference.component';
import { ChatProductCarouselComponent } from '../cms-components/chat-product-carousel/chat-product-carousel.component';

export const defaultAssistantTokenComponents: CxaiAssistantTokenComponentsConfigInternal = {
  assistantTokens: {
    //product recommendations
    [AssistantComponents.AssistantToken_products_recommendation]: ChatProductCarouselComponent,

    //components for chat-token (returned by ChatMessagePipe)
    [AssistantComponents.AssistantToken_product]: AssistantProductReferenceComponent,
    [AssistantComponents.AssistantToken_order]:  AssistantOrderReferenceComponent,
  },
};
