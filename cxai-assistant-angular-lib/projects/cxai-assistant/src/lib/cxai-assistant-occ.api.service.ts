import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DynamicAttributes, IOccEndpointsService } from '@cx-spartacus/cxai-assistant/root';
import {
  AssistantChatResponse,
  AssistantChatSessionInternal,
  AssistantEndpointKey,
  AssistantProductFilter,
  AssistantUserInput,
  CxaiAssistantApiService,
} from '@cx-spartacus/cxai-assistant/root';

@Injectable({
  providedIn: 'root',
})
export class CxaiAssistantOccApiService extends CxaiAssistantApiService {
  protected readonly endpointsService = inject(IOccEndpointsService);
  protected readonly http = inject(HttpClient);

  override postMessage(payload: AssistantUserInput) {
    const url = this.buildUrl('cxaiAssistant_postMessage', {
      urlParams: { sessionId: payload.session_id },
    });

    return this.http.post<AssistantChatResponse>(url, payload);
  }

  override getChatSession(sessionId: string) {
    const url = this.buildUrl('cxaiAssistant_getChatSession', { urlParams: { sessionId } });

    return this.http.get<AssistantChatSessionInternal>(url);
  }

  override createChatSession(configId: string, filters: AssistantProductFilter[] = []) {
    const body = { config_id: configId, filter_attributes: filters };
    const url = this.buildUrl('cxaiAssistant_createChatSession', { urlParams: { configId } });
    return this.http.post<{ session_id: string }>(url, body);
  }

  override deleteChatSession(sessionId: string) {
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
