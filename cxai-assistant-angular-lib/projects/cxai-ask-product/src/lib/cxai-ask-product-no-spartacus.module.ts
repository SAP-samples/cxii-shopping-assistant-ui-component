import { NgModule } from '@angular/core';
import { CxaiAskProductChatComponent } from './cms-components/cxai-ask-product-chat/cxai-ask-product-chat.component';
import { CxaiAskProductBaseModule } from './cxai-ask-product-base.module';
import { CxTranslatePipe } from './no-spartacus/i18n/cx-translate.pipe';

/**
 * @deprecated Please use lazy CxaiAskProductFeatureModule
 * Module variant WITHOUT Spartacus dependency - for web component build
 */
@NgModule({
  declarations: [
    CxaiAskProductChatComponent,
  ],
  imports: [
    CxaiAskProductBaseModule,
    CxTranslatePipe,
  ],
  exports: [
    CxaiAskProductChatComponent,
  ],
})
export class CxaiAskProductModule { }
