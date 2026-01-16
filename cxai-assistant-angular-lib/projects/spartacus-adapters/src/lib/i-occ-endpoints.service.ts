export abstract class IOccEndpointsService {
  /**
   * Build a URL for the given endpoint
   */
  abstract buildUrl(endpoint: string, urlParams?: object, queryParams?: object): string;
}
