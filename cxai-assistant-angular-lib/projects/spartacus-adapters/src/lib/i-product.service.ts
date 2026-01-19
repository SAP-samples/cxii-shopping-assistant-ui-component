import { Observable } from 'rxjs';
import { Product } from './interfaces/product';

export abstract class IProductService {
  /**
   * Get product by code
   */
  abstract get(
    productCode: string,
  ): Observable<Product | undefined>;

}
