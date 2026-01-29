import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Product } from '@cx-spartacus/cxai-assistant/root';

@Component({
  selector: 'lib-product-card',
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  @Input({required: true}) product: Product | null | undefined;
}
