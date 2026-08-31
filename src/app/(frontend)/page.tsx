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
  const latestFeed = posts.slice(5, 26);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white transition-colors duration-200">
      <MagazineHeader />

      {/* Main Content Layout Container: Exactly 1536px */}
      <main className="max-w-[1536px] mx-auto px-6 lg:px-12 py-10 space-y-20">
        
        {/* =========================================================================
            SECTION 1: HERO LEAD STORY & TRENDING SIDE RAIL (1536px)
           ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Lead Story Card (8 cols) */}
          {leadStory && (
            <div className="lg:col-span-8 group">
              <Link href={`/${leadStory.slug}`} className="block space-y-5">
                <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-muted/40 border border-border shadow-lg">
                  <img
                    src={leadStory.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                    alt={leadStory.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                  />
                  <div className="absolute top-5 left-5">
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold font-mono uppercase tracking-wider bg-primary text-primary-foreground shadow-xl">
                      Lead Story
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span className="text-primary font-bold uppercase tracking-wider">
                      {(leadStory.categoryId ? categoryMap[leadStory.categoryId]?.name : null) || 'AI & Tech'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      <span>{leadStory.readingTime || '21 min read'}</span>
                    </span>
                    <span>•</span>
                    <span>{leadStory.publishedAt ? new Date(leadStory.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 2, 2026'}</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif tracking-tight text-foreground group-hover:text-primary transition leading-tight">
                    {leadStory.title}
                  </h1>

                  <p className="text-muted-foreground text-base sm:text-lg line-clamp-3 leading-relaxed">
                    {leadStory.excerpt}
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src="https://fabelo.io/content/images/size/w160/2026/04/ufuk_square.png"
                      alt="Ufuk Yorulmaz"
                      className="size-8 rounded-full object-cover border border-border shadow-xs"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      By {(leadStory.authorId ? authorMap[leadStory.authorId]?.name : null) || 'Ufuk Yorulmaz'}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Trending Stories Rail (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider font-mono">
                <Flame className="size-4.5 text-amber-500 fill-amber-500" />
                <span>Trending Dispatches</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground font-semibold">Most Read</span>
            </div>

            <div className="divide-y divide-border/60">
              {trendingStories.map((post, idx) => (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="group py-5 flex items-start gap-5 block first:pt-1"
                >
                  <span className="text-3xl font-black font-serif text-muted-foreground/40 group-hover:text-primary transition w-8 shrink-0">
                    0{idx + 1}
                  </span>
                  <div className="space-y-2 flex-1 min-w-0">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
                      {(post.categoryId ? categoryMap[post.categoryId]?.name : null) || 'Editorial'}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold font-serif text-foreground group-hover:text-primary transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <span>{post.readingTime || '6 min read'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: AI & PRODUCTIVITY SYSTEMS SHOWCASE (1536px)
           ========================================================================= */}
        <section className="border-t border-border/80 pt-16 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider">
                <Zap className="size-4" />
                <span>Deep Focus</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight text-foreground">
                AI &amp; Productivity Systems
              </h2>
            </div>
            <Link
              href="/tag/ai-tech"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline group"
            >
              <span>Explore all AI Guides</span>
              <ChevronRight className="size-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aiPosts.map((post, index) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className={`group rounded-3xl overflow-hidden border border-border bg-card hover:border-primary/50 transition duration-300 shadow-sm flex flex-col justify-between ${
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
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-background/90 backdrop-blur-md text-foreground border border-border/60 shadow-xs">
                      {post.readingTime || '8 min read'}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <h3 className={`font-bold font-serif text-foreground group-hover:text-primary transition leading-snug ${
                      index === 0 ? 'text-xl sm:text-2xl' : 'text-lg line-clamp-2'
                    }`}>
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs font-mono text-muted-foreground">
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Jul 2026'}</span>
                    <span className="text-primary font-bold group-hover:translate-x-0.5 transition">Read →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: PERSONAL FINANCE & WEALTH CREATION (1536px)
           ========================================================================= */}
        <section className="border-t border-border/80 pt-16 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                <DollarSign className="size-4" />
                <span>Wealth &amp; Strategy</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight text-foreground">
                Personal Finance &amp; Compounding
              </h2>
            </div>
            <Link
              href="/tag/personal-finance"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline group"
            >
              <span>View all Finance Playbooks</span>
              <ChevronRight className="size-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {financePosts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="group flex flex-col rounded-3xl overflow-hidden border border-border bg-card hover:border-emerald-500/40 transition duration-300 shadow-sm"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/60">
                  <img
                    src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-5466808.jpeg'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                    loading="lazy"
                  />
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>FINANCE GUIDE</span>
                      <span>•</span>
                      <span>{post.readingTime || '7 min read'}</span>
                    </div>
                    <h3 className="text-xl font-bold font-serif text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition inline-flex items-center gap-1.5">
                    <span>Read Analysis</span>
                    <ArrowRight className="size-3.5 group-hover:translate-x-1 transition" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: CAREER ACCELERATION & HIGH-LEVERAGE WORK (1536px)
           ========================================================================= */}
        <section className="border-t border-border/80 pt-16 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Briefcase className="size-4" />
                <span>High-Leverage Work</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight text-foreground">
                Career Acceleration &amp; Income
              </h2>
            </div>
            <Link
              href="/tag/career"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline group"
            >
              <span>All Career Strategy Guides</span>
              <ChevronRight className="size-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {careerPosts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="group flex flex-col rounded-3xl overflow-hidden border border-border bg-card hover:border-blue-500/40 transition duration-300 shadow-sm"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/60">
                  <img
                    src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-5882683.jpeg'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                    loading="lazy"
                  />
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
                      <span>CAREER PLAYBOOK</span>
                      <span>•</span>
                      <span>{post.readingTime || '6 min read'}</span>
                    </div>
                    <h3 className="text-xl font-bold font-serif text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition inline-flex items-center gap-1.5">
                    <span>Read Playbook</span>
                    <ArrowRight className="size-3.5 group-hover:translate-x-1 transition" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: LATEST PUBLICATIONS STREAM (1536px)
           ========================================================================= */}
        <section className="border-t border-border/80 pt-16 space-y-10">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div className="space-y-1.5">
              <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight text-foreground">
                Latest Publications
              </h2>
              <p className="text-muted-foreground text-sm">Explore all deep dives across AI, finance, and modern engineering.</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground font-bold">
              {posts.length} Guides
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestFeed.map((post) => (
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
                      <span>{(post.categoryId ? categoryMap[post.categoryId]?.name : null) || 'EDITORIAL'}</span>
                      <span>•</span>
                      <span>{post.readingTime || '8 min read'}</span>
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
        </section>

      </main>

      <MagazineFooter />
    </div>
  );
}
