import React from 'react';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { MagazineHeader } from '@/components/magazine/MagazineHeader';
import { MagazineFooter } from '@/components/magazine/MagazineFooter';
import { Clock, ArrowRight, UserCheck, Sparkles, BookOpen } from 'lucide-react';

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
    title: author ? `${author.name} - Author Desk | Fabelo` : `${slug} | Fabelo`,
    description: author?.bio || `Strategic articles, deep dives, and research published by ${author?.name || slug} on Fabelo.`,
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white transition-colors duration-200">
      <MagazineHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Author Bio Header Card */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center gap-8 shadow-xs">
          <div className="size-24 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-3xl font-black text-primary uppercase overflow-hidden shrink-0 shadow-md">
            {author?.avatarUrl ? (
              <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              author?.name?.slice(0, 2) || 'ED'
            )}
          </div>
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary">
              <UserCheck className="size-3" />
              <span>{author?.role || 'Senior Editorial Contributor'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-serif tracking-tight text-foreground">
              {author?.name || slug.replace(/-/g, ' ')}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-3xl leading-relaxed">
              {author?.bio || 'Writes extensively on AI agent workflows, software architecture, personal finance systems, and high-leverage career engineering.'}
            </p>
            <div className="pt-2 text-xs font-mono text-muted-foreground font-semibold">
              {posts.length} Authored Publications
            </div>
          </div>
        </div>

        {/* Publications Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-xl sm:text-2xl font-bold font-serif">Published Guides &amp; Analyses</h2>
            <span className="text-xs font-mono text-muted-foreground">{posts.length} articles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/50 transition duration-300 shadow-xs"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/60">
                  <img
                    src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-primary font-semibold">
                      <span>GUIDE</span>
                      <span>•</span>
                      <span>{post.readingTime || '7 min read'}</span>
                    </div>
                    <h3 className="text-lg font-bold font-serif text-foreground group-hover:text-primary transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs font-medium text-muted-foreground">
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '2026'}</span>
                    <span className="text-primary font-semibold group-hover:translate-x-1 transition inline-flex items-center gap-1">
                      Read Guide →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <MagazineFooter />
    </div>
  );
}
