export type CurrencyCode = 'USD' | 'EUR' | 'TRY';

export interface ExchangeRates {
  USD: number;
  EUR: number;
  TRY: number;
}

export const DEFAULT_RATES: ExchangeRates = {
  USD: 1.0,
  EUR: 0.92,
  TRY: 38.50,
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  TRY: '₺',
};

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  TRY: 'Turkish Lira',
};

export function convertFromUsd(usdAmount: number | string, targetCurrency: CurrencyCode, customRates?: Partial<ExchangeRates>): number {
  const num = typeof usdAmount === 'string' ? parseFloat(usdAmount) || 0 : usdAmount;
  const rates = { ...DEFAULT_RATES, ...customRates };
  const rate = rates[targetCurrency] || 1;
  return num * rate;
}

export function formatPrice(usdAmount: number | string, currency: CurrencyCode = 'USD', customRates?: Partial<ExchangeRates>): string {
  const converted = convertFromUsd(usdAmount, currency, customRates);
  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  if (currency === 'TRY') {
    return `${symbol}${converted.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency === 'EUR') {
    return `${symbol}${converted.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    return `${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
