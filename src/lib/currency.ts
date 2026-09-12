export type CurrencyCode = 'USD' | 'EUR' | 'TRY';

/** 1 USD karsiligi. TRY ve EUR degerleri TCMB'den gelir, sabit yazilmaz. */
export interface ExchangeRates {
  USD: number;
  EUR: number;
  TRY: number;
}

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

const YERELLER: Record<CurrencyCode, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  TRY: 'tr-TR',
};

function sayiya(tutar: number | string): number {
  return typeof tutar === 'string' ? parseFloat(tutar) || 0 : tutar;
}

/**
 * Tutari kendi para biriminde yazar. Cevrim yapmaz.
 * Siparis ve urun tutarlari zaten kendi para biriminde saklandigi icin
 * panelde gosterilen her tutar bu fonksiyondan gecer.
 */
export function formatPrice(tutar: number | string, currency: CurrencyCode = 'USD'): string {
  const sayi = sayiya(tutar);
  const sembol = CURRENCY_SYMBOLS[currency] || '$';
  const yerel = YERELLER[currency] || 'en-US';
  return `${sembol}${sayi.toLocaleString(yerel, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * USD tutari hedef para birimine cevirir. Kurlar cagiranin sorumlulugunda:
 * canli TCMB kuru yoksa cevrim yapilmaz (null doner), uydurma kur kullanilmaz.
 */
export function convertFromUsd(
  usdAmount: number | string,
  targetCurrency: CurrencyCode,
  rates: ExchangeRates | null,
): number | null {
  if (!rates) return null;
  const kur = rates[targetCurrency];
  if (!kur || !Number.isFinite(kur)) return null;
  return sayiya(usdAmount) * kur;
}

/** USD tutari hedef para biriminde yazar; kur yoksa cizgi doner. */
export function formatConverted(
  usdAmount: number | string,
  targetCurrency: CurrencyCode,
  rates: ExchangeRates | null,
): string {
  const cevrilen = convertFromUsd(usdAmount, targetCurrency, rates);
  if (cevrilen === null) return '—';
  return formatPrice(cevrilen, targetCurrency);
}
