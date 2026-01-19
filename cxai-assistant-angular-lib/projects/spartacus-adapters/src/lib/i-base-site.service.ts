import { Observable } from 'rxjs';

export abstract class IBaseSiteService {
  abstract getActive(): Observable<string>;
  abstract getAll(): Observable<{uid?: string, name?: string}[]>;
}
