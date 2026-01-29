import { inject, Injectable, Pipe, PipeTransform } from "@angular/core";
import { ASSISTANT_CONFIG_SCOPE, CxaiAssistantConfig } from "@cx-spartacus/cxai-assistant/root";
import { Product } from "@cx-spartacus/cxai-assistant/root";

@Injectable({
  providedIn: 'root'
})
@Pipe({
  name: 'assistantProductName',
  pure: true,
  standalone: false,
})
export class AssistantProductNamePipe implements PipeTransform {
  protected productNameTemplate = inject(CxaiAssistantConfig)[ASSISTANT_CONFIG_SCOPE]?.productNameTemplate;

  transform(product: Product): string | undefined {
    if(!product) {
      return;
    }

    if(!this.productNameTemplate) {
      return (product.name || product.code)?.trim();
    }

    return this.productNameTemplate.replace(/{([^}]+)}/g, (entireMatch, token) => {
      return product[token] || entireMatch;
    });
  }

}
