"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";

/**
 * Calisma hatasi ekrani.
 *
 * Yoktu: bir sayfa render sirasinda patlarsa Next'in kendi ciplak
 * ekrani cikiyordu — beyaz zemin, sistem yazi tipi, "Application error"
 * ve hicbir cikis. Okur sitenin coktugunu dusunuyordu.
 *
 * 404'ten AYRI bir sey: orada sayfa yok, burada sayfa var ama
 * uretilemedi. O yuzden metni de ayri; "bulunamadi" demek yanlis
 * olurdu ve okur adresi yanlis yazdigini sanirdi.
 *
 * Ayrica bir "tekrar dene" var: bu hatalarin cogu gecici (veritabani
 * bir an cevap vermedi gibi) ve reset() sayfayi yeniden denemek icin.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sunucu gunlugune dusen digest ile eslestirmek icin.
    console.error("[frontend] sayfa uretilemedi:", error);
  }, [error]);

  return (
    <div className="mag min-h-screen">
      <MagazineHeader />

      <main>
        <header className="mag-wrap pt-14 sm:pt-20">
          <div className="rule-heavy pt-5">
            <div className="folio mb-3">§ ERROR</div>
            <h1 className="display mb-4 text-[clamp(2.4rem,6vw,4.5rem)]">
              Something broke on our side.
            </h1>
            <p
              className="max-w-[56ch] text-[1.08rem] leading-relaxed"
              style={{ color: "var(--ink-2)" }}
            >
              This page exists — we just could not build it this time. It is usually
              momentary, so trying again often works.
            </p>

            {error?.digest && (
              <p className="byline mt-6">
                REFERENCE {error.digest}
              </p>
            )}
          </div>
        </header>

        <div className="mag-wrap pt-10">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={reset}
              className="byline px-6 py-3 transition"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              TRY AGAIN
            </button>
            <Link href="/" className="byline">
              ← BACK TO THE FRONT PAGE
            </Link>
            <Link href="/contact" className="byline">
              TELL US WHAT HAPPENED →
            </Link>
          </div>
        </div>

        <div className="h-24 sm:h-32" />
      </main>

      <MagazineFooter />
    </div>
  );
}
