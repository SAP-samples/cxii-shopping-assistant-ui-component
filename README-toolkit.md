## CX AI Toolkit Integration
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
