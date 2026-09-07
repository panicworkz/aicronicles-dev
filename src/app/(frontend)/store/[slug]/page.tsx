import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, schema } from "@/db";
import { and, desc, eq, ne } from "drizzle-orm";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { SepetSeridi } from "@/components/store/SepetSeridi";
import { UrunKarti, type KartUrun } from "@/components/store/UrunKarti";
import { UrunGorselleri } from "./UrunGorselleri";
import { SepeteEkle } from "@/components/store/SepeteEkle";
import { SITE, markali, mutlak, kirintiSemasi } from "@/lib/seo";
import { magazaRobots } from "@/lib/magaza-durumu";
import { fiyat, stokta, turu, TUR_ADI, TUR_VAADI, urunSemasi } from "@/lib/magaza";

export const dynamic = "force-dynamic";

/**
 * Urun sayfasi — dergi katmaninda.
 *
 * Oncekinde 343 satirlik tek bir istemci bileseni vardi: galeri,
 * varyant secimi, adet, kupon kutusu, sekmeler, hepsi bir arada. Ustelik
 * sayfanin kendi basligi, kanonik adresi ve yapisal verisi YOKTU —
 * yani arama motoru bu sayfayi ana sayfayla ayni baslikla goruyordu.
 *
 * Simdi: sunucuda uretilen bir sayfa, yalnizca galeri istemcide
 * (tiklamayla degisen tek sey o). Basligi, aciklamasi, kanonigi ve
 * schema.org/Product verisi var.
 *
 * Satin alma bolumu (SepeteEkle) gercekten calisiyor: sepete ekliyor,
 * odeme ekranina goturuyor ve siparis olusturuyor. Oncekinde bir "Add
 * to Cart" dugmesi vardi ve yalnizca bir bildirim gosteriyordu.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function urunGetir(slug: string) {
  return db.query.products.findFirst({ where: eq(schema.products.slug, slug) });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const urun = await urunGetir(slug);
  if (!urun) return { title: markali("Not found") };

  const adres = `${SITE}/store/${urun.slug}`;
  const aciklama =
    urun.metaDescription ||
    urun.description ||
    `${urun.title} — from the Fabelo desk.`;
  const gorsel = mutlak(urun.featuredImageUrl) || `${SITE}/images/fabelo-logo.png`;

  return {
    title: markali(urun.metaTitle || urun.title),
    description: aciklama,
    alternates: { canonical: adres },
    // Kapaliyken noindex; tek kaynak lib/magaza-durumu.ts
    robots: await magazaRobots(),
    openGraph: {
      type: "website",
      url: adres,
      title: urun.title,
      description: aciklama,
      images: [{ url: gorsel }],
    },
    twitter: {
      card: "summary_large_image",
      title: urun.title,
      description: aciklama,
      images: [gorsel],
    },
  };
}

export default async function UrunSayfasi({ params }: PageProps) {
  const { slug } = await params;

  const urun = await urunGetir(slug);
  if (!urun) notFound();

  const [varyantlar, benzerler] = await Promise.all([
    db.query.productVariants.findMany({
      where: eq(schema.productVariants.productId, urun.id),
    }),
    db.query.products.findMany({
      where: and(
        eq(schema.products.status, "published"),
        ne(schema.products.id, urun.id)
      ),
      orderBy: [desc(schema.products.createdAt)],
      limit: 3,
    }),
  ]);

  const t = turu(urun.productType);
  const mevcut = stokta(urun as any);
  const paraBirimi = urun.currency || "USD";
  const indirimli =
    urun.compareAtPrice != null &&
    Number(urun.compareAtPrice) > Number(urun.price ?? 0);

  const gorseller = [
    urun.featuredImageUrl,
    ...(Array.isArray(urun.galleryUrls) ? (urun.galleryUrls as string[]) : []),
  ].filter(Boolean) as string[];

  const ozellikler = Array.isArray(urun.specificationsJson)
    ? (urun.specificationsJson as any[])
    : [];

  return (
    <div className="mag min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(urunSemasi(urun as any)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            kirintiSemasi([
              { ad: "Store", yol: "/store" },
              { ad: urun.title, yol: `/store/${urun.slug}` },
            ])
          ),
        }}
      />
      <MagazineHeader />

      <main>
        {/* Sepete giden kalici yol — derginin basliginin ALTINDA. */}
        <SepetSeridi />
        <div className="mag-wrap pt-10">
          <Link href="/store" className="byline hover:text-[var(--accent-ink)]">
            ← STORE
          </Link>
        </div>

        <section className="mag-wrap pt-6">
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Galeri */}
            <div className="lg:col-span-7">
              <UrunGorselleri gorseller={gorseller} baslik={urun.title} />
            </div>

            {/* Kunye ve satin alma */}
            <div className="lg:col-span-5">
              <div className="folio mb-3" style={{ color: "var(--accent)" }}>
                § {TUR_ADI[t].toUpperCase()}
              </div>
              <h1 className="display mb-4 text-[clamp(2rem,4.5vw,3.2rem)]">
                {urun.title}
              </h1>

              {urun.description && (
                <p
                  className="mb-6 text-[1.05rem] leading-relaxed"
                  style={{ color: "var(--ink-2)" }}
                >
                  {urun.description}
                </p>
              )}

              <div className="rule-heavy pt-5">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <span className="display text-[2rem]">
                    {fiyat(urun.price, paraBirimi)}
                  </span>
                  {indirimli && (
                    <span
                      className="text-[1.05rem] line-through"
                      style={{ color: "var(--ink-3)" }}
                    >
                      {fiyat(urun.compareAtPrice, paraBirimi)}
                    </span>
                  )}
                  <span className="byline ml-auto" style={{ color: "var(--ink-3)" }}>
                    {mevcut ? TUR_VAADI[t].toUpperCase() : "SOLD OUT"}
                  </span>
                </div>

                <SepeteEkle
                  urunId={urun.id}
                  slug={urun.slug}
                  baslik={urun.title}
                  fiyat={Number(urun.price ?? 0)}
                  paraBirimi={paraBirimi}
                  tur={t}
                  gorsel={urun.featuredImageUrl}
                  varyantlar={(varyantlar as any[]).map((v) => ({
                    id: v.id,
                    title: v.title,
                    price: v.price,
                    inventory: v.inventory,
                  }))}
                  stokta={mevcut}
                />
              </div>

              {/* Teknik ozellikler */}
              {ozellikler.length > 0 && (
                <div className="mt-8">
                  <div className="folio mb-3" style={{ color: "var(--ink-3)" }}>
                    DETAILS
                  </div>
                  <dl>
                    {ozellikler.map((o: any, i: number) => (
                      <div
                        key={i}
                        className="flex gap-4 py-2.5 text-[0.92rem]"
                        style={{ borderTop: "1px solid var(--rule)" }}
                      >
                        <dt style={{ color: "var(--ink-2)" }} className="w-40 shrink-0">
                          {o?.label ?? o?.key}
                        </dt>
                        <dd>{o?.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Uzun anlatim */}
        {urun.contentHtml && (
          <section className="mag-wrap pt-16">
            <div className="rule-heavy mb-8 pt-5">
              <div className="folio">§ ABOUT THIS</div>
            </div>
            {/* Makale govdesiyle ayni sinif — yayindaki metin neyse
                urun anlatimi da o. "dropcap" YOK: o, bir yazinin
                acilisina ait bir isaret, urun aciklamasina degil. */}
            <div
              className="article-body max-w-[68ch] text-[1.06rem] leading-[1.82]"
              dangerouslySetInnerHTML={{ __html: urun.contentHtml }}
            />
          </section>
        )}

        {/* Digerleri */}
        {benzerler.length > 0 && (
          <section className="mag-wrap pt-16">
            <div className="rule-heavy mb-8 pt-5">
              <div className="folio">§ ALSO ON THE SHELF</div>
            </div>
            <div className="grid gap-x-9 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {(benzerler as unknown as KartUrun[]).map((u, i) => (
                <UrunKarti key={u.id} urun={u} no={i + 1} />
              ))}
            </div>
          </section>
        )}

        <div className="h-24 sm:h-32" />
      </main>

      <MagazineFooter />
    </div>
  );
}
