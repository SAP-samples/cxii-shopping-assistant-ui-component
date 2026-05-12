export interface Product {
  code?: string;
  name?: string;
  averageRating?: number;
  stock?: Stock;
  price?: Price;
  images?: any;
  baseProduct?: string;
  baseOptions?: BaseOption[];
}

export interface BaseOption {
  selected?: VariantOption;
}

export interface VariantOption {
  variantOptionQualifiers?: VariantOptionQualifier[];
}

export interface VariantOptionQualifier {
  name?: string;
  qualifier?: string;
  value?: string;
}

export interface Price {
  currencyIso?: string;
  formattedValue?: string;
  value?: number;
}

export interface Stock {
  isValueRounded?: boolean;
  stockLevel?: number;
  stockLevelStatus?: string;
}
