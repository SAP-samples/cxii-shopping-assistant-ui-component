import { NgModule } from '@angular/core';
import { CxaiAssistantRootModule } from '@cx-spartacus/cxai-assistant/root';
import { CXAI_ASSISTANT_FEATURE } from '@cx-spartacus/cxai-assistant/root';
import { CmsConfig, provideConfig } from '@spartacus/core';

@NgModule({
  imports: [CxaiAssistantRootModule],
  providers: [
    provideConfig(<CmsConfig>{
      featureModules: {
        [CXAI_ASSISTANT_FEATURE]: {
          module: () =>
            import('@cx-spartacus/cxai-assistant').then((m) => m.CxaiAssistantMainModule),
        },
      },
    }),
  ],
})
export class CxaiAssistantFeatureModule { }
