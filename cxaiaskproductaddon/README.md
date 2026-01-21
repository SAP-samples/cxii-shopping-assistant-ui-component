# SAP-Samples Assistant & Ask Product UI Web Component
This project provides an accelerator component for integrating the CXII Ask Product and Assistant API.


## Prerequisites

Components are based on Spartacus code - they reuse the same backend which is based on OCC. That means you have to enable OCC on your storefront.

Before you integrate the components and API you have to configure SAP AI Toolkit integration with your SAP Commerce Cloud system.
All the steps are available here: https://help.sap.com/docs/cx-ai-toolkit/set-up/provision-new-commerce-tenant?version=CLOUD

1. Add necessary extensions
2. Enable OAuth for selected Integration Objects
3. Adjust mandatory fields on Integration Objects
4. Add missing oauthUrl to ConsumedDestination
5. Adjust IP Filter Set for CCv2 to accept incoming requests from Toolkit's IP Addresses
6. Create OAuth client configuration
7. Perform inital integration in the Toolkit
8. Wait for data replication to complete

### Link IAS Client ID with Toolkit Organizagtion

Follow Step 1 of Procedure available here:
https://help.sap.com/docs/cx-ai-toolkit/set-up/configuration?version=CLOUD

If you don't know the IAS Client ID it can be found in Backoffice:

1. Go to Backoffice
2. Navigate to: System > API > Credentials > Consumed OAuthCredentials
3. Find CXAIToolkitCredentials_\<your-toolkit-organization-id> (The organization id is available in the Toolkit > Settings > Organization)
4. Copy Client ID value

## Install the Component
### Add Required Extensions to Manifest
If you use OCC Extensions (`commercewebservices`):
1. Add https://github.com/SAP-samples/cxii-commerce-extn as submodule, and extensions `cxaiocc`, `cxaibackoffice` to CCV2 manifest
2. Add https://github.com/SAP-samples/cxii-shopping-assistant-ui-component as a submodule, and extensions `cxaiaskproductocc` to manifest
3. Add `cxaiaskproductaddon` extension to manifest, including `storefrontAddons` section
4. Deploy with migrate data

### Add Required Extensions to Manifest - Legacy OCC addons usage
If you use legacy OCC addons (`ycommercewebservices` generated extension instead of `commercewebservices`):
1. Add https://github.com/SAP-samples/cxii-commerce-extn/ as submodule, and extensions `cxaioccaddon`, `cxaibackoffice` to CCV2 manifest
2. Add https://github.com/SAP-samples/cxii-shopping-assistant-ui-component/ as a submodule, and extensions `cxaiaskproductoccaddon` to manifest
3. Add `cxaiaskproductaddon` extension to manifest, including `storefrontAddons` section
4. Add `cxaioccaddon` and `cxaiaskproductoccaddon` to `storefrontAddons` of your `ycommercewebservices` template extension
5. Deploy with migrate data

### Configure CX AI Backend
Run the following impex to configure CX AI. 
You need to set proper variable values, and change site / catalog name from `electronics` to your site.

```bash
# CXAI config
$askProductUrl=https://ai-assistant-usea-prod-api.cxai.cloud.sap
$askProductAuthUrl=https://<ias>.accounts.ondemand.com/oauth2/token
$askProductClientId=<client_id>
$askProductClientSecret=<client_secret>
$siteUid=electronics

INSERT_UPDATE ConsumedDestination; id[unique = true]    ; url                      ; destinationTarget(id); active[default = true]
                                 ; ask-product          ; $askProductUrl           ; Default_Template     ; 

INSERT_UPDATE ConsumedOAuthCredential; id[unique = true]   ; clientId               ; clientSecret               ; oAuthUrl
                                     ; ask-product         ; $askProductClientId    ; $askProductClientSecret    ; $askProductAuthUrl

# Alternatively we can link CXAIToolkitCredentials_<your-toolkit-organization-id> as credential(id)
UPDATE ConsumedDestination; id[unique = true] ; credential(id)
                          ; ask-product       ; ask-product

INSERT_UPDATE CxaiConfig; code[unique=true]; baseSites(uid)  ; consumedDestination(id); askProductDestination(id); active;
                        ; $siteUid        ; $siteUid         ;                        ; ask-product              ; true  ;
```

As a result you'll see new config in backoffice / CX AI Configurations.

### Add the Chat Component to a Slot
Add component to your desired slot
```bash
$contentCatalog = electronicsContentCatalog
$version = Staged
$contentCV = catalogVersion(CatalogVersion.catalog(Catalog.id[default=$contentCatalog]), CatalogVersion.version[default=$version])[default=$contentCatalog:$version]

INSERT_UPDATE CxaiAskProductChatJspComponent;$contentCV[unique=true];uid[unique=true];name
;;CxaiAskProductChatJspComponent;CxaiAskProductChatJspComponent

# Optional restriction - don't render component if no valid CXAI Config
INSERT_UPDATE AskProductRestriction; $contentCV[unique = true]; uid[unique = true]      ; name                    ; components(uid, $contentCV)
                                       ;                      ; AskProductRestriction   ; Ask Product Restriction ; CxaiAskProductChatJspComponent

# (+?) = append if not already appended
INSERT_UPDATE ContentSlot;$contentCV[unique=true];uid[unique=true];cmsComponents(uid, $contentCV)
;;<SlotName>;(+?)CxaiAskProductChatJspComponent
```

### Add the Assistant Component to a Slot
Add component to slot that is present on every page (e.g. FooterSlot)

```bash
$contentCatalog = electronicsContentCatalog
$version = Staged
$contentCV = catalogVersion(CatalogVersion.catalog(Catalog.id[default=$contentCatalog]), CatalogVersion.version[default=$version])[default=$contentCatalog:$version]

INSERT_UPDATE CxaiAssistantChatJspComponent;$contentCV[unique=true];uid[unique=true];name
;;CxaiAssistantChatJspComponent;CxaiAssistantChatJspComponent

# Optional restriction - don't render component if no valid CXAI Config
INSERT_UPDATE AssistantRestriction; $contentCV[unique = true]; uid[unique = true]      ; name                    ; components(uid, $contentCV)
                                       ;                     ; AssistantRestriction    ; Assistant Restriction   ; CxaiAssistantChatJspComponent

# (+?) = append if not already appended
INSERT_UPDATE ContentSlot;$contentCV[unique=true];uid[unique=true];cmsComponents(uid, $contentCV)
;;<FooterSlot>;(+?)CxaiAssistantChatJspComponent
```

### Allow components to be added in SmartEdit (optional)
Optionally can also run the following to allow adding it in SmartEdit
```bash
INSERT_UPDATE ComponentTypeGroups2ComponentType;source(code)[unique=true];target(code)[unique=true]
;wide;CxaiAskProductChatJspComponent
;narrow;CxaiAskProductChatJspComponent
;mobile;CxaiAskProductChatJspComponent
;wide;CxaiAssistantChatJspComponent
;narrow;CxaiAssistantChatJspComponent
;mobile;CxaiAssistantChatJspComponent
```

You can also add component directly from JSPInclude / JSP page, e.g.:
```jsp
<%@ taglib prefix="cms" uri="http://hybris.com/tld/cmstags" %>
<cms:component uid="CxaiAskProductChatJspComponent"/>
```

Ask product component will only work if product.code is available in page context (e.g. on PDP).

### Verify that component renders properly
Go to the page where you added the component. If component is not visible, view page source and look for `<cxai-`.
1. Make sure that baseUrl is correct, if not see [Change Backend URL](#change-backend-url)
2. If `baseUrl` and `productCode` is valid check DevTools Network tab for request to `cxai/config`
3. if request fails with 403 make sure to set CORS properties in your API aspect for your commercewebservices extension e.g:
  ```bash
  corsfilter.commercewebservices.allowedOrigins=<URL of your storefront>
  # if using legacy OCC
  corsfilter.ycommercewebservices.allowedOrigins=<URL of your storefront>
  corsfilter.yoursitecommercewebservices.allowedOrigins=<URL of your storefront>
  ```

  URL is just a base URL to your storefront, e.g. `https://some.domain.com`

### Change Translation Labels
You can edit `base_xx.properties` inside `cxaiaskproductaddon/acceleratoraddon/web/webroot/WEB-INF/messages/` to translate the components. You can also add new `base_xx.properties` file for new languages.
Keys not present in the translation file will default to the English label defined in javascript components.
```bash
askProduct.inputPlaceholder=Ask anything...
askProduct.welcomeMessage=Hello! If you have any questions about this product feel free to ask here.
askProduct.noAnswerMessage=Sorry, could not find answer to your question. Please ask a different one.
askProduct.send=Generate
askProduct.clearChat=Clear

cxaiAssistant.inputPlaceholder=What are you looking for today?
cxaiAssistant.title={{siteName}} Assistant
...
```
### Change Backend URL
By default component tries to use `ccv2.services.api.url.0` property as backend (OCC) URL and `ext.commercewebservices.extension.webmodule.webroot` as OCC prefix (e.g. /occ/v2). If default values are not resolved properly you can uncomment the following properties (defined in `project.properties.template`) to force using specific backend URL 

```bash
cxaiaskproductaddon.occ.prefix=/occ/v2/
cxaiaskproductaddon.occ.baseUrl=
```

### Extra addon properties
Assistant requires font-awesome icons to be loaded. If you already use them then set `cxaiaskproductaddon.importFontAwesome` to `false`.
```properties
# Change when script is updated to invalidate browser cache
cxaiaskproductaddon.script.version=2211.47.0
# Set to false if you already have font awesome icons
cxaiaskproductaddon.importFontAwesome=true
```

Empty base URL = use the same domain as storefront as backend.

### Customize Default Colors
You can adjust values for variables that are normally present in Spartacus storefront, see `cxaiaskproductaddon.css`. Internal css variables use these colors.
```css
/** selector must be more specific than [attribute] {} */
.page-productDetails cxai-ask-product-chat {
  --cx-color-primary:  #0066cc;
  --cx-color-text:  #333333;
  --cx-color-medium:  #999999;
  --cx-color-light:  #f5f5f5;
  --cx-color-background:  #ffffff;
  --cx-color-inverse:  #ffffff;
  --cx-color-danger:  #dc3545;
}
```

### Change Internal (derived) CSS Variables
Internal css variables must be targeted by `cxai-ask-product-chat .cxai-chat-wrapper` selector. See `_common-variables.less` for default values. As an example default font size is modified in `cxaiaskproductaddon.css`. 
You can also modify any other styles (besides variables) as component is not using Shadow DOM.

Example of overriding some variables:
```css
.page-productDetails cxai-ask-product-chat .cxai-chat-wrapper {
  --cxai-font-size: 14px;
  /** change assistant chat bubble */
  --cxai-message-assistant-background: #faa;
  --cxai-message-assistant-border: 1px solid #c00;
  --cxai-message-assistant-text: var(--cx-color-text);
  /* disable border radius for textarea */
  --cxai-border-radius--small: 0;
}
```

All defined veriables:
```less
:host {
  --cxai-spacer: 20px;
  --cxai-spacer--extra-small: 5px;
  --cxai-spacer--small: 10px;
  --cxai-spacer--big: 36px;
  --cxai-icon-size: 20px;
  --cxai-border-radius--small: 5px;
  --cxai-border-radius--big: 15px;
  --cxai-border: 1px solid var(--cx-color-medium);
  --cxai-border--dark: 1px solid var(--cx-color-text);
  --cxai-shadow--small: 0 2px 4px #22354840;
  --cxai-shadow--big: 0 1px 6px lightgrey;
  --cxai-chat-min-height: 300px;
  --cxai-chat-default-height: 600px;
  --cxai-chat-min-width: 400px;
  --cxai-font-size: 1rem;
  --cxai-border-color: #ffffff4c;
  --cxai-border--light: 1px solid var(--cxai-border-color);
  --cxai-input-bg: #fff;
  --cxai-input-active-color: #4682b4;
  --cxai-placeholder-color: var(--cx-color-medium);
  --cxai-input-color: var(--cx-color-text);
  --cxai-button-height: 40px;
  --cxai-chat-input-height: 40px;

  // Colors for the title-bar, float button, default for btn-primary
  --cxai-primary: var(--cx-color-primary);
  --cxai-primary-text: var(--cx-color-inverse);

  // Chat background, popup background
  --cxai-background: var(--cx-color-background);

  // Chat message - assistant
  --cxai-message-assistant-background: var(--cx-color-light);
  --cxai-message-assistant-border: 1px solid var(--cx-color-medium);
  --cxai-message-assistant-text: var(--cx-color-text);

  // Chat message - user
  --cxai-message-user-background: var(--cx-color-primary);
  --cxai-message-user-border: unset;
  --cxai-message-user-text: var(--cx-color-inverse);

  // Error message
  --cxai-message-error-background: var(--cx-color-danger);
  --cxai-message-error-border: unset;
  --cxai-message-error-text: var(--cx-color-inverse);
}
```

## Development
### Build the Library
1. Go to angular workspace `cxai-assistant-angular-lib`
2. Run `nvm use`
3. Run `npm i`
4. Run `./build-web.component.sh` - this will build the bundle and update files in this addon
5. To make sure file is fetched after modification you can modify `cxaiaskproductaddon.script.version` property when `cxai-components.js` file is updated
6. You can also run `npm run build:web-component` to just build the code but not copy it to addon
7. You can run `ng s` to run web-components on localhost page - make sure you set proper parameters in `index.html`

### Modify JSP Component
You can modify `cxaiaskproductchatjspcomponent.jsp` and serving controllers to change component behavior.

`cxaiaskproductaddon.js` contains information about javascript context that is consumed by the component, e.g. you can set `ACC.cxaiaskproductaddon.config` to disable fetching config via occ

`ACC.cxaiaskproductaddon.i18n` contains translation labels that are passed to the component - they are populated automatically from `.properties` files.

`ACC.cxaiaskproductaddon.spartacus` contains required configs normally available in Spartacus storefront.

### OCC Tokens (Assistant)
Assistant component requires a valid customer OCC token to perform actions like checking orders or adding items to the cart. Since Accelerator doesn't natively authorize with OCC, this token is not available by default.

Sample code is provided with `DefaultAcceleratorOccTokenService`, which attempts to create a customer token. However, this only works with the default configuration.

You may need to develop your own `AcceleratorOccTokenService` implementation to handle OCC authorization, for example, by generating the token when a customer logs in.

Alternatively, you can use `NoopAcceleratorOccTokenService` (via `-spring.xml` override) and disable the relevant agents in the CX AI Assistant Config (`AddToCartAgent`, `OrderStatusAgent`).
