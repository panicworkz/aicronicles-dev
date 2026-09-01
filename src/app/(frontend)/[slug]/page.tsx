import React from "react";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq, desc, ne, and } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import ClientForm from "@/components/magazine/ClientForm";
import ArticleClientActions from "./ArticleClientActions";
import {
  HorizontalStoryCard,
  NumberedTrendingCard,
  AdSlot,
  fmtDate,
  type CardPost,
} from "@/components/magazine/PostCard";
import { decodeEntities, tagLabel } from "@/lib/taxonomy";
import { enrichArticleHtml, type MediaBoyut } from "@/components/magazine/enrichArticleHtml";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({ where: eq(schema.posts.slug, slug) });

  if (!post) {
    const page = await db.query.pages.findFirst({ where: eq(schema.pages.slug, slug) });
    if (!page) return { title: "Not Found | Fabelo" };
    return {
      title: `${page.metaTitle || page.title} | Fabelo`,
      description: page.metaDescription || "Fabelo publication page.",
    };
  }

  return {
    title: `${post.metaTitle || post.title} | Fabelo`,
    description: post.metaDescription || post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : [],
    },
  };
}


/** Dosya adi -> {width,height} haritasi; gorsellere yer ayirmak icin */
async function medyaBoyutlari(): Promise<Map<string, MediaBoyut>> {
  const satirlar = await db.query.media.findMany();
  const harita = new Map<string, MediaBoyut>();
  for (const m of satirlar as any[]) {
    if (m?.filename) harita.set(m.filename, { width: m.width ?? null, height: m.height ?? null });
  }
  return harita;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  const post = await db.query.posts.findFirst({ where: eq(schema.posts.slug, slug) });

  /* ---------------------------------------------------------------
     CMS sayfasi (About, Advertise, Sponsor, Terms, Privacy...)
     --------------------------------------------------------------- */
  if (!post) {
    const page = await db.query.pages.findFirst({ where: eq(schema.pages.slug, slug) });
    if (!page) notFound();

    return (
      <div className="mag min-h-screen">
        <MagazineHeader />
        <main className="mag-wrap py-16 sm:py-24">
          <div className="mx-auto max-w-[760px]">
            <div className="folio mb-4">§ FABELO</div>
            <h1 className="display mb-8 text-[clamp(2.4rem,5vw,4rem)]">{decodeEntities(page.title)}</h1>
            <div className="rule mb-10" />
            <div
              className="article-body text-[1.06rem] leading-[1.78]"
              dangerouslySetInnerHTML={{
                __html: enrichArticleHtml(page.contentHtml, await medyaBoyutlari()),
              }}
            />
          </div>
        </main>
        <MagazineFooter />
      </div>
    );
  }

  /* ---------------------------------------------------------------
     Yazi
     --------------------------------------------------------------- */
  const author = post.authorId
    ? await db.query.authors.findFirst({ where: eq(schema.authors.id, post.authorId) })
    : null;

  const category = post.categoryId
    ? await db.query.categories.findFirst({ where: eq(schema.categories.id, post.categoryId) })
    : null;

  const others = await db.query.posts.findMany({
    where: and(eq(schema.posts.status, "published"), ne(schema.posts.id, post.id)),
    orderBy: [desc(schema.posts.publishedAt)],
    limit: 9,
  });

  const authors = await db.query.authors.findMany();
  const categories = await db.query.categories.findMany();
  const authorById = new Map(authors.map((a: any) => [a.id, a]));
  const catById = new Map(categories.map((c: any) => [c.id, c]));

  const toCard = (p: any): CardPost => ({
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
  });

  const boyutlar = await medyaBoyutlari();

  const related = others.slice(0, 4).map(toCard);
  const trending = others.slice(4, 9).map(toCard);

  /* Yazinin tag'leri — tagsJson (fabelo.io tag'leri buraya yaziliyor) */
  const rawTags: string[] = Array.isArray(post.tagsJson) ? (post.tagsJson as string[]) : [];
  const tagSlugs = rawTags
    .map((t) => String(t).toLowerCase().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-"))
    .filter(Boolean);

  return (
    <div className="mag min-h-screen">
      <ArticleClientActions title={post.title} />
      <MagazineHeader />

      <main>
        {/* ============== BASLIK BLOGU (tam genislik hissi) ============== */}
        <header className="mag-wrap pt-10 sm:pt-14">
          <nav className="byline mb-7 flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--accent-ink)]">
              HOME
            </Link>
            <span style={{ color: "var(--rule)" }}>/</span>
            {category && (
              <>
                <Link href={`/category/${category.slug}`} className="hover:text-[var(--accent-ink)]">
                  {category.name.toUpperCase()}
                </Link>
                <span style={{ color: "var(--rule)" }}>/</span>
              </>
            )}
            <span className="truncate" style={{ color: "var(--ink-3)" }}>
              {decodeEntities(post.title).slice(0, 48)}…
            </span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-9">
              {category && (
                <Link href={`/category/${category.slug}`} className="folio mb-4 inline-block">
                  § {category.name.toUpperCase()}
                </Link>
              )}
              <h1 className="display mb-6 text-[clamp(2.4rem,5.6vw,4.6rem)]">
                {decodeEntities(post.title)}
              </h1>
              {post.excerpt && (
                <p
                  className="mb-7 max-w-[62ch] text-[1.15rem] leading-relaxed sm:text-[1.28rem]"
                  style={{ color: "var(--ink-2)" }}
                >
                  {decodeEntities(post.excerpt)}
                </p>
              )}
              <div className="rule flex flex-wrap items-center gap-x-3 gap-y-2 pt-5">
                {author && (
                  <Link href={`/author/${author.slug}`} className="byline hover:text-[var(--accent-ink)]">
                    BY {author.name.toUpperCase()}
                  </Link>
                )}
                <span className="byline" style={{ color: "var(--rule)" }}>
                  ·
                </span>
                <span className="byline">{fmtDate(post.publishedAt || post.createdAt)}</span>
                {post.readingTime && (
                  <>
                    <span className="byline" style={{ color: "var(--rule)" }}>
                      ·
                    </span>
                    <span className="byline">{post.readingTime.replace(" read", "").toUpperCase()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {post.featuredImageUrl && (
            <figure className="mt-10">
              <div className="plate w-full" style={{ aspectRatio: "21 / 9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.featuredImageUrl}
                  alt={decodeEntities(post.title)}
                  className="size-full object-cover"
                />
              </div>
            </figure>
          )}
        </header>

        {/* ============== GOVDE + KENAR ============== */}
        <div className="mag-wrap pt-14">
          <div className="grid gap-14 lg:grid-cols-12">
            {/* Metin — 8 kolon, olcu 68ch */}
            <article className="lg:col-span-8">
              <div
                className="article-body dropcap text-[1.06rem] leading-[1.82]"
                dangerouslySetInnerHTML={{
                  __html: enrichArticleHtml(post.contentHtml, boyutlar),
                }}
              />

              {/* Tag'ler */}
              {tagSlugs.length > 0 && (
                <div className="rule mt-14 pt-7">
                  <div className="folio mb-4">§ FILED UNDER</div>
                  <div className="flex flex-wrap gap-2.5">
                    {tagSlugs.map((t) => (
                      <Link
                        key={t}
                        href={`/tag/${t}`}
                        className="kicker px-4 py-2 transition-colors hover:text-[var(--accent-ink)]"
                        style={{ border: "1px solid var(--rule)" }}
                      >
                        {tagLabel(t)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Yazi ici reklam */}
              <div className="mt-12">
                <AdSlot size="leaderboard" label="Advertisement" />
              </div>

              {/* Yazar kunyesi */}
              {author && (
                <section
                  className="mt-14 flex flex-col gap-5 p-8 sm:flex-row"
                  style={{ background: "var(--paper-2)", border: "1px solid var(--rule)" }}
                >
                  <div
                    className="display grid size-16 shrink-0 place-items-center rounded-full text-2xl"
                    style={{ background: "var(--ink)", color: "var(--paper)" }}
                  >
                    {author.name.charAt(0)}
                  </div>
                  <div>
                    <div className="folio mb-1.5">§ WRITTEN BY</div>
                    <Link href={`/author/${author.slug}`}>
                      <h3 className="display headline-link mb-2 text-[1.5rem]">{author.name}</h3>
                    </Link>
                    {author.bio && (
                      <p className="text-[0.96rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
                        {decodeEntities(author.bio)}
                      </p>
                    )}
                  </div>
                </section>
              )}
            </article>

            {/* Kenar — 4 kolon */}
            <aside className="lg:col-span-4 lg:rule-v lg:pl-14">
              <div className="sticky top-44 flex flex-col gap-10">
                <div>
                  <div className="rule-heavy pt-3">
                    <div className="folio mb-1.5">§ MOST READ</div>
                    <h2 className="display mb-4 text-[1.6rem]">On the desk</h2>
                  </div>
                  {trending.map((p, i) => (
                    <NumberedTrendingCard key={p.slug} post={p} index={i + 1} />
                  ))}
                </div>

                <AdSlot size="skyscraper" label="Sponsor" />
              </div>
            </aside>
          </div>
        </div>

        {/* ============== DISPATCH ============== */}
        <section className="mt-20 sm:mt-28" style={{ background: "var(--ink)" }}>
          <div className="mag-wrap py-14 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-7">
                <div className="folio mb-3" style={{ color: "var(--accent)" }}>
                  § THE FABELO DISPATCH
                </div>
                <h2 className="display text-[clamp(1.9rem,4vw,3rem)]" style={{ color: "var(--paper)" }}>
                  Liked this? Get the next one <em>in your inbox</em>.
                </h2>
              </div>
              <div className="lg:col-span-5">
                <ClientForm className="flex flex-col gap-3">
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    className="h-12 w-full bg-transparent px-0 text-[1.05rem] outline-none"
                    style={{ borderBottom: "1px solid #3a4048", color: "var(--paper)" }}
                  />
                  <button
                    type="submit"
                    className="h-12 w-full text-[0.82rem] font-bold tracking-[0.14em]"
                    style={{ background: "var(--accent)", color: "#08181c" }}
                  >
                    SUBSCRIBE FREE
                  </button>
                </ClientForm>
              </div>
            </div>
          </div>
        </section>

        {/* ============== ILGILI YAZILAR ============== */}
        <section className="mag-wrap pt-16 sm:pt-24">
          <div className="mb-8 rule-heavy pt-4">
            <div className="folio mb-2">§ NEXT</div>
            <h2 className="display text-[2rem] sm:text-[2.6rem]">Keep reading</h2>
          </div>
          <div className="grid gap-x-14 gap-y-0 lg:grid-cols-2">
            {related.map((p) => (
              <HorizontalStoryCard key={p.slug} post={p} />
            ))}
          </div>
        </section>

        <div className="h-20 sm:h-28" />
      </main>

      <MagazineFooter />
    </div>
  );
}
