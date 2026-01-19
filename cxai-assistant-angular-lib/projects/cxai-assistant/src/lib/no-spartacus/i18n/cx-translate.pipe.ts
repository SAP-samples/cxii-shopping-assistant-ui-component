import { inject, Pipe, PipeTransform } from '@angular/core';
import { ITranslationService } from '@cx-spartacus/cxai-assistant/root';
import { AcceleratorTranslationService } from './accelerator-translation.service';

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
  private readonly translationService = inject(ITranslationService) as AcceleratorTranslationService;

  transform(key: string, params?: { [key: string]: string | number }): string {
    return this.translationService.translateSync([key], params);
  }
}
