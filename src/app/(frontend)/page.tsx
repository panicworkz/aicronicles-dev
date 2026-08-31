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
  Layers,
  ArrowUpRight,
  TrendingUp,
  Radio,
  Bookmark,
  CheckCircle2,
  Cpu,
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
  const wirePosts = posts.slice(3, 7);
  const deepSpreadPost = posts[7] || posts[0];
  const bentoPosts = posts.slice(8, 14);
  const remainingPosts = posts.slice(14, 35);

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#f4f4f5] selection:bg-amber-400 selection:text-black antialiased">
      <MagazineHeader />

      {/* =========================================================================
          AVANT-GARDE EDITORIAL COVER SPREAD (1536px)
         ========================================================================= */}
      <main className="max-w-[1536px] mx-auto px-6 lg:px-12 py-8 space-y-28">

        {/* 1. TOP SPONSOR STRIP */}
        <AdBanner
          slot="billboard"
          sponsorName="Panic Studio AI Suite"
          sponsorTagline="The autonomous multi-agent CMS powering next-gen media publications, live SEO, and headless edge delivery."
          sponsorUrl="/panic"
          ctaText="Explore Platform"
        />

        {/* 2. GRAND EDITORIAL COVER SPREAD */}
        {coverPost && (
          <section className="relative rounded-[2.5rem] bg-gradient-to-b from-[#18181b]/80 via-[#121215] to-[#09090b] border border-white/10 p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column (7 cols): Typography & Lead Thesis */}
              <div className="lg:col-span-7 space-y-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-4 py-1.5 rounded-full text-xs font-mono font-extrabold uppercase tracking-widest bg-amber-500 text-black shadow-lg flex items-center gap-2">
                    <Sparkles className="size-3.5 fill-black" />
                    <span>COVER ESSAY</span>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-white/10 text-white border border-white/15">
                    {(coverPost.categoryId ? categoryMap[coverPost.categoryId]?.name : null) || 'AI & SYSTEMS'}
                  </span>
                  <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
                    <Clock className="size-3.5 text-amber-400" />
                    <span>{coverPost.readingTime || '21 min read'}</span>
                  </span>
                </div>

                <Link href={`/${coverPost.slug}`} className="block group">
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-serif tracking-tight text-white leading-[1.08] group-hover:text-amber-400 transition-colors duration-300">
                    {coverPost.title}
                  </h1>
                </Link>

                <p className="text-neutral-300 text-base sm:text-lg lg:text-xl font-light leading-relaxed max-w-2xl">
                  {coverPost.excerpt}
                </p>

                {/* Author Card & CTA */}
                <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://fabelo.io/content/images/size/w160/2026/04/ufuk_square.png"
                      alt="Ufuk Yorulmaz"
                      className="size-12 rounded-2xl object-cover border-2 border-amber-500/80 shadow-md"
                    />
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {(coverPost.authorId ? authorMap[coverPost.authorId]?.name : null) || 'Ufuk Yorulmaz'}
                      </span>
                      <span className="text-xs font-mono text-neutral-400">Chief Architect &amp; Editorial Director</span>
                    </div>
                  </div>

                  <Link
                    href={`/${coverPost.slug}`}
                    className="px-6 py-3 rounded-2xl bg-amber-500 text-black font-extrabold text-sm hover:bg-amber-400 transition flex items-center gap-2 shadow-xl group-hover:scale-102"
                  >
                    <span>Read Full Dossier</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column (5 cols): Cinematic Framed Artwork */}
              <div className="lg:col-span-5 relative">
                <Link href={`/${coverPost.slug}`} className="block relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/15 shadow-2xl group">
                  <img
                    src={coverPost.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                    alt={coverPost.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-neutral-300 flex items-center justify-between">
                    <span>ARCHIVE REF: 2026-AI-01</span>
                    <span className="text-amber-400 font-bold">FABELO SPECIAL EDITION</span>
                  </div>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 3. THE LIVE WIRE: 4-COLUMN HORIZONTAL DISPATCH MATRIX */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-xl font-bold font-serif uppercase tracking-wider text-white">
                The Live Wire // Breaking Analyses
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">UPDATED REAL-TIME</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {wirePosts.map((post, idx) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="group p-6 rounded-3xl bg-[#141417] border border-white/10 hover:border-amber-500/50 hover:bg-[#1a1a1f] transition-all duration-300 flex flex-col justify-between space-y-6 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-400 font-extrabold">0{idx + 1}</span>
                    <span className="text-neutral-500 uppercase">{(post.categoryId ? categoryMap[post.categoryId]?.name : null) || 'Dispatch'}</span>
                  </div>
                  <h3 className="text-base font-bold font-serif text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed font-sans">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>{post.readingTime || '6 min'}</span>
                  <span className="text-amber-400 group-hover:translate-x-1 transition">Read →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. ASYMMETRICAL 3-COLUMN EDITORIAL BENTO MATRIX */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight">
              Featured Editorial Investigations
            </h2>
            <Link href="/tag/ai-tech" className="text-xs font-mono font-bold text-amber-400 hover:underline">
              VIEW ARCHIVE →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {/* Slot 1: Secondary Hero Spotlight (Tall Card) */}
            {secondaryPost && (
              <Link
                href={`/${secondaryPost.slug}`}
                className="group rounded-3xl overflow-hidden bg-[#141417] border border-white/10 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between shadow-md"
              >
                <div className="aspect-[16/10] w-full overflow-hidden relative">
                  <img
                    src={secondaryPost.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-5466808.jpeg'}
                    alt={secondaryPost.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-amber-400 border border-white/15">
                      FEATURED ESSAY
                    </span>
                  </div>
                </div>
                <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="text-xs font-mono text-neutral-400">
                      <span>{(secondaryPost.categoryId ? categoryMap[secondaryPost.categoryId]?.name : null) || 'STRATEGY'}</span> • <span>{secondaryPost.readingTime || '7 min'}</span>
                    </div>
                    <h3 className="text-2xl font-bold font-serif text-white group-hover:text-amber-400 transition-colors leading-tight">
                      {secondaryPost.title}
                    </h3>
                    <p className="text-neutral-400 text-sm line-clamp-3 leading-relaxed">
                      {secondaryPost.excerpt}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-400 inline-flex items-center gap-1.5 pt-2">
                    <span>Examine Blueprint</span>
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            )}

            {/* Slot 2: Tertiary Hero Spotlight */}
            {tertiaryPost && (
              <Link
                href={`/${tertiaryPost.slug}`}
                className="group rounded-3xl overflow-hidden bg-[#141417] border border-white/10 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between shadow-md"
              >
                <div className="aspect-[16/10] w-full overflow-hidden relative">
                  <img
                    src={tertiaryPost.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-5882683.jpeg'}
                    alt={tertiaryPost.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-amber-400 border border-white/15">
                      WEALTH PLAYBOOK
                    </span>
                  </div>
                </div>
                <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="text-xs font-mono text-neutral-400">
                      <span>{(tertiaryPost.categoryId ? categoryMap[tertiaryPost.categoryId]?.name : null) || 'FINANCE'}</span> • <span>{tertiaryPost.readingTime || '8 min'}</span>
                    </div>
                    <h3 className="text-2xl font-bold font-serif text-white group-hover:text-amber-400 transition-colors leading-tight">
                      {tertiaryPost.title}
                    </h3>
                    <p className="text-neutral-400 text-sm line-clamp-3 leading-relaxed">
                      {tertiaryPost.excerpt}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-400 inline-flex items-center gap-1.5 pt-2">
                    <span>Read Investigation</span>
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            )}

            {/* Slot 3: In-Grid Luxury Sponsor Capsule (300x250 Medium Rectangle) */}
            <AdBanner
              slot="rectangle"
              sponsorName="Panic Autonomous Agents"
              sponsorTagline="Autonomous LLM agents that design architecture, write tests, and self-deploy live infrastructure."
              sponsorUrl="/panic"
              ctaText="Start Free Trial"
            />
          </div>
        </section>

        {/* 5. MID-PAGE HIGH-IMPACT SPONSOR LEADERBOARD */}
        <AdBanner
          slot="leaderboard"
          sponsorName="Fabelo Pro Executive Suite"
          sponsorTagline="The definitive daily intelligence platform for founders, AI engineers, and financial strategists."
          sponsorUrl="/store"
          ctaText="Explore Suite"
        />

        {/* 6. THE DEEP SPREAD: 2-PAGE EDITORIAL SPREAD */}
        {deepSpreadPost && (
          <section className="rounded-[2.5rem] bg-gradient-to-r from-[#17171c] via-[#111114] to-[#17171c] border border-amber-500/20 p-8 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-8 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                  <Sparkles className="size-3.5" />
                  <span>MONOGRAPH // ESSENTIAL PERSPECTIVE</span>
                </div>
                <Link href={`/${deepSpreadPost.slug}`} className="block group">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif text-white group-hover:text-amber-400 transition leading-tight">
                    {deepSpreadPost.title}
                  </h2>
                </Link>
                <p className="text-neutral-300 text-base sm:text-lg font-light leading-relaxed max-w-3xl">
                  {deepSpreadPost.excerpt}
                </p>
                <div className="flex items-center gap-6 pt-4 text-xs font-mono text-neutral-400">
                  <span>READ TIME: {deepSpreadPost.readingTime || '14 min'}</span>
                  <span>•</span>
                  <span>VERIFIED BY EDITORIAL DESK</span>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center">
                <Link
                  href={`/${deepSpreadPost.slug}`}
                  className="w-full py-5 rounded-2xl bg-amber-500 text-black font-black text-center text-sm uppercase tracking-wider hover:bg-amber-400 transition shadow-2xl"
                >
                  Read Full Monograph →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 7. CAREER SOVEREIGNTY WITH STICKY SKYSCRAPER AD (8 + 4 SPLIT) */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight">
              Executive Sovereignty &amp; Income Architecture
            </h2>
            <Link href="/tag/career" className="text-xs font-mono font-bold text-amber-400 hover:underline">
              ALL CAREER PLAYBOOKS →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {bentoPosts.slice(0, 4).map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="group p-6 rounded-3xl bg-[#141417] border border-white/10 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-neutral-800">
                    <img
                      src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                      alt={post.title}
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-neutral-400">
                      <span>{(post.categoryId ? categoryMap[post.categoryId]?.name : null) || 'BLUEPRINT'}</span> • <span>{post.readingTime || '8 min'}</span>
                    </div>
                    <h4 className="text-lg font-bold font-serif text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h4>
                    <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-400 inline-flex items-center gap-1">
                    <span>Examine Guide</span>
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

        {/* 8. COMPLETE INTELLIGENCE DIRECTORY (3-COLUMN MASONRY WITH IN-FEED SPONSOR) */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight">
              The Complete Editorial Compendium
            </h2>
            <span className="text-xs font-mono text-neutral-400">{posts.length} PUBLICATIONS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AdBanner
              slot="native-infeed"
              sponsorName="Panic Copilot Autonomous Edition"
              sponsorTagline="Instant AI writing, automated schema generation, and real-time validation built for digital media brands."
              sponsorUrl="/panic"
              ctaText="Start Free Trial"
            />

            {remainingPosts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="group rounded-3xl overflow-hidden bg-[#141417] border border-white/10 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between shadow-sm"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-800">
                  <img
                    src={post.featuredImageUrl || 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'}
                    alt={post.title}
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="text-xs font-mono text-neutral-400">
                      <span>{(post.categoryId ? categoryMap[post.categoryId]?.name : null) || 'ANALYSIS'}</span> • <span>{post.readingTime || '7 min'}</span>
                    </div>
                    <h3 className="text-xl font-bold font-serif text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-neutral-400 text-sm line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '2026'}</span>
                    <span className="text-amber-400 font-bold group-hover:translate-x-1 transition">Read →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>

      {/* 9. STICKY BOTTOM AD BANNER */}
      <AdBanner slot="sticky-bottom" />

      <MagazineFooter />
    </div>
  );
}
