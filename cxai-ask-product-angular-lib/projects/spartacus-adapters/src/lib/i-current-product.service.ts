import { Observable } from 'rxjs';
import { Product } from './interfaces/product';

export abstract class ICurrentProductService {
  /**
   * Get the current product
   */
  abstract getProduct(): Observable<Product | null>;
}
