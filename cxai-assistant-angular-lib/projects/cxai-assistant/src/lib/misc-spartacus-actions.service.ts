/*
 * SPDX-FileCopyrightText: 2025 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { inject, Injectable } from '@angular/core';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { AssistantContext, ICurrentProductService, ILoggerService } from '@cx-spartacus/cxai-assistant/root';
import { combineLatest, defaultIfEmpty, filter, map, Observable, of, switchMap, take, timeout } from 'rxjs';
import { IMiscSpartacusActionsService } from './i-cart-actions.service';

const ASSISTANT_LOG_MARKER = 'CXAI-ASSISTANT';

@Injectable()
export class MiscSpartacusActionsService extends IMiscSpartacusActionsService {
  private readonly activeCartFacade = inject(ActiveCartFacade);
  private readonly currentProductService = inject(ICurrentProductService);
  private readonly loggerService = inject(ILoggerService);

  reloadCart(): void {
    this.activeCartFacade.getActiveCartId().pipe(
      switchMap(cartId => {
        if(cartId) {
          this.activeCartFacade.reloadActiveCart();
          return of(cartId);
        } else {
          return this.activeCartFacade.requireLoadedCart().pipe(
            filter(cart => !!cart?.code || !!cart?.guid),
            take(1),
            map(cart => cart.code || cart.guid || ''),
          )
        }
      }),
      take(1),
    ).subscribe(cartId => {
      this.loggerService.info(ASSISTANT_LOG_MARKER, 'Reloaded cart', cartId);
    });
  }

  getPageContext(): Observable<AssistantContext> {
    return combineLatest([
      this.activeCartFacade.getActive(),
      this.currentProductService.getProduct().pipe(
        defaultIfEmpty(null),
        timeout({ first: 1, with: () => of(undefined) }),
      )
    ]).pipe(map(([cart, pdpProduct]) => {
      return {
        cartProductCodes: cart.entries ? cart.entries.map(e => e.product?.code).filter(Boolean) as string[] : [],
        pdpProductCode: pdpProduct?.code,
      }
    }));
  }
}
