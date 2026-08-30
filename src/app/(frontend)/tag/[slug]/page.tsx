import React from 'react';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TagArchivePage({ params }: PageProps) {
  const { slug } = await params;

  const tag = await db.query.tags.findFirst({
    where: eq(schema.tags.slug, slug),
  });

  const posts = await db.query.posts.findMany({
    where: eq(schema.posts.status, 'published'),
    orderBy: [desc(schema.posts.publishedAt)],
    limit: 30,
  });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-foreground font-serif">
            FABELO<span className="text-primary">.</span>
          </Link>
          <Link href="/panic" className="text-xs text-primary font-mono hover:underline">Panic CMS</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-primary">Editorial Topic</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground font-serif capitalize">
            {tag?.name || slug.replace(/-/g, ' ')}
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">Curated guides and analysis.</p>
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
      </main>
    </div>
  );
}
