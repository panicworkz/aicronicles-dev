import React from 'react';
import Link from 'next/link';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { MagazineHeader } from '@/components/magazine/MagazineHeader';
import { MagazineFooter } from '@/components/magazine/MagazineFooter';
import { AdBanner } from '@/components/magazine/AdBanner';
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
  ShieldCheck,
  Award,
  Users,
  Compass,
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
  const heroSecondary = posts[1];
  const trendingStories = posts.slice(2, 6);
  
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
  }).slice(0, 4);

  // Remaining latest feed
  const latestFeed = posts.slice(6, 24);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white transition-colors duration-200">
      <MagazineHeader />

      {/* Main Content Layout Container: Exactly 1536px */}
      <main className="max-w-[1536px] mx-auto px-6 lg:px-12 py-8 space-y-20">

        {/* =========================================================================
            REKLAM ALANI 1: TOP BILLBOARD HEADER AD (970x90 / Leaderboard)
           ========================================================================= */}
        <AdBanner
          slot="billboard"
          sponsorName="Panic Studio AI Suite"
          sponsorTagline="Autonomous LLM agents, automated editorial workflows, and real-time SEO intelligence in one platform."
          sponsorUrl="/panic"
          ctaText="Explore Panic"
        />
        
        {/* =========================================================================
            SECTION 1: HERO EDITORIAL SPOTLIGHT MATRIX (Bento Grid)
           ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Main Lead Story Card (8 cols) */}
          {leadStory && (
            <div className="lg:col-span-8 group relative flex flex-col justify-end rounded-3xl overflow-hidden border border-border shadow-xl min-h-[480px] lg:min-h-[580px] bg-neutral-900">
              {/* Background Image with Cinematic Overlay */}
              <img
                src={leadStory.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                alt={leadStory.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-103 opacity-75 dark:opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

              {/* Top Badges */}
              <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
                <span className="px-4 py-1.5 rounded-full text-xs font-extrabold font-mono uppercase tracking-wider bg-primary text-primary-foreground shadow-lg flex items-center gap-1.5">
                  <Sparkles className="size-3.5" />
                  <span>Cover Story</span>
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold font-mono bg-black/60 backdrop-blur-md text-white border border-white/20">
                  {(leadStory.categoryId ? categoryMap[leadStory.categoryId]?.name : null) || 'AI & Tech'}
                </span>
              </div>

              {/* Content Overlay */}
              <div className="relative p-6 sm:p-10 lg:p-12 space-y-4 z-10">
                <div className="flex items-center gap-3 text-xs text-neutral-300 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5 text-amber-400" />
                    <span>{leadStory.readingTime || '21 min read'}</span>
                  </span>
                  <span>•</span>
                  <span>{leadStory.publishedAt ? new Date(leadStory.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 2, 2026'}</span>
                </div>

                <Link href={`/${leadStory.slug}`} className="block">
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-serif tracking-tight text-white group-hover:text-amber-400 transition leading-tight">
                    {leadStory.title}
                  </h1>
                </Link>

                <p className="text-neutral-300 text-sm sm:text-base line-clamp-2 max-w-3xl leading-relaxed">
                  {leadStory.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/15">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://fabelo.io/content/images/size/w160/2026/04/ufuk_square.png"
                      alt="Ufuk Yorulmaz"
                      className="size-8 rounded-full object-cover border-2 border-white/40"
                    />
                    <span className="text-sm font-semibold text-white">
                      By {(leadStory.authorId ? authorMap[leadStory.authorId]?.name : null) || 'Ufuk Yorulmaz'}
                    </span>
                  </div>

                  <Link
                    href={`/${leadStory.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-white transition"
                  >
                    <span>Read Deep Dive</span>
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Right Rail: 1 Secondary Spotlight + 1 Sponsor Box (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6">
            {/* Secondary Hero Story */}
            {heroSecondary && (
              <Link
                href={`/${heroSecondary.slug}`}
                className="group flex-1 rounded-3xl overflow-hidden border border-border bg-card hover:border-primary/50 transition duration-300 shadow-sm flex flex-col justify-between"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-muted/40 relative">
                  <img
                    src={heroSecondary.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-5466808.jpeg'}
                    alt={heroSecondary.title}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-104"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-background/90 backdrop-blur text-foreground border border-border">
                      Spotlight
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-mono text-primary font-bold">
                    <span>{(heroSecondary.categoryId ? categoryMap[heroSecondary.categoryId]?.name : null) || 'CAREER'}</span>
                    <span>•</span>
                    <span>{heroSecondary.readingTime || '7 min read'}</span>
                  </div>
                  <h3 className="text-lg font-bold font-serif text-foreground group-hover:text-primary transition line-clamp-2 leading-snug">
                    {heroSecondary.title}
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
                    {heroSecondary.excerpt}
                  </p>
                </div>
              </Link>
            )}

            {/* REKLAM ALANI 2: IN-HERO SPONSOR CARD (300x250 Medium Rectangle) */}
            <AdBanner
              slot="rectangle"
              sponsorName="Panic Autonomous Agents"
              sponsorTagline="Supercharge your engineering with self-executing multi-agent AI pipelines."
              sponsorUrl="/panic"
              ctaText="Try Free"
            />
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: TRENDING DISPATCHES TICKER STRIP (01 - 04)
           ========================================================================= */}
        <section className="border-y border-border/80 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider font-mono">
              <Flame className="size-5 text-amber-500 fill-amber-500" />
              <span>Trending Worldwide</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground font-semibold">Real-Time Reader Analytics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingStories.map((post, idx) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="group p-5 rounded-2xl border border-border/60 bg-card/40 hover:bg-card hover:border-primary/40 transition duration-300 flex items-start gap-4 shadow-2xs"
              >
                <span className="text-3xl font-black font-serif text-muted-foreground/30 group-hover:text-primary transition w-8 shrink-0">
                  0{idx + 1}
                </span>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                    {(post.categoryId ? categoryMap[post.categoryId]?.name : null) || 'Editorial'}
                  </span>
                  <h4 className="text-sm font-bold font-serif text-foreground group-hover:text-primary transition line-clamp-2 leading-snug">
                    {post.title}
                  </h4>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    <span>{post.readingTime || '5 min read'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: AI & PRODUCTIVITY SYSTEMS SHOWCASE (Bento Hub)
           ========================================================================= */}
        <section className="space-y-8">
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
            REKLAM ALANI 3: MID-PAGE LEADERBOARD SPONSOR BANNER (728x90)
           ========================================================================= */}
        <AdBanner
          slot="leaderboard"
          sponsorName="Fabelo Developer API & Store"
          sponsorTagline="Access real-time AI knowledge models, downloadable prompt kits, and VIP finance calculators."
          sponsorUrl="/store"
          ctaText="Browse Store"
        />

        {/* =========================================================================
            SECTION 4: PERSONAL FINANCE & WEALTH CREATION
           ========================================================================= */}
        <section className="space-y-8">
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
            SECTION 5: CAREER ACCELERATION & SKYSCRAPER AD (Split View 8 + 4)
           ========================================================================= */}
        <section className="space-y-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Career Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
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
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
                        <span>CAREER PLAYBOOK</span>
                        <span>•</span>
                        <span>{post.readingTime || '6 min read'}</span>
                      </div>
                      <h3 className="text-lg font-bold font-serif text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 leading-relaxed">
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

            {/* REKLAM ALANI 4: RIGHT 4 COLS STICKY SKYSCRAPER AD (300x600 Half-Page) */}
            <div className="lg:col-span-4">
              <AdBanner
                slot="halfpage"
                sponsorName="Panic Media Cloud"
                sponsorTagline="Autonomous Headless CMS engine powering 100M+ monthly readers with sub-millisecond edge delivery."
                sponsorUrl="/panic"
                ctaText="Deploy on Cloud"
              />
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: LATEST EDITORIAL STREAM WITH NATIVE IN-FEED SPONSOR (3-Cols)
           ========================================================================= */}
        <section className="space-y-8">
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
            {/* Native In-Feed Sponsor Ad inserted right at position 1 */}
            <AdBanner
              slot="native-infeed"
              sponsorName="Panic Copilot Pro"
              sponsorTagline="Instant AI code writing, automated article rewriting, and real-time schema validator built for editorial creators."
              sponsorUrl="/panic"
              ctaText="Start Free Trial"
            />

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

      {/* REKLAM ALANI 5: STICKY BOTTOM FLOAT AD BAR */}
      <AdBanner slot="sticky-bottom" />

      <MagazineFooter />
    </div>
  );
}
