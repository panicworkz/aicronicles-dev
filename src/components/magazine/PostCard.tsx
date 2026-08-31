import React from "react";
import Link from "next/link";
import { Clock, ArrowUpRight, Sparkles } from "lucide-react";

export const fmtDate = (d: Date | string | null | undefined) => {
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(d));
  } catch {
    return "";
  }
};

export interface CardPost {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  readingTime?: string | null;
  publishedAt?: Date | string | null;
  authorId?: number | null;
  categoryId?: number | null;
  tagsJson?: any;
}

// 1. Standard Magazine Grid Card
export function PostCard({
  post,
  author,
  category,
  showExcerpt = true,
}: {
  post: CardPost;
  author?: { name?: string | null; slug?: string | null; avatarUrl?: string | null } | null;
  category?: { name?: string | null; slug?: string | null } | null;
  showExcerpt?: boolean;
}) {
  return (
    <Link href={`/${post.slug}`} className="f-card group flex flex-col justify-between h-full">
      <div>
        {post.featuredImageUrl && (
          <div className="f-card-media aspect-[16/10] rounded-xl overflow-hidden mb-4 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featuredImageUrl}
              alt={post.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {category && (
              <span
                className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md backdrop-blur-md shadow-xs transition-colors"
                style={{
                  background: "color-mix(in oklab, var(--bg) 85%, transparent)",
                  color: "var(--accent)",
                  border: "1px solid var(--line)",
                }}
              >
                {category.name}
              </span>
            )}
          </div>
        )}
        <div className="f-card-body p-0">
          {!post.featuredImageUrl && category && (
            <span className="f-tag mb-1.5">{category.name}</span>
          )}
          <h3 className="f-card-title text-[18px] sm:text-[20px] font-bold leading-snug tracking-tight transition-colors group-hover:text-[var(--accent)]">
            {post.title}
          </h3>
          {showExcerpt && post.excerpt && (
            <p className="f-card-excerpt text-[14px] text-[var(--muted)] leading-relaxed mt-2.5 line-clamp-2">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>

      <div className="f-card-meta mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between text-[12.5px] text-[var(--muted)]">
        <div className="flex items-center gap-2">
          {author?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.avatarUrl}
              alt={author.name || "Author"}
              className="size-5 rounded-full object-cover"
            />
          ) : null}
          <span className="font-semibold text-[var(--fg)]">{author?.name || "Fabelo"}</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span>{fmtDate(post.publishedAt)}</span>
          <span>·</span>
          <span>{post.readingTime || "5 min read"}</span>
        </div>
      </div>
    </Link>
  );
}

// 2. Numbered Trending / Top 50 Style Card (Detailed.com/50 Inspired)
export function NumberedTrendingCard({
  post,
  index,
  category,
}: {
  post: CardPost;
  index: number;
  category?: { name?: string | null; slug?: string | null } | null;
}) {
  const rank = String(index).padStart(2, "0");
  return (
    <Link
      href={`/${post.slug}`}
      className="group flex items-start gap-4 py-4 border-b border-[var(--line)] transition-colors hover:bg-[var(--accent-weak)]/30 rounded-lg px-2 -mx-2"
    >
      <span
        className="text-[26px] sm:text-[32px] font-extrabold font-mono tracking-tighter leading-none select-none shrink-0"
        style={{ color: index <= 3 ? "var(--accent)" : "var(--muted)" }}
      >
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        {category && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] mb-1 block">
            {category.name}
          </span>
        )}
        <h4 className="text-[15px] sm:text-[16px] font-bold text-[var(--heading)] leading-snug tracking-tight group-hover:text-[var(--accent)] transition-colors line-clamp-2">
          {post.title}
        </h4>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-[var(--muted)]">
          <span>{fmtDate(post.publishedAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {post.readingTime || "5 min read"}
          </span>
        </div>
      </div>
    </Link>
  );
}

// 3. Horizontal Story Card (Side-by-Side Thumbnail)
export function HorizontalStoryCard({
  post,
  author,
  category,
}: {
  post: CardPost;
  author?: { name?: string | null } | null;
  category?: { name?: string | null; slug?: string | null } | null;
}) {
  return (
    <Link
      href={`/${post.slug}`}
      className="group flex flex-col sm:flex-row gap-5 items-start p-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] transition-all hover:border-[var(--accent)] hover:shadow-sm"
    >
      {post.featuredImageUrl && (
        <div className="w-full sm:w-48 aspect-[16/10] sm:aspect-[4/3] rounded-xl overflow-hidden shrink-0 bg-[var(--bg-2)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.featuredImageUrl}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {category && (
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-[var(--accent)] mb-1.5 block">
            {category.name}
          </span>
        )}
        <h3 className="text-[17px] sm:text-[19px] font-bold text-[var(--heading)] leading-snug tracking-tight group-hover:text-[var(--accent)] transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-[13.5px] text-[var(--muted)] leading-relaxed mt-2 line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <div className="mt-4 flex items-center gap-3 text-[12.5px] text-[var(--muted)] font-medium">
          <span className="text-[var(--fg)] font-semibold">{author?.name || "Fabelo"}</span>
          <span>·</span>
          <span>{fmtDate(post.publishedAt)}</span>
          <span>·</span>
          <span>{post.readingTime || "5 min read"}</span>
        </div>
      </div>
    </Link>
  );
}

// 4. Native Sponsored Article Card
export function NativeSponsoredCard({
  sponsorName = "Panic Studio Enterprise",
  title = "How Next-Generation AI Media Infrastructure Cuts Publishing Latency by 90%",
  excerpt = "Discover how modern media engineering is transforming headless publishing workflows for enterprise newsrooms.",
  ctaUrl = "/panic",
  imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
}: {
  sponsorName?: string;
  title?: string;
  excerpt?: string;
  ctaUrl?: string;
  imageUrl?: string;
}) {
  return (
    <Link
      href={ctaUrl}
      target={ctaUrl.startsWith("http") ? "_blank" : undefined}
      className="group block rounded-2xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--card)] to-[var(--bg-2)] p-5 transition hover:border-[var(--accent)] shadow-xs"
    >
      <div className="flex items-center justify-between mb-3 text-[11px] font-mono uppercase tracking-widest text-[var(--accent)] font-bold">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3.5" />
          Sponsored Story
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[var(--accent-weak)] text-[10px]">
          {sponsorName}
        </span>
      </div>

      <div className="aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-[var(--bg-2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <h4 className="text-[17px] font-bold text-[var(--heading)] leading-snug group-hover:text-[var(--accent)] transition-colors">
        {title}
      </h4>
      <p className="text-[13.5px] text-[var(--muted)] leading-relaxed mt-2 line-clamp-2">
        {excerpt}
      </p>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--line)] text-xs font-bold text-[var(--accent)]">
        <span>Explore Partner Report</span>
        <ArrowUpRight className="size-4" />
      </div>
    </Link>
  );
}

// 5. Ad Slot Component
export type AdSize = "billboard" | "leaderboard" | "skyscraper" | "inread" | "rectangle";

export function AdSlot({
  size = "leaderboard",
  label = "Advertisement",
}: {
  size?: AdSize;
  label?: string;
}) {
  const sizeMap: Record<AdSize, string> = {
    billboard: "f-ad--billboard",
    leaderboard: "f-ad--leaderboard",
    skyscraper: "f-ad--skyscraper",
    inread: "f-ad--inread",
    rectangle: "f-ad--rectangle w-[300px] h-[250px]",
  };

  return (
    <div className="w-full flex justify-center py-4">
      <div className={`f-ad ${sizeMap[size] || "f-ad--leaderboard"} flex flex-col items-center justify-center p-4 text-center border-dashed border-[var(--line)] bg-[var(--bg-2)]/60 rounded-xl transition hover:border-[var(--accent)]/40`}>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
          {label}
        </span>
        <span className="text-xs font-bold text-[var(--heading)] opacity-80">
          {size === "billboard" && "970 × 250 Premium Billboard"}
          {size === "leaderboard" && "728 × 90 Responsive Leaderboard"}
          {size === "skyscraper" && "300 × 600 Half-Page Skyscraper"}
          {size === "rectangle" && "300 × 250 Medium Rectangle"}
          {size === "inread" && "In-Read Native Sponsor Unit"}
        </span>
      </div>
    </div>
  );
}
