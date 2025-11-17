import { OccEndpoint } from '@spartacus/core';

export interface AssistantOccEndpoints {
  cxaiAssistant_trackingIdToConsignment?: string | OccEndpoint;

  cxaiAssistant_postMessage?: string | OccEndpoint;
  cxaiAssistant_getChatSession?: string | OccEndpoint;
  cxaiAssistant_createChatSession?: string | OccEndpoint;
  cxaiAssistant_deleteChatSession?: string | OccEndpoint;
}

declare module '@spartacus/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface OccEndpoints extends AssistantOccEndpoints {}
}

export type AssistantEndpointKey = keyof AssistantOccEndpoints;