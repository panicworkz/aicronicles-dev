'use client';

import React from 'react';
import { useKurlar } from '@/lib/kurlar';

export function LiveRatesTicker() {
  const { yanit, yukleniyor } = useKurlar();

  // Kur gelmediyse uydurma deger gosterilmez, serit hic cizilmez.
  if (yukleniyor || !yanit) return null;

  const eski = Boolean(yanit.stale);

  return (
    <div
      className="hidden xl:flex items-center gap-1.5 bg-muted/30 border border-border/80 rounded-lg p-1 transition select-none"
      title={
        eski
          ? `TCMB kuru tazelenemedi — son alinan: ${yanit.date}`
          : `TCMB Resmi Gosterge Kurlari (${yanit.date})`
      }
    >
      <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono">
        <span className="text-muted-foreground font-medium">USD/TRY:</span>
        <span className="font-bold text-foreground">{yanit.usd.display}</span>
      </div>

      <div className="h-3 w-px bg-border/80 shrink-0" />

      <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono">
        <span className="text-muted-foreground font-medium">EUR/TRY:</span>
        <span className="font-bold text-foreground">{yanit.eur.display}</span>
      </div>

      <div className="h-3 w-px bg-border/80 shrink-0" />

      <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono">
        <span className="text-muted-foreground font-medium">EUR/USD:</span>
        <span className="font-bold text-foreground">{yanit.eurUsd.display}</span>
      </div>

      <span
        className={`px-1.5 text-[10px] font-medium ${eski ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
      >
        {eski ? `eski · ${yanit.date}` : yanit.date}
      </span>
    </div>
  );
}
