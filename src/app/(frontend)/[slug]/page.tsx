import React from 'react';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { eq, desc, and, ne } from 'drizzle-orm';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArticleLiveWrapper } from './ArticleLiveWrapper';
import { MagazineHeader } from '@/components/magazine/MagazineHeader';
import { MagazineFooter } from '@/components/magazine/MagazineFooter';
import { Clock, ArrowRight, Share2, Sparkles, BookOpen } from 'lucide-react';

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

        {/* Main Article Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {/* Recommended / Related Stories Grid */}
          {relatedPosts.length > 0 && (
            <section className="border-t border-border/80 mt-16 pt-12 space-y-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">Related Dispatches</span>
                  <h3 className="text-2xl font-black font-serif tracking-tight text-foreground">
                    Continue Reading on Fabelo
                  </h3>
                </div>
                <Link href="/" className="text-xs font-semibold text-primary hover:underline">
                  All Editorial →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/${rel.slug}`}
                    className="group flex flex-col rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 transition duration-300 shadow-xs"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/60">
                      <img
                        src={rel.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                        alt={rel.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-mono text-primary font-semibold">
                          {rel.readingTime || '6 min read'}
                        </span>
                        <h4 className="text-sm font-bold font-serif text-foreground group-hover:text-primary transition line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                      </div>
                      <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition inline-flex items-center gap-1">
                        Read Story →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="mb-10 space-y-3 border-b border-border pb-6">
          <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Fabelo Editorial</span>
          <h1 className="text-4xl sm:text-5xl font-black font-serif tracking-tight text-foreground">{page.title}</h1>
        </header>
        <div
          className="gh-content is-body leading-relaxed"
          dangerouslySetInnerHTML={{ __html: page.contentHtml || '' }}
        />
      </main>
      <MagazineFooter />
    </div>
  );
}
