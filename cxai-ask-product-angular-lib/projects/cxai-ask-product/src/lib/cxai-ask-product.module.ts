import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CmsConfig, ConfigInitializerService, I18nModule, MODULE_INITIALIZER, provideDefaultConfig } from '@spartacus/core';
import { CxaiAskProductChatComponent } from './cms-components/cxai-ask-product-chat/cxai-ask-product-chat.component';
import { AskProductInitializer } from './config/ask-product.config.initializer';
import { defaultAskProductConfig } from './config/default.ask-product.config';
import { IconModule } from '@spartacus/storefront';


/**
 * @deprecated Please use lazy CxaiAskProductFeatureModule
 */
@NgModule({
  declarations: [
    CxaiAskProductChatComponent
  ],
  imports: [
    CommonModule,
    I18nModule,
    IconModule,
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