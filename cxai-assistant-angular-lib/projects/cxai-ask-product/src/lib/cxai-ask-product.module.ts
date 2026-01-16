import { NgModule } from '@angular/core';
import { AskProductConfig } from '@cx-spartacus/cxai-ask-product/root';
import { CmsConfig, ConfigInitializerService, I18nModule, MODULE_INITIALIZER, provideDefaultConfig } from '@spartacus/core';
import { CxaiAskProductChatComponent } from './cms-components/cxai-ask-product-chat/cxai-ask-product-chat.component';
import { AskProductInitializer } from './config/ask-product.config.initializer';
import { defaultAskProductConfig } from './config/default.ask-product.config';
import { CxaiAskProductBaseModule } from './cxai-ask-product-base.module';

/**
 * @deprecated Please use lazy CxaiAskProductFeatureModule
 * Module variant WITH Spartacus support
 */
@NgModule({
  declarations: [
    CxaiAskProductChatComponent,
  ],
  imports: [
    CxaiAskProductBaseModule,
    I18nModule,
  ],
  exports: [
    CxaiAskProductChatComponent,
  ],
  providers: [
    provideDefaultConfig(defaultAskProductConfig),
    provideDefaultConfig(<CmsConfig>{
      cmsComponents: {
        CxaiAskProductChatComponent: {
          component: CxaiAskProductChatComponent
        }
      }
    }),
    //we're creating private copy of ConfigInitializerService because root version can't be reused
    ConfigInitializerService,
    {
      provide: MODULE_INITIALIZER,
      useFactory: moduleConfigInitializer,
      deps: [AskProductInitializer, ConfigInitializerService],
      multi: true,
    },
  ]
})
export class CxaiAskProductModule { }

function moduleConfigInitializer(
  initializer: AskProductInitializer,
  configInitializerService: ConfigInitializerService
) {
  return () => configInitializerService['initialize']([initializer]);
}

declare module '@spartacus/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Config extends AskProductConfig {}
}
