import { isDevMode } from "@angular/core";
import { en, ITranslationService } from "@cx-spartacus/cxai-assistant/root";
import { Observable, of } from "rxjs";

export class AcceleratorTranslationService extends ITranslationService {
  private readonly translations = Object.assign({}, en.cxaiAssistant);
  private readonly NON_BREAKING_SPACE = String.fromCharCode(160);

  constructor() {
    super();
    this.translations = {
      cxaiAssistant: {
        ...this.translations.cxaiAssistant,
        ...(window.ACC?.cxaiassistant?.i18n?.cxaiAssistant ?? {}),
      }
    }
  }

  override translate = (key: string | string[], options?: any): Observable<string> => {
    const possibleKeys = this.getPossibleKeys(Array.isArray(key) ? key[0] : key, options || {});
    return of(
      this.translateSync(possibleKeys, options)
    );
  }

  private getPossibleKeys(key: string, params: { [key: string]: string | number }): string[] {
    const keys = [key];
    const context = params['context'] as string | undefined;

    if(context) {
      keys.unshift(`${key}_${context}`);
    }

    return keys;
  }

  translateSync(keys: string[], params?: { [key: string]: string | number }): string {

    let translation: string | null = null;

    for (const key of keys) {
      const value = this.getNestedValue(this.translations, key);
      if (typeof value === 'string') {
        translation = value;
        break;
      }
    }

    if (!translation) {
      return isDevMode() ? `[${keys[keys.length - 1]}]` : this.NON_BREAKING_SPACE;
    }

    if (!params) {
      return translation;
    }

    // Replace placeholders like {{paramName}} with actual values
    return translation.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
      return params[paramName]?.toString() || match;
    });
  }

  /**
   * Get nested value from object using dot notation
   * @param obj Object to search in
   * @param path Dot-separated path (e.g., 'askProduct.inputPlaceholder')
   * @returns Value at the path or undefined
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }
}
