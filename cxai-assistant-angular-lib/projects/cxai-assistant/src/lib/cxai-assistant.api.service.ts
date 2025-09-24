import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AssistantChatResponse,
  AssistantChatSessionInternal,
  AssistantNoSessionYetUserInput,
  AssistantUserInput,
} from '@cx-spartacus/cxai-assistant/root';
import { OccEndpointsService } from '@spartacus/core';

@Injectable({
  providedIn: 'root',
})
export class CxaiAssistantApiService {
  protected readonly endpointsService = inject(OccEndpointsService);
  protected readonly http = inject(HttpClient);
  protected baseUrl = '/cxai/assistant';
  
  postMessage(payload: AssistantUserInput) {
    const url = this.buildUrl('/chat');
    return this.http.post<AssistantChatResponse>(url, payload);
  }

  getChatSession(sessionId: string) {
    const url = this.buildUrl(`/chat_session/${sessionId}`);
    return this.http.get<AssistantChatSessionInternal>(url);
  }

  createChatSession(configId: string) {
    const body = { config_id: configId };
    const url = this.buildUrl('/chat_session');
    return this.http.post<{ session_id: string }>(url, body);
  }

  postMessageAndCreateSession(payload: AssistantNoSessionYetUserInput) {
    const url = this.buildUrl('/combined_chat_session');
    // it actually returns a response as well but not always contain recommendations
    // so we just return the session_id and require getSession call to obtain the conversation
    return this.http.post<{ session_id: string }>(url, payload);
  }

  deleteChatSession(sessionId: string) {
    const url = this.buildUrl(`/sessions`);
    const deleteRequest = {
      session_ids: [sessionId],
    };

    return this.http.delete(url, { body: deleteRequest });
  }

  buildUrl(path: string): string {
    return this.endpointsService.buildUrl(this.baseUrl + path);
  }
}
