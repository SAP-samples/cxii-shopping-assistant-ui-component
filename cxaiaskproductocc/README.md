# Example Assistant backend

OCC and backoffice extension for CXII Assistant

## Requirements
It requires and extends https://github.com/SAP-samples/cxii-commerce-extn/

## Download and Installation
Add `cxaiaskproductocc`, `cxai`, `cxaibackoffice` to localextensions
Run database update / migration

## Functionality
1. Extends `/cxai/config` endpoint to include Assistant config
2. Provides `/cxai/assistant/*` proxy to access Assistant API using current site's CX AI Config
3. Adds Assistant tab to backoffice / CX AI configuration node
4. Adds CX AI Assistant Config section subnode, which allows to manage remote chat configs

## Proxy authorization
By default `/cxai/assistant/*` proxy requires user to be logged in commerce, meaning that Assistant won't work for anonymous user - you can attach `loggedInUser` restriction to hide AssistantChatFloatComponent for anonymous users.

```
UPDATE AbstractCMSComponent; uid[unique = true]          ; onlyOneRestrictionMustApply; restrictions(uid,$contentCV); $contentCV[unique = true];
                           ; AssistantChatFloatComponent ; false                      ; (-)loggedInUser,(+)loggedInUser

```

Alternatively you can remove `@Secured` from OCC Controller class, in this case OCC proxy will be fully open which is not recommended.

## Example Assistant Config JSON 
Example payload for use when creating a config from backoffice (JSON field). This is subject to change and not all features are currently used, please consult https://api.sap.com/api/sap-cxai-apiResource-ShoppingAssistant-v1/resource/create_config_v2_v2_config_post


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
      }
   ],
  "global_settings": {
    "default_language": "en-US",
    "tone": "formal",
    "voice": "",
    "brand": "<brand>"
  }
}
```
