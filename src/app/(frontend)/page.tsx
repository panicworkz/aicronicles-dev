import React from "react";
import Link from "next/link";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import {
  PostCard,
  NumberedTrendingCard,
  NativeSponsoredCard,
  AdSlot,
  fmtDate,
} from "@/components/magazine/PostCard";
import Reveal from "@/components/magazine/Reveal";
import {
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  Briefcase,
  DollarSign,
  Cpu,
  Mail,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await db.query.posts.findMany({
    where: eq(schema.posts.status, "published"),
    orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)],
    limit: 50,
  });

  const authors = await db.query.authors.findMany();
  const categories = await db.query.categories.findMany();

  const authorMap: Record<number, any> = {};
  authors.forEach((a: any) => {
    if (a?.id) authorMap[a.id] = a;
  });

  const categoryMap: Record<number, any> = {};
  categories.forEach((c: any) => {
    if (c?.id) categoryMap[c.id] = c;
  });

  const catBySlug: Record<string, any> = {};
  categories.forEach((c: any) => {
    if (c?.slug) catBySlug[c.slug] = c;
  });

  // Split posts for magazine layout
  const coverStory = posts[0];
  const secondaryStories = posts.slice(1, 3);
  const trendingStories = posts.slice(3, 8);

  // Category specific groups
  const financePosts = posts
    .filter((p) => {
      const catSlug = p.categoryId ? categoryMap[p.categoryId]?.slug : "";
      return catSlug === "personal-finance" || JSON.stringify(p.tagsJson || "").includes("personal-finance");
    })
    .slice(0, 4);

  const careerPosts = posts
    .filter((p) => {
      const catSlug = p.categoryId ? categoryMap[p.categoryId]?.slug : "";
      return catSlug === "career" || JSON.stringify(p.tagsJson || "").includes("career");
    })
    .slice(0, 4);

  const aiPosts = posts
    .filter((p) => {
      const catSlug = p.categoryId ? categoryMap[p.categoryId]?.slug : "";
      return catSlug === "ai-tech" || JSON.stringify(p.tagsJson || "").includes("ai-tech");
    })
    .slice(0, 4);

  const latestFeed = posts.slice(8, 20);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col selection:bg-[var(--accent)] selection:text-white">
      <MagazineHeader />

      <main className="f-content flex-1 w-full space-y-16 sm:space-y-20 py-8">
        {/* ========================================================
            1. HERO NEWSLETTER & DISPATCH BANNER
            ======================================================== */}
        <section>
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#3b4bc8] via-[#2a38a3] to-[#1a237e] text-white p-8 sm:p-12 lg:p-16 shadow-xl border border-white/10">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-indigo-400/15 blur-2xl pointer-events-none" />

              <div className="relative z-10 max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-mono font-bold uppercase tracking-widest text-white/90 border border-white/20">
                  <Sparkles className="size-3.5 text-amber-300" />
                  <span>The Fabelo Dispatch · Issue #142</span>
                </div>

                <h1 className="f-display mt-5 text-[clamp(2.1rem,4.8vw,3.8rem)] leading-[1.05] font-extrabold tracking-tight text-white">
                  Personal finance, career &amp; AI — for ambitious professionals.
                </h1>

                <p className="mt-4 text-[16px] sm:text-[18px] text-white/85 max-w-2xl leading-relaxed">
                  Join 42,000+ ambitious operators, builders, and executives. Field-tested frameworks, actionable money tactics, and curated AI workflows twice a week.
                </p>

                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg"
                >
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your work email…"
                      className="w-full h-12 sm:h-13 pl-11 pr-4 rounded-full bg-white text-gray-900 placeholder:text-gray-500 text-sm font-medium outline-none focus:ring-2 focus:ring-white/80 shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-12 sm:h-13 px-8 rounded-full bg-gray-950 hover:bg-black text-white font-bold text-sm transition-transform active:scale-98 shrink-0 shadow-lg"
                  >
                    Subscribe Free
                  </button>
                </form>

                <div className="mt-5 flex flex-wrap items-center gap-6 text-[12.5px] text-white/75">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    <span>Free forever</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    <span>2 dispatches / week</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    <span>No sponsor spam</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ========================================================
            2. EDITORIAL COVER STORY & TRENDING (DETAILED.COM/50 DENSITY)
            ======================================================== */}
        <section>
          <div className="flex items-center justify-between pb-4 mb-8 border-b-2 border-[var(--heading)]">
            <div className="flex items-center gap-2.5">
              <Zap className="size-5 text-[var(--accent)]" />
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--heading)]">
                Cover Story &amp; Editorial Highlights
              </h2>
            </div>
            <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider hidden sm:inline">
              Updated Live
            </span>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 items-start">
            {/* Massive Main Cover Story (7 Columns) */}
            {coverStory && (
              <div className="lg:col-span-7 group">
                <Link href={`/${coverStory.slug}`} className="block">
                  <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[var(--bg-2)] relative mb-5 shadow-sm">
                    {coverStory.featuredImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverStory.featuredImageUrl}
                        alt={coverStory.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                      />
                    ) : null}
                    {coverStory.categoryId && categoryMap[coverStory.categoryId] && (
                      <span
                        className="absolute top-4 left-4 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-md shadow-sm"
                        style={{
                          background: "color-mix(in oklab, var(--bg) 90%, transparent)",
                          color: "var(--accent)",
                          border: "1px solid var(--line)",
                        }}
                      >
                        {categoryMap[coverStory.categoryId].name}
                      </span>
                    )}
                  </div>

                  <h2 className="f-headline font-extrabold leading-[1.12] text-[var(--heading)] group-hover:text-[var(--accent)] transition-colors">
                    {coverStory.title}
                  </h2>

                  {coverStory.excerpt && (
                    <p className="mt-3.5 text-[15.5px] sm:text-[17px] text-[var(--muted)] leading-relaxed line-clamp-3">
                      {coverStory.excerpt}
                    </p>
                  )}

                  <div className="mt-5 flex items-center gap-3 text-[13px] text-[var(--muted)] font-medium">
                    <span className="font-bold text-[var(--fg)]">
                      {coverStory.authorId && authorMap[coverStory.authorId]?.name ? authorMap[coverStory.authorId].name : "Fabelo"}
                    </span>
                    <span>·</span>
                    <span>{fmtDate(coverStory.publishedAt)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {coverStory.readingTime || "5 min read"}
                    </span>
                  </div>
                </Link>
              </div>
            )}

            {/* Trending Top Ranked + Secondary (5 Columns) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-2)] border border-[var(--line)]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--heading)] font-mono">
                      Trending Stories
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--muted)]">RANKED</span>
                </div>

                <div className="divide-y divide-[var(--line)]">
                  {trendingStories.map((post, idx) => (
                    <NumberedTrendingCard
                      key={post.id}
                      post={post}
                      index={idx + 1}
                      category={post.categoryId ? categoryMap[post.categoryId] : null}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary story cards */}
              {secondaryStories.map((sec) => (
                <Link
                  key={sec.id}
                  href={`/${sec.slug}`}
                  className="group flex gap-4 p-4 rounded-xl border border-[var(--line)] bg-[var(--card)] hover:border-[var(--accent)] transition-colors"
                >
                  {sec.featuredImageUrl && (
                    <div className="size-24 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-2)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sec.featuredImageUrl}
                        alt={sec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      {sec.categoryId && categoryMap[sec.categoryId]?.name ? categoryMap[sec.categoryId].name : "Feature"}
                    </span>
                    <h4 className="text-[14.5px] font-bold text-[var(--heading)] line-clamp-2 leading-snug group-hover:text-[var(--accent)] transition-colors mt-0.5">
                      {sec.title}
                    </h4>
                    <span className="text-[12px] text-[var(--muted)] mt-1.5 block">
                      {sec.readingTime || "4 min read"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            3. MID-PAGE LEADERBOARD AD BANNER
            ======================================================== */}
        <section className="py-2">
          <AdSlot size="leaderboard" label="Featured Partner" />
        </section>

        {/* ========================================================
            4. CATEGORY DEEP DIVE: PERSONAL FINANCE
            ======================================================== */}
        {financePosts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-emerald-600">
              <div className="flex items-center gap-2.5">
                <DollarSign className="size-5 text-emerald-600" />
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--heading)]">
                  Personal Finance &amp; Wealth
                </h2>
              </div>
              <Link
                href="/tag/personal-finance"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 transition"
              >
                <span>View all 24 guides</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {financePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  author={post.authorId ? authorMap[post.authorId] : null}
                  category={{ name: "Personal Finance", slug: "personal-finance" }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ========================================================
            5. CATEGORY DEEP DIVE: CAREER ACCELERATION
            ======================================================== */}
        {careerPosts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-blue-600">
              <div className="flex items-center gap-2.5">
                <Briefcase className="size-5 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--heading)]">
                  Career &amp; Remote Work
                </h2>
              </div>
              <Link
                href="/tag/career"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 transition"
              >
                <span>View all 13 guides</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {careerPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  author={post.authorId ? authorMap[post.authorId] : null}
                  category={{ name: "Career", slug: "career" }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ========================================================
            6. CATEGORY DEEP DIVE: AI & TECH TOOLS + NATIVE AD
            ======================================================== */}
        {aiPosts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-purple-600">
              <div className="flex items-center gap-2.5">
                <Cpu className="size-5 text-purple-600" />
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--heading)]">
                  AI &amp; Productivity Technology
                </h2>
              </div>
              <Link
                href="/tag/ai-tech"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-purple-600 hover:text-purple-700 transition"
              >
                <span>View all 10 guides</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              {aiPosts.slice(0, 3).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  author={post.authorId ? authorMap[post.authorId] : null}
                  category={{ name: "AI & Tech", slug: "ai-tech" }}
                />
              ))}
              <NativeSponsoredCard />
            </div>
          </section>
        )}

        {/* ========================================================
            7. LATEST STORIES FEED ARCHIVE
            ======================================================== */}
        <section className="pt-6">
          <div className="flex items-center justify-between pb-3 mb-8 border-b-2 border-[var(--heading)]">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--heading)]">
              Latest Field Notes &amp; Analysis
            </h2>
            <span className="text-xs font-mono text-[var(--muted)]">
              Showing {latestFeed.length} of {posts.length} stories
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestFeed.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={post.authorId ? authorMap[post.authorId] : null}
                category={post.categoryId ? categoryMap[post.categoryId] : null}
              />
            ))}
          </div>
        </section>
      </main>

      <MagazineFooter />
    </div>
  );
}
