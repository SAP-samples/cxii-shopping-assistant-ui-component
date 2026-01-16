import { Observable } from 'rxjs';

export abstract class IBaseSiteService {
  abstract getActive(): Observable<string>;
}
