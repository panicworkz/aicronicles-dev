'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurrencyCode, ExchangeRates, DEFAULT_RATES, formatPrice, convertFromUsd } from '@/lib/currency';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: ExchangeRates;
  format: (usdAmount: number | string) => string;
  convert: (usdAmount: number | string) => number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => null,
  rates: DEFAULT_RATES,
  format: (amt) => formatPrice(amt, 'USD'),
  convert: (amt) => Number(amt),
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [rates] = useState<ExchangeRates>(DEFAULT_RATES);

  useEffect(() => {
    const saved = localStorage.getItem('panic_store_currency') as CurrencyCode | null;
    if (saved && (saved === 'USD' || saved === 'EUR' || saved === 'TRY')) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('panic_store_currency', newCurrency);
  };

  const format = (usdAmount: number | string) => formatPrice(usdAmount, currency, rates);
  const convert = (usdAmount: number | string) => convertFromUsd(usdAmount, currency, rates);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, format, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
