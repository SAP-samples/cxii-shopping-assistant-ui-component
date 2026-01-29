import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { IOccEndpointsService, IProductService, Product } from "@cx-spartacus/cxai-ask-product/root";
import { map, Observable } from "rxjs";
import { ProductImageNormalizer } from "./product-image-normalizer";

@Injectable({
  providedIn: 'root'
})
export class WcProductService extends IProductService {
  private readonly http = inject(HttpClient);
  private readonly occEndpoints = inject(IOccEndpointsService);
  private readonly productImageNormalizer = inject(ProductImageNormalizer);

  public setUpService(baseUrl: string): void {
    this.productImageNormalizer.setUpService(baseUrl);
  }

  override get(productCode: string): Observable<Product | undefined> {
    const url = this.occEndpoints.buildUrl('product', {
      urlParams: { productCode },
    });

    return this.http
      .get(url)
      .pipe(
        map(p => this.productImageNormalizer.convert(p)),
      );
  }
}
