import React from 'react';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import type { Metadata } from 'next';

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
      <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-500 selection:text-black">
        {/* Header */}
        <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white font-serif">
              FABELO<span className="text-amber-500">.</span>
            </Link>
            <div className="flex items-center space-x-4 text-xs font-mono text-neutral-400">
              <Link href="/llms.txt" className="text-amber-500 hover:underline">AEO / llms.txt</Link>
              <Link href={`/api/llm/${post.slug}`} className="hover:text-white">AI Raw View</Link>
              <Link href={`/panic/posts/${post.id}`} className="text-amber-500 hover:underline">Edit in CMS</Link>
            </div>
          </div>
        </header>

        {/* Article Container */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-6 font-serif">
            {post.title}
          </h1>

          <div className="flex items-center space-x-4 border-y border-neutral-800 py-4 mb-8 text-xs text-neutral-400 font-mono">
            <span className="text-neutral-200 font-sans font-medium">Fabelo Editorial</span>
            <span>•</span>
            <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Editorial'}</span>
            <span>•</span>
            <span>{post.readingTime}</span>
          </div>

          {post.featuredImageUrl && (
            <div className="mb-10 rounded-xl overflow-hidden border border-neutral-800 aspect-video bg-neutral-900">
              <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Content Body */}
          <div
            className="prose prose-invert prose-lg max-w-none font-sans leading-relaxed
              prose-headings:font-serif prose-headings:text-white prose-headings:tracking-tight
              prose-a:text-amber-500 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:border prose-img:border-neutral-800
              prose-blockquote:border-l-amber-500 prose-blockquote:text-neutral-300"
            dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }}
          />
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-900 bg-neutral-950 py-12 mt-20 text-neutral-500 text-sm">
          <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
            <p>© {new Date().getFullYear()} Fabelo Editorial.</p>
            <Link href="/" className="text-xs text-amber-500 hover:underline">Back to Home</Link>
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white font-serif">
            FABELO<span className="text-amber-500">.</span>
          </Link>
        </div>
      </header>
      <article className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-8 font-serif">{page.title}</h1>
        <div
          className="prose prose-invert prose-lg max-w-none prose-headings:font-serif prose-a:text-amber-500 hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: page.contentHtml || '' }}
        />
      </article>
    </div>
  );
}
