"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Moon, Sun, Menu, X } from "lucide-react";
import { FABELO_TAGS, tagLabel } from "@/lib/taxonomy";

/** fabelo.io menusuyle birebir: 3 bolum + About */
const SECTIONS = [
  { label: "Personal Finance", href: "/category/personal-finance" },
  { label: "Career", href: "/category/career" },
  { label: "AI & Tech", href: "/category/ai-tech" },
  { label: "About", href: "/about" },
];


export default function MagazineHeader() {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);

  const kunyeRef = React.useRef<HTMLElement>(null);

  /**
   * Cipa hedeflerinin kunyenin TAM altina oturmasi icin kunye yuksekligini
   * CSS degiskenine yaziyoruz. Sabit bir piksel degeri yazmak yanlisti:
   * yukseklik ekran genisligine, yazi tipi olculerine ve tarayici
   * yakinlastirmasina gore degisiyor, aradaki fark bosluk olarak goruluyordu.
   */
  useEffect(() => {
    const el = kunyeRef.current;
    if (!el) return;
    const yaz = () =>
      document.documentElement.style.setProperty(
        "--mag-header-h",
        `${Math.round(el.getBoundingClientRect().height)}px`
      );
    yaz();
    const gozlemci = new ResizeObserver(yaz);
    gozlemci.observe(el);
    window.addEventListener("resize", yaz);
    return () => {
      gozlemci.disconnect();
      window.removeEventListener("resize", yaz);
    };
  }, []);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <header ref={kunyeRef} className="sticky top-0 z-50" style={{ background: "var(--paper)" }}>
      {/* --- Ust serit: tarih + sayi + abone -------------------------------- */}
      <div style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className="mag-shell flex h-9 items-center justify-between">
          <span className="byline hidden sm:block">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span className="folio">FABELO — INDEPENDENT MONEY, CAREER &amp; AI DESK</span>
          <a href="/#dispatch" className="byline hidden sm:block hover:text-[var(--accent-ink)]">
            THE DISPATCH →
          </a>
        </div>
      </div>

      {/* --- Kunye ---------------------------------------------------------- */}
      <div
        className="transition-all duration-300"
        style={{ borderBottom: "1px solid var(--rule)", height: 72 }}
      >
        <div className="mag-shell flex h-full items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0"
            aria-label="Fabelo"
            onClick={(e) => {
              // Zaten bu sayfadaysak Next yeniden yonlendirip tepeye pat diye
              // atiyor; bunun yerine tarayicinin yumusak kaydirmasini kullan.
              if (window.location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0 });
              }
            }}
          >
            <Image
              src="/images/fabelo-logo.webp"
              alt="Fabelo"
              width={44}
              height={44}
              priority
              className="rounded-[3px]"
              style={{ width: stuck ? 30 : 40, height: stuck ? 30 : 40, transition: "all .3s" }}
            />
            <span
              className="display leading-none"
              style={{ fontSize: stuck ? "1.45rem" : "1.9rem", transition: "font-size .3s", letterSpacing: "-0.04em" }}
            >
              Fabelo<span style={{ color: "var(--accent)" }}>.</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-9">
            {SECTIONS.map((s) => (
              <Link key={s.href} href={s.href} className="group text-[0.9rem] font-medium">
                <span className="ulink">{s.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              aria-label="Search"
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-[var(--paper-2)]"
            >
              <Search className="size-[18px]" />
            </Link>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-[var(--paper-2)]"
            >
              {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
            <a
              href="/#dispatch"
              className="hidden sm:inline-flex h-9 items-center rounded-full px-5 text-[0.78rem] font-semibold tracking-wide"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              Subscribe
            </a>
            <button
              onClick={() => setOpen(!open)}
              aria-label="Menu"
              className="grid size-9 place-items-center rounded-full lg:hidden hover:bg-[var(--paper-2)]"
            >
              {open ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </button>
          </div>
        </div>
      </div>

      {/* --- 19 tag seridi --------------------------------------------------- */}
      <div className="marquee overflow-hidden" style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className="marquee-track flex w-max items-center gap-0 py-2">
          {[...FABELO_TAGS, ...FABELO_TAGS].map((t, i) => (
            <Link
              key={`${t}-${i}`}
              href={`/tag/${t}`}
              className="kicker whitespace-nowrap px-5 transition-colors hover:text-[var(--accent-ink)]"
            >
              {tagLabel(t)}
              <span className="ml-5" style={{ color: "var(--rule)" }}>
                ·
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* --- Mobil menu ------------------------------------------------------ */}
      {open && (
        <div className="lg:hidden" style={{ borderBottom: "1px solid var(--rule)", background: "var(--paper)" }}>
          <div className="mag-shell flex flex-col py-4">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                onClick={() => setOpen(false)}
                className="display py-2.5 text-2xl"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
