import { Component, Input } from '@angular/core';
import { Product } from '@spartacus/core';

@Component({
  selector: 'lib-product-card',
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  standalone: false,
})
export class ProductCardComponent {
  @Input({required: true}) product: Product | null | undefined;
}
