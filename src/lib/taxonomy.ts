/**
 * Fabelo taksonomisi — fabelo.io/sitemap-tags.xml uzerinden birebir alindi.
 * Sunucu ve istemci bilesenlerinin ikisi de buradan okur; bu yuzden bu dosya
 * "use client" ICERMEZ (client modulunden export edilen dizi sunucuda
 * calismiyordu).
 */

/** fabelo.io'daki 19 tag, birebir */
export const FABELO_TAGS = [
  "ai-tech",
  "banking",
  "budgeting",
  "career",
  "credit",
  "debt-management",
  "freelancing",
  "future-of-work",
  "investing",
  "job-search",
  "personal-finance",
  "productivity",
  "professional-development",
  "remote-work",
  "retirement",
  "savings",
  "side-income",
  "tools",
  "wealth-building",
] as const;

/** fabelo.io menusundeki 3 ana bolum */
export const SECTIONS = [
  { slug: "personal-finance", label: "Personal Finance", folio: "01", blurb: "Money that compounds while you sleep." },
  { slug: "career", label: "Career", folio: "02", blurb: "Leverage, negotiation and the long game." },
  { slug: "ai-tech", label: "AI & Tech", folio: "03", blurb: "Tools that actually earn their subscription." },
] as const;

/** slug -> okunabilir etiket ("ai-tech" -> "AI & Tech") */
export function tagLabel(slug: string): string {
  if (slug === "ai-tech") return "AI & Tech";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Ghost gocunden gelen ozetlerde HTML varliklari ham kaliyor
 * ("net worth &#x3D; assets"). Sunucu tarafinda DOM olmadigi icin
 * elle cozuyoruz.
 */
export function decodeEntities(input?: string | null): string {
  if (!input) return "";
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013");
}
