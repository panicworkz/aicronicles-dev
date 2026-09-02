import React from "react";
import Link from "next/link";
import { db, schema } from "@/db";
import { desc, eq, and, sql } from "drizzle-orm";
import type { Metadata } from "next";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { PostCard, HorizontalStoryCard, type CardPost } from "@/components/magazine/PostCard";
import { AdSlot } from "@/components/magazine/AdSlot";
import { FABELO_TAGS, tagLabel } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${tagLabel(slug)} | Fabelo`,
    description: `Every Fabelo story filed under ${tagLabel(slug)}.`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const label = tagLabel(slug);

  /**
   * Yazilar tagsJson icinde etiket ADIYLA saklaniyor ("Personal Finance"),
   * adres ise slug ("personal-finance"). Ikisini de eslestiriyoruz; ayrica
   * bolum slug'i eslesen yazilar da bu konuya dahil.
   */
  const rows = await db.query.posts.findMany({
    where: and(
      eq(schema.posts.status, "published"),
      sql`(
        ${schema.posts.tagsJson}::text ILIKE ${"%" + label + "%"}
        OR ${schema.posts.tagsJson}::text ILIKE ${"%" + slug + "%"}
        OR ${schema.posts.categoryId} IN (
          SELECT id FROM categories WHERE slug = ${slug}
        )
      )`
    ),
    orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)],
    limit: 60,
  });

  const authors = await db.query.authors.findMany();
  const categories = await db.query.categories.findMany();
  const authorById = new Map(authors.map((a: any) => [a.id, a]));
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
    authorName: authorById.get(p.authorId)?.name ?? null,
    categoryName: catById.get(p.categoryId)?.name ?? null,
    categorySlug: catById.get(p.categoryId)?.slug ?? null,
  }));

  const [lead, ...rest] = posts;
  const siblings = FABELO_TAGS.filter((t) => t !== slug);

  return (
    <div className="mag min-h-screen">
      <MagazineHeader />

      <main>
        <header className="mag-wrap pt-12 sm:pt-16">
          <div className="rule-heavy pt-5">
            <div className="folio mb-3">§ TOPIC</div>
            <h1 className="display mb-3 text-[clamp(2.6rem,6.5vw,5rem)]">{label}</h1>
            <div className="byline">{posts.length} STORIES FILED UNDER THIS TOPIC</div>
          </div>
        </header>

        {posts.length === 0 ? (
          <section className="mag-wrap py-20">
            <p className="display mb-4 text-3xl">Nothing filed under {label} yet.</p>
            <Link href="/" className="byline hover:text-[var(--accent-ink)]">
              ← BACK TO THE FRONT PAGE
            </Link>
          </section>
        ) : (
          <>
            <section className="mag-wrap pt-12">
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
                <div className="lg:col-span-7">
                  <PostCard post={lead} size="lg" showImage />
                </div>
                <div className="lg:col-span-5 lg:rule-v lg:pl-14">
                  {rest.slice(0, 4).map((p) => (
                    <HorizontalStoryCard key={p.slug} post={p} />
                  ))}
                  <div className="mt-9">
                    <AdSlot size="rectangle" label="Sponsor" />
                  </div>
                </div>
              </div>
            </section>

            {rest.length > 4 && (
              <section className="mag-wrap pt-16">
                <div className="mb-8 rule-heavy pt-4">
                  <div className="folio mb-2">§ MORE</div>
                  <h2 className="display text-[2rem] sm:text-[2.6rem]">More on {label}</h2>
                </div>
                <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.slice(4).map((p) => (
                    <PostCard key={p.slug} post={p} size="sm" showImage />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Diger konular */}
        <section className="mag-wrap pt-16 sm:pt-24">
          <div className="mb-7 rule-heavy pt-4">
            <div className="folio mb-2">§ ELSEWHERE</div>
            <h2 className="display text-[1.9rem]">Other topics</h2>
          </div>
          <div className="flex flex-wrap gap-x-2.5 gap-y-3">
            {siblings.map((t) => (
              <Link
                key={t}
                href={`/tag/${t}`}
                className="kicker px-4 py-2 transition-colors hover:text-[var(--accent-ink)]"
                style={{ border: "1px solid var(--rule)", color: "var(--ink-2)" }}
              >
                {tagLabel(t)}
              </Link>
            ))}
          </div>
        </section>

        <div className="h-20 sm:h-28" />
      </main>

      <MagazineFooter />
    </div>
  );
}
