import React from "react";
import Link from "next/link";
import { decodeEntities } from "@/lib/taxonomy";
import { alaniDoldur } from "@/lib/ads";
import AdTracker from "./AdTracker";

export const fmtDate = (d: Date | string | null | undefined) => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
};

export interface CardPost {
  id?: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  readingTime?: string | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
  authorName?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
}


/** Eski sayfalar author/category'yi ayri prop olarak geciyor; ikisini de destekle. */
type Extras = { author?: any; category?: any };
const merge = (post: CardPost, x: Extras = {}): CardPost => ({
  ...post,
  authorName: post.authorName ?? x.author?.name ?? null,
  categoryName: post.categoryName ?? x.category?.name ?? null,
  categorySlug: post.categorySlug ?? x.category?.slug ?? null,
});

const Plate = ({
  src,
  alt,
  ratio = "4 / 3",
}: {
  src?: string | null;
  alt: string;
  ratio?: string;
}) => (
  <div className="plate w-full" style={{ aspectRatio: ratio }}>
    {src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
    ) : (
      <div className="size-full" style={{ background: "var(--paper-3)" }} />
    )}
  </div>
);

const Meta = ({ post, sep = "·" }: { post: CardPost; sep?: string }) => (
  <div className="byline flex flex-wrap items-center gap-x-2 gap-y-1">
    {post.authorName && <span>{post.authorName.toUpperCase()}</span>}
    {post.authorName && <span style={{ color: "var(--rule)" }}>{sep}</span>}
    <span>{fmtDate(post.publishedAt || post.createdAt)}</span>
    {post.readingTime && (
      <>
        <span style={{ color: "var(--rule)" }}>{sep}</span>
        <span>{post.readingTime.replace(" read", "").toUpperCase()}</span>
      </>
    )}
  </div>
);

/** Standart dergi karti — dikey, gorsel ustte */
export function PostCard({
  post: raw,
  showImage = true,
  size = "md",
  author,
  category,
}: {
  post: CardPost;
  showImage?: boolean;
  size?: "sm" | "md" | "lg";
} & Extras) {
  const post = merge(raw, { author, category });
  const titleSize =
    size === "lg" ? "text-[1.8rem] sm:text-[2.15rem]" : size === "sm" ? "text-[1.05rem]" : "text-[1.35rem]";

  return (
    <article className="group flex flex-col">
      {showImage && (
        <Link href={`/${post.slug}`} className="mb-4 block">
          <Plate src={post.featuredImageUrl} alt={decodeEntities(post.title)} ratio={size === "lg" ? "16 / 10" : "4 / 3"} />
        </Link>
      )}
      {post.categoryName && (
        <Link href={`/category/${post.categorySlug}`} className="kicker mb-2 hover:text-[var(--accent-ink)]">
          {post.categoryName}
        </Link>
      )}
      <Link href={`/${post.slug}`}>
        <h3 className={`display headline-link ${titleSize} mb-2.5`}>{decodeEntities(post.title)}</h3>
      </Link>
      {post.excerpt && size !== "sm" && (
        <p className="mb-3 text-[0.95rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          {decodeEntities(post.excerpt).length > 155 ? decodeEntities(post.excerpt).slice(0, 155).trimEnd() + "…" : decodeEntities(post.excerpt)}
        </p>
      )}
      <Meta post={post} />
    </article>
  );
}

/** Numaralandirilmis liste karti — "En cok okunan" */
export function NumberedTrendingCard({
  post: raw,
  index,
  author,
  category,
}: { post: CardPost; index: number } & Extras) {
  const post = merge(raw, { author, category });
  return (
    <article className="group flex gap-5 py-5 rule">
      <span
        className="display shrink-0 leading-none"
        style={{ fontSize: "2.6rem", color: "var(--paper-3)", WebkitTextStroke: "0px" }}
      >
        {String(index).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        {post.categoryName && <div className="kicker mb-1.5">{post.categoryName}</div>}
        <Link href={`/${post.slug}`}>
          <h3 className="display headline-link mb-2 text-[1.2rem]">{decodeEntities(post.title)}</h3>
        </Link>
        <Meta post={post} />
      </div>
    </article>
  );
}

/** Yatay hikaye karti — bolum listelerinde */
export function HorizontalStoryCard({
  post: raw,
  author,
  category,
}: { post: CardPost } & Extras) {
  const post = merge(raw, { author, category });
  return (
    <article className="group grid grid-cols-[110px_1fr] gap-5 py-5 rule sm:grid-cols-[160px_1fr]">
      <Link href={`/${post.slug}`}>
        <Plate src={post.featuredImageUrl} alt={decodeEntities(post.title)} ratio="1 / 1" />
      </Link>
      <div className="min-w-0">
        {post.categoryName && <div className="kicker mb-1.5">{post.categoryName}</div>}
        <Link href={`/${post.slug}`}>
          <h3 className="display headline-link mb-2 text-[1.15rem] sm:text-[1.3rem]">{decodeEntities(post.title)}</h3>
        </Link>
        {post.excerpt && (
          <p className="mb-2 hidden text-[0.9rem] leading-relaxed sm:block" style={{ color: "var(--ink-2)" }}>
            {decodeEntities(post.excerpt).length > 110 ? decodeEntities(post.excerpt).slice(0, 110).trimEnd() + "…" : decodeEntities(post.excerpt)}
          </p>
        )}
        <Meta post={post} />
      </div>
    </article>
  );
}

/** Akis ici sponsorlu icerik — reklam ama editoryel dilde, acikca etiketli */
export function NativeSponsoredCard({ post }: { post?: CardPost }) {
  return (
    <article
      className="group flex flex-col p-6"
      style={{ background: "var(--paper-2)", border: "1px solid var(--rule)" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="folio px-1.5 py-0.5"
          style={{ background: "var(--accent)", color: "#fff", letterSpacing: "0.16em" }}
        >
          SPONSORED
        </span>
        <span className="kicker">PARTNER CONTENT</span>
      </div>
      <h3 className="display mb-2 text-[1.3rem]">
        {post?.title || "Your brand in front of 42,000 finance & tech professionals"}
      </h3>
      <p className="mb-4 text-[0.92rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
        {post?.excerpt ||
          "Native placements inside the Fabelo Dispatch reach decision-makers who read every issue end to end."}
      </p>
      <Link href="/advertise" className="byline mt-auto hover:text-[var(--accent-ink)]">
        PARTNER WITH US →
      </Link>
    </article>
  );
}

export type AdSize = "billboard" | "leaderboard" | "skyscraper" | "inread" | "rectangle";

const AD_SPECS: Record<AdSize, { w: number; h: number; note: string }> = {
  billboard: { w: 970, h: 250, note: "970 × 250" },
  leaderboard: { w: 728, h: 90, note: "728 × 90" },
  skyscraper: { w: 300, h: 600, note: "300 × 600" },
  rectangle: { w: 300, h: 250, note: "300 × 250" },
  inread: { w: 640, h: 200, note: "IN-READ" },
};

/**
 * Reklam alani.
 *
 * Yayini kendisi cekiyor: alan adini (`size`) yerlesim adi olarak kabul
 * edip CMS'te o yerlesime tanimli, tarihi gecerli ve aktif reklamlardan
 * birini basiyor. Boylece sayfalarda cagri sekli degismiyor —
 * <AdSlot size="billboard" /> yeterli.
 *
 * `creative` elle verilirse o oncelikli; ozel bir yerlesim gerektiginde
 * kullanilabilir. Hicbir reklam yoksa olculeri belli, editoryel dile
 * uygun bir yer tutucu gosteriliyor.
 */
export async function AdSlot({
  size = "leaderboard",
  label = "Advertisement",
  creative,
  href,
  placement,
}: {
  size?: AdSize;
  label?: string;
  creative?: { imageUrl?: string | null; alt?: string | null } | null;
  href?: string | null;
  /** CMS yerlesim adi — verilmezse `size` kullanilir */
  placement?: string;
}) {
  const spec = AD_SPECS[size];

  // Elle verilmediyse CMS'ten al
  const cmsReklami = creative?.imageUrl ? null : await alaniDoldur(placement ?? size);

  const gorsel = creative?.imageUrl
    ? { imageUrl: creative.imageUrl, alt: creative.alt ?? null }
    : cmsReklami
      ? { imageUrl: cmsReklami.imageUrl, alt: cmsReklami.alt }
      : null;
  const hedef = href ?? cmsReklami?.targetUrl ?? null;

  const body = gorsel ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={gorsel.imageUrl} alt={gorsel.alt || label} className="max-h-full max-w-full object-contain" />
  ) : (
    <span className="folio" style={{ color: "var(--ink-3)" }}>
      {label.toUpperCase()} · {spec.note}
    </span>
  );

  return (
    <aside className="w-full" aria-label={label}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="folio" style={{ color: "var(--ink-3)" }}>
          ADVERTISEMENT
        </span>
        <span className="flex-1 rule" />
      </div>
      <div
        className="grid w-full place-items-center overflow-hidden"
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--rule)",
          aspectRatio: `${spec.w} / ${spec.h}`,
          maxHeight: spec.h,
        }}
      >
        {cmsReklami && hedef ? (
          // CMS reklami: gosterim ve tiklama sayiliyor
          <AdTracker id={cmsReklami.id} href={hedef} className="grid size-full place-items-center">
            {body}
          </AdTracker>
        ) : hedef && gorsel ? (
          <a href={hedef} target="_blank" rel="noopener noreferrer sponsored" className="grid size-full place-items-center">
            {body}
          </a>
        ) : (
          body
        )}
      </div>
    </aside>
  );
}
