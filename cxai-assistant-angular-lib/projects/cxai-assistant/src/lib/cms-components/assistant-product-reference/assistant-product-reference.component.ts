import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Product, IProductService } from '@cx-spartacus/cxai-assistant/root';
import { Observable, tap } from 'rxjs';
import { AssistantProductNamePipe } from '../product-name.pipe';
import { AssistantTokenContext } from '@cx-spartacus/cxai-assistant/root';
@Component({
  selector: 'lib-assistant-product-reference',
  templateUrl: './assistant-product-reference.component.html',
  styleUrl: './assistant-product-reference.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AssistantProductReferenceComponent implements OnInit {
  tokenContext: AssistantTokenContext = inject(AssistantTokenContext);
  token = this.tokenContext.token;
  private readonly productService = inject(IProductService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly assistantProductNamePipe = inject(AssistantProductNamePipe);

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

    this.product$ = this.productService.get(this.token.content).pipe(
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
      this.tokenContext.chatWindowComponent.focusInput();
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
