import React from 'react';
import Link from 'next/link';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { MagazineHeader } from '@/components/magazine/MagazineHeader';
import { MagazineFooter } from '@/components/magazine/MagazineFooter';
import {
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  DollarSign,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const posts = await db.query.posts.findMany({
    where: eq(schema.posts.status, 'published'),
    orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)],
    limit: 47,
  });

  const authors = await db.query.authors.findMany();
  const categories = await db.query.categories.findMany();

  const authorMap: Record<number, any> = {};
  authors.forEach((a: any) => { if (a?.id) authorMap[a.id] = a; });

  const categoryMap: Record<number, any> = {};
  categories.forEach((c: any) => { if (c?.id) categoryMap[c.id] = c; });

  // Categorize posts
  const leadStory = posts[0];
  const trendingStories = posts.slice(1, 5);
  
  // AI & Tech posts
  const aiPosts = posts.filter((p) => {
    const cat = p.categoryId ? categoryMap[p.categoryId] : null;
    return cat?.slug === 'ai-tech' || p.slug.includes('ai') || p.slug.includes('productivity');
  }).slice(0, 4);

  // Finance posts
  const financePosts = posts.filter((p) => {
    const cat = p.categoryId ? categoryMap[p.categoryId] : null;
    return cat?.slug === 'personal-finance' || p.slug.includes('money') || p.slug.includes('invest') || p.slug.includes('budget') || p.slug.includes('interest') || p.slug.includes('savings');
  }).slice(0, 3);

  // Career posts
  const careerPosts = posts.filter((p) => {
    const cat = p.categoryId ? categoryMap[p.categoryId] : null;
    return cat?.slug === 'career' || p.slug.includes('career') || p.slug.includes('job') || p.slug.includes('remote') || p.slug.includes('resume') || p.slug.includes('salary');
  }).slice(0, 3);

  // Remaining latest feed
  const latestFeed = posts.slice(5, 23);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white transition-colors duration-200">
      <MagazineHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
        
        {/* SECTION 1: HERO LEAD STORY & TRENDING SIDE RAIL */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Lead Story Card (8 cols) */}
          {leadStory && (
            <div className="lg:col-span-8 group">
              <Link href={`/${leadStory.slug}`} className="block space-y-4">
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-muted/40 border border-border shadow-md">
                  <img
                    src={leadStory.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                    alt={leadStory.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider bg-primary text-primary-foreground shadow-lg">
                      Lead Story
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span className="text-primary font-semibold uppercase tracking-wider">
                      {(leadStory.categoryId ? categoryMap[leadStory.categoryId]?.name : null) || 'AI & Tech'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{leadStory.readingTime || '21 min read'}</span>
                    </span>
                    <span>•</span>
                    <span>{leadStory.publishedAt ? new Date(leadStory.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 2, 2026'}</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black font-serif tracking-tight text-foreground group-hover:text-primary transition leading-tight">
                    {leadStory.title}
                  </h1>

                  <p className="text-muted-foreground text-sm sm:text-base line-clamp-3 leading-relaxed">
                    {leadStory.excerpt}
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src="https://fabelo.io/content/images/size/w160/2026/04/ufuk_square.png"
                      alt="Ufuk Yorulmaz"
                      className="size-7 rounded-full object-cover border border-border"
                    />
                    <span className="text-xs font-medium text-foreground">
                      By {(leadStory.authorId ? authorMap[leadStory.authorId]?.name : null) || 'Ufuk Yorulmaz'}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Trending Stories Rail (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider font-mono">
                <Flame className="size-4 text-amber-500 fill-amber-500" />
                <span>Trending Dispatches</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">Most Read</span>
            </div>

            <div className="divide-y divide-border/60">
              {trendingStories.map((post, idx) => (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="group py-4 flex items-start gap-4 block first:pt-1"
                >
                  <span className="text-2xl font-black font-serif text-muted-foreground/40 group-hover:text-primary transition w-6 shrink-0">
                    0{idx + 1}
                  </span>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
                      {(post.categoryId ? categoryMap[post.categoryId]?.name : null) || 'Editorial'}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold font-serif text-foreground group-hover:text-primary transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                      <span>{post.readingTime || '6 min read'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2: AI & PRODUCTIVITY SYSTEMS */}
        <section className="border-t border-border/80 pt-12 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider">
                <Zap className="size-3.5" />
                <span>Deep Focus</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-foreground">
                AI &amp; Productivity Systems
              </h2>
            </div>
            <Link
              href="/tag/ai-tech"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group"
            >
              <span>Explore all AI Guides</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiPosts.map((post, index) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className={`group rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/50 transition duration-300 shadow-xs flex flex-col justify-between ${
                  index === 0 ? 'md:col-span-2' : ''
                }`}
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/60 relative">
                  <img
                    src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-background/90 backdrop-blur-md text-foreground border border-border/60">
                      {post.readingTime || '8 min read'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <h3 className={`font-bold font-serif text-foreground group-hover:text-primary transition leading-snug ${
                      index === 0 ? 'text-lg sm:text-xl' : 'text-base line-clamp-2'
                    }`}>
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Jul 2026'}</span>
                    <span className="text-primary font-semibold group-hover:translate-x-0.5 transition">Read →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 3: PERSONAL FINANCE & WEALTH */}
        <section className="border-t border-border/80 pt-12 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                <DollarSign className="size-3.5" />
                <span>Wealth &amp; Strategy</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-foreground">
                Personal Finance &amp; Compounding
              </h2>
            </div>
            <Link
              href="/tag/personal-finance"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group"
            >
              <span>View all Finance Playbooks</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {financePosts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-card hover:border-emerald-500/40 transition duration-300 shadow-xs"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/60">
                  <img
                    src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-5466808.jpeg'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>FINANCE GUIDE</span>
                      <span>•</span>
                      <span>{post.readingTime || '7 min read'}</span>
                    </div>
                    <h3 className="text-lg font-bold font-serif text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition inline-flex items-center gap-1">
                    <span>Read Analysis</span>
                    <ArrowRight className="size-3 group-hover:translate-x-1 transition" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 4: CAREER ACCELERATION */}
        <section className="border-t border-border/80 pt-12 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Briefcase className="size-3.5" />
                <span>High-Leverage Work</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-foreground">
                Career Acceleration &amp; Income
              </h2>
            </div>
            <Link
              href="/tag/career"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group"
            >
              <span>All Career Strategy Guides</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {careerPosts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-card hover:border-blue-500/40 transition duration-300 shadow-xs"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/60">
                  <img
                    src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-5882683.jpeg'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      <span>CAREER PLAYBOOK</span>
                      <span>•</span>
                      <span>{post.readingTime || '6 min read'}</span>
                    </div>
                    <h3 className="text-lg font-bold font-serif text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition inline-flex items-center gap-1">
                    <span>Read Playbook</span>
                    <ArrowRight className="size-3 group-hover:translate-x-1 transition" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 5: LATEST PUBLICATIONS STREAM */}
        <section className="border-t border-border/80 pt-12 space-y-8">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-foreground">
                Latest Publications
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm">Explore all deep dives across AI, finance, and modern engineering.</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground font-semibold">
              {posts.length} Guides
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestFeed.map((post) => (
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
                      <span>{(post.categoryId ? categoryMap[post.categoryId]?.name : null) || 'EDITORIAL'}</span>
                      <span>•</span>
                      <span>{post.readingTime || '8 min read'}</span>
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
        </section>

      </main>

      <MagazineFooter />
    </div>
  );
}
