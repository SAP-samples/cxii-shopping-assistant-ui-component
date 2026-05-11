import { inject, Injectable } from '@angular/core';
import { ASSISTANT_LOG_MARKER, ILoggerService, IProductService, Product, VariantOptionQualifier } from '@cx-spartacus/cxai-assistant/root';
import { catchError, filter, forkJoin, map, Observable, of, take } from 'rxjs';

@Injectable()
export class ChatProductService {
  private readonly productService = inject(IProductService);
  private readonly loggerService = inject(ILoggerService);

  /** Fetches all products, emits once when all are resolved, and collapses variant duplicates. */
  buildProductStream(codes: string[], categories: string[]): Observable<Product[]> {
    return this.loadProducts(codes).pipe(
      categories.length
        ? map(products => this.collapseVariants(products, categories))
        : map(products => products)
    );
  }

  /** Fetches all products and emits once when all are resolved, enabling a single render without per-card pop-in. */
  loadProducts(codes: string[]): Observable<Product[]> {
    return forkJoin(
      codes.map((code) =>
        this.productService.get(code).pipe(
          filter((p): p is Product => !!p),
          take(1),
          catchError(() => of(null))
        )
      )
    ).pipe(map((products) => products.filter((p): p is Product => p !== null)));
  }

  collapseVariants(products: Product[], categories: string[]): Product[] {
    const categorySet = new Set(categories);
    const seenVariantHashes = new Set<string>();
    this.loggerService.info(ASSISTANT_LOG_MARKER, `Collapsing variants: [${categories.join(', ')}]`);

    return products.filter((product) => {
      const qualifiers = (product.baseOptions?.[0]?.selected?.variantOptionQualifiers ?? [])
        .filter(q => !categorySet.has(q.qualifier ?? ''));

      const key = (product.baseProduct || product.code) + '|' + this.buildVariantHashKey(qualifiers);
      if (seenVariantHashes.has(key)) {
        this.loggerService.info(ASSISTANT_LOG_MARKER, `Collapsed duplicate variant: ${product.code} (key: ${key})`);
        return false;
      }
      seenVariantHashes.add(key);
      return true;
    });
  }

  private buildVariantHashKey(qualifiers: VariantOptionQualifier[]): string {
    const sortedQualifiers = [...qualifiers].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '')
    );

    return sortedQualifiers
      .map((qualifier) => `${qualifier.qualifier}:${qualifier.value}`)
      .join('|');
  }
}
