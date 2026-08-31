import React from "react";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { desc, eq, or, sql } from "drizzle-orm";
import Link from "next/link";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { PostCard, HorizontalStoryCard, AdSlot, fmtDate } from "@/components/magazine/PostCard";
import type { Metadata } from "next";
import { Sparkles, ArrowLeft, BookOpen, Layers } from "lucide-react";
import ClientForm from "@/components/magazine/ClientForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const CATEGORY_META: Record<
  string,
  { name: string; description: string; color: string; label: string }
> = {
  "personal-finance": {
    name: "Personal Finance",
    label: "Wealth, Budgeting & Investing",
    description:
      "Actionable frameworks for high-yield savings, credit optimization, index funds, debt payoff, and scalable passive income systems.",
    color: "#16a34a",
  },
  career: {
    name: "Career",
    label: "Career Acceleration & Freelancing",
    description:
      "Strategic playbooks for career pivots, remote web freelancing, high-leverage skill acquisition, and workplace transformations.",
    color: "#2563eb",
  },
  "ai-tech": {
    name: "AI & Tech",
    label: "Productivity AI & LLM Systems",
    description:
      "Curated reviews and zero-cost workflows featuring leading AI tools, automation stacks, and workplace AI intelligence.",
    color: "#9333ea",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = CATEGORY_META[slug] || {
    name: slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    description: `Curated guides and tactical playbooks on ${slug.replace(/-/g, " ")}.`,
  };

  return {
    title: `${meta.name} | Fabelo`,
    description: meta.description,
  };
}

export default async function TagArchivePage({ params }: PageProps) {
  const { slug } = await params;

  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.slug, slug),
  });

  const tagRecord = await db.query.tags.findFirst({
    where: eq(schema.tags.slug, slug),
  });

  // Get all published posts
  const allPosts = await db.query.posts.findMany({
    where: eq(schema.posts.status, "published"),
    orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)],
  });

  // Filter posts matching this category or tag
  const matchingPosts = allPosts.filter((p) => {
    if (category && p.categoryId === category.id) return true;
    const tagsStr = JSON.stringify(p.tagsJson || "").toLowerCase();
    if (tagsStr.includes(slug.toLowerCase())) return true;
    if (p.slug.toLowerCase().includes(slug.toLowerCase())) return true;
    return false;
  });

  const authors = await db.query.authors.findMany();
  const authorMap: Record<number, any> = {};
  authors.forEach((a: any) => {
    if (a?.id) authorMap[a.id] = a;
  });

  const meta = CATEGORY_META[slug] || {
    name:
      category?.name ||
      tagRecord?.name ||
      slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    label: "Curated Topic Archive",
    description:
      category?.description ||
      tagRecord?.description ||
      `Comprehensive guides, field notes and deep dives into ${slug.replace(/-/g, " ")}.`,
    color: "#3b4bc8",
  };

  if (matchingPosts.length === 0 && !category && !tagRecord) {
    notFound();
  }

  const leadStory = matchingPosts[0];
  const remainingStories = matchingPosts.slice(1);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col selection:bg-[var(--accent)] selection:text-white">
      <MagazineHeader />

      <main className="f-content flex-1 py-10 space-y-12">
        {/* ========================================================
            TOPIC MANIFESTO HERO HEADER
            ======================================================== */}
        <section className="p-8 sm:p-12 rounded-3xl bg-[var(--bg-2)] border border-[var(--line)] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to All Topics</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--card)] border border-[var(--line)] text-[var(--fg)]">
                {matchingPosts.length} Guides Available
              </span>
            </div>
          </div>

          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--accent)]">
              {meta.label}
            </span>
            <h1 className="f-manifesto text-[clamp(2.4rem,5vw,4.2rem)] font-extrabold text-[var(--heading)] leading-none">
              {meta.name}
            </h1>
            <p className="text-[16.5px] sm:text-[18px] text-[var(--muted)] leading-relaxed pt-2">
              {meta.description}
            </p>
          </div>
        </section>

        {/* Lead Story Feature */}
        {leadStory && (
          <section className="space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)]">
              Lead Masterclass
            </span>
            <HorizontalStoryCard
              post={leadStory}
              author={leadStory.authorId ? authorMap[leadStory.authorId] : null}
              category={{ name: meta.name, slug }}
            />
          </section>
        )}

        {/* Leaderboard Ad Placement */}
        <section className="py-2">
          <AdSlot size="leaderboard" label="Topic Sponsor" />
        </section>

        {/* Remaining Stories Grid */}
        {remainingStories.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h2 className="text-xl font-bold tracking-tight text-[var(--heading)]">
                All {meta.name} Articles
              </h2>
              <span className="text-xs font-mono text-[var(--muted)]">
                {remainingStories.length} More Articles
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {remainingStories.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  author={post.authorId ? authorMap[post.authorId] : null}
                  category={{ name: meta.name, slug }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Topic-Specific Newsletter Capture */}
        <section className="pt-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#3b4bc8] to-[#1f2987] text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-mono uppercase tracking-widest text-white/80 font-bold">
                Specialized Track
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold">
                Get the latest in {meta.name}.
              </h3>
              <p className="text-sm text-white/85 leading-relaxed">
                Receive new deep-dives on {meta.name.toLowerCase()} straight to your inbox before they are published publicly.
              </p>
            </div>

            <ClientForm className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="h-12 px-5 rounded-full bg-white text-gray-900 text-sm font-medium outline-none shadow-inner w-full sm:w-64"
              />
              <button
                type="submit"
                className="h-12 px-6 rounded-full bg-gray-950 hover:bg-black text-white font-bold text-sm transition"
              >
                Join Track
              </button>
            </ClientForm>
          </div>
        </section>
      </main>

      <MagazineFooter />
    </div>
  );
}
