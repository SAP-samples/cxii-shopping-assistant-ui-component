
# Cxai Assistant Angular Lib
## Add library to application
1. Add `@cx-spartacus/cxai-assistant` to package.json
2. Import `CxaiAssistantFeatureModule` (not MainModule) into app.module 
3. Optionally provide `CxaiAssistantConfig` using `provideConfig`
4. `CxaiAssistantInitializer` will fetch config from backend when main module is loaded, values from this config have priority over locally provided config (fields that are defined will overwrite local values)

## Backend assumptions
This library uses cxai backend, which contains:
1. `/cxai/config` endpoint to fetch configuration - can be configured or turned off via local config `configInitializerEndpoint`
2. `/cxai/assistant/*` proxy which forwards requests to assistant API and handles authorization, this library does not send any credentials and doesn't manage tokens. If you implement this kind of proxy be sure to filter (allowlist) allowed API calls and not forward all requests. See `CxaiAssistantApiService` to check which endpoints / methods are required. Other calls to the API should be blocked.

## Spartacus config
Config is fetched from backend, but can be also provided locally. Backend values (if defined) will overwrite local.

```js
    provideConfig({
      cxaiAssistant: {
        //enable if SAP-icons font is available
        useSapIcons: true,
        //disable attaching hidden context to text messages
        chatMessageContextProvider: null,
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


## Create assistant config using /config endpoint
https://api.sap.com/api/sap-cxai-apiResource-ShoppingAssistant-v1/resource/create_config_v2_v2_config_post

This will return configId which must be provided via local spartacus config, or backend config.

## Customize library
### Modify styles
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
### Override token components
Chat may return tokens inside a message, e.g. product code, order code etc. These tokens may be handled by custom components. Usually default implementation is provided but you may swap it with your own.
See `AssistantTokenType` for available token types (`product`, `order`, `tracking_id` etc). 

```ts
    provideConfig(<CmsConfig>{
      cmsComponents: {
       AssistantToken_product: { //AssistantToken_<tokenType>
         component: MyComponent, //overwrite with custom component or undefined to display tokens as-is (e.g. just raw product code)
       }
      },
    }),
```
Inside component inject `AssistantTokenContext` - see `AssistantProductReference` or `AssistantOrderReferenceComponent` for an example.

### Extend via outlets
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

## Backend extensions
This section is relevant only if you use cxai backend extensions which provide CXAI section in backoffice.

Current limitation: config is connected with site, so in case of many sites need to create separate CX AI configs for each site.

```
$assistantConfigIdCanary=<config_id>
# CXAI config
INSERT_UPDATE ConsumedOAuthCredential; id[unique = true] ; clientId                                      ; clientSecret                               ; oAuthUrl
                                     ; visual-search-canary     ; $config-stylebuddy.clientId            ; $config-stylebuddy.clientSecret            ; $visualSearchAuthUrl
                                     ; visual-search-prod       ; $config-stylebuddy.prod.clientId       ; $config-stylebuddy.prod.clientSecret       ; $visualSearchProdAuthUrl
                                     ; ask-product-canary       ; $config-cxai.ask-product.clientId      ; $config-cxai.ask-product.clientSecret      ; $askProductAuthUrl
                                     ; ask-product-prod         ; $config-cxai.ask-product.prod.clientId ; $config-cxai.ask-product.prod.clientSecret ; $askProductAuthUrl

INSERT_UPDATE ConsumedDestination; id[unique = true]     ; url                       ; destinationTarget(id); credential(id)       ; active[default = true]
                                 ; visual-search-canary  ; $visualSearchCanaryUrl    ; Default_Template     ; visual-search-canary ;
                                 ; visual-search-prod    ; $visualSearchProdUrl      ; Default_Template     ; visual-search-prod   ;
                                 ; ask-product-canary    ; $askProductCanaryUrl      ; Default_Template     ; ask-product-canary   ;
                                 ; ask-product-prod      ; $askProductProdUrl        ; Default_Template     ; ask-product-prod     ;
                                 ; assistant-canary      ; $assistantCanaryUrl       ; Default_Template     ; visual-search-canary ;

INSERT_UPDATE CxaiConfig; code[unique=true]; baseSites(uid); consumedDestination(id); askProductDestination(id); variantDuplicateFiltering; enableObjectDetection; active; assistantConfigId        ; assistantDestination(id);
                        ; canary           ; $cxaiSites    ; visual-search-canary   ; ask-product-canary       ; true                     ; false                ; true  ; $assistantConfigIdCanary ; assistant-canary
                        ; prod             ; $cxaiSites    ; visual-search-prod     ; ask-product-prod         ; true                     ; false                ; false ; $assistantConfigIdCanary ; assistant-canary
```

assistantDestination is optional - required only if it's different that default Visual Search (VS) destination. If it's empty it will use default VS destination and just change the API suffix.