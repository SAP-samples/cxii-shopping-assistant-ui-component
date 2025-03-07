import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AssistantChatResponse,
  AssistantChatSession,
  AssistantUserInput,
} from '@cx-spartacus/cxai-assistant/root';
import { OccEndpointsService } from '@spartacus/core';

@Injectable({
  providedIn: 'root',
})
export class CxaiAssistantApiService {
  protected endpointsService = inject(OccEndpointsService);
  protected http = inject(HttpClient);
  protected baseUrl = '/cxai/assistant';
  
  postMessage(payload: AssistantUserInput) {
    const url = this.buildUrl('/chat');
    return this.http.post<AssistantChatResponse>(url, payload);
  }

  getChatSession(sessionId: string) {
    const url = this.buildUrl(`/chat_session/${sessionId}`);
    return this.http.get<AssistantChatSession>(url);
  }

  createChatSession(configId: string) {
    const url = this.buildUrl('/chat_session');
    return this.http.post<{ session_id: string }>(url, {
      config_id: configId,
    });
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
