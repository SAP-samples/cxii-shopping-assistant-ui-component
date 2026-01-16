import { Injectable } from "@angular/core";
import { ICurrentProductService, Product } from "@cx-spartacus/cxai-ask-product/root";
import { BehaviorSubject, filter, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class WcCurrentProductService extends ICurrentProductService {

  private readonly productCode$ = new BehaviorSubject<Product | undefined>(undefined);

  public setUpService(productCode: string): void {
    this.productCode$.next({ code: productCode });
  }

  override getProduct(): Observable<Product> {
    return this.productCode$.pipe(
      filter(p => !!p),
    );
  }
}
