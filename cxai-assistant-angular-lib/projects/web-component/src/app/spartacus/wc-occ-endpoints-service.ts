import { inject, Injectable } from "@angular/core";
import { IBaseSiteService, IOccEndpointsService } from "@cx-spartacus/cxai-ask-product/root";
import { filter, take } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class WcOccEndpointsService extends IOccEndpointsService {
  private readonly baseSiteService = inject(IBaseSiteService);
  private baseUrl!: string;
  private baseSite: string | undefined;

  constructor() {
    super();
    this.baseSiteService.getActive().pipe(
      filter(x => !!x),
      take(1),
    ).subscribe(site => {
      this.baseSite = site;
    })
  }

  public setUpService(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  override buildUrl(endpoint: string, urlParams?: object, queryParams?: object): string {
    let url = this.baseUrl;
    if (!url.endsWith('/')) {
      url += '/';
    }

    url += this.baseSite + '/';

    // Remove leading slash from endpoint if present
    if (endpoint.startsWith('/')) {
      endpoint = endpoint.substring(1);
    }
    url += endpoint;
    // Optionally add query params
    if (queryParams && Object.keys(queryParams).length > 0) {
      const query = Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      url += `?${query}`;
    }
    return url;
  }
}
