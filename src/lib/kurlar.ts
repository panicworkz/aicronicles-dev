'use client';

import { useEffect, useState } from 'react';
import type { ExchangeRates } from '@/lib/currency';

export interface KurYaniti {
  success: boolean;
  stale?: boolean;
  source: string;
  date: string;
  usd: { selling: number; buying: number; display: string };
  eur: { selling: number; buying: number; display: string };
  eurUsd: { rate: number; display: string };
  updatedAt: string;
}

/** TCMB yanitini "1 USD karsiligi" tablosuna cevirir. Eksik veri varsa null. */
export function kurTablosu(yanit: KurYaniti | null): ExchangeRates | null {
  if (!yanit) return null;
  const usdTry = yanit.usd?.selling;
  const eurUsd = yanit.eurUsd?.rate;
  if (!usdTry || !eurUsd || !Number.isFinite(usdTry) || !Number.isFinite(eurUsd)) return null;
  return { USD: 1, EUR: 1 / eurUsd, TRY: usdTry };
}

const TAZELEME = 5 * 60 * 1000;

/**
 * Canli TCMB kurunu ceker ve 5 dakikada bir tazeler.
 * Kur gelene kadar `kurlar` null kalir; cagiran taraf cevrim yerine cizgi gosterir.
 */
export function useKurlar() {
  const [yanit, setYanit] = useState<KurYaniti | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    let iptal = false;

    const cek = async () => {
      try {
        const res = await fetch('/api/rates');
        const veri = await res.json();
        if (!iptal && veri?.success) setYanit(veri);
      } catch {
        /* kur alinamadi: eldeki deger korunur, uydurma kur yazilmaz */
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    };

    cek();
    const zamanlayici = setInterval(cek, TAZELEME);
    return () => {
      iptal = true;
      clearInterval(zamanlayici);
    };
  }, []);

  return { yanit, kurlar: kurTablosu(yanit), yukleniyor };
}
