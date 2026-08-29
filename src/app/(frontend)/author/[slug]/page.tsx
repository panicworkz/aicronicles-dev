import React from 'react';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AuthorArchivePage({ params }: PageProps) {
  const { slug } = await params;

  const author = await db.query.authors.findFirst({
    where: eq(schema.authors.slug, slug),
  });

  const posts = await db.query.posts.findMany({
    where: eq(schema.posts.status, 'published'),
    orderBy: [desc(schema.posts.publishedAt)],
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-500 selection:text-black">
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-white font-serif">
            FABELO<span className="text-amber-500">.</span>
          </Link>
          <Link href="/panic" className="text-xs text-amber-500 font-mono hover:underline">Panic CMS</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-500">Editorial Staff</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-serif">
            {author?.name || 'Fabelo Editorial'}
          </h1>
          <p className="text-neutral-400 text-sm max-w-2xl">{author?.bio || 'Editorial desk covering career, finance and AI.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/${post.slug}`}
              className="group flex flex-col rounded-xl overflow-hidden border border-neutral-800/80 bg-neutral-900/30 hover:border-amber-500/50 hover:bg-neutral-900/60 transition duration-300"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-800 border-b border-neutral-800">
                <img
                  src={post.featuredImageUrl || '/media/default.webp'}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition font-serif line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-neutral-400 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-500 group-hover:translate-x-1 transition duration-200 inline-flex items-center">
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
