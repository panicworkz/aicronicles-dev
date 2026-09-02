import React from "react";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import type { Metadata } from "next";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { PostCard, HorizontalStoryCard, type CardPost } from "@/components/magazine/PostCard";
import { AdSlot } from "@/components/magazine/AdSlot";
import AuthorAvatar from "@/components/magazine/AuthorAvatar";
import { decodeEntities } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await db.query.authors.findFirst({ where: eq(schema.authors.slug, slug) });
  if (!author) return { title: "Not Found | Fabelo" };
  return {
    title: `${author.name} | Fabelo`,
    description: author.bio || `Stories written by ${author.name} for Fabelo.`,
  };
}

export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params;

  const author = await db.query.authors.findFirst({ where: eq(schema.authors.slug, slug) });
  if (!author) notFound();

  const rows = await db.query.posts.findMany({
    where: and(eq(schema.posts.status, "published"), eq(schema.posts.authorId, author.id)),
    orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)],
    limit: 60,
  });

  const categories = await db.query.categories.findMany();
  const catById = new Map(categories.map((c: any) => [c.id, c]));

  const posts: CardPost[] = rows.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    featuredImageUrl: p.featuredImageUrl,
    readingTime: p.readingTime,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    authorName: author.name,
    categoryName: catById.get(p.categoryId)?.name ?? null,
    categorySlug: catById.get(p.categoryId)?.slug ?? null,
  }));

  const [lead, ...rest] = posts;

  return (
    <div className="mag min-h-screen">
      <MagazineHeader />

      <main>
        {/* --- Yazar kunyesi --- */}
        <header className="mag-wrap pt-12 sm:pt-16">
          <div className="rule-heavy grid gap-8 pt-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="folio mb-3">§ CONTRIBUTOR</div>
              <h1 className="display mb-4 text-[clamp(2.6rem,6.5vw,5rem)]">{author.name}</h1>
              {author.bio && (
                <p className="max-w-[58ch] text-[1.1rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
                  {decodeEntities(author.bio)}
                </p>
              )}
              <div className="byline mt-5">{posts.length} STORIES PUBLISHED</div>
            </div>
            <div className="lg:col-span-4 lg:flex lg:justify-end">
              <AuthorAvatar name={author.name} src={author.avatarUrl} size={112} />
            </div>
          </div>
        </header>

        {posts.length === 0 ? (
          <div className="mag-wrap py-24">
            <p className="display text-3xl">No stories published yet.</p>
          </div>
        ) : (
          <>
            <section className="mag-wrap pt-12">
              <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
                <div className="lg:col-span-7">
                  <PostCard post={lead} size="lg" showImage />
                  {/* Manset altinda iki hikaye daha: sag kolonda dort kart
                      ve 540px'lik rail reklami var; sol kolon tek kartla
                      kalinca satirin yarisindan fazlasi bos kaliyordu. */}
                  {rest.slice(0, 2).length > 0 && (
                    <div className="rule mt-9 pt-8">
                      {rest.slice(0, 2).map((p) => (
                        <HorizontalStoryCard key={p.slug} post={p} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="lg:col-span-5 lg:rule-v lg:pl-14">
                  {rest.slice(2, 5).map((p) => (
                    <HorizontalStoryCard key={p.slug} post={p} />
                  ))}
                  <div className="mt-9">
                    <AdSlot format="rail" label="Sponsor" />
                  </div>
                </div>
              </div>
            </section>

            {rest.length > 5 && (
              <section className="mag-wrap pt-16">
                <div className="mb-8 rule-heavy pt-4">
                  <div className="folio mb-2">§ ARCHIVE</div>
                  <h2 className="display text-[2rem] sm:text-[2.6rem]">More by {author.name}</h2>
                </div>
                <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.slice(5).map((p) => (
                    <PostCard key={p.slug} post={p} size="sm" showImage />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="h-20 sm:h-28" />
      </main>

      <MagazineFooter />
    </div>
  );
}
