"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSepet } from "@/components/store/SepetSaglayici";
import { fiyat as bicimliFiyat } from "@/lib/magaza";

/**
 * Sepete ekleme — urun sayfasinin satin alma bolumu.
 *
 * Oncekinde bir "Add to Cart" dugmesi vardi ve yalnizca bir bildirim
 * gosteriyordu: sepet yoktu, siparis olusmuyordu. Bu dugme gercekten
 * ekliyor; eklendikten sonra sepete giden bir baglanti cikiyor, cunku
 * "eklendi" demek yetmiyor — okur nereye gidecegini gormeli.
 */

type Varyant = { id: number; title: string; price: unknown; inventory?: number | null };

export function SepeteEkle({
  urunId,
  slug,
  baslik,
  fiyat: temelFiyat,
  paraBirimi,
  tur,
  gorsel,
  varyantlar,
  stokta,
}: {
  urunId: number;
  slug: string;
  baslik: string;
  fiyat: number;
  paraBirimi: string;
  tur: string;
  gorsel?: string | null;
  varyantlar: Varyant[];
  stokta: boolean;
}) {
  const { ekle, kalemler, paraBirimi: sepetBirimi } = useSepet();
  const [varyantId, setVaryantId] = useState<number | null>(varyantlar[0]?.id ?? null);
  const [adet, setAdet] = useState(1);
  const [eklendi, setEklendi] = useState(false);

  const secili = varyantlar.find((v) => v.id === varyantId);
  const fiyat = secili?.price != null ? Number(secili.price) : temelFiyat;

  /* Sepette baska bir para birimi varsa tek bir toplam cikmaz.
     Cevirmek de dogru degil (bkz. lib/magaza.ts: fiyat kesin olmali). */
  const birimCakisiyor =
    kalemler.length > 0 && sepetBirimi !== paraBirimi;

  if (!stokta) {
    return (
      <div className="mt-7 p-5" style={{ background: "var(--paper-2)" }}>
        <div className="folio mb-2" style={{ color: "var(--ink-3)" }}>
          SOLD OUT
        </div>
        <p className="text-[0.95rem] leading-relaxed">
          This one is gone for now. Ask us and we will tell you when it is back.
        </p>
        <Link href="/contact?type=general" className="byline mt-4 inline-block">
          ASK ABOUT THIS →
        </Link>
      </div>
    );
  }

  if (birimCakisiyor) {
    return (
      <div className="mt-7 p-5" style={{ background: "var(--paper-2)" }}>
        <div className="folio mb-2" style={{ color: "var(--accent)" }}>
          ONE CURRENCY AT A TIME
        </div>
        <p className="text-[0.95rem] leading-relaxed">
          Your basket is in {sepetBirimi} and this is priced in {paraBirimi}. Order
          what you have first, then come back for this.
        </p>
        <Link href="/store/cart" className="byline mt-4 inline-block">
          GO TO THE BASKET →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-7">
      {varyantlar.length > 0 && (
        <div className="mb-5">
          <div className="folio mb-2.5" style={{ color: "var(--ink-3)" }}>
            OPTION
          </div>
          <div className="flex flex-wrap gap-2">
            {varyantlar.map((v) => {
              const s = v.id === varyantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVaryantId(v.id)}
                  aria-pressed={s}
                  className="px-3.5 py-2 text-[0.88rem] transition-colors"
                  style={{
                    border: `1px solid ${s ? "var(--ink)" : "var(--rule)"}`,
                    background: s ? "var(--ink)" : "transparent",
                    color: s ? "var(--paper)" : "inherit",
                  }}
                >
                  {v.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-stretch gap-3">
        {/* Adet. Sayi kutusu yerine iki dugme: dokunmatikte yazmak
            zor ve klavyeyle "0" ya da "-3" girilebiliyordu. */}
        <div className="flex items-center" style={{ border: "1px solid var(--rule)" }}>
          <button
            type="button"
            onClick={() => setAdet((a) => Math.max(1, a - 1))}
            disabled={adet <= 1}
            aria-label="One fewer"
            className="px-3.5 py-2.5 text-lg leading-none disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-8 text-center text-[0.95rem]" aria-live="polite">
            {adet}
          </span>
          <button
            type="button"
            onClick={() => setAdet((a) => Math.min(99, a + 1))}
            aria-label="One more"
            className="px-3.5 py-2.5 text-lg leading-none"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            ekle(
              {
                urunId,
                varyantId,
                slug,
                baslik: secili ? `${baslik} — ${secili.title}` : baslik,
                fiyat,
                paraBirimi,
                tur,
                gorsel,
              },
              adet
            );
            setEklendi(true);
          }}
          className="byline flex-1 px-6 py-3 transition-opacity hover:opacity-90"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          ADD TO BASKET — {bicimliFiyat(fiyat * adet, paraBirimi)}
        </button>
      </div>

      {eklendi && (
        <p className="mt-4">
          <Link href="/store/cart" className="byline">
            IN YOUR BASKET — GO TO CHECKOUT →
          </Link>
        </p>
      )}

      <p className="mt-4 text-[0.85rem]" style={{ color: "var(--ink-3)" }}>
        Payment by bank transfer{tur === "physical" ? " or on delivery" : ""}.
      </p>
    </div>
  );
}
