import React from "react";
import MagazineHeader from "@/components/magazine/MagazineHeader";

/**
 * Sayfa sunucudan akarken gorunen ara ekran.
 *
 * Yoktu: butun yayin sayfalari force-dynamic, yani her gezinmede
 * sunucudan uretiliyor. O sirada tarayici bir onceki sayfada bekliyor
 * ve hicbir sey olmuyordu — tiklamanin isleyip islemedigi belli
 * degildi.
 *
 * Donen bir cark degil, SAYFANIN ISKELETI: manset, yan kolon ve
 * kartlarin duracagi yerler. Okur nereye ne gelecegini goruyor ve
 * icerik dustugunde duzen yerinden oynamiyor.
 *
 * Kunye de basiliyor cunku o zaten her sayfada ayni; iskelette
 * olmasaydi menu bir an kaybolup geri gelirdi.
 */

const Blok = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`iskelet ${className ?? ""}`} style={style} aria-hidden="true" />
);

export default function Loading() {
  return (
    <div className="mag min-h-screen">
      <MagazineHeader />

      <main aria-busy="true" aria-live="polite">
        {/* Ekran okuyucu icin: iskelet gorseldir, durum yazili olmali. */}
        <span className="sr-only">Loading…</span>

        <section className="mag-wrap pt-10 sm:pt-14">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Manset */}
            <div className="lg:col-span-7">
              <Blok className="mb-4 h-3 w-28" />
              <Blok className="mb-3 h-[clamp(2.6rem,6vw,4.6rem)] w-full" />
              <Blok className="mb-5 h-[clamp(2.6rem,6vw,4.6rem)] w-3/4" />
              <Blok className="mb-2 h-4 w-full max-w-[58ch]" />
              <Blok className="mb-6 h-4 w-2/3 max-w-[58ch]" />
              <Blok className="w-full" style={{ aspectRatio: "16 / 9" }} />
            </div>

            {/* Yan kolon */}
            <div className="lg:col-span-5 lg:rule-v lg:pl-14">
              <Blok className="mb-5 h-3 w-32" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="rule py-5">
                  <Blok className="mb-2.5 h-3 w-20" />
                  <Blok className="mb-2 h-5 w-full" />
                  <Blok className="h-5 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kart satiri */}
        <section className="mag-wrap pt-16">
          <Blok className="mb-8 h-3 w-24" />
          <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <Blok className="mb-4 w-full" style={{ aspectRatio: "4 / 3" }} />
                <Blok className="mb-2.5 h-3 w-16" />
                <Blok className="mb-2 h-5 w-full" />
                <Blok className="h-5 w-3/4" />
              </div>
            ))}
          </div>
        </section>

        <div className="h-24 sm:h-32" />
      </main>
    </div>
  );
}
