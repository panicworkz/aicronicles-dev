import React from "react";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import type { Metadata } from "next";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { PostCard, HorizontalStoryCard, type CardPost } from "@/components/magazine/PostCard";
import { AdSlot } from "@/components/magazine/AdSlot";
import { SECTIONS, decodeEntities } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.query.categories.findFirst({ where: eq(schema.categories.slug, slug) });
  if (!category) return { title: "Not Found | Fabelo" };
  return {
    title: `${category.name} | Fabelo`,
    description: category.description || `Every ${category.name} story from the Fabelo desk.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await db.query.categories.findFirst({ where: eq(schema.categories.slug, slug) });
  if (!category) notFound();

  const rows = await db.query.posts.findMany({
    where: and(eq(schema.posts.status, "published"), eq(schema.posts.categoryId, category.id)),
    orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)],
    limit: 60,
  });

  const authors = await db.query.authors.findMany();
  const authorById = new Map(authors.map((a: any) => [a.id, a]));

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
    categoryName: category.name,
    categorySlug: category.slug,
  }));

  const meta = SECTIONS.find((s) => s.slug === slug);
  const [lead, ...rest] = posts;
  const column = rest.slice(0, 4);
  const grid = rest.slice(4);

  return (
    <div className="mag min-h-screen">
      <MagazineHeader />

      <main>
        {/* --- Bolum kunyesi --- */}
        <header className="mag-wrap pt-12 sm:pt-16">
          <div className="rule-heavy pt-5">
            <div className="folio mb-3">§ {meta?.folio ?? "SECTION"}</div>
            <h1 className="display mb-3 text-[clamp(2.8rem,7vw,5.5rem)]">{category.name}</h1>
            <p className="max-w-[56ch] text-[1.08rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
              {category.description || meta?.blurb}
            </p>
            <div className="byline mt-5">{posts.length} STORIES ON THE DESK</div>
          </div>
        </header>

        {posts.length === 0 ? (
          <div className="mag-wrap py-24">
            <p className="display text-3xl">Nothing filed here yet.</p>
          </div>
        ) : (
          <>
            {/* --- Bolum mansedi --- */}
            <section className="mag-wrap pt-12">
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
                <div className="lg:col-span-7">
                  <PostCard post={lead} size="lg" showImage />
                </div>
                <div className="lg:col-span-5 lg:rule-v lg:pl-14">
                  {column.map((p) => (
                    <HorizontalStoryCard key={p.slug} post={p} />
                  ))}
                </div>
              </div>
            </section>

            <section className="mag-wrap py-12 sm:py-16">
              <AdSlot format="measure" label="Partner" baglam={{ tur: "category", slug }} />
            </section>

            {/* --- Arsiv izgarasi --- */}
            {grid.length > 0 && (
              <section className="mag-wrap">
                <div className="mb-8 rule-heavy pt-4">
                  <div className="folio mb-2">§ ARCHIVE</div>
                  <h2 className="display text-[2rem] sm:text-[2.6rem]">Everything else</h2>
                </div>
                <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">
                  {grid.map((p) => (
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
