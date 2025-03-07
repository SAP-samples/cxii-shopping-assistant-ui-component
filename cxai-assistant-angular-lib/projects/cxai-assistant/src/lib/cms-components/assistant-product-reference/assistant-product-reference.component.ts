import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Product, ProductService } from '@spartacus/core';
import { Observable, tap } from 'rxjs';
import { AssistantProductNamePipe } from '../product-name.pipe';

@Component({
  selector: 'lib-assistant-product-reference',
  templateUrl: './assistant-product-reference.component.html',
  styleUrl: './assistant-product-reference.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantProductReferenceComponent implements OnInit {
  @Input({required: true}) productCode!: string;
  @Output() productCopied = new EventEmitter<string>();

  productService = inject(ProductService);
  changeDetectorRef = inject(ChangeDetectorRef);
  assistantProductNamePipe = inject(AssistantProductNamePipe);

  product$!: Observable<Product | undefined>;
  loadPopup = false;
  popupVisible = false;
  invalidProduct = false;
  popupCoords: {x: number, y: number | undefined} | undefined;

  ngOnInit() {
    //there is no other way to detect loading error
    const loadTimeout = setTimeout(() => {
      this.invalidProduct = true;
      this.changeDetectorRef.markForCheck();
    }, 2000);

    this.product$ = this.productService.get(this.productCode).pipe(
      tap((product) => {
        if(product?.code) {
          clearTimeout(loadTimeout);
          this.invalidProduct = false;
        }
      })
    )
  }

  copyToClipboard(product: Product) {
    const text = '"' + this.assistantProductNamePipe.transform(product) + '"';
    navigator.clipboard.writeText(text).then(() => {
      this.productCopied.emit(text);
    });
  }

  togglePopup(event: MouseEvent) {
    this.popupVisible = !this.popupVisible;
    this.loadPopup = true;
    //click coordinates within relative container
    this.popupCoords = {x: event.offsetX + 15, y: undefined};

    //prevent event from bubbling up to parent
    event.stopPropagation();
  }

  close() {
    if(this.popupVisible) {
      this.popupVisible = false;
      this.changeDetectorRef.markForCheck();
    }
  }
}
