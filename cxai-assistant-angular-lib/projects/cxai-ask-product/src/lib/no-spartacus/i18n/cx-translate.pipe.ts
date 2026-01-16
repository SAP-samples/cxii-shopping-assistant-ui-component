import { Pipe, PipeTransform } from '@angular/core';
import { en } from '@cx-spartacus/cxai-ask-product/root';

/**
 * Standalone pipe for translating text with optional parameters
 *
 * Usage examples:
 * - {{ 'askProduct.inputPlaceholder' | cxTranslate }}
 * - {{ 'askProduct.welcome' | cxTranslate : { siteName: currentSiteName } }}
 */
@Pipe({
  name: 'cxTranslate',
  standalone: true,
})
export class CxTranslatePipe implements PipeTransform {
  private readonly translations = Object.assign({}, en.askProduct);

  constructor() {
    this.translations = {
      askProduct: {
        ...this.translations.askProduct,
        ...(window['ACC']?.cxaiaskproduct?.i18n?.askProduct ?? {}),
      }
    }
  }

  transform(key: string, params?: { [key: string]: string | number }): string {
    const translation = this.getNestedValue(this.translations, key);

    if (typeof translation !== 'string') {
      return key; // Return key if translation not found
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
