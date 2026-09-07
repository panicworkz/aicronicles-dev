import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { db, schema } from "@/db";
import { asc, desc, eq } from "drizzle-orm";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { SepetSeridi } from "@/components/store/SepetSeridi";
import { UrunKarti, type KartUrun } from "@/components/store/UrunKarti";
import { SITE, markali, kirintiSemasi } from "@/lib/seo";
import { magazaRobots } from "@/lib/magaza-durumu";
import { TUR_ADI, turu } from "@/lib/magaza";

export const dynamic = "force-dynamic";

/**
 * Magaza vitrini.
 *
 * ONCEKI HALI DERGININ DISINDAYDI — 404 sayfasinin ve imlecin basina
 * gelenin aynisi. Kendi basligi (StoreHeader), kendi kunyesi, yuvarlak
 * koseli kartlar, panelin cividi ve genel bir font-serif. Yayin
 * sayfalariyla yan yana koyunca iki ayri site gibi duruyorlardi.
 *
 * Simdi .mag katmaninda ve derginin kaliplariyla: bolum kunyesi,
 * cizgiyle ayrilan kartlar, ayni yazi tipleri. Baslik ve kunye artik
 * MagazineHeader/MagazineFooter — yani magazadan cikan okur sitenin
 * geri kalanina ayni menuden ulasiyor.
 *
 * Sayfa su an DISARIYA KAPALI; kapiyi layout.tsx tutuyor.
 */

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: markali("Store"),
    description:
      "Guides, templates and sessions from the Fabelo desk — the same work that goes into the reporting, in a form you can use.",
    alternates: { canonical: `${SITE}/store` },
    /* Kapaliyken noindex, acilinca kendiliginden kalkiyor.
       Tek kaynak: lib/magaza-durumu.ts */
    robots: await magazaRobots(),
  };
}

export default async function MagazaSayfasi() {
  const [urunler, kategoriler] = await Promise.all([
    db.query.products.findMany({
      where: eq(schema.products.status, "published"),
      orderBy: [desc(schema.products.createdAt)],
    }),
    db.query.productCategories.findMany({
      orderBy: [asc(schema.productCategories.name)],
    }),
  ]);

  const kartlar = urunler as unknown as KartUrun[];

  /* Turlere gore sayim — vitrinin ustunde ne satildigini tek satirda
     soylemek icin. Uydurma bir tanitim cumlesi yazmaktansa sayfada
     zaten duran bilgiyi soylemek dogru (etiket sayfasindaki ayni
     gerekce). */
  const sayim = kartlar.reduce<Record<string, number>>((acc, u) => {
    const t = turu(u.productType);
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  const [bas, ...kalan] = kartlar;

  return (
    <div className="mag min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(kirintiSemasi([{ ad: "Store", yol: "/store" }])),
        }}
      />
      <MagazineHeader />

      <main>
        {/* --- Vitrin kunyesi --- */}
        <header className="mag-wrap pt-12 sm:pt-16">
          <div className="rule-heavy pt-5">
            <div className="folio mb-3">§ STORE</div>
            <h1 className="display mb-3 text-[clamp(2.8rem,7vw,5.5rem)]">
              From the desk
            </h1>
            <p
              className="max-w-[58ch] text-[1.05rem] leading-relaxed"
              style={{ color: "var(--ink-2)" }}
            >
              The same work that goes into the reporting, in a form you can use.
            </p>
            {kartlar.length > 0 && (
              <div className="byline mt-5">
                {(["digital", "physical", "service"] as const)
                  .filter((t) => sayim[t])
                  .map((t) => `${sayim[t]} ${TUR_ADI[t].toUpperCase()}`)
                  .join(" · ")}
              </div>
            )}
          </div>
        </header>

        {/* Sepete giden kalici yol — magazanin KENDI baslik blogunun
            altinda, bolumun bir parcasi olarak. */}
        <SepetSeridi />

        {kartlar.length === 0 ? (
          /* Bos vitrin. Once burada hicbir sey yoktu — urun silinince
             sayfa bos bir izgara gosteriyordu ve okur yuklenmedi
             saniyordu. */
          <section className="mag-wrap py-24">
            <p className="display mb-4 text-3xl">Nothing on the shelf yet.</p>
            <p
              className="mb-6 max-w-[52ch] leading-relaxed"
              style={{ color: "var(--ink-2)" }}
            >
              The first guides and templates are being prepared. In the meantime the
              reporting is all free to read.
            </p>
            <Link href="/" className="byline hover:text-[var(--accent-ink)]">
              ← BACK TO THE FRONT PAGE
            </Link>
          </section>
        ) : (
          <>
            {/* --- Ilk urun genis, digerleri izgarada ---
                Dergideki manset kalibinin aynisi: ilk kart daha buyuk
                duruyor, gozun nereden baslayacagi belli oluyor. */}
            <section className="mag-wrap pt-12">
              <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
                <div className="lg:col-span-7">
                  <UrunKarti urun={bas} no={1} />
                </div>
                <div className="lg:col-span-5 lg:rule-v lg:pl-14">
                  <div className="folio mb-5" style={{ color: "var(--accent)" }}>
                    § SHELVES
                  </div>
                  <ul>
                    {(kategoriler as any[]).map((k, i) => (
                      <li key={k.id} style={{ borderTop: "1px solid var(--rule)" }}>
                        <div className="flex items-baseline gap-3 py-3">
                          <span className="folio shrink-0" style={{ color: "var(--ink-3)" }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[0.95rem]">{k.name}</span>
                          <span
                            className="folio ml-auto"
                            style={{ color: "var(--ink-3)" }}
                          >
                            {kartlar.filter((u: any) => u.categoryId === k.id).length}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p
                    className="mt-6 text-[0.9rem] leading-relaxed"
                    style={{ color: "var(--ink-2)" }}
                  >
                    Everything is sold directly by Fabelo. Payment is by bank transfer
                    or on delivery.
                  </p>
                </div>
              </div>
            </section>

            {kalan.length > 0 && (
              <section className="mag-wrap pt-16">
                <div className="rule-heavy mb-8 pt-5">
                  <div className="folio">§ EVERYTHING ELSE</div>
                </div>
                <div className="grid gap-x-9 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {kalan.map((u, i) => (
                    <UrunKarti key={u.id} urun={u} no={i + 2} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="h-24 sm:h-32" />
      </main>

      <MagazineFooter />
    </div>
  );
}
