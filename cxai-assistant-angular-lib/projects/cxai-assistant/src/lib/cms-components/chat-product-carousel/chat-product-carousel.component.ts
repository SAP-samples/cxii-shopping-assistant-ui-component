import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ASSISTANT_CONFIG_SCOPE, AssistantTokenContext, CxaiAssistantConfig, Product } from '@cx-spartacus/cxai-assistant/root';
import { debounceTime, Observable, tap } from 'rxjs';
import { CxaiAssistantService } from '../../cxai-assistant.service';
import { ChatProductService } from '../../chat-product.service';

@Component({
  selector: 'lib-chat-product-carousel',
  templateUrl: './chat-product-carousel.component.html',
  styleUrl: './chat-product-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ChatProductCarouselComponent implements OnInit {
  private readonly chatProductService = inject(ChatProductService);
  private readonly cxaiAssistantService = inject(CxaiAssistantService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly collapseVariantCategories = inject(CxaiAssistantConfig)[ASSISTANT_CONFIG_SCOPE]?.collapseVariantCategories || [];

  tokenContext: AssistantTokenContext = inject(AssistantTokenContext);
  productCodes = this.tokenContext.token.data as string[];

  @ViewChild('carousel', { static: true }) carousel!: ElementRef;
  products$!: Observable<Product[]>;

  private numberOfProducts = this.productCodes.length;
  elementWidth = 150;
  gapWidth = 20;
  scrollValue = 0;
  maxScrollValue = 0;

  constructor() {
    this.cxaiAssistantService
      .getChatWindowSize$()
      .pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe(() => {
        this.calculateScrollBounds();
        this.changeDetectorRef.markForCheck();
      });
  }

  ngOnInit() {
    this.products$ = this.chatProductService
      .buildProductStream(this.productCodes, this.collapseVariantCategories)
      .pipe(
        tap((products) => this.numberOfProducts = products.length),
        tap(() => {
          this.carousel.nativeElement.scrollLeft = 0;
          this.calculateScrollBounds();
        })
      );
  }

  // recalculate scroll values when component is resized
  calculateScrollBounds() {
    this.scrollValue = Math.ceil(this.carousel.nativeElement.scrollLeft / (this.elementWidth + this.gapWidth));
    const totalCarouselWidth = this.numberOfProducts * this.elementWidth + (this.numberOfProducts - 1) * this.gapWidth;
    this.maxScrollValue = Math.ceil(
      (totalCarouselWidth - this.carousel.nativeElement.clientWidth) / (this.elementWidth + this.gapWidth),
    );
  }

  scrollCarousel(amount: number) {
    this.calculateScrollBounds();
    this.scrollValue = Math.min(Math.max(0, this.scrollValue + amount), this.maxScrollValue);
    this.carousel.nativeElement.scrollLeft = this.scrollValue * (this.elementWidth + this.gapWidth);
  }
}
