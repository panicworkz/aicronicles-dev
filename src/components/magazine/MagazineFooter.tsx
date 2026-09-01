import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FABELO_TAGS, tagLabel } from "@/lib/taxonomy";

/** fabelo.io footer'iyla birebir baglantilar */
const MASTHEAD_LINKS = [
  { label: "About", href: "/about" },
  { label: "Advertise", href: "/advertise" },
  { label: "Sponsor", href: "/sponsor" },
  { label: "Terms & conditions", href: "/terms-and-conditions" },
  { label: "Data & privacy", href: "/data-and-privacy" },
];

const SECTIONS = [
  { label: "Personal Finance", href: "/category/personal-finance" },
  { label: "Career", href: "/category/career" },
  { label: "AI & Tech", href: "/category/ai-tech" },
  { label: "Store", href: "/store" },
];

export default function MagazineFooter() {
  return (
    <footer style={{ background: "var(--ink)", color: "var(--paper)" }}>
      {/* --- Ust: kunye + sutunlar --------------------------------------- */}
      <div className="mag-shell pt-16 pb-12 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Kunye */}
          <div className="lg:col-span-5">
            <div className="mb-5 flex items-center gap-3">
              <Image
                src="/images/fabelo-logo.webp"
                alt="Fabelo"
                width={46}
                height={46}
                className="rounded-[3px]"
              />
              <span className="display text-[2rem] leading-none" style={{ letterSpacing: "-0.04em" }}>
                Fabelo<span style={{ color: "var(--accent)" }}>.</span>
              </span>
            </div>
            <p className="max-w-[42ch] text-[0.98rem] leading-relaxed" style={{ color: "#b7bcc4" }}>
              An independent desk covering personal finance, career strategy and the AI tools that
              actually earn their subscription — for professionals who read to the end.
            </p>
            <div className="folio mt-6" style={{ color: "#7d848d" }}>
              ISTANBUL · LONDON · REMOTE
            </div>
          </div>

          {/* Bolumler */}
          <nav className="lg:col-span-3">
            <div className="folio mb-5" style={{ color: "var(--accent)" }}>
              § SECTIONS
            </div>
            <ul className="flex flex-col gap-3">
              {SECTIONS.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-[0.98rem] transition-colors hover:text-[var(--accent)]">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Kurumsal */}
          <nav className="lg:col-span-4">
            <div className="folio mb-5" style={{ color: "var(--accent)" }}>
              § MASTHEAD
            </div>
            <ul className="grid grid-cols-2 gap-3">
              {MASTHEAD_LINKS.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-[0.98rem] transition-colors hover:text-[var(--accent)]">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* --- Tag dizini ---------------------------------------------------- */}
      <div className="mag-shell pb-12" style={{ borderTop: "1px solid #2a3038", paddingTop: "2.5rem" }}>
        <div className="folio mb-5" style={{ color: "#7d848d" }}>
          § TOPIC INDEX — {FABELO_TAGS.length} SUBJECTS
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {FABELO_TAGS.map((t) => (
            <Link
              key={t}
              href={`/tag/${t}`}
              className="text-[0.88rem] transition-colors"
              style={{ color: "#8b9098" }}
            >
              {tagLabel(t)}
            </Link>
          ))}
        </div>
      </div>

      {/* --- Alt serit ----------------------------------------------------- */}
      <div style={{ borderTop: "1px solid #2a3038" }}>
        <div className="mag-shell flex flex-col items-center justify-between gap-3 py-6 sm:flex-row sm:pr-20">
          <span className="byline" style={{ color: "#7d848d" }}>
            © {new Date().getFullYear()} FABELO — ALL RIGHTS RESERVED
          </span>
          <span className="byline" style={{ color: "#7d848d" }}>
            PUBLISHED WITH PANIC CMS
          </span>
        </div>
      </div>
    </footer>
  );
}
