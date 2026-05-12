import {TestBed} from '@angular/core/testing';
import {ILoggerService, IProductService, Product} from '@cx-spartacus/cxai-assistant/root';
import {ChatProductService} from './chat-product.service';

const createProduct = (code: string, baseProduct: string, color: string, size: string): Product => {
  return {
    code, baseProduct, baseOptions: [{
      selected: {
        variantOptionQualifiers: [
          { qualifier: 'swatchColors', name: 'Color', value: color },
          { qualifier: 'size', name: 'Size', value: size },
        ]
      }
    }]
  }
}

// 15 Brandon sneaker variants: 3 colors (Black, Red, White) x 5 sizes (7-11)
const BRANDON_VARIANTS: Product[] = [
  createProduct('BR1021BLA7', 'BR1021', 'Black', '7'),
  createProduct('BR1021BLA8', 'BR1021', 'Black', '8'),
  createProduct('BR1021BLA9', 'BR1021', 'Black', '9'),
  createProduct('BR1021BLA10', 'BR1021', 'Black', '10'),
  createProduct('BR1021BLA11', 'BR1021', 'Black', '11'),
  createProduct('BR1021RED7', 'BR1021', 'Red', '7'),
  createProduct('BR1021RED8', 'BR1021', 'Red', '8'),
  createProduct('BR1021RED9', 'BR1021', 'Red', '9'),
  createProduct('BR1021RED10', 'BR1021', 'Red', '10'),
  createProduct('BR1021RED11', 'BR1021', 'Red', '11'),
  createProduct('BR1021WHI7', 'BR1021', 'White', '7'),
  createProduct('BR1021WHI8', 'BR1021', 'White', '8'),
  createProduct('BR1021WHI9', 'BR1021', 'White', '9'),
  createProduct('BR1021WHI10', 'BR1021', 'White', '10'),
  createProduct('BR1021WHI11', 'BR1021', 'White', '11'),
];

describe('ChatProductService', () => {
  let service: ChatProductService;
  let loggerServiceSpy: jasmine.SpyObj<ILoggerService>;
  let productServiceSpy: jasmine.SpyObj<IProductService>;

  beforeEach(() => {
    loggerServiceSpy = jasmine.createSpyObj('ILoggerService', ['info', 'warn', 'error']);
    productServiceSpy = jasmine.createSpyObj('IProductService', ['get']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ChatProductService,
        {provide: ILoggerService, useValue: loggerServiceSpy},
        {provide: IProductService, useValue: productServiceSpy},
      ]
    });

    service = TestBed.inject(ChatProductService);
  });

  describe('collapseVariants', () => {
    it('should collapse size variants and keep one product per color', () => {
      const result = service.collapseVariants(BRANDON_VARIANTS, ['size']);

      expect(result.length).toBe(3);
      expect(result.map(p => p.code)).toEqual(['BR1021BLA7', 'BR1021RED7', 'BR1021WHI7']);
    });

    it('should collapse color variants and keep one product per size', () => {
      const result = service.collapseVariants(BRANDON_VARIANTS, ['swatchColors']);

      expect(result.length).toBe(5);
    });

    it('should collapse color and size variants', () => {
      const result = service.collapseVariants(BRANDON_VARIANTS, ['size', 'swatchColors']);

      expect(result.length).toBe(1);
    });
  });
});
