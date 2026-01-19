import { OccEndpoint } from '@spartacus/core';

export interface AssistantOccEndpoints {
  cxaiAssistant_trackingIdToConsignment?: string | OccEndpoint;

  cxaiAssistant_postMessage?: string | OccEndpoint;
  cxaiAssistant_getChatSession?: string | OccEndpoint;
  cxaiAssistant_createChatSession?: string | OccEndpoint;
  cxaiAssistant_deleteChatSession?: string | OccEndpoint;
}

export type AssistantEndpointKey = keyof AssistantOccEndpoints;
