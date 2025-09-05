import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { OutletContextData } from '@spartacus/storefront';
import { CxaiAssistantRootService } from '../../cxai-assistant.root.service';

interface SearchBoxOutlet {
  search: string;
  searchBoxActive: boolean;
  maxRecentSearches?: number;
}

@Component({
  selector: 'lib-search-box-chat-outlet',
  templateUrl: './search-box-chat-outlet.html',
  styleUrl: './search-box-chat-outlet.scss',
  encapsulation: ViewEncapsulation.None,
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxChatOutletComponent {
  private readonly cxaiAssistantRootService = inject(CxaiAssistantRootService);
  outletContext$ = inject(OutletContextData<SearchBoxOutlet>, { optional: true });
  useSapIcons = this.cxaiAssistantRootService.useSapIcons;
  moduleEnabled$ = this.cxaiAssistantRootService.moduleEnabled$;

  startChat(text: string) {
    this.cxaiAssistantRootService.openChat();
    this.cxaiAssistantRootService.sendTextViaChat(text.trim(), false);
  }
}
