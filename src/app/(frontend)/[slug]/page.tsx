import React from 'react';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArticleLiveWrapper } from './ArticleLiveWrapper';

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
    title: `${post.metaTitle || post.title} - Fabelo`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : [],
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
    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white transition-colors duration-200">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-foreground font-serif tracking-tight">
              FABELO<span className="text-primary">.</span>
            </Link>
            <div className="flex items-center space-x-4 text-xs font-mono text-muted-foreground">
              <Link href="/llms.txt" className="text-primary hover:underline font-medium">AEO / llms.txt</Link>
              <Link href={`/api/llm/${post.slug}`} className="hover:text-foreground">AI Raw View</Link>
              <Link href={`/panic/posts/${post.id}`} className="text-primary hover:underline font-medium">Edit in CMS</Link>
            </div>
          </div>
        </header>

        {/* Article with Live Sync & Dynamic Theme Adaptation */}
        <ArticleLiveWrapper
          initialTitle={post.title}
          initialContentHtml={post.contentHtml || ''}
          initialCoverUrl={post.featuredImageUrl}
          readingTime={post.readingTime}
          publishedAt={post.publishedAt ? post.publishedAt.toISOString() : null}
        />

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30 py-12 mt-20 text-muted-foreground text-sm">
          <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
            <p>© {new Date().getFullYear()} Fabelo Editorial.</p>
            <Link href="/" className="text-xs text-primary hover:underline font-medium">Back to Home</Link>
          </div>
        </footer>
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
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground font-serif">
            FABELO<span className="text-primary">.</span>
          </Link>
        </div>
      </header>
      <article className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-8 font-serif">{page.title}</h1>
        <div
          className="prose dark:prose-invert prose-neutral prose-lg max-w-none prose-headings:font-serif prose-a:text-primary hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: page.contentHtml || '' }}
        />
      </article>
    </div>
  );
}
