import { Directive, ElementRef, inject, Input, OnChanges } from '@angular/core';

/**
 * Directive that provides router-like navigation using standard href behavior
 * Used in no-Spartacus / Accelerator setup to not pull @angular/router
 *
 * Usage:
 * <a [routerLink]="'/products'">Products</a>
 * <a [routerLink]="['/category', categoryId]">Category</a>
 */
@Directive({
  selector: '[routerLink]',
  standalone: true,
})
export class RouterLinkDirective implements OnChanges {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  @Input() routerLink: string | string[] = '';

  ngOnChanges(): void {
    const url = this.buildUrl();
    if (url) {
      this.elementRef.nativeElement.setAttribute('href', url);
    }
  }

  private buildUrl(): string {
    if (!this.routerLink) {
      return '';
    }

    if (typeof this.routerLink === 'string') {
      return this.routerLink;
    }

    if (Array.isArray(this.routerLink)) {
      // Join array segments with '/'
      return this.routerLink
        .map(segment => String(segment))
        .join('/')
        .replace(/\/+/g, '/'); // Remove duplicate slashes
    }

    return '';
  }
}
