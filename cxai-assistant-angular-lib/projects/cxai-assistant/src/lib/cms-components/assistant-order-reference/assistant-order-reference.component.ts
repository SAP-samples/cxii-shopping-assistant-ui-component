import { Component, inject } from '@angular/core';
import { AssistantTokenContext } from '@cx-spartacus/cxai-assistant/root';

@Component({
  selector: 'lib-assistant-order-reference',
  templateUrl: './assistant-order-reference.component.html',
  styleUrl: './assistant-order-reference.component.scss',
  standalone: false,
})
export class AssistantOrderReferenceComponent {
  tokenContext: AssistantTokenContext = inject(AssistantTokenContext);
  token = this.tokenContext.token;
}
