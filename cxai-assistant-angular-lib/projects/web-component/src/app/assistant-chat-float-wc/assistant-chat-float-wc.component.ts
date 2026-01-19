import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CxaiAssistantMainModule } from '@cx-spartacus/cxai-assistant';
import {
  ASSISTANT_CONFIG_SCOPE, AssistantChatFloatComponent, CxaiAssistantConfig, CxaiAssistantInitializer,
  IBaseSiteService,
  IOccEndpointsService,
  IProductService
} from '@cx-spartacus/cxai-assistant/root';

@Component({
  imports: [
    CommonModule,
    AssistantChatFloatComponent,
    CxaiAssistantMainModule,
  ],
  templateUrl: './assistant-chat-float-wc.component.html',
  styleUrl: './assistant-chat-float-wc.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantChatFloatWcComponent extends AssistantChatFloatComponent {
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input("base-url") baseUrl: string | undefined;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input("media-base-url") mediaBaseUrl: string | undefined;
  @Input() site: string | undefined;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input("site-name") siteName: string | undefined;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input("occ-token") occToken: string | undefined;

  productService = inject(IProductService);
  occEndpointsService = inject(IOccEndpointsService);
  baseSiteService = inject(IBaseSiteService);
  config$ = inject(CxaiAssistantInitializer).configFactory();
  config = inject(CxaiAssistantConfig);

  override ngOnInit() {
    if (this.occToken && window.ACC) {
      window.ACC.spartacus = window.ACC.spartacus ?? {};
      window.ACC.spartacus.occToken = this.occToken;
    }

    this.config$.then((config) => {
      if (config) {
        this.config[ASSISTANT_CONFIG_SCOPE] = config[ASSISTANT_CONFIG_SCOPE];
      }
    });

    const serviceSetupMethodName = 'setUpService';
    this.productService[serviceSetupMethodName](this.mediaBaseUrl);
    this.occEndpointsService[serviceSetupMethodName](this.baseUrl);
    this.baseSiteService[serviceSetupMethodName](this.site, this.siteName);

    super.ngOnInit();
  }
}
