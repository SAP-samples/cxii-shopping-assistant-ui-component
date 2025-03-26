import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { ASSISTANT_CONFIG_SCOPE, CxaiAssistantConfig } from '@cx-spartacus/cxai-assistant/root';

@Component({
  selector: 'lib-chat-icon',
  templateUrl: './chat-icon.component.html',
  styleUrl: './chat-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ChatIconComponent {
  @Input() faIcon: string | undefined;
  useSapIcons = inject(CxaiAssistantConfig)[ASSISTANT_CONFIG_SCOPE]?.useSapIcons;
}
