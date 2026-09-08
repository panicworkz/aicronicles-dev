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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ shelf?: string }>;
}): Promise<Metadata> {
  const { shelf } = await searchParams;
  return {
    title: markali("Store"),
    description:
      "Guides, templates and sessions from the Fabelo desk — the same work that goes into the reporting, in a form you can use.",
    /* Raf suzgeci ayri bir sayfa DEGIL: ?shelf=... ile suzulmus her
       gorunum ayni vitrinin bir kesiti. Kanonik hep /store'u
       gosteriyor ki arama motoru bunlari yinelenen sayfa saymasin. */
    alternates: { canonical: `${SITE}/store` },
    ...(shelf ? { robots: { index: false, follow: true } } : {}),
    /* Kapaliyken noindex, acilinca kendiliginden kalkiyor.
       Tek kaynak: lib/magaza-durumu.ts */
    robots: await magazaRobots(),
  };
}

export default async function MagazaSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ shelf?: string }>;
}) {
  /* Raf suzgeci adreste: /store?shelf=furniture. Ayri bir rota yerine
     parametre, cunku vitrinin duzeni ayni — degisen yalnizca hangi
     urunlerin gosterildigi. */
  const { shelf } = await searchParams;

  const [urunler, kategoriler] = await Promise.all([
    db.query.products.findMany({
      where: eq(schema.products.status, "published"),
      orderBy: [desc(schema.products.createdAt)],
    }),
    db.query.productCategories.findMany({
      orderBy: [asc(schema.productCategories.name)],
    }),
  ]);

  const tumKartlar = urunler as unknown as KartUrun[];

  /* Her rafta kac urun var — hem listede yazmak hem bos raflari
     baglanti YAPMAMAK icin. Bos bir rafa tiklatmak okuru bos bir
     sayfaya goturur. */
  const rafSayisi = new Map<number, number>();
  for (const u of tumKartlar as any[]) {
    if (u.categoryId) rafSayisi.set(u.categoryId, (rafSayisi.get(u.categoryId) ?? 0) + 1);
  }

  /* Yalnizca icinde urun OLAN raflar gosteriliyor. */
  const doluRaflar = (kategoriler as any[]).filter((k) => (rafSayisi.get(k.id) ?? 0) > 0);

  const acikRaf = shelf
    ? (kategoriler as any[]).find((k) => k.slug === shelf) ?? null
    : null;

  const kartlar = acikRaf
    ? tumKartlar.filter((u: any) => u.categoryId === acikRaf.id)
    : tumKartlar;

  /* Turlere gore sayim — vitrinin ustunde ne satildigini tek satirda
     soylemek icin. Uydurma bir tanitim cumlesi yazmaktansa sayfada
     zaten duran bilgiyi soylemek dogru (etiket sayfasindaki ayni
     gerekce). */
  const sayim = kartlar.reduce<Record<string, number>>((acc, u) => {
    const t = turu(u.productType);
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

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
              {acikRaf ? acikRaf.name : "From the desk"}
            </h1>
            <p
              className="max-w-[58ch] text-[1.05rem] leading-relaxed"
              style={{ color: "var(--ink-2)" }}
            >
              The same work that goes into the reporting, in a form you can use.
            </p>
            {/* Bir raf secilmisse cikis yolu hemen yaninda dursun. */}
            {acikRaf && (
              <p className="mt-4">
                <Link href="/store" className="byline hover:text-[var(--accent-ink)]">
                  ← ALL {tumKartlar.length} ITEMS
                </Link>
              </p>
            )}

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

        {/* --- RAFLAR ---
            Once sag sutunda dikey bir listeydi ve iki sorun uretiyordu:
            liste bitince altinda kocaman bir bosluk kaliyordu, ve bos
            raflar soluk gorundugu icin "stokta yok" gibi okunuyordu —
            oysa anlami "bu rafta hic urun yok".

            Simdi baslik altinda yatay bir serit ve BOS RAFLAR HIC
            GORUNMUYOR. Bir dukkan bos rafini vitrine koymaz; urun
            girilince raf kendiliginden geri geliyor. */}
        {doluRaflar.length > 0 && (
          <nav className="mag-wrap pt-8">
            <div className="folio mb-3" style={{ color: "var(--ink-3)" }}>
              SHELVES
            </div>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <li>
                <Link
                  href="/store"
                  className="text-[0.95rem] transition-colors"
                  style={
                    acikRaf
                      ? { color: "var(--ink-3)" }
                      : { color: "var(--accent-ink)", fontWeight: 500 }
                  }
                >
                  Everything
                  <span className="folio ml-1.5" style={{ color: "var(--ink-3)" }}>
                    {tumKartlar.length}
                  </span>
                </Link>
              </li>
              {doluRaflar.map((k: any) => {
                const secili = acikRaf?.id === k.id;
                return (
                  <li key={k.id}>
                    <Link
                      href={`/store?shelf=${k.slug}`}
                      className="text-[0.95rem] transition-colors hover:text-[var(--accent-ink)]"
                      style={
                        secili
                          ? { color: "var(--accent-ink)", fontWeight: 500 }
                          : { color: "var(--ink-2)" }
                      }
                    >
                      {k.name}
                      <span className="folio ml-1.5" style={{ color: "var(--ink-3)" }}>
                        {rafSayisi.get(k.id)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Sepete giden kalici yol. */}
        <SepetSeridi />

        {kartlar.length === 0 ? (
          /* Bos vitrin. Once burada hicbir sey yoktu — urun silinince
             sayfa bos bir izgara gosteriyordu ve okur yuklenmedi
             saniyordu. */
          <section className="mag-wrap py-24">
            <p className="display mb-4 text-3xl">
              {acikRaf ? `Nothing on the ${acikRaf.name} shelf yet.` : "Nothing on the shelf yet."}
            </p>
            <p
              className="mb-6 max-w-[52ch] leading-relaxed"
              style={{ color: "var(--ink-2)" }}
            >
              The first guides and templates are being prepared. In the meantime the
              reporting is all free to read.
            </p>
            <Link
              href={acikRaf ? "/store" : "/"}
              className="byline hover:text-[var(--accent-ink)]"
            >
              {acikRaf ? "← BACK TO THE STORE" : "← BACK TO THE FRONT PAGE"}
            </Link>
          </section>
        ) : (
          <>
            {/* --- URUNLER ---
                Once "ilk urun genis + sag sutunda raf listesi + altta
                izgara" seklindeydi. Raflar sag sutundan cikinca o
                sutun bosaldi ve manset urunun yaninda kocaman bir
                bosluk kaldi. Tek ve esit bir izgara hem o boslugu
                kaldiriyor hem de bir vitrinin dogru bicimi: urunler
                birbirine gore hiyerarsik degil. */}
            <section className="mag-wrap pt-10">
              <div className="grid gap-x-9 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {kartlar.map((u, i) => (
                  <UrunKarti key={u.id} urun={u} no={i + 1} />
                ))}
              </div>
            </section>

            <section className="mag-wrap pt-16">
              <p
                className="max-w-[52ch] text-[0.95rem] leading-relaxed"
                style={{ color: "var(--ink-2)", borderTop: "1px solid var(--rule)", paddingTop: "1.25rem" }}
              >
                Everything is sold directly by Fabelo. Payment is by bank transfer or on
                delivery.
              </p>
            </section>
          </>
        )}

        <div className="h-24 sm:h-32" />
      </main>

      <MagazineFooter />
    </div>
  );
}
