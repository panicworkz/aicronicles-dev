import React from 'react';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { eq, desc, and, ne } from 'drizzle-orm';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArticleLiveWrapper } from './ArticleLiveWrapper';
import { MagazineHeader } from '@/components/magazine/MagazineHeader';
import { MagazineFooter } from '@/components/magazine/MagazineFooter';
import { AdBanner } from '@/components/magazine/AdBanner';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.slug, slug),
  });

  if (!post) {
    const page = await db.query.pages.findFirst({ where: eq(schema.pages.slug, slug) });
    if (!page) return { title: 'Not Found - Fabelo' };
    return { title: `${page.title} - Fabelo` };
  }

  return {
    title: `${post.metaTitle || post.title} | Fabelo`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.featuredImageUrl ? [post.featuredImageUrl] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Try to find Post
  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.slug, slug),
  });

  if (post) {
    let author = null;
    if (post.authorId) {
      author = await db.query.authors.findFirst({
        where: eq(schema.authors.id, post.authorId),
      });
    }

    let category = null;
    if (post.categoryId) {
      category = await db.query.categories.findFirst({
        where: eq(schema.categories.id, post.categoryId),
      });
    }

    // Fetch 3 related posts
    const relatedPosts = await db.query.posts.findMany({
      where: and(
        eq(schema.posts.status, 'published'),
        ne(schema.posts.id, post.id)
      ),
      orderBy: [desc(schema.posts.publishedAt)],
      limit: 3,
    });

    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white transition-colors duration-200">
        <MagazineHeader />

        {/* Main Content Layout Container: Exactly 1536px */}
        <main className="max-w-[1536px] mx-auto px-6 lg:px-12 py-8 space-y-12">
          
          {/* Top Billboard Sponsor Bar */}
          <AdBanner
            slot="billboard"
            sponsorName="Fabelo Pro Executive AI Stack"
            sponsorTagline="The definitive daily briefing for tech leaders, algorithmic traders, and software founders."
            sponsorUrl="/panic"
            ctaText="Join Executive Circle"
          />

          {/* 2-Column Editorial & Sidebar Architecture */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left 8 Cols: Main Article Body Canvas */}
            <div className="lg:col-span-8 space-y-12">
              <ArticleLiveWrapper
                initialTitle={post.title}
                initialContentHtml={post.contentHtml || ''}
                initialCoverUrl={post.featuredImageUrl}
                excerpt={post.excerpt}
                readingTime={post.readingTime}
                publishedAt={post.publishedAt ? post.publishedAt.toISOString() : null}
                author={author}
                category={category}
              />

              {/* In-Article Mid-Roll Leaderboard Ad */}
              <AdBanner
                slot="leaderboard"
                sponsorName="Panic Media Cloud Infrastructure"
                sponsorTagline="Enterprise high-availability media hosting with auto-scaling headless edge APIs."
                sponsorUrl="/panic"
                ctaText="Deploy on Cloud"
              />
            </div>

            {/* Right 4 Cols: Sticky Desktop Magazine Sidebar with Skyscraper Ad */}
            <aside className="lg:col-span-4 space-y-8 sticky top-24">
              {/* Author Quick Profile Widget */}
              <div className="p-6 rounded-3xl border border-border bg-card/60 backdrop-blur-sm space-y-4 shadow-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">WRITTEN BY</span>
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden shrink-0">
                    <img
                      src={author?.avatarUrl || 'https://fabelo.io/content/images/size/w160/2026/04/ufuk_square.png'}
                      alt={author?.name || 'Author'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-bold font-serif text-foreground">{author?.name || 'Ufuk Yorulmaz'}</h4>
                    <p className="text-xs text-muted-foreground">{author?.role || 'Lead Editor & Architect'}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {author?.bio || 'Covering AI productivity workflows, high-income career engineering, and modern software architectures.'}
                </p>
                <Link
                  href={`/author/${author?.slug || 'ufuk-yorulmaz'}`}
                  className="w-full py-2 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground transition flex items-center justify-center gap-1"
                >
                  <span>View Author Desk</span>
                  <span>→</span>
                </Link>
              </div>

              {/* REKLAM ALANI: STICKY HALF-PAGE SKYSCRAPER AD (300x600) */}
              <AdBanner
                slot="halfpage"
                sponsorName="Panic Studio AI Suite"
                sponsorTagline="Automate your entire digital media operation with AI copilots, real-time analytics, and headless delivery."
                sponsorUrl="/panic"
                ctaText="Get Started"
              />
            </aside>
          </div>

          {/* Recommended / Related Stories Grid (1536px canvas) */}
          {relatedPosts.length > 0 && (
            <section className="border-t border-border/80 mt-20 pt-16 space-y-10">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">Related Dispatches</span>
                  <h3 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-foreground">
                    Continue Reading on Fabelo
                  </h3>
                </div>
                <Link href="/" className="text-sm font-bold text-primary hover:underline">
                  All Editorial →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/${rel.slug}`}
                    className="group flex flex-col rounded-3xl overflow-hidden border border-border bg-card hover:border-primary/50 transition duration-300 shadow-sm"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/60">
                      <img
                        src={rel.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                        alt={rel.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-mono text-primary font-bold">
                          {rel.readingTime || '6 min read'}
                        </span>
                        <h4 className="text-base font-bold font-serif text-foreground group-hover:text-primary transition line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition inline-flex items-center gap-1">
                        Read Story →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Bottom Floating Adhesive Banner */}
        <AdBanner slot="sticky-bottom" />

        <MagazineFooter />
      </div>
    );
  }

  // 2. Try to find Static Page
  const page = await db.query.pages.findFirst({
    where: eq(schema.pages.slug, slug),
  });

  if (!page) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MagazineHeader />
      <main className="max-w-[1536px] mx-auto px-6 lg:px-12 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="space-y-3 border-b border-border pb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Fabelo Editorial</span>
            <h1 className="text-4xl sm:text-5xl font-black font-serif tracking-tight text-foreground">{page.title}</h1>
          </header>
          <div
            className="gh-content is-body leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.contentHtml || '' }}
          />
        </div>
      </main>
      <MagazineFooter />
    </div>
  );
}
