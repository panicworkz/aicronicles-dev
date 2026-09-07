import React from "react";
import Link from "next/link";
import { fiyat, stokta, turu, TUR_ADI, TUR_VAADI } from "@/lib/magaza";

/**
 * Magazadaki urun karti — DERGININ dilinde.
 *
 * Oncekinde yuvarlak koseler, golge, gri kart zemini ve renkli rozetler
 * vardi: baska bir sitenin tasarimi. Yayin tarafi bunlarin hicbirini
 * kullanmiyor — orada kartlar zemin degil CIZGI ile ayriliyor, tur
 * bilgisi rozetle degil "folio" satiriyla veriliyor.
 *
 * Bu kart PostCard'in kalibini takip ediyor; yan yana durduklarinda
 * ayni yayindan cikmis gorunsunler diye.
 */

export type KartUrun = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  featuredImageUrl: string | null;
  price: unknown;
  compareAtPrice?: unknown;
  currency: string | null;
  productType: string | null;
  unlimitedStock?: boolean | null;
  inventory?: number | null;
};

export function UrunKarti({ urun, no }: { urun: KartUrun; no?: number }) {
  const t = turu(urun.productType);
  const mevcut = stokta(urun);
  const indirimli =
    urun.compareAtPrice != null && Number(urun.compareAtPrice) > Number(urun.price ?? 0);

  return (
    /* h-full: izgaradaki kartlar satirin en uzununa uzuyor ve fiyat
       satiri hepsinde ayni hizada duruyor. Bu olmadan aciklamayi
       kesmeden esit gorunum saglanamiyordu. */
    <article className="group flex h-full flex-col">
      <Link href={`/store/${urun.slug}`} className="block">
        {/* Gorsel alani her kartta ayni oranda: icerik gelmeden de
            duzen oturmus olsun, kartlar birbirine gore kaymasin.
            Icindeki gorsel KIRPILMIYOR (asagi bkz.). */}
        <div
          className="mb-4 flex w-full items-center justify-center overflow-hidden p-4"
          style={{ aspectRatio: "4 / 3", background: "var(--paper-2)" }}
        >
          {urun.featuredImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urun.featuredImageUrl}
              alt={urun.title}
              /* object-contain: urun fotografi KIRPILMIYOR. cover ile
                 sise, kutu ve etiketlerin kenarlari kesiliyordu —
                 okurun tam olarak neyi satin aldigini gormesi gereken
                 tek yer bu gorsel. */
              className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ color: "var(--ink-3)" }}
            >
              <span className="folio">NO IMAGE</span>
            </div>
          )}
        </div>

        <div className="mb-2.5 flex items-baseline gap-3">
          {no != null && (
            <span className="folio shrink-0" style={{ color: "var(--ink-3)" }}>
              {String(no).padStart(2, "0")}
            </span>
          )}
          <span className="folio" style={{ color: "var(--accent)" }}>
            {TUR_ADI[t]}
          </span>
        </div>

        <h3 className="display mb-2 text-[1.35rem] leading-snug transition-colors group-hover:text-[var(--accent-ink)]">
          {urun.title}
        </h3>

        {/* ACIKLAMA KESILMIYOR. Once line-clamp-2 vardi ve cumleler
            "..." ile yarida kaliyordu — okur urunun ne oldugunu
            anlamadan kartin bittigini goruyordu. Kartlar h-full ile
            esitlendigi icin kesmeye gerek de yok. */}
        {urun.description && (
          <p
            className="mb-4 text-[0.92rem] leading-relaxed"
            style={{ color: "var(--ink-2)" }}
          >
            {urun.description}
          </p>
        )}
      </Link>

      {/* Fiyat satiri en altta ve kartlar arasinda ayni hizada:
          mt-auto olmadan kisa acikliamali kartlarda yukari kayardi. */}
      <div
        className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-1"
        style={{ borderTop: "1px solid var(--rule)" }}
      >
        <span className="display pt-3 text-[1.15rem]">
          {fiyat(urun.price, urun.currency || "USD")}
        </span>
        {indirimli && (
          <span
            className="pt-3 text-[0.9rem] line-through"
            style={{ color: "var(--ink-3)" }}
          >
            {fiyat(urun.compareAtPrice, urun.currency || "USD")}
          </span>
        )}
        <span className="byline ml-auto pt-3" style={{ color: "var(--ink-3)" }}>
          {mevcut ? TUR_VAADI[t] : "SOLD OUT"}
        </span>
      </div>
    </article>
  );
}
