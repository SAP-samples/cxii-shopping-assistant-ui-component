import { Injectable } from "@angular/core";
import { IBaseSiteService } from "@cx-spartacus/cxai-ask-product/root";
import { BehaviorSubject, filter, Observable } from "rxjs";
@Injectable({
  providedIn: 'root'
})
export class WcBaseSiteService extends IBaseSiteService {
  private readonly baseSite$ = new BehaviorSubject<string | undefined>(undefined);

  public setUpService(baseSite: string): void {
    this.baseSite$.next(baseSite);
  }

  override getActive(): Observable<string> {
    return this.baseSite$.pipe(
      filter(Boolean),
    );
  }
}
