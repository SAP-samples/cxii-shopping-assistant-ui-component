import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AssistantEndpointKey } from '@cx-spartacus/cxai-assistant/root';
import { IOccEndpointsService } from '@cx-spartacus/cxai-assistant/root';
import { Consignment } from '@spartacus/order/root';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CxaiAssistantTrackingService {
  private readonly endpointsService = inject(IOccEndpointsService);
  private readonly http = inject(HttpClient);

  getConsignmentByTrackingId(trackingId: string): Observable<Consignment | null> {
    const url = this.endpointsService.buildUrl(`cxaiAssistant_trackingIdToConsignment` satisfies AssistantEndpointKey, {
      urlParams: { trackingId },
    });

    return this.http.get<Consignment | null>(url);
  }
}
