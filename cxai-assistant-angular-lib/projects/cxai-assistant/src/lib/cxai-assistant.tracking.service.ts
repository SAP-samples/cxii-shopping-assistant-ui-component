import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AssistantEndpointKey, CXAI_ASSISTANT_FEATURE } from '@cx-spartacus/cxai-assistant/root';
import { OccEndpointsService } from '@spartacus/core';
import { Consignment } from '@spartacus/order/root';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CxaiAssistantTrackingService {
  private readonly endpointsService = inject(OccEndpointsService);
  private readonly http = inject(HttpClient);

  getConsignmentByTrackingId(trackingId: string): Observable<Consignment | null> {
    const url = this.endpointsService.buildUrl(CXAI_ASSISTANT_FEATURE, {
      scope: 'trackingIdToConsignment' satisfies AssistantEndpointKey,
      urlParams: { trackingId },
    });

    return this.http.get<Consignment | null>(url);
  }
}
