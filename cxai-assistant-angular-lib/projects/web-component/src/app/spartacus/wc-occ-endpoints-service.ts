import { inject, Injectable } from "@angular/core";
import { DynamicAttributes, IBaseSiteService, IOccEndpointsService } from "@cx-spartacus/cxai-ask-product/root";
import { filter, take } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class WcOccEndpointsService extends IOccEndpointsService {
  private readonly baseSiteService = inject(IBaseSiteService);
  private readonly namedUrls = window?.ACC?.spartacus?.occEndpoints ?? {};

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

  override buildUrl(endpoint: string, attributes?: DynamicAttributes): string {
    let url = this.baseUrl;
    if (!url.endsWith('/')) {
      url += '/';
    }

    url += this.baseSite + '/';

    if(this.namedUrls[endpoint]) {
      endpoint = this.namedUrls[endpoint];
    }

    // Remove leading slash from endpoint if present
    if (endpoint.startsWith('/')) {
      endpoint = endpoint.substring(1);
    }

    // Replace URL parameters
    if (attributes?.urlParams) {
      for (const [key, value] of Object.entries(attributes.urlParams)) {
        endpoint = endpoint.replace(`\${${key}}`, encodeURIComponent(String(value)));
      }
    }

    url += endpoint;
    // Optionally add query params
    if (attributes?.queryParams && Object.keys(attributes.queryParams).length > 0) {
      const query = Object.entries(attributes.queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      url += `?${query}`;
    }
    return url;
  }
}
