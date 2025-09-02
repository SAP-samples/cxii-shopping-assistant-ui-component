import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { OccEndpointsService } from '@spartacus/core';
import { Consignment } from '@spartacus/order/root';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CxaiAssistantTrackingService {
  protected endpointsService = inject(OccEndpointsService);
  protected http = inject(HttpClient);
  protected baseUrl = '/cxai/tools';

  getConsignmentByTrackingId(trackingId: string): Observable<Consignment | null> {
    const url = this.buildUrl(`/find-consignment/${trackingId}?fields=code,status,statusDate,statusDisplay,orderCode`);
    return this.http.get<Consignment | null>(url);
  }

  buildUrl(path: string): string {
    return this.endpointsService.buildUrl(this.baseUrl + path);
  }
}
