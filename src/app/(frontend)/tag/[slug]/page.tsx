import React from 'react';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { MagazineHeader } from '@/components/magazine/MagazineHeader';
import { MagazineFooter } from '@/components/magazine/MagazineFooter';
import { Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.slug, slug),
  });

  return {
    title: category ? `${category.name} - Editorial Category | Fabelo` : `${slug.replace(/-/g, ' ')} | Fabelo`,
    description: category?.description || `Curated guides, tools, and strategic insights for ${slug.replace(/-/g, ' ')}.`,
  };
}

export default async function TagArchivePage({ params }: PageProps) {
  const { slug } = await params;

  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.slug, slug),
  });

  let posts = [];
  if (category) {
    posts = await db.query.posts.findMany({
      where: eq(schema.posts.categoryId, category.id),
      orderBy: [desc(schema.posts.publishedAt)],
      limit: 30,
    });
  }

  // Fallback if no specific category id matched
  if (posts.length === 0) {
    posts = await db.query.posts.findMany({
      where: eq(schema.posts.status, 'published'),
      orderBy: [desc(schema.posts.publishedAt)],
      limit: 30,
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white transition-colors duration-200">
      <MagazineHeader />

      {/* Main Content Layout Container: Exactly 1536px */}
      <main className="max-w-[1536px] mx-auto px-6 lg:px-12 py-12 space-y-16">
        {/* Category Hero Banner */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8 sm:p-14 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary text-xs font-mono font-bold uppercase tracking-wider">
            <Layers className="size-4" />
            <span>Curated Editorial Category</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black font-serif tracking-tight text-foreground capitalize">
            {category?.name || slug.replace(/-/g, ' ')}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-3xl leading-relaxed">
            {category?.description || 'In-depth strategic guides, actionable playbooks, and verified analyses curated by the Fabelo editorial desk.'}
          </p>
          <div className="pt-3 text-xs font-mono text-muted-foreground font-bold">
            {posts.length} Publications in this section
          </div>
        </div>

        {/* Magazine Grid Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/${post.slug}`}
              className="group flex flex-col rounded-3xl overflow-hidden border border-border bg-card hover:border-primary/50 transition duration-300 shadow-sm"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/60">
                <img
                  src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                  loading="lazy"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-mono text-primary font-bold">
                    <span>{category?.name || 'EDITORIAL'}</span>
                    <span>•</span>
                    <span>{post.readingTime || '7 min read'}</span>
                  </div>
                  <h3 className="text-xl font-bold font-serif text-foreground group-hover:text-primary transition line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs font-semibold text-muted-foreground">
                  <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '2026'}</span>
                  <span className="text-primary font-bold group-hover:translate-x-1 transition inline-flex items-center gap-1">
                    Read Guide →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <MagazineFooter />
    </div>
  );
}
