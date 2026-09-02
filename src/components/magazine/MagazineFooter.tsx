import React from "react";
import Link from "next/link";
import Image from "next/image";
import ClientForm from "./ClientForm";
import { FABELO_TAGS, tagLabel } from "@/lib/taxonomy";
import PanicWorkzNetwork from "./PanicWorkzNetwork";

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

/** Sutun basligi — bolum isaretleriyle ayni dil */
function SutunBasligi({ children }: { children: React.ReactNode }) {
  return (
    <div className="folio mb-5" style={{ color: "var(--accent)" }}>
      § {children}
    </div>
  );
}

function Liste({ items }: { items: { label: string; href: string }[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((s) => (
        <li key={s.href}>
          <Link
            href={s.href}
            className="text-[0.95rem] transition-colors hover:text-[var(--accent)]"
            style={{ color: "#d6dae0" }}
          >
            {s.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function MagazineFooter() {
  return (
    <footer style={{ background: "var(--ink)", color: "var(--paper)" }}>
      {/* --- Ust: kunye + sutunlar ---------------------------------------
          Dort sutun tek satirda: kimlik / bolumler / kurumsal / abonelik.
          Onceki duzende kurumsal baglantilar iki kolona bolundugu icin okuma
          sirasi zikzak yapiyordu; artik her sutun tek kolon. */}
      <div className="mag-shell pb-14 pt-16 sm:pt-20">
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-x-12">
          {/* Kimlik */}
          <div className="lg:col-span-4">
            <div className="mb-5 flex items-center gap-3">
              <Image
                src="/images/fabelo-logo.webp"
                alt="Fabelo"
                width={42}
                height={42}
                className="mag-logo rounded-[3px]"
              />
              <span className="display text-[1.9rem] leading-none" style={{ letterSpacing: "-0.04em" }}>
                Fabelo<span style={{ color: "var(--accent)" }}>.</span>
              </span>
            </div>
            <p className="max-w-[38ch] text-[0.95rem] leading-relaxed" style={{ color: "#9aa1aa" }}>
              An independent desk covering personal finance, career strategy and the AI tools that
              actually earn their subscription.
            </p>
            <div className="folio mt-6" style={{ color: "#6b7178" }}>
              ISTANBUL · LONDON · REMOTE
            </div>
          </div>

          <nav className="lg:col-span-2">
            <SutunBasligi>SECTIONS</SutunBasligi>
            <Liste items={SECTIONS} />
          </nav>

          <nav className="lg:col-span-3">
            <SutunBasligi>MASTHEAD</SutunBasligi>
            <Liste items={MASTHEAD_LINKS} />
          </nav>

          {/* Abonelik — ortadaki bosluğu doldurur ve footer'a amac katar.
              Kunyedeki "THE DISPATCH" ve "Subscribe" buraya geliyor: bu form
              HER sayfada var, ana sayfadaki bolum ise yalnizca ana sayfada. */}
          <div id="subscribe" className="lg:col-span-3">
            <SutunBasligi>THE DISPATCH</SutunBasligi>
            <p className="mb-4 text-[0.92rem] leading-relaxed" style={{ color: "#9aa1aa" }}>
              Twice a week. Money, career and AI — without the noise.
            </p>
            <ClientForm className="flex flex-col gap-2.5" source="footer">
              <input
                type="email"
                required
                placeholder="you@company.com"
                aria-label="E-posta adresiniz"
                className="h-11 w-full bg-transparent px-0 text-[0.95rem] outline-none"
                style={{ borderBottom: "1px solid #3a4048", color: "var(--paper)" }}
              />
              <button
                type="submit"
                className="h-11 w-full text-[0.72rem] font-bold tracking-[0.16em] transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)", color: "#08181c" }}
              >
                SUBSCRIBE FREE
              </button>
            </ClientForm>
          </div>
        </div>
      </div>

      {/* --- Konu dizini --------------------------------------------------
          Dagınık sarma yerine hizali kolonlar; 19 basligi taramak kolaylasiyor. */}
      <div className="mag-shell pb-12" style={{ borderTop: "1px solid #262c33", paddingTop: "2.5rem" }}>
        <div className="folio mb-6" style={{ color: "#6b7178" }}>
          § TOPIC INDEX — {FABELO_TAGS.length} SUBJECTS
        </div>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
          {FABELO_TAGS.map((t) => (
            <li key={t}>
              <Link
                href={`/tag/${t}`}
                className="text-[0.88rem] transition-colors hover:text-[var(--accent)]"
                style={{ color: "#9aa1aa" }}
              >
                {tagLabel(t)}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* --- PanicWorkz ekosistem agi -------------------------------------- */}
      <PanicWorkzNetwork />

      {/* --- Alt serit -----------------------------------------------------
          Sagda basa-don butonu duruyor; yaziyi ezmemesi icin pay birakiyoruz. */}
      <div style={{ borderTop: "1px solid #262c33" }}>
        <div className="mag-shell flex flex-col items-center justify-between gap-3 py-6 text-center sm:flex-row sm:text-left sm:pr-24">
          <span className="byline" style={{ color: "#6b7178" }}>
            © {new Date().getFullYear()} FABELO — ALL RIGHTS RESERVED
          </span>
          {/* Kunye satiri — iki marka da baglantili */}
          <span className="byline" style={{ color: "#6b7178" }}>
            BUILT ON{" "}
            <a
              href="https://panic.com.tr/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--accent)]"
              style={{ color: "#9aa1aa" }}
            >
              PANIC CMS
            </a>{" "}
            · ENGINEERED BY{" "}
            <a
              href="https://panicworkz.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--accent)]"
              style={{ color: "#9aa1aa" }}
            >
              PANICWORKZ
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
