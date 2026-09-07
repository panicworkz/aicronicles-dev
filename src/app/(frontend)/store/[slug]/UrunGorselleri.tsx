"use client";

import React, { useState } from "react";

/**
 * Urun galerisi.
 *
 * Sayfanin TEK istemci parcasi. Oncekinde galeri, varyant secimi, adet,
 * kupon kutusu ve sekmeler 343 satirlik tek bir istemci bileseninde
 * duruyordu; oysa tiklamayla degisen tek sey buyuk gorsel. Geri kalani
 * sunucuda uretiliyor, yani okura once metin ulasiyor.
 */
export function UrunGorselleri({
  gorseller,
  baslik,
}: {
  gorseller: string[];
  baslik: string;
}) {
  const [secili, setSecili] = useState(0);

  if (gorseller.length === 0) {
    return (
      <div
        className="flex w-full items-center justify-center"
        style={{ aspectRatio: "4 / 3", background: "var(--paper-2)", color: "var(--ink-3)" }}
      >
        <span className="folio">NO IMAGE</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="w-full overflow-hidden"
        style={{ aspectRatio: "4 / 3", background: "var(--paper-2)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gorseller[secili]}
          alt={baslik}
          className="h-full w-full object-cover"
        />
      </div>

      {gorseller.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {gorseller.map((g, i) => (
            <button
              key={g + i}
              type="button"
              onClick={() => setSecili(i)}
              aria-label={`Image ${i + 1} of ${gorseller.length}`}
              aria-current={i === secili}
              className="h-16 w-20 overflow-hidden transition-opacity"
              style={{
                /* Secili olan tam opak, otekiler soluk. Cerceve rengi
                   degistirmek yerine opaklik: dergide kutu ici kutu yok. */
                opacity: i === secili ? 1 : 0.45,
                border: i === secili ? "1px solid var(--ink)" : "1px solid var(--rule)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
