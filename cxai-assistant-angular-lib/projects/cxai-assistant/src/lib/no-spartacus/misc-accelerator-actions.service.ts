import { inject, Injectable } from '@angular/core';
import { IMiscSpartacusActionsService } from '../i-cart-actions.service';
import { AssistantContext, ICurrentProductService } from '@cx-spartacus/cxai-assistant/root';
import { Observable, combineLatest, defaultIfEmpty, timeout, of, map } from 'rxjs';

@Injectable()
export class MiscAcceleratorActionsService extends IMiscSpartacusActionsService {
  private readonly currentProductService = inject(ICurrentProductService);

  reloadCart(): void {
    const minicart = (window as any)?.ACC?.minicart;
    if (minicart?.updateMiniCartDisplay) {
      minicart.updateMiniCartDisplay();
    }
  }

  getPageContext(): Observable<AssistantContext> {
    return combineLatest([
      this.currentProductService.getProduct().pipe(
        defaultIfEmpty(null),
        timeout({ first: 1, with: () => of(undefined) }),
      )
    ]).pipe(map(([pdpProduct]) => {
      //context is not currently used by default, if it is enabled then should implement cartProductCodes retrieval too
      return {
        cartProductCodes: [],
        pdpProductCode: pdpProduct?.code,
      }
    }));
  }
}
