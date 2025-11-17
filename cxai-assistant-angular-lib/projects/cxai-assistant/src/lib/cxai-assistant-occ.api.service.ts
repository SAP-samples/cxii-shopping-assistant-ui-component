import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DynamicAttributes, OccEndpointsService } from '@spartacus/core';
import {
  AssistantChatResponse,
  AssistantChatSessionInternal,
  AssistantEndpointKey,
  AssistantUserInput,
  CxaiAssistantApiService,
} from '@cx-spartacus/cxai-assistant/root';

@Injectable({
  providedIn: 'root',
})
export class CxaiAssistantOccApiService extends CxaiAssistantApiService {
  protected readonly endpointsService = inject(OccEndpointsService);
  protected readonly http = inject(HttpClient);

  postMessage(payload: AssistantUserInput) {
    const url = this.buildUrl('cxaiAssistant_postMessage', {
      urlParams: { sessionId: payload.session_id },
    });

    return this.http.post<AssistantChatResponse>(url, payload);
  }

  getChatSession(sessionId: string) {
    const url = this.buildUrl('cxaiAssistant_getChatSession', { urlParams: { sessionId } });

    return this.http.get<AssistantChatSessionInternal>(url);
  }

  createChatSession(configId: string) {
    const body = { config_id: configId };
    const url = this.buildUrl('cxaiAssistant_createChatSession', { urlParams: { configId } });
    return this.http.post<{ session_id: string }>(url, body);
  }

  deleteChatSession(sessionId: string) {
    const url = this.buildUrl('cxaiAssistant_deleteChatSession', { urlParams: { sessionId } });
    const deleteRequest = {
      session_ids: [sessionId],
    };

    return this.http.delete(url, { body: deleteRequest });
  }

  buildUrl(urlId: AssistantEndpointKey, attributes?: DynamicAttributes | undefined): string {
    return this.endpointsService.buildUrl(urlId, attributes);
  }
}
