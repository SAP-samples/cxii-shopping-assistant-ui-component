# cxai-ask-product library
Extension to workspace README for ask-product library.

## Add library to application
1. Add `@cx-spartacus/cxai-ask-product` to package.json
2. Import `CxaiAskProductFeatureModule` (not MainModule) into app.module 
3. Optionally provide `CxaiAskProductConfig` using `provideConfig`
4. `AskProductInitializer` will fetch config from backend when main module is loaded, values from this config have priority over locally provided config (fields that are defined will overwrite local values)

## Backend assumptions
This library uses cxai backend, which contains:
1. `/cxai/config` endpoint to fetch configuration
2. `/cxai/ask-product/*` proxy which forwards requests to API and handles authorization, this library does not send any credentials and doesn't manage tokens.

## Variant products
When using variant products, the ask product service receives only the currently viewed variant's product code. This means you can ask questions specific to that variant, but **only that variant's datasheets** are used to generate the response. The backend service does not use variant hierarchy (does not include the base product). 
To get answers to general questions that span multiple variants (such as available sizes etc.), you need to provide common datasheets for each variant product.

## Config
Config is fetched from backend, but can be also provided locally. Backend values (if defined) **will overwrite local**.

```js
    provideConfig({
      cxaiAskProduct: {
        contextCharacterLimit: 0,
        contextMessageWindow: 0,
      },
    } satisfies CxaiAskProductConfig),
```

Full config definition
```js
export interface AskProductConfigInternal {
  url?: string;
  authUrl?: string;
  clientId?: string;
  clientSecret?: string;
  //how many previous messages pass as context, with character limit
  //this is managed on client-side, backend does not keep any context
  contextCharacterLimit?: number;
  contextMessageWindow?: number;
}

//default config passed by the library
export const defaultAskProductConfigInternal: AskProductConfigInternal = {
  contextCharacterLimit: 2000,
  contextMessageWindow: 4,
};
```
## Add component
Restriction (last line) hides component if no valid CXAI ask product config is present for current site.

```
INSERT_UPDATE CMSFlexComponent; $contentCV[unique = true]; uid[unique = true]          ; name                        ; flexType
                              ;                          ; CxaiAskProductChatComponent ; CxaiAskProductChatComponent ; CxaiAskProductChatComponent

INSERT_UPDATE AskProductRestriction; $contentCV[unique = true]; uid[unique = true]    ; name                    ; components(uid, $contentCV)
                                   ;                          ; AskProductRestriction ; Ask Product Restriction ; CxaiAskProductChatComponent

INSERT_UPDATE ContentSlot; $contentCV[unique = true]; uid[unique = true] ; cmsComponents(uid, $contentCV)
                         ;                          ; ProductSummarySlot ; (-)CxaiAskProductChatComponent,(+)CxaiAskProductChatComponent
```
