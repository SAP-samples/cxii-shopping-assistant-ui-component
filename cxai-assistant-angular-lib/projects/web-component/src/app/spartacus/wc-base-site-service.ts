import { Injectable } from "@angular/core";
import { IBaseSiteService } from "@cx-spartacus/cxai-ask-product/root";
import { BehaviorSubject, filter, map, Observable } from "rxjs";

interface BaseSite {
  uid: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WcBaseSiteService extends IBaseSiteService {
  private readonly baseSite$ = new BehaviorSubject<BaseSite | undefined>(undefined);

  public setUpService(siteUid: string, siteName?: string): void {
    this.baseSite$.next({ uid: siteUid, name: siteName });
  }

  override getActive(): Observable<string> {
    return this.baseSite$.pipe(
      filter(Boolean),
      map((baseSite) => baseSite!.uid),
    );
  }

  override getAll(): Observable<BaseSite[]> {
    return this.baseSite$.pipe(
      map((baseSite) => baseSite ? [{ uid: baseSite.uid, name: baseSite.name }] : []),
    );
  }
}
