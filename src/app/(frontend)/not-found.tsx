import React from "react";
import Link from "next/link";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { FABELO_TAGS, SECTIONS, tagLabel } from "@/lib/taxonomy";

/**
 * 404.
 *
 * ONCEKI HALI SITENIN DISINDAYDI. Sayfalar govdelerini
 * <div className="mag"> icine sariyor; bu dosya sarmiyordu, yani dergi
 * katmani hic devreye girmiyordu. Iki sonucu vardi:
 *
 *   1. Vurgu rengi panelin indigosu (#3b4bc8) cikiyordu, sitenin
 *      cyan'i degil — imlecte yasanan hatanin aynisi.
 *   2. f-content, f-display, f-headline gibi eski tasarim sisteminin
 *      siniflari kullaniliyordu; ikisi (frontend)/globals.css'te bir
 *      kez geciyor, geri kalani hicbir yerde tanimli degil. Yani
 *      bicimlendirme zaten yoktu.
 *
 * Simdi .mag icinde ve sayfanin kendi kaliplariyla. Ustelik cikmaz
 * sokak degil: okur buraya bir sey ararken dustu, bolum ve konu
 * baglantilari onu aramaya devam edebilecegi yere birakiyor.
 */
export default function NotFound() {
  return (
    <div className="mag min-h-screen">
      <MagazineHeader />

      <main>
        <header className="mag-wrap pt-14 sm:pt-20">
          <div className="rule-heavy pt-5">
            <div className="folio mb-3">§ 404</div>
            <h1 className="display mb-4 text-[clamp(2.6rem,6.5vw,5rem)]">
              This page wandered off.
            </h1>
            <p
              className="max-w-[56ch] text-[1.08rem] leading-relaxed"
              style={{ color: "var(--ink-2)" }}
            >
              The story you are looking for does not exist, or it has moved. The desk
              is still here — start from a section or a subject below.
            </p>
          </div>
        </header>

        {/* Bolumler */}
        <section className="mag-wrap pt-12">
          <div className="folio mb-4" style={{ color: "var(--accent)" }}>
            § SECTIONS
          </div>
          <div className="grid gap-px sm:grid-cols-3" style={{ background: "var(--rule)" }}>
            {SECTIONS.map((s) => (
              <Link
                key={s.slug}
                href={`/category/${s.slug}`}
                className="flex flex-col gap-2 p-6 transition-colors"
                style={{ background: "var(--paper)" }}
              >
                <span className="folio" style={{ color: "var(--ink-3)" }}>
                  {s.folio}
                </span>
                <span className="display text-[1.4rem] leading-snug">{s.label}</span>
                <span className="text-[0.92rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
                  {s.blurb}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Konular — ana sayfadaki dizinin ayni kalibi */}
        <section className="mag-wrap pt-14">
          <div className="folio mb-4" style={{ color: "var(--accent)" }}>
            § SUBJECTS
          </div>
          <ul className="grid grid-cols-2 gap-x-8 sm:grid-cols-3 lg:grid-cols-5">
            {FABELO_TAGS.map((t, i) => (
              <li key={t} style={{ borderTop: "1px solid var(--rule)" }}>
                <Link
                  href={`/tag/${t}`}
                  className="group flex items-baseline gap-3 py-3 transition-colors hover:text-[var(--accent-ink)]"
                >
                  <span className="folio shrink-0" style={{ color: "var(--ink-3)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.92rem]">{tagLabel(t)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mag-wrap pt-14">
          <div
            className="flex flex-wrap items-center justify-between gap-4 pt-5"
            style={{ borderTop: "2px solid var(--ink)" }}
          >
            <Link href="/" className="byline">
              ← BACK TO THE FRONT PAGE
            </Link>
            <Link href="/contact" className="byline">
              TELL US WHAT YOU WERE LOOKING FOR →
            </Link>
          </div>
        </div>

        <div className="h-20 sm:h-28" />
      </main>

      <MagazineFooter />
    </div>
  );
}
