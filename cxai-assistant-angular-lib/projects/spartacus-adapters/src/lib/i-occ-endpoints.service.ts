import { DynamicAttributes } from "./interfaces/misc";

export abstract class IOccEndpointsService {
  /**
   * Build a URL for the given endpoint
   */
  abstract buildUrl(endpoint: string, attributes?: DynamicAttributes): string;
}
