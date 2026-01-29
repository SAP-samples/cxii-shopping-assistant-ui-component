/* eslint-disable @typescript-eslint/no-empty-object-type */
import { NgModule } from '@angular/core';
import { CxaiAssistantRootModule } from './cxai-assistant-root.module';
import { AssistantOccEndpoints, CXAI_ASSISTANT_FEATURE, CxaiAssistantConfig } from '@cx-spartacus/cxai-assistant/root';
import { CmsConfig, provideConfig } from '@spartacus/core';

declare module '@spartacus/core' {
  interface Config extends CxaiAssistantConfig {}
  interface OccEndpoints extends AssistantOccEndpoints {}
}

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
