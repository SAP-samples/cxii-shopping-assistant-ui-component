import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';
import { AssistantChatFloatComponent, CxaiAssistantOutlets } from '@cx-spartacus/cxai-assistant/root';

@Component({
  selector: 'lib-assistant-chat-float-spartacus',
  templateUrl: './assistant-chat-float-spartacus.component.html',
  styleUrl: './assistant-chat-float-spartacus.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantChatFloatSpartacusComponent extends AssistantChatFloatComponent {
  outlets = CxaiAssistantOutlets;
}
