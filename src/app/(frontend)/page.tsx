import React from 'react';
import Link from 'next/link';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { MagazineHeader } from '@/components/magazine/MagazineHeader';
import { MagazineFooter } from '@/components/magazine/MagazineFooter';
import { AdBanner } from '@/components/magazine/AdBanner';
import {
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  DollarSign,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
  BookOpen,
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

  const coverPost = posts[0];
  const secondaryPost = posts[1];
  const tertiaryPost = posts[2];
  const trendingStories = posts.slice(3, 7);
  
  const aiPosts = posts.filter((p) => {
    const cat = p.categoryId ? categoryMap[p.categoryId] : null;
    return cat?.slug === 'ai-tech' || p.slug.includes('ai') || p.slug.includes('productivity');
  }).slice(0, 4);

  const financePosts = posts.filter((p) => {
    const cat = p.categoryId ? categoryMap[p.categoryId] : null;
    return cat?.slug === 'personal-finance' || p.slug.includes('money') || p.slug.includes('invest') || p.slug.includes('budget') || p.slug.includes('interest') || p.slug.includes('savings');
  }).slice(0, 3);

  const careerPosts = posts.filter((p) => {
    const cat = p.categoryId ? categoryMap[p.categoryId] : null;
    return cat?.slug === 'career' || p.slug.includes('career') || p.slug.includes('job') || p.slug.includes('remote') || p.slug.includes('resume') || p.slug.includes('salary');
  }).slice(0, 4);

  const latestFeed = posts.slice(7, 25);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-amber-500 selection:text-black">
      <MagazineHeader />

      {/* Main Content Layout Container: Exactly 1536px */}
      <main className="max-w-[1536px] mx-auto px-6 lg:px-12 py-8 space-y-20">

        {/* TOP BILLBOARD AD (970x90 / Leaderboard) */}
        <AdBanner
          slot="billboard"
          sponsorName="Panic Studio AI Suite"
          sponsorTagline="Autonomous LLM agents, automated editorial workflows, and real-time SEO intelligence in one platform."
          sponsorUrl="/panic"
          ctaText="Explore Panic"
        />

        {/* SECTION 1: EDITORIAL COVER STORY (High-Contrast Hero Spread) */}
        {coverPost && (
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-10 lg:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Left Column (7 cols): Lead Editorial Content */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3.5 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider bg-amber-500 text-black shadow-xs flex items-center gap-1.5">
                    <Sparkles className="size-3.5 fill-black" />
                    <span>COVER ESSAY</span>
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-muted text-foreground border border-border">
                    {(coverPost.categoryId ? categoryMap[coverPost.categoryId]?.name : null) || 'AI & TECH'}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-amber-500" />
                    <span>{coverPost.readingTime || '21 min read'}</span>
                  </span>
                </div>

                <Link href={`/${coverPost.slug}`} className="block group">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif tracking-tight text-foreground leading-[1.12] group-hover:text-amber-500 transition-colors duration-200">
                    {coverPost.title}
                  </h1>
                </Link>

                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed font-sans max-w-2xl">
                  {coverPost.excerpt}
                </p>

                {/* Author Card & CTA */}
                <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="https://fabelo.io/content/images/size/w160/2026/04/ufuk_square.png"
                      alt="Ufuk Yorulmaz"
                      className="size-11 rounded-2xl object-cover border border-border shadow-xs"
                    />
                    <div>
                      <span className="text-sm font-bold text-foreground block">
                        {(coverPost.authorId ? authorMap[coverPost.authorId]?.name : null) || 'Ufuk Yorulmaz'}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">Chief Architect &amp; Lead Editor</span>
                    </div>
                  </div>

                  <Link
                    href={`/${coverPost.slug}`}
                    className="px-6 py-3 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition flex items-center gap-2 shadow-sm"
                  >
                    <span>Read Full Dossier</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column (5 cols): High-Resolution Featured Artwork */}
              <div className="lg:col-span-5">
                <Link href={`/${coverPost.slug}`} className="block relative aspect-[16/11] sm:aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-muted/40 group shadow-md">
                  <img
                    src={coverPost.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                    alt={coverPost.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </Link>
              </div>

            </div>
          </section>
        )}

        {/* SECTION 2: THE LIVE WIRE (01 - 04 Real-Time Trending Grid) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5 text-foreground font-bold font-serif text-lg">
              <Flame className="size-5 text-amber-500 fill-amber-500" />
              <span>Trending Dispatches</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest font-semibold">Real-Time Radar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingStories.map((post, idx) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-amber-500/50 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">0{idx + 1}</span>
                    <span className="text-muted-foreground uppercase font-semibold">{(post.categoryId ? categoryMap[post.categoryId]?.name : null) || 'Dispatch'}</span>
                  </div>
                  <h3 className="text-base font-bold font-serif text-foreground group-hover:text-amber-500 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>{post.readingTime || '6 min read'}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-1 transition">Read →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 3: 3-COLUMN EDITORIAL BENTO (Secondary + Tertiary + Sponsor) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-2xl font-bold font-serif text-foreground tracking-tight">
              Featured Deep Dives
            </h2>
            <Link href="/tag/ai-tech" className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline">
              ALL GUIDES →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {/* Slot 1: Secondary Feature */}
            {secondaryPost && (
              <Link
                href={`/${secondaryPost.slug}`}
                className="group rounded-3xl overflow-hidden border border-border bg-card hover:border-amber-500/50 transition-all duration-200 flex flex-col justify-between shadow-xs"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border relative">
                  <img
                    src={secondaryPost.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-5466808.jpeg'}
                    alt={secondaryPost.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-background/90 backdrop-blur text-foreground border border-border">
                      STRATEGY
                    </span>
                  </div>
                </div>
                <div className="p-7 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="text-xs font-mono text-muted-foreground">
                      <span>{(secondaryPost.categoryId ? categoryMap[secondaryPost.categoryId]?.name : null) || 'CAREER'}</span> • <span>{secondaryPost.readingTime || '7 min'}</span>
                    </div>
                    <h3 className="text-xl font-bold font-serif text-foreground group-hover:text-amber-500 transition-colors leading-snug">
                      {secondaryPost.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                      {secondaryPost.excerpt}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 pt-2">
                    <span>Read Blueprint</span>
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            )}

            {/* Slot 2: Tertiary Feature */}
            {tertiaryPost && (
              <Link
                href={`/${tertiaryPost.slug}`}
                className="group rounded-3xl overflow-hidden border border-border bg-card hover:border-amber-500/50 transition-all duration-200 flex flex-col justify-between shadow-xs"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border relative">
                  <img
                    src={tertiaryPost.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-5882683.jpeg'}
                    alt={tertiaryPost.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-background/90 backdrop-blur text-foreground border border-border">
                      FINANCE
                    </span>
                  </div>
                </div>
                <div className="p-7 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="text-xs font-mono text-muted-foreground">
                      <span>{(tertiaryPost.categoryId ? categoryMap[tertiaryPost.categoryId]?.name : null) || 'FINANCE'}</span> • <span>{tertiaryPost.readingTime || '8 min'}</span>
                    </div>
                    <h3 className="text-xl font-bold font-serif text-foreground group-hover:text-amber-500 transition-colors leading-snug">
                      {tertiaryPost.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                      {tertiaryPost.excerpt}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 pt-2">
                    <span>Read Investigation</span>
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            )}

            {/* Slot 3: In-Grid Luxury Sponsor Card (300x250) */}
            <AdBanner
              slot="rectangle"
              sponsorName="Panic Autonomous Agents"
              sponsorTagline="Autonomous LLM agents that write code, test software, and self-deploy live infrastructure."
              sponsorUrl="/panic"
              ctaText="Start Free Trial"
            />
          </div>
        </section>

        {/* MID-PAGE LEADERBOARD AD (728x90) */}
        <AdBanner
          slot="leaderboard"
          sponsorName="Fabelo Developer API & Prompt Models"
          sponsorTagline="Integrate Fabelo's verified prompt libraries, financial formulas, and AI benchmarks directly into your stack."
          sponsorUrl="/store"
          ctaText="Explore Store"
        />

        {/* SECTION 4: AI & PRODUCTIVITY SYSTEMS SHOWCASE */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Cpu className="size-4" />
                <span>Deep Focus</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-foreground">
                AI &amp; Productivity Systems
              </h2>
            </div>
            <Link
              href="/tag/ai-tech"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline group"
            >
              <span>Explore all AI Guides</span>
              <ChevronRight className="size-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiPosts.map((post, index) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className={`group rounded-3xl overflow-hidden border border-border bg-card hover:border-amber-500/50 transition-all duration-200 flex flex-col justify-between shadow-xs ${
                  index === 0 ? 'md:col-span-2' : ''
                }`}
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border relative">
                  <img
                    src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-background/90 backdrop-blur text-foreground border border-border">
                      {post.readingTime || '8 min read'}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <h3 className={`font-bold font-serif text-foreground group-hover:text-amber-500 transition leading-snug ${
                      index === 0 ? 'text-xl sm:text-2xl' : 'text-base line-clamp-2'
                    }`}>
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-mono text-muted-foreground">
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Jul 2026'}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-0.5 transition">Read →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 5: CAREER MOBILITY & STICKY SKYSCRAPER AD (8 + 4 SPLIT) */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Briefcase className="size-4" />
                <span>Executive Sovereignty</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-foreground">
                Career Acceleration &amp; High-Income Strategy
              </h2>
            </div>
            <Link
              href="/tag/career"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline group"
            >
              <span>All Career Strategy Guides</span>
              <ChevronRight className="size-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {careerPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="group p-6 rounded-3xl border border-border bg-card hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-muted/40 border border-border/60">
                    <img
                      src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-5882683.jpeg'}
                      alt={post.title}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-104"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-muted-foreground">
                      <span>{(post.categoryId ? categoryMap[post.categoryId]?.name : null) || 'BLUEPRINT'}</span> • <span>{post.readingTime || '6 min'}</span>
                    </div>
                    <h4 className="text-lg font-bold font-serif text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h4>
                    <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition inline-flex items-center gap-1">
                    <span>Read Playbook</span>
                    <ArrowRight className="size-3" />
                  </span>
                </Link>
              ))}
            </div>

            {/* Skyscraper 300x600 Display Ad */}
            <div className="lg:col-span-4">
              <AdBanner
                slot="halfpage"
                sponsorName="Panic Media Cloud Infrastructure"
                sponsorTagline="Autonomous Headless CMS engine powering 100M+ monthly readers with sub-millisecond edge delivery."
                sponsorUrl="/panic"
                ctaText="Deploy on Cloud"
              />
            </div>
          </div>
        </section>

        {/* SECTION 6: LATEST EDITORIAL COMPENDIUM (3-Column Grid + In-Feed Sponsor) */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-foreground">
              All Publications
            </h2>
            <span className="text-xs font-mono text-muted-foreground font-bold">{posts.length} GUIDES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AdBanner
              slot="native-infeed"
              sponsorName="Panic Copilot Pro Edition"
              sponsorTagline="Instant AI code writing, automated article rewriting, and real-time schema validator built for digital publishers."
              sponsorUrl="/panic"
              ctaText="Start Free Trial"
            />

            {latestFeed.map((post) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="group flex flex-col rounded-3xl overflow-hidden border border-border bg-card hover:border-amber-500/50 transition-all duration-200 shadow-xs"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border">
                  <img
                    src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                    loading="lazy"
                  />
                </div>
                <div className="p-7 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="text-xs font-mono text-muted-foreground">
                      <span>{(post.categoryId ? categoryMap[post.categoryId]?.name : null) || 'EDITORIAL'}</span> • <span>{post.readingTime || '8 min'}</span>
                    </div>
                    <h3 className="text-lg font-bold font-serif text-foreground group-hover:text-amber-500 transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-medium text-muted-foreground">
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '2026'}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-1 transition inline-flex items-center gap-1">
                      Read Guide →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>

      {/* STICKY BOTTOM AD BAR */}
      <AdBanner slot="sticky-bottom" />

      <MagazineFooter />
    </div>
  );
}
