import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { CxaiAskProductModule, AskProductInitializer } from '@cx-spartacus/cxai-ask-product';
import { ASK_PRODUCT_CONFIG_SCOPE, AskProductConfig, IBaseSiteService, ICurrentProductService, IOccEndpointsService } from '@cx-spartacus/cxai-ask-product/root';

@Component({
  selector: 'lib-ask-product-chat-wc',
  templateUrl: './ask-product-chat-wc.component.html',
  styleUrls: ['./ask-product-chat-wc.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CxaiAskProductModule,
  ],
  // this will require style refactor, e.g. all css variables to be defined in :host
  // encapsulation: ViewEncapsulation.ShadowDom,
})
export class AskProductChatWcComponent implements OnInit {
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('base-url') baseUrl: string | undefined;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('product-code') productCode: string | undefined;
  @Input() site: string | undefined;

  currentProductService = inject(ICurrentProductService);
  occEndpointsService = inject(IOccEndpointsService);
  baseSiteService = inject(IBaseSiteService);
  config$ = inject(AskProductInitializer).configFactory();
  config = inject(AskProductConfig);

  ngOnInit() {
    this.config$.then(config => {
      if(config) {
        this.config[ASK_PRODUCT_CONFIG_SCOPE] = config[ASK_PRODUCT_CONFIG_SCOPE];
      }
    });

    const serviceSetupMethodName = 'setUpService';
    this.currentProductService[serviceSetupMethodName](this.productCode);
    this.occEndpointsService[serviceSetupMethodName](this.baseUrl);
    this.baseSiteService[serviceSetupMethodName](this.site);
  }
}
