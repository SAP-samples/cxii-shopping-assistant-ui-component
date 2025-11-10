import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AssistantChatResponse,
  AssistantChatSessionInternal,
  AssistantNoSessionYetUserInput,
  AssistantUserInput,
} from '@cx-spartacus/cxai-assistant/root';
import { OccEndpointsService } from '@spartacus/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

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

  postMessageAndCreateSession(payload: AssistantNoSessionYetUserInput): Observable<{ session_id: string }> {
    return this.createChatSession(payload.config_id).pipe(
      switchMap((sessionResponse) => {
        return this.postMessage({
          session_id: sessionResponse.session_id,
          user_input: payload.user_input,
        }).pipe(
          map((chatResponse) => {
            return { session_id: chatResponse.session_id };
          })
        );
      })
    );
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
