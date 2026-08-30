import React from 'react';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const author = await db.query.authors.findFirst({
    where: eq(schema.authors.slug, slug),
  });

  return {
    title: author ? `${author.name} - Author Profile | Fabelo` : `${slug} | Fabelo`,
    description: author?.bio || `Articles, analyses, and publications by ${author?.name || slug} on Fabelo.`,
  };
}

export default async function AuthorArchivePage({ params }: PageProps) {
  const { slug } = await params;

  const author = await db.query.authors.findFirst({
    where: eq(schema.authors.slug, slug),
  });

  let posts = [];
  if (author) {
    posts = await db.query.posts.findMany({
      where: eq(schema.posts.authorId, author.id),
      orderBy: [desc(schema.posts.publishedAt)],
      limit: 30,
    });
  }

  // Fallback if no specific author posts
  if (posts.length === 0) {
    posts = await db.query.posts.findMany({
      where: eq(schema.posts.status, 'published'),
      orderBy: [desc(schema.posts.publishedAt)],
      limit: 30,
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-foreground font-serif">
            FABELO<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/store" className="hover:underline">Store</Link>
            <Link href="/panic" className="text-primary hover:underline">Panic CMS</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Author Bio Header Card */}
        <div className="mb-12 p-8 rounded-2xl border border-border bg-card/60 backdrop-blur flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-xs">
          <div className="size-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-2xl font-black text-primary uppercase overflow-hidden shrink-0 shadow-inner">
            {author?.avatarUrl ? (
              <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              author?.name?.slice(0, 2) || 'ED'
            )}
          </div>
          <div className="space-y-1.5 flex-1">
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
              {author?.role || 'Editorial Staff'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-serif">
              {author?.name || slug.replace(/-/g, ' ')}
            </h1>
            <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
              {author?.bio || 'Editorial contributor covering AI architecture, modern software engineering, and digital commerce insights.'}
            </p>
          </div>
        </div>

        {/* Publications Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-lg font-bold font-serif">Published Guides & Analyses</h2>
            <span className="text-xs font-mono text-muted-foreground">{posts.length} articles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="group flex flex-col rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 transition duration-300 shadow-xs"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-muted/40 border-b border-border">
                  <img
                    src={post.featuredImageUrl || '/media/default.webp'}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition font-serif line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition duration-200 inline-flex items-center">
                    Read Deep Dive →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
