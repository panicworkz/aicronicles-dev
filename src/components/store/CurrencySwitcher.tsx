'use client';

import React from 'react';
import { useCurrency } from '@/providers/currency-provider';
import { CurrencyCode, CURRENCY_SYMBOLS } from '@/lib/currency';

export function CurrencySwitcher({ className = '' }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();

  const currencies: CurrencyCode[] = ['USD', 'EUR', 'TRY'];

  return (
    <div className={`inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs ${className}`}>
      {currencies.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCurrency(c)}
          className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold transition cursor-pointer ${
            currency === c
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {CURRENCY_SYMBOLS[c]} {c}
        </button>
      ))}
    </div>
  );
}
