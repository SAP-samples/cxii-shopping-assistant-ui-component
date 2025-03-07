import {
  AssistantChatResponse,
  AssistantChatSession,
} from '@cx-spartacus/cxai-assistant/root';

const welcomeMessage = 'Welcome to the Mock Catalog Assistant!';
const assistantResponse = 'Here are some **fantastic** white sneakers {BR3089}, {BR1021WHI} that will elevate your style and comfort:';
const mockSessionId = 'SHOPASSIST_MOCK';

const assistantRecommendations = {
  recommendations: [
    {
      recommendation_type: 'product',
      codes: ['BR3089'],
    },
    {
      recommendation_type: 'product',
      codes: ['BR1021WHI'],
    },
  ],
}

export const mockCreateSessionResponse = {
  session_id: mockSessionId,
  welcome_message: welcomeMessage,
};

export const mockPostMessageResponse: AssistantChatResponse = {
  ...assistantRecommendations,
  response: assistantResponse,
  session_id: mockSessionId,
};

export const mockFreshChatSessionResponse: AssistantChatSession = {
  status: 'active',
  chat_history: [
    {
      role: 'assistant',
      content: welcomeMessage,
    },
  ],
};

export const mockOldChatSessionResponse: AssistantChatSession = {
  status: 'active',
  chat_history: [
    {
      role: 'assistant',
      content: welcomeMessage,
    },
    {
      role: 'user',
      content: 'recommend some white sneakers',
    },
    {
      ...assistantRecommendations,
      role: 'assistant',
      content: assistantResponse,
    },
  ],
};
