
# Spartacus Library Workspace
Projects within the workspace:
- cxai-ask-product: ask product library
- cxai-assistant: assistant library
- spartacus-adapters: compatibility layer for no-spartacus builds (accelerator only)
- web-component: web-component build for accelerator (accelerator only)

For Composable Storefront only 2 first projects are relevant, 3rd is copied into code by build scripts.

## Requirements
1. Node version specified in `.nvmrc` files
2. Valid `configurationId` created by Assistant API https://api.sap.com/api/sap-cxai-apiResource-ShoppingAssistant-v1/resource/create_config_v2_v2_config_post or in Backoffice as in [Quick Start Guide](../README.md)
3. Library depends on backend which allows access to part of API without authorization. Library assumes API is served via OCC, but you modify default URLs and use a custom backend. Sample backend extension is provided: [Backend README](cxaiaskproductocc/README.md). [Quick Start Guide](../README.md) shows setup using default backend.

## Download and Installation
The following instructions are for assistant library. For ask-product you can follow exactly the same steps, just change `assistant` to `ask-product`. You can either use prebuilt release or build the library manually.

### Using Prebuilt Release
1. Open latest [release](https://github.com/SAP-samples/cxii-shopping-assistant-ui-component/releases) 
2. Modify your application's `package.json` by adding entries specified on release page
    > Optionally you can `npm publish` the tgzs to your private npm registry and use version syntax instead of URLs
3. Run `npm i`
4. Skip to [Importing Assistant Library Module](#importing-assistant-library-module)

### Building the Library
Development guide for building and debugging the library.

#### Running the Build
1. cd into `cxai-assistant-angular-lib`
2. `nvm use` or use node version specified in `.nvmrc`
3. Verify and adjust `.npmrc` file
    - if you use private npm registry (e.g. Verdaccio, GitHub Packages etc.) as a proxy for `@spartacus` (and to host your own packages) then just set environment variables to your proxy URL and auth token
    - otherwise replace `@spartacus:registry` with URL and credentials that you use in your spartacus app (e.g. RBSC) and optionally add `@cx-spartacus:registry` to be able to `npm publish`
4. `npm i`
    - never run `npm install` inside `projects/*`, only in workspace root
5. `npm run build:assistant`

#### Publishing to Your Private npm Repository
If you own a private npm repository:
1. Update `@cx-spartacus:registry` in `.npmrc` to point to your private repository
2. Run `build.sh` script
3. Add library to your application's `package.json`, e.g.
    - `"@cx-spartacus/cxai-assistant": "~2211.43.0"`

#### Creating .tgz File (If You Don't Have npm Repository)
If you don't own a private npm repository:
1. `cd` into `dist/cxai-assistant` after `npm run build:assistant`
2. Run `npm pack` - this will produce a `.tgz` file
3. Copy the `.tgz` into your application's codebase, e.g. into `lib/cx-spartacus-cxai-assistant-<version>.tgz`
4. Add library to your application's `package.json`, e.g.
    - `"@cx-spartacus/cxai-assistant": "file:lib/cx-spartacus-cxai-assistant-<version>.tgz"`

#### Run in Development Mode
If you want to run the library in watch mode:
1. Run `npm link` in `dist/cxai-assistant` folder (after `npm run build`)
2. Run `npm link @cx-spartacus/cxai-assistant` in your application
    > You need to have `"preserveSymlinks": true,` in app's `angular.json` projects/<project_name>/architect/build/options
3. Run the library using `npm run watch:assistant`
4. Run your app `ng s`
5. When you modify library code, the application will reload automatically
6. `npm link` is temporary and will be removed after each `npm install` in your application

### Importing Assistant Library Module
After you've successfully added library as a dependency in your application's `package.json`, and either run `npm install` or `npm link` you can now use it.
1. Add import `CxaiAssistantFeatureModule` from `@cx-spartacus/cxai-assistant/feature` into `app.module`
2. Build your application - it must build without errors.

Optional steps:
1. Optionally provide `CxaiAssistantConfig` using `provideConfig`
2. `CxaiAssistantInitializer` will fetch config from backend when main module is loaded, values from this config **have priority over locally provided config** (fields that are defined will overwrite local values)
    > You can disable fetching backend config by `configInitializerEndpoint: null` in locally provided config.

### Ask Product Library
For ask product library, do the same steps but use `:ask-product` for npm commands. Check [Ask Product README](projects/cxai-ask-product/README.md) for custom information.

## Backend Assumptions
This library uses cxai backend, which contains:
1. `/cxai/config` endpoint to fetch configuration - can be configured or turned off via local config `configInitializerEndpoint`
2. `/cxai/assistant/*` proxy which forwards requests to assistant API and handles authorization, this library does not send any credentials and doesn't manage tokens. If you implement this kind of proxy be sure to filter (allowlist) allowed API calls and not forward all requests. See `CxaiAssistantOccApiService` to check which endpoints / methods are required. Other calls to the API should be blocked.
3. You can provide your own `CxaiAssistantApiService` implementation, or overwrite API URLs via standard Spartacus mechanism.
```js
const occAssistantEndpoints: AssistantOccEndpoints = {
  cxaiAssistant_trackingIdToConsignment: 
    '/cxai/tools/find-consignment/${trackingId}?fields=code,status,statusDate,statusDisplay,orderCode',

  // sessionId or configId parameters are available where it makes sense, but not always used in default API
  cxaiAssistant_postMessage: '/cxai/assistant/chat',
  cxaiAssistant_getChatSession: '/cxai/assistant/chat_session/${sessionId}',
  cxaiAssistant_createChatSession: '/cxai/assistant/chat_session',
  cxaiAssistant_deleteChatSession: '/cxai/assistant/sessions',
};
```

## Spartacus config
Config is fetched from backend, but can be also provided locally. Backend values (if defined) will overwrite local.

```js
    provideConfig({
      cxaiAssistant: {
        //enable if SAP-icons font is available, otherwise font-awesome is used
        useSapIcons: true,
      },
    } satisfies CxaiAssistantConfig),
```

Full config definition
```js
export interface CxaiAssistantConfigInternal {
  //must be created via API, fetched from backend by default
  assistantConfigId?: string;
  //set to null to disable config initializer - then you must provide assistantConfigId locally
  configInitializerEndpoint?: string;
  //use sap-icon instead of font-awesome, this requires sap-icons font to be loaded
  //https://github.com/SAP/theming-base-content/tree/master/content/Base/baseLib/baseTheme/fonts
  useSapIcons?: boolean;
  /** open session only after first message is sent or immediately when window is opened.
  if set to true then you must provide cxaiAssistant.welcomeMessage via translations, otherwise you can
  rely on welcome message provided by the backend */
  openSessionOnlyAfterFirstMessage?: boolean;
  //in rare use case where product.name doesn't contain full product name, you can provide a template like "{name} {summary}"
  //product codes in chat message will be replaced accordingly
  productNameTemplate?: string;
  //returns additional context pasted directly into chat message - see sampleAssistantContextProvider for example
  //context is not visible in the UI, it's appended into each message and stripped before displaying it in the chat
  //however it may allow the user to ask about current product, or cart contents etc
  //this is temporary solution until API is extended
  chatMessageContextProvider?: ((context: AssistantContext) => string) | null;
}

//default config passed by the library
export const defaultAssistantConfigInternal: CxaiAssistantConfigInternal = {
  configInitializerEndpoint: '/cxai/config',
};
```
## Adding component via impex
Restriction (last line) hides component if no valid assistant config is present for current site (e.g. empty config id). Ignore it if you don't use backend extensions.

```
INSERT_UPDATE CMSFlexComponent; $contentCV[unique = true]; uid[unique = true]          ; name                        ; flexType
                              ;                          ; AssistantChatFloatComponent ; AssistantChatFloatComponent ; AssistantChatFloatComponent

INSERT_UPDATE ContentSlot; $contentCV[unique = true]; uid[unique = true]; cmsComponents(uid, $contentCV)
                         ;                          ; FooterSlot        ; (-)AssistantChatFloatComponent,(+)AssistantChatFloatComponent

INSERT_UPDATE AssistantRestriction; $contentCV[unique = true]; uid[unique = true]   ; name                  ; components(uid, $contentCV)
                                  ;                          ; AssistantRestriction ; Assistant Restriction ; AssistantChatFloatComponent
```

## Customize the Assistant Library
### Modify Styles
By default default OOTB spa colors are used (e.g. `--cx-color-primary`) so library should look good on OOTB spartacus. See `_common-variables.scss` for details. Example of changing some colors:
```scss
.cxai-chat-wrapper {
  //titlebar, float button
  --cxai-primary: var(--xy-primary);
  --cxai-primary-text: var(--xy-white);
  --cxai-font-size: var(--xy-font-size);
  //color of user's, assistant, error chat bubbles
  --cxai-message-user-background: var(--cxai-primary);
  --cxai-message-user-text: var(--cxai-primary-text);
  --cxai-message-assistant-border: 1px solid black;
  --cxai-message-error-background: (--xy-danger);
}
```
### Override Token Components
Chat may return tokens inside a message, e.g. product code, order code etc. These tokens may be handled by custom components. Usually default implementation is provided but you may swap it with your own.
See `AssistantTokenType` for available token types (`product`, `order`, `tracking_id` etc). 

```ts
    {
      provide: CxaiAssistantTokenComponentsConfig,
      useValue: {
        assistantTokens: {
          [AssistantComponents.AssistantToken_product]: SampletokenComponent,
        }
      } satisfies CxaiAssistantTokenComponentsConfig,
    }
```
Inside component inject `AssistantTokenContext` - see `AssistantProductReference` or `AssistantOrderReferenceComponent` for an example.

```ts
export class SampletokenComponent implements OnInit {
  tokenContext: AssistantTokenContext = inject(AssistantTokenContext);
  token = this.tokenContext.token;
  ...
}
```

### Extend via Outlets
You can change float button appearance or add custom titlebar actions, buttons next to "send" etc. via Spartacus outlets.

```ts
    provideOutlet({
      id: CxaiAssistantOutlets.CHAT_BUTTONS,
      component: SampleoutletComponent,
      position: OutletPosition.AFTER,
    }),
    provideOutlet({
      id: CxaiAssistantOutlets.TITLEBAR_ACTIONS,
      component: SampleoutletComponent,
      position: OutletPosition.AFTER,
    })
```
```ts
@Component({
  selector: 'app-sampleoutlet',
  templateUrl: './sampleoutlet.component.html',
  standalone: false,
})
export class SampleoutletComponent {
  readonly outletContext$: Observable<AssistantChatWindowOutletContext> = inject(OutletContextData<AssistantChatWindowOutletContext>).context$;

  sendHello(context: AssistantChatWindowOutletContext): void {
    context.chatWindowComponent.insertInputText('Hello');
  }
}
```
```html
<button *ngIf="outletContext$ | async as context" type="button" 
 class="cxai-btn action" 
 [disabled]="context.chatWindowComponent.inputTextDisabled()" 
 (click)="sendHello(context)">
  <i class="fa-solid fa-microphone"></i>
</button>
```
