'use client';

import React from 'react';
import { FileCode2 } from 'lucide-react';

/**
 * KAYNAK DUZENLEYICI — govdenin HTML hali.
 *
 * TipTap'in yerine gecen sey BU DEGIL: yazilarin asil editoru artik
 * onizlemenin uzerindeki blok yuzeyi. Burasi kacis kapisi ve iki
 * durumda gerekiyor:
 *
 *   1. Onizleme yuklenemediginde (sunucu kapali, sayfa hata veriyor)
 *      yaziya erisilebilecek tek yer.
 *   2. Disaridan gelen bir isaretlemeyi oldugu gibi yapistirmak ya da
 *      bir seyin neden oyle gorundugunu anlamak icin.
 *
 * Sabit sayfalar (About, Terms, Privacy...) icin ise ASIL editor
 * burasi: o sayfalar govdeyi bolumlere ayirip her bolumu farkli bir
 * duzende basiyor, yani tek parca bir blok yuzeyi oraya uymuyor.
 * WYSIWYG zaten o duzeni gostermiyordu.
 *
 * KAYDEDILEN SEY SUZULUYOR: buraya ne yazilirsa yazilsin, kayit
 * noktasindaki sema gecersiz isaretlemeyi temizliyor
 * (lib/blok-sema.ts). Yani serbest bir metin kutusu olmasi guvenlik
 * acigi degil.
 */
export function KaynakDuzenleyici({
  value,
  onChange,
  minRows = 24,
}: {
  value: string;
  onChange: (html: string) => void;
  minRows?: number;
}) {
  const satir = value ? value.split('\n').length : 0;

  return (
    <div className="rounded-lg border border-border bg-muted/20">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileCode2 className="size-3.5" />
          <span>HTML source</span>
        </div>
        {/* Sayac: uzun bir govdede yanlislikla her seyi silmek
            mumkun; kaybin buyuklugu burada hemen gorunuyor. */}
        <span className="font-mono text-[11px] text-muted-foreground">
          {satir.toLocaleString('en-US')} lines · {value.length.toLocaleString('en-US')} chars
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={minRows}
        spellCheck={false}
        placeholder="<p>Write or paste HTML…</p>"
        className="w-full resize-y bg-transparent p-3 font-mono text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
      />

      <p className="border-t border-border px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        Invalid markup is stripped on save — scripts, event handlers and inline
        styles never reach the published page.
      </p>
    </div>
  );
}
