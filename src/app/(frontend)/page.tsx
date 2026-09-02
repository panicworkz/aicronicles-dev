import React from "react";
import Link from "next/link";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import { FABELO_TAGS, SECTIONS, tagLabel, decodeEntities } from "@/lib/taxonomy";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import ClientForm from "@/components/magazine/ClientForm";
import {
  PostCard,
  NumberedTrendingCard,
  HorizontalStoryCard,
  NativeSponsoredCard,
  fmtDate,
  type CardPost,
} from "@/components/magazine/PostCard";
import { AdSlot } from "@/components/magazine/AdSlot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fabelo | Personal Finance, Career & AI Tools for Professionals",
  description:
    "An independent desk for money, career and AI. Field-tested frameworks and honest reviews for ambitious professionals.",
};

/** Bolum basligi — basili dergi bolum isareti */
function SectionHead({
  folio,
  title,
  blurb,
  href,
}: {
  folio: string;
  title: string;
  blurb?: string;
  href?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 rule-heavy pt-4">
      <div>
        <div className="folio mb-2">§ {folio}</div>
        <h2 className="display text-[2rem] sm:text-[2.6rem]">{title}</h2>
        {blurb && (
          <p className="mt-1.5 text-[0.95rem]" style={{ color: "var(--ink-2)" }}>
            {blurb}
          </p>
        )}
      </div>
      {href && (
        <Link href={href} className="byline shrink-0 pb-2 hover:text-[var(--accent-ink)]">
          ALL STORIES →
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const rows = await db.query.posts.findMany({
    where: eq(schema.posts.status, "published"),
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

  const bySection = (slug: string) => posts.filter((p) => p.categorySlug === slug);

  const lead = posts[0];
  const secondary = posts.slice(1, 3);
  const briefs = posts.slice(3, 7);
  const mostRead = posts.slice(0, 5);
  const latest = posts.slice(7, 16);

  if (!lead) {
    return (
      <div className="mag min-h-screen">
        <MagazineHeader />
        <div className="mag-wrap py-32 text-center">
          <h1 className="display text-4xl">No stories published yet.</h1>
        </div>
        <MagazineFooter />
      </div>
    );
  }

  return (
    <div className="mag min-h-screen">
      <MagazineHeader />

      <main>
        {/* ================= MANSET ================= */}
        <section className="mag-wrap pt-10 sm:pt-14">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Ana hikaye — 7 kolon */}
            <article className="group lg:col-span-7">
              <div className="mb-4 flex items-center gap-3">
                <span className="folio">§ LEAD STORY</span>
                <span className="h-px flex-1" style={{ background: "var(--rule)" }} />
              </div>
              <Link href={`/${lead.slug}`}>
                <h1 className="display mb-5 text-[clamp(2.6rem,6.2vw,5rem)]">{decodeEntities(lead.title)}</h1>
              </Link>
              {lead.excerpt && (
                <p
                  className="mb-5 max-w-[58ch] text-[1.08rem] leading-relaxed sm:text-[1.15rem]"
                  style={{ color: "var(--ink-2)" }}
                >
                  {decodeEntities(lead.excerpt)}
                </p>
              )}
              <div className="byline mb-6 flex flex-wrap items-center gap-x-2.5">
                {lead.authorName && <span>BY {lead.authorName.toUpperCase()}</span>}
                <span style={{ color: "var(--rule)" }}>·</span>
                <span>{fmtDate(lead.publishedAt || lead.createdAt)}</span>
                {lead.readingTime && (
                  <>
                    <span style={{ color: "var(--rule)" }}>·</span>
                    <span>{lead.readingTime.replace(" read", "").toUpperCase()}</span>
                  </>
                )}
              </div>
              <Link href={`/${lead.slug}`} className="block">
                <div className="plate w-full" style={{ aspectRatio: "16 / 9" }}>
                  {lead.featuredImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lead.featuredImageUrl} alt={decodeEntities(lead.title)} className="size-full object-cover" />
                  ) : (
                    <div className="size-full" style={{ background: "var(--paper-3)" }} />
                  )}
                </div>
              </Link>
            </article>

            {/* Yan kolon — 5 kolon: ikincil hikayeler + reklam */}
            <div className="lg:col-span-5 lg:rule-v lg:pl-14">
              <div className="mb-4 flex items-center gap-3">
                <span className="folio">§ ALSO THIS WEEK</span>
                <span className="h-px flex-1" style={{ background: "var(--rule)" }} />
              </div>
              <div className="flex flex-col">
                {secondary.map((p, i) => (
                  <div key={p.slug} className={i > 0 ? "rule pt-7 mt-7" : ""}>
                    <PostCard post={p} showImage={i === 0} />
                  </div>
                ))}
              </div>
              <div className="mt-9">
                <AdSlot size="rectangle" label="Sponsor" />
              </div>
            </div>
          </div>
        </section>

        {/* ================= BILLBOARD ================= */}
        <section className="mag-wrap py-12 sm:py-16">
          <AdSlot size="billboard" label="Partner" />
        </section>

        {/* ================= KISA HABERLER ================= */}
        <section className="mag-wrap">
          <SectionHead folio="00" title="The Briefs" blurb="Four things worth your attention today." />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {briefs.map((p) => (
              <PostCard key={p.slug} post={p} size="sm" showImage />
            ))}
          </div>
        </section>

        {/* ================= THE DISPATCH (newsletter) ================= */}
        <section id="dispatch" className="mt-16 sm:mt-24" style={{ background: "var(--ink)" }}>
          {/* Ust dolgu bilerek dar: cipa ile gelindiginde kunye ile baslik
              arasinda kocaman bir koyu bosluk kalmasin. */}
          <div className="mag-wrap pb-16 pt-10 sm:pb-24 sm:pt-12">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <div className="folio mb-4" style={{ color: "var(--accent)" }}>
                  § THE FABELO DISPATCH — ISSUE №&nbsp;142
                </div>
                <h2
                  className="display mb-5 text-[clamp(2.2rem,5vw,3.8rem)]"
                  style={{ color: "var(--paper)" }}
                >
                  Money, career and AI — <em>twice a week</em>, without the noise.
                </h2>
                <p className="max-w-[52ch] text-[1.05rem] leading-relaxed" style={{ color: "#b7bcc4" }}>
                  Join 42,000+ operators, builders and executives. Field-tested frameworks, honest tool
                  reviews and the numbers behind the headlines.
                </p>
              </div>

              <div className="lg:col-span-5 lg:pl-10" style={{ borderLeft: "1px solid #2a3038" }}>
                <ClientForm className="flex flex-col gap-3" source="dispatch">
                  <label className="folio" style={{ color: "#8b9098" }} htmlFor="dispatch-email">
                    YOUR WORK EMAIL
                  </label>
                  <input
                    id="dispatch-email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    className="h-12 w-full bg-transparent px-0 text-[1.05rem] outline-none"
                    style={{ borderBottom: "1px solid #3a4048", color: "var(--paper)" }}
                  />
                  <button
                    type="submit"
                    className="mt-3 h-12 w-full text-[0.82rem] font-bold tracking-[0.14em] transition-transform active:scale-[0.99]"
                    style={{ background: "var(--accent)", color: "#08181c" }}
                  >
                    SUBSCRIBE FREE
                  </button>
                  <small className="byline mt-1 block" style={{ color: "#7d848d" }}>
                    No spam. Unsubscribe in one click.
                  </small>
                </ClientForm>
              </div>
            </div>
          </div>
        </section>

        {/* ================= BOLUMLER ================= */}
        {SECTIONS.map((section, si) => {
          const items = bySection(section.slug);
          if (items.length === 0) return null;
          const [first, ...rest] = items;

          return (
            <section key={section.slug} className="mag-wrap pt-16 sm:pt-24">
              <SectionHead
                folio={section.folio}
                title={section.label}
                blurb={section.blurb}
                href={`/category/${section.slug}`}
              />
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
                <div className="lg:col-span-7">
                  <PostCard post={first} size="lg" showImage />
                </div>
                <div className="lg:col-span-5 lg:rule-v lg:pl-14">
                  {rest.slice(0, 4).map((p) => (
                    <HorizontalStoryCard key={p.slug} post={p} />
                  ))}
                </div>
              </div>

              {/* Bolumler arasi reklam katmani */}
              {si === 0 && (
                <div className="mt-14 grid gap-8 lg:grid-cols-3">
                  <NativeSponsoredCard />
                  <div className="lg:col-span-2">
                    <AdSlot size="leaderboard" label="Advertisement" />
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {/* ================= EN COK OKUNAN + SON YAZILAR ================= */}
        <section className="mag-wrap pt-16 sm:pt-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-8">
              <SectionHead folio="04" title="Latest" blurb="Everything from the desk, newest first." />
              <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">
                {latest.map((p) => (
                  <PostCard key={p.slug} post={p} size="sm" showImage />
                ))}
              </div>
            </div>

            <aside className="lg:col-span-4 lg:rule-v lg:pl-14">
              <SectionHead folio="05" title="Most Read" />
              <div>
                {mostRead.map((p, i) => (
                  <NumberedTrendingCard key={p.slug} post={p} index={i + 1} />
                ))}
              </div>
              <div className="mt-10 sticky top-44">
                <AdSlot size="skyscraper" label="Sponsor" />
              </div>
            </aside>
          </div>
        </section>

        {/* ================= TAG DIZINI ================= */}
        <section className="mag-wrap pt-16 sm:pt-24">
          <SectionHead folio="06" title="Topics" blurb="Every subject the desk covers." />
          <div className="flex flex-wrap gap-x-2.5 gap-y-3">
            {FABELO_TAGS.map((t) => (
              <Link
                key={t}
                href={`/tag/${t}`}
                className="kicker px-4 py-2 transition-colors"
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
