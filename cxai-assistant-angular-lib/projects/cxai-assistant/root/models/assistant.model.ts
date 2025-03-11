
export interface AssistantRecommendation {
  codes: string[];
  recommendation_type?: string;
}

export interface AssistantChatMessage {
  content: string;
  contextString?: string;
  //here it is always flattened to zero-size array
  recommendations?: AssistantRecommendation[];
  role: 'assistant' | 'user';
  error?: boolean;
}

export interface AssistantChatSession {
  chat_history: AssistantChatMessage[];
  session_id?: string;
  //properly created backend session has status 'active'
  //dummy sessions, e.g. EMPTY_CHAT_SESSION, or error sessions don't have this field
  //so this can be used to check if session is valid, or error
  status?: string;
}

export interface AssistantUserInput {
  session_id: string;
  user_input: string;
}

export interface AssistantChatResponse {
  session_id: string;
  response: string;
  recommendations?: AssistantRecommendation[];
}

export interface AssistantChatTextData {
  text: string;
  send?: boolean;
}

export interface AssistantContext {
  cartProductCodes?: string[];
  searchQuery?: string;
  pdpProductCode?: string;
}

export const EMPTY_CHAT_SESSION: AssistantChatSession = {
  chat_history: [],
  session_id: undefined,
};