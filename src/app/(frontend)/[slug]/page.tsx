import React from "react";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq, desc, ne, and } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { PostCard, NumberedTrendingCard, AdSlot, fmtDate } from "@/components/magazine/PostCard";
import {
  Clock,
  ArrowLeft,
  ChevronRight,
  Share2,
  Bookmark,
  Sparkles,
  Check,
  Twitter,
  Linkedin,
  Copy,
} from "lucide-react";
import ArticleClientActions from "./ArticleClientActions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.slug, slug),
  });

  if (!post) {
    const page = await db.query.pages.findFirst({
      where: eq(schema.pages.slug, slug),
    });
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

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Check if it's a post
  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.slug, slug),
  });

  // 2. Check if it's a static page (about, advertise, sponsor, terms, privacy)
  if (!post) {
    const page = await db.query.pages.findFirst({
      where: eq(schema.pages.slug, slug),
    });

    if (!page) notFound();

    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
        <MagazineHeader />

        <main className="f-content flex-1 py-14 max-w-4xl">
          <div className="space-y-4 pb-8 border-b border-[var(--line)]">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Index</span>
            </Link>
            <h1 className="f-manifesto text-[clamp(2.2rem,4.5vw,3.6rem)]">
              {page.title}
            </h1>
          </div>

          <div
            className="f-prose mt-8 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.contentHtml || "<p></p>" }}
          />
        </main>

        <MagazineFooter />
      </div>
    );
  }

  // Fetch author & category info
  const author = post.authorId
    ? await db.query.authors.findFirst({
        where: eq(schema.authors.id, post.authorId),
      })
    : null;

  const category = post.categoryId
    ? await db.query.categories.findFirst({
        where: eq(schema.categories.id, post.categoryId),
      })
    : null;

  // Related & Trending posts
  const relatedPosts = await db.query.posts.findMany({
    where: and(
      eq(schema.posts.status, "published"),
      ne(schema.posts.id, post.id)
    ),
    orderBy: [desc(schema.posts.publishedAt)],
    limit: 4,
  });

  const trendingPosts = await db.query.posts.findMany({
    where: and(
      eq(schema.posts.status, "published"),
      ne(schema.posts.id, post.id)
    ),
    orderBy: [desc(schema.posts.publishedAt)],
    limit: 5,
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col selection:bg-[var(--accent)] selection:text-white">
      <ArticleClientActions title={post.title} />
      <MagazineHeader />

      <main className="f-content flex-1 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] mb-6">
          <Link href="/" className="hover:text-[var(--fg)] transition">
            Home
          </Link>
          <ChevronRight className="size-3 text-[var(--muted)]/60" />
          {category ? (
            <Link
              href={`/tag/${category.slug}`}
              className="text-[var(--accent)] hover:underline"
            >
              {category.name}
            </Link>
          ) : (
            <span>Editorial</span>
          )}
          <ChevronRight className="size-3 text-[var(--muted)]/60" />
          <span className="truncate max-w-[240px] text-[var(--fg)] opacity-70">
            {post.title}
          </span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* ========================================================
              ARTICLE COLUMN (8 cols)
              ======================================================== */}
          <article className="lg:col-span-8 space-y-8">
            {/* Header Area */}
            <header className="space-y-4">
              {category && (
                <Link
                  href={`/tag/${category.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--accent-weak)] text-[var(--accent)] text-xs font-bold uppercase tracking-wider transition hover:opacity-85"
                >
                  {category.name}
                </Link>
              )}

              <h1 className="f-display text-[clamp(2.2rem,4.5vw,3.6rem)] font-extrabold text-[var(--heading)] leading-[1.08] tracking-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-[17px] sm:text-[19px] text-[var(--muted)] leading-relaxed font-serif italic border-l-2 border-[var(--accent)] pl-4 py-0.5">
                  {post.excerpt}
                </p>
              )}

              {/* Author & Meta Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--line)] text-xs sm:text-sm text-[var(--muted)]">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full overflow-hidden bg-[var(--bg-2)] border border-[var(--line)]">
                    {author?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={author.avatarUrl}
                        alt={author.name || "Author"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center font-bold text-[var(--accent)]">
                        F
                      </div>
                    )}
                  </div>
                  <div>
                    <Link
                      href={author ? `/author/${author.slug}` : "/"}
                      className="font-bold text-[var(--fg)] hover:text-[var(--accent)] transition"
                    >
                      {author?.name || "Fabelo Staff"}
                    </Link>
                    <div className="text-xs text-[var(--muted)]">
                      {author?.role || "Editorial Desk"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <span>{fmtDate(post.publishedAt)}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {post.readingTime || "5 min read"}
                  </span>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {post.featuredImageUrl && (
              <figure className="rounded-2xl overflow-hidden bg-[var(--bg-2)] border border-[var(--line)] shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.featuredImageUrl}
                  alt={post.title}
                  className="w-full h-auto object-cover max-h-[560px]"
                />
              </figure>
            )}

            {/* Main Article Prose Content */}
            <div
              className="f-prose f-dropcap text-[17px] sm:text-[18px] leading-[1.8] text-[var(--fg)] font-sans"
              dangerouslySetInnerHTML={{
                __html: post.contentHtml || "<p></p>",
              }}
            />

            {/* Mid-Article In-Read Ad Placement */}
            <div className="my-8">
              <AdSlot size="inread" label="Sponsor Dispatch" />
            </div>

            {/* Tags & Taxonomy List */}
            {post.tagsJson && Array.isArray(post.tagsJson) && post.tagsJson.length > 0 && (
              <div className="pt-6 border-t border-[var(--line)] space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)] block">
                  Categorized Topics:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(post.tagsJson as any[]).map((t: any, idx: number) => {
                    const tagSlug = typeof t === "string" ? t : t.slug || t.name;
                    const tagName = typeof t === "string" ? t : t.name || t.slug;
                    return (
                      <Link
                        key={idx}
                        href={`/tag/${tagSlug}`}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
                      >
                        #{tagName}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Author Profile Bio Box */}
            {author && (
              <div className="rounded-2xl p-6 sm:p-8 bg-[var(--bg-2)] border border-[var(--line)] flex flex-col sm:flex-row gap-6 items-start">
                <div className="size-20 rounded-full overflow-hidden bg-[var(--accent-weak)] shrink-0 border border-[var(--line)]">
                  {author.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={author.avatarUrl}
                      alt={author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xl font-bold text-[var(--accent)]">
                      {author.name[0]}
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--accent)]">
                    Published By Author
                  </div>
                  <Link
                    href={`/author/${author.slug}`}
                    className="text-xl font-bold text-[var(--heading)] hover:text-[var(--accent)] transition inline-block"
                  >
                    {author.name}
                  </Link>
                  {author.role && (
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      {author.role}
                    </p>
                  )}
                  {author.bio && (
                    <p className="text-sm text-[var(--muted)] leading-relaxed pt-1">
                      {author.bio}
                    </p>
                  )}
                  <div className="pt-2">
                    <Link
                      href={`/author/${author.slug}`}
                      className="text-xs font-bold text-[var(--accent)] hover:underline"
                    >
                      View all articles by {author.name} →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </article>

          {/* ========================================================
              STICKY SIDEBAR COLUMN (4 cols)
              ======================================================== */}
          <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
            {/* Newsletter Mini Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#3b4bc8] to-[#1f2987] text-white space-y-3 shadow-md">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/80 font-bold">
                The Fabelo Dispatch
              </span>
              <h3 className="text-lg font-extrabold leading-snug">
                Never miss an in-depth breakdown.
              </h3>
              <p className="text-xs text-white/85 leading-relaxed">
                Join 42K+ readers. Two high-impact briefings delivered weekly.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-2 pt-1">
                <input
                  type="email"
                  required
                  placeholder="Your email address…"
                  className="w-full h-10 px-3.5 rounded-xl bg-white text-gray-900 text-xs font-medium outline-none shadow-inner"
                />
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-gray-950 hover:bg-black text-white font-bold text-xs transition"
                >
                  Join Free
                </button>
              </form>
            </div>

            {/* Half-Page Skyscraper Sponsor Unit (300x600) */}
            <AdSlot size="skyscraper" label="Sponsored Partner" />

            {/* Trending In Focus */}
            <div className="p-6 rounded-2xl bg-[var(--bg-2)] border border-[var(--line)]">
              <div className="pb-3 mb-3 border-b border-[var(--line)] flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[var(--heading)]">
                  Top Trending
                </h3>
                <span className="text-[10px] font-mono text-[var(--muted)]">RANKED</span>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {trendingPosts.map((tp, i) => (
                  <NumberedTrendingCard
                    key={tp.id}
                    post={tp}
                    index={i + 1}
                    category={tp.categoryId ? { name: "Trending", slug: "trending" } : null}
                  />
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom Related Stories Grid */}
        {relatedPosts.length > 0 && (
          <section className="mt-20 pt-10 border-t-2 border-[var(--heading)] space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--heading)]">
                More From The Fabelo Journal
              </h2>
              <Link
                href="/"
                className="text-xs sm:text-sm font-bold text-[var(--accent)] hover:underline"
              >
                Browse all stories →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedPosts.map((rp) => (
                <PostCard key={rp.id} post={rp} />
              ))}
            </div>
          </section>
        )}
      </main>

      <MagazineFooter />
    </div>
  );
}
