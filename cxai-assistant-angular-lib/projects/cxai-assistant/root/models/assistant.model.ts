
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

//internal api response formats
export interface AssistantUserInput {
  session_id: string;
  user_input: string;
}

//for send first message & open session endpoint
export interface AssistantNoSessionYetUserInput {
  config_id: string;
  user_input: string;
}

export interface AssistantChatMessageInternal {
  content: string | AssistantChatContentInternal;
  role: 'assistant' | 'user';
}

export interface AssistantChatSessionInternal {
  chat_history: AssistantChatMessageInternal[];
  status: string;
  user_id?: string | null;
}

export interface AssistantAction {
  action: string;
}

export interface AssistantChatContentInternal {
  response: string;
  recommendations?: AssistantRecommendation[];
  //any actions performed, e.g. add_to_cart, some of them may require refreshing data
  actions?: AssistantAction[];
}
export interface AssistantChatResponse extends AssistantChatContentInternal {
  session_id: string;
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