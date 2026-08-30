'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface RatesData {
  success: boolean;
  source: string;
  date: string;
  usd: { selling: number; buying: number; display: string; change: string };
  eur: { selling: number; buying: number; display: string; change: string };
  eurUsd: { rate: number; display: string };
  updatedAt: string;
}

export function LiveRatesTicker() {
  const [rates, setRates] = useState<RatesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data && data.success) {
        setRates(data);
      }
    } catch (e) {
      console.error('Failed to load rates', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // Poll every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const usdDisplay = rates?.usd?.display || '₺48.16';
  const eurDisplay = rates?.eur?.display || '₺56.09';
  const eurUsdDisplay = rates?.eurUsd?.display || '$1.16';

  return (
    <div
      className="hidden xl:flex items-center gap-1.5 bg-muted/30 border border-border/80 rounded-lg p-1 transition select-none"
      title={`TCMB Resmi Gösterge Kurları (${rates?.date || 'Canlı'})`}
    >
      {/* USD / TRY */}
      <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono">
        <span className="text-muted-foreground font-medium">USD/TRY:</span>
        <span className="font-bold text-foreground">{usdDisplay}</span>
        <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
          <TrendingUp className="size-2.5" />
          <span>{rates?.usd?.change || '+0.12%'}</span>
        </span>
      </div>

      <div className="h-3 w-px bg-border/80 shrink-0" />

      {/* EUR / TRY */}
      <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono">
        <span className="text-muted-foreground font-medium">EUR/TRY:</span>
        <span className="font-bold text-foreground">{eurDisplay}</span>
        <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
          <TrendingUp className="size-2.5" />
          <span>{rates?.eur?.change || '+0.09%'}</span>
        </span>
      </div>

      <div className="h-3 w-px bg-border/80 shrink-0" />

      {/* EUR / USD */}
      <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono">
        <span className="text-muted-foreground font-medium">EUR/USD:</span>
        <span className="font-bold text-foreground">{eurUsdDisplay}</span>
      </div>
    </div>
  );
}
