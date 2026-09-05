import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { desc, eq, and, sql } from "drizzle-orm";
import type { Metadata } from "next";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { PostCard, HorizontalStoryCard, type CardPost } from "@/components/magazine/PostCard";
import { AdSlot } from "@/components/magazine/AdSlot";
import { FABELO_TAGS, tagLabel } from "@/lib/taxonomy";
import { SITE, koleksiyonSemasi } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const aciklama = `Every Fabelo story filed under ${tagLabel(slug)}.`;
  const adres = `${SITE}/tag/${slug}`;
  return {
    title: `${tagLabel(slug)} | Fabelo`,
    description: aciklama,
    // Bkz. kategori sayfasi: parametreli adresler ayri sayfa sayilmasin.
    alternates: { canonical: adres },
    openGraph: { type: "website", url: adres, title: tagLabel(slug), description: aciklama },
    twitter: { card: "summary", title: tagLabel(slug), description: aciklama },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const label = tagLabel(slug);

  /**
   * Yazilar tagsJson icinde etiket ADIYLA saklaniyor ("Personal Finance"),
   * adres ise slug ("personal-finance"). Ikisini de eslestiriyoruz; ayrica
   * bolum slug'i eslesen yazilar da bu konuya dahil.
   */
  const rows = await db.query.posts.findMany({
    where: and(
      eq(schema.posts.status, "published"),
      sql`(
        ${schema.posts.tagsJson}::text ILIKE ${"%" + label + "%"}
        OR ${schema.posts.tagsJson}::text ILIKE ${"%" + slug + "%"}
        OR ${schema.posts.categoryId} IN (
          SELECT id FROM categories WHERE slug = ${slug}
        )
      )`
    ),
    orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)],
    limit: 60,
  });

  /* Bilinmeyen etiket 404 verir.
     Kategori ve yazar sayfalari zaten oyle davraniyordu; etiket sayfasi
     HER slug'a 200 donuyordu, yani /tag/<akla-gelen-her-sey> gecerli bir
     sayfaydi. Bu, arama motoruna sonsuz sayida ince icerikli sayfa acar.
     Bilinen etiketler bos olsalar bile kalir — konu var, yazi henuz yok. */
  if (!FABELO_TAGS.includes(slug as (typeof FABELO_TAGS)[number]) && rows.length === 0) {
    notFound();
  }

  const authors = await db.query.authors.findMany();
  const categories = await db.query.categories.findMany();
  const authorById = new Map(authors.map((a: any) => [a.id, a]));
  const catById = new Map(categories.map((c: any) => [c.id, c]));

  const posts: CardPost[] = rows.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    featuredImageUrl: p.featuredImageUrl,
    readingTime: p.readingTime,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    authorName: authorById.get(p.authorId)?.name ?? null,
    categoryName: catById.get(p.categoryId)?.name ?? null,
    categorySlug: catById.get(p.categoryId)?.slug ?? null,
  }));

  const [lead, ...rest] = posts;
  const siblings = FABELO_TAGS.filter((t) => t !== slug);

  return (
    <div className="mag min-h-screen">
      {/* Bkz. kategori sayfasi — icerik bizim urettigimiz nesneden geliyor. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            koleksiyonSemasi({
              ad: label,
              aciklama: `Every Fabelo story filed under ${label}.`,
              yol: `/tag/${slug}`,
              yazilar: posts,
            })
          ),
        }}
      />
      <MagazineHeader />

      <main>
        <header className="mag-wrap pt-12 sm:pt-16">
          <div className="rule-heavy pt-5">
            <div className="folio mb-3">§ TOPIC</div>
            <h1 className="display mb-3 text-[clamp(2.6rem,6.5vw,5rem)]">{label}</h1>
            <div className="byline">{posts.length} STORIES FILED UNDER THIS TOPIC</div>
          </div>
        </header>

        {posts.length === 0 ? (
          <section className="mag-wrap py-20">
            <p className="display mb-4 text-3xl">Nothing filed under {label} yet.</p>
            <Link href="/" className="byline hover:text-[var(--accent-ink)]">
              ← BACK TO THE FRONT PAGE
            </Link>
          </section>
        ) : (
          <>
            <section className="mag-wrap pt-12">
              <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
                <div className="lg:col-span-7">
                  <PostCard post={lead} size="lg" showImage />
                  {/* Manset altinda iki hikaye daha: sag kolonda dort kart
                      ve 540px'lik rail reklami var; sol kolon tek kartla
                      kalinca satirin yarisindan fazlasi bos kaliyordu. */}
                  {rest.slice(0, 2).length > 0 && (
                    <div className="rule mt-9 pt-8">
                      {rest.slice(0, 2).map((p) => (
                        <HorizontalStoryCard key={p.slug} post={p} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="lg:col-span-5 lg:rule-v lg:pl-14">
                  {rest.slice(2, 5).map((p) => (
                    <HorizontalStoryCard key={p.slug} post={p} />
                  ))}
                  <div className="mt-9">
                    {/* panel, rail degil. Bu kolon 567px genisliginde; rail 387x540
                        icin cizildigi icin burada 1.32 kat buyuyup 713px'e
                        ulasiyor ve sag kolonu sol kolondan 231px asagi
                        tasiyordu. panel (511x300) bu genislikte 300px
                        kaliyor. */}
                    <AdSlot format="panel" label="Sponsor" baglam={{ tur: "tag", slug }} />
                  </div>
                </div>
              </div>
            </section>

            {rest.length > 5 && (
              <section className="mag-wrap pt-16">
                <div className="mb-8 rule-heavy pt-4">
                  <div className="folio mb-2">§ MORE</div>
                  <h2 className="display text-[2rem] sm:text-[2.6rem]">More on {label}</h2>
                </div>
                <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.slice(5).map((p) => (
                    <PostCard key={p.slug} post={p} size="sm" showImage />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Diger konular */}
        <section className="mag-wrap pt-16 sm:pt-24">
          <div className="mb-7 rule-heavy pt-4">
            <div className="folio mb-2">§ ELSEWHERE</div>
            <h2 className="display text-[1.9rem]">Other topics</h2>
          </div>
          {/* Ana sayfadaki konu dizininin ayni duzeni: cerceveli rozetler
              serbest sarilinca satirlar farkli yerlerde bitiyor ve dagınık
              duruyordu. Hizali kolonlar, ustte ince kural, solda folio
              numarasi — basili dergi dizini gibi. */}
          <ul className="grid grid-cols-2 gap-x-10 sm:grid-cols-3 lg:grid-cols-5">
            {siblings.map((t, i) => (
              <li key={t} style={{ borderTop: "1px solid var(--rule)" }}>
                <Link
                  href={`/tag/${t}`}
                  className="flex items-baseline gap-3 py-3 transition-colors hover:text-[var(--accent-ink)]"
                >
                  <span className="folio shrink-0" style={{ color: "var(--ink-3)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.95rem]" style={{ color: "var(--ink-2)" }}>
                    {tagLabel(t)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="h-20 sm:h-28" />
      </main>

      <MagazineFooter />
    </div>
  );
}
