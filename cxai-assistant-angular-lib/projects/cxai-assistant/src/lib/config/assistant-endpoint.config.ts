import { AssistantOccEndpoints } from "@cx-spartacus/cxai-assistant/root";
import { OccConfig } from "@spartacus/core";

const occAssistantEndpoints: AssistantOccEndpoints = {
  cxaiAssistant_trackingIdToConsignment: 
    '/cxai/tools/find-consignment/${trackingId}?fields=code,status,statusDate,statusDisplay,orderCode',

  // sessionId or configId parameters are available where it makes sense, but not always used in default API
  cxaiAssistant_postMessage: '/cxai/assistant/chat',
  cxaiAssistant_getChatSession: '/cxai/assistant/chat_session/${sessionId}',
  cxaiAssistant_createChatSession: '/cxai/assistant/chat_session',
  cxaiAssistant_deleteChatSession: '/cxai/assistant/sessions',
};

export const defaultOccAssistantConfig: OccConfig = {
  backend: {
    occ: {
      endpoints: {
        ...occAssistantEndpoints,
      },
    },
  },
};
