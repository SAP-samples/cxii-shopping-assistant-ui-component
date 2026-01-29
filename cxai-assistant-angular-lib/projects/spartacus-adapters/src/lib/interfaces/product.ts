export interface Product {
  code?: string;
  name?: string;
  averageRating?: number;
  stock?: Stock;
  price?: Price;
  images?: any;
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
