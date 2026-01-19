import { Observable } from 'rxjs';

export abstract class ITranslationService {
  abstract translate: (
    key: string | string[],
    options?: any,
    whitespaceUntilLoaded?: boolean
  ) => Observable<string>;
}
