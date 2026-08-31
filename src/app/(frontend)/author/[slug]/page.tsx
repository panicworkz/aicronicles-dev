import React from "react";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { desc, eq, or } from "drizzle-orm";
import Link from "next/link";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { PostCard, AdSlot } from "@/components/magazine/PostCard";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, Award, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await db.query.authors.findFirst({
    where: eq(schema.authors.slug, slug),
  });
  return {
    title: author ? `${author.name} | Fabelo Editorial Staff` : `Author | Fabelo`,
    description: author?.bio || "Fabelo contributor profile.",
  };
}

export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const author = await db.query.authors.findFirst({
    where: eq(schema.authors.slug, slug),
  });

  if (!author) notFound();

  // Find posts by author ID or all published if staff
  const allPosts = await db.query.posts.findMany({
    where: eq(schema.posts.status, "published"),
    orderBy: [desc(schema.posts.publishedAt)],
  });

  const posts = allPosts.filter((p) => {
    if (p.authorId === author.id) return true;
    if (author.slug === "fabelo") return true; // Editorial desk umbrella
    return false;
  });

  const categories = await db.query.categories.findMany();
  const categoryMap: Record<number, any> = {};
  categories.forEach((c: any) => {
    if (c?.id) categoryMap[c.id] = c;
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col selection:bg-[var(--accent)] selection:text-white">
      <MagazineHeader />

      <main className="f-content flex-1 py-10 space-y-12">
        {/* ========================================================
            AUTHOR PROFILE HERO
            ======================================================== */}
        <section className="p-8 sm:p-12 rounded-3xl bg-[var(--bg-2)] border border-[var(--line)]">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="size-28 sm:size-36 rounded-full overflow-hidden bg-[var(--accent-weak)] border-2 border-[var(--line)] shrink-0 shadow-md">
              {author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={author.avatarUrl}
                  alt={author.name || "Author"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-4xl font-extrabold text-[var(--accent)]">
                  {author.name[0]}
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--accent-weak)] text-[var(--accent)]">
                  <CheckCircle2 className="size-3.5" />
                  Verified Columnist
                </span>
                <span className="text-xs font-mono text-[var(--muted)]">
                  {posts.length} Published Articles
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--heading)]">
                {author.name}
              </h1>

              {author.role && (
                <p className="text-sm font-bold text-[var(--accent)]">
                  {author.role}
                </p>
              )}

              {author.bio && (
                <p className="text-sm sm:text-base text-[var(--muted)] max-w-2xl leading-relaxed">
                  {author.bio}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Sponsor Banner */}
        <section className="py-2">
          <AdSlot size="leaderboard" label="Sponsored Partner" />
        </section>

        {/* Author Articles Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h2 className="text-xl font-bold tracking-tight text-[var(--heading)]">
              Articles by {author.name}
            </h2>
            <span className="text-xs font-mono text-[var(--muted)]">
              {posts.length} Stories
            </span>
          </div>

          {posts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  author={{ name: author.name, slug: author.slug }}
                  category={post.categoryId ? categoryMap[post.categoryId] : null}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-[var(--muted)]">
              <p>No articles published yet by this author.</p>
            </div>
          )}
        </section>
      </main>

      <MagazineFooter />
    </div>
  );
}
