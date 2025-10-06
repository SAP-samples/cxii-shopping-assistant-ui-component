# Example Assistant and Ask Product backend

OCC and backoffice extension for CXII Assistant and Ask Product

## Requirements
It requires and extends https://github.com/SAP-samples/cxii-commerce-extn/

## Download and Installation
Add `cxaiaskproductocc`, `cxai`, `cxaibackoffice` to localextensions
Run database update / migration

## Functionality
1. Extends `/cxai/config` endpoint to include Assistant and Ask Product config
2. Provides `/cxai/assistant/*` proxy to access Assistant API using current site's CX AI Config
3. Provides `/cxai/ask-product/*` proxy to access Ask Product API using current site's CX AI Config
4. Adds Assistant and Ask Product tab to backoffice / CX AI configuration node
5. Adds CX AI Assistant Config section subnode, which allows to manage remote Assistant chat configs

## Proxy authorization
By default `/cxai/assistant/*` and `/cxai/ask-product/*` proxy require user to be logged in commerce, meaning that components won't work for anonymous user - you can attach `loggedInUser` restriction to hide components for anonymous users.

```
UPDATE AbstractCMSComponent; uid[unique = true]          ; onlyOneRestrictionMustApply; restrictions(uid,$contentCV); $contentCV[unique = true];
                           ; AssistantChatFloatComponent ; false                      ; (-)loggedInUser,(+)loggedInUser
                           ; CxaiAskProductChatComponent ; false                      ; (-)loggedInUser,(+)loggedInUser

```

Alternatively you can remove `@Secured` from OCC Controllers classes, in this case OCC proxy will be fully open which is not recommended.

## Sample Assistant Config JSON 
Sample payload for use when creating a config from backoffice (JSON field). This is subject to change and not all features are currently used, please consult https://api.sap.com/api/sap-cxai-apiResource-ShoppingAssistant-v1/resource/create_config_v2_v2_config_post


```json
{
  "agent_name": "<agent name>",
  "agent_description": "<agent description>",
  "is_active": true,
  "initial_message": "<welcome message, overridable via UI translations>",
  "catalog_id": "<product catalog used for recommendation>",
  "catalog_version": "Online",
  "classification": "<what kind of products are recommended, e.g. automotive/fashion, optional>",
  "sub_agents": [
    {
      "name": "PriceRecommendationAgent",
      "is_active": true
    },
    {
      "name": "SelfServiceAgent",
      "is_active": true
    },
    {
      "name": "OrderStatusAgent",
      "is_active": true
    },
    {
      "name": "AddToCartAgent",
      "is_active": true
    },
    {
      "name": "StockAgent",
      "is_active": true,
      "features": {
        "show_out_of_stock_recommendations": true,
        "allow_specific_quantity_stock_queries": false
      }
    }
  ],
  "global_settings": {
    "default_language": "en-US",
    "tone": "Neutral",
    "brand": "<brand>"
  }
}
```
