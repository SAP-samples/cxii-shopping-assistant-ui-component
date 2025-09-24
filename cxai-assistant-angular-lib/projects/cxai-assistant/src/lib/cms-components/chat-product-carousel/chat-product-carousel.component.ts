import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  ViewChild, OnInit, AfterViewInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Product, ProductService } from '@spartacus/core';
import { ICON_TYPE } from '@spartacus/storefront';
import { debounceTime, Observable } from 'rxjs';
import { CxaiAssistantService } from '../../cxai-assistant.service';

@Component({
  selector: 'lib-chat-product-carousel',
  templateUrl: './chat-product-carousel.component.html',
  styleUrl: './chat-product-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ChatProductCarouselComponent implements OnInit, AfterViewInit {
  private readonly productService = inject(ProductService);
  private readonly cxaiAssistantService = inject(CxaiAssistantService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  @ViewChild('carousel', { static: true }) carousel!: ElementRef;
  @Input() productCodes: string[] = [];
  products$: Observable<Product | undefined>[] = [];
  elementWidth = 150;
  gapWidth = 20;
  scrollValue = 0;
  maxScrollValue = 0;
  iconTypes = ICON_TYPE;

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
    this.products$ = this.productCodes.map((code) => this.productService.get(code));
  }

  ngAfterViewInit() {
    this.carousel.nativeElement.scrollLeft = 0;
    this.calculateScrollBounds();
  }

  //recalculate scroll values when component is resized
  calculateScrollBounds() {
    this.scrollValue = Math.ceil(this.carousel.nativeElement.scrollLeft / (this.elementWidth + this.gapWidth));
    const totalCarouselWidth = this.products$.length * this.elementWidth + (this.products$.length - 1) * this.gapWidth;
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
