"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, Sun, Moon } from "lucide-react";

// fabelo.io nav — birebir
const NAV = [
  { label: "Personal Finance", href: "/tag/personal-finance" },
  { label: "Career", href: "/tag/career" },
  { label: "AI & Tech", href: "/tag/ai-tech" },
  { label: "About", href: "/about" },
];

export default function MagazineHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const saved =
      typeof window !== "undefined" && localStorage.getItem("panic_theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("panic_theme", next ? "dark" : "light");
  };

  return (
    <>
      {/* ===== Billboard reklam (en üst) ===== */}
      <div className="pt-6 pb-2" style={{ background: "var(--bg)" }}>
        <div className="f-wide">
          <div className="f-ad f-ad--billboard">Advertisement · 970×250</div>
        </div>
      </div>

      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: "color-mix(in oklab, var(--bg) 90%, transparent)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="f-wide">
          <div className="flex items-center justify-between h-[76px] gap-6">
            {/* Logo — fabelo.io görsel logo (değişmez) */}
            <Link
              href="/"
              className="flex items-center shrink-0"
              aria-label="Fabelo home"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/fabelo-logo.webp"
                alt="Fabelo"
                className="h-10 w-auto"
              />
            </Link>

            {/* Nav — fabelo.io birebir */}
            <nav className="hidden lg:flex items-center gap-9">
              {NAV.map((n) => {
                const active = pathname.startsWith(n.href);
                return (
                  <Link
                    key={n.label}
                    href={n.href}
                    className="f-link text-[14px] font-semibold tracking-tight"
                    style={{ color: active ? "var(--accent)" : "var(--fg)" }}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (q.trim())
                    window.location.href = `/search?q=${encodeURIComponent(q)}`;
                }}
                className="hidden md:flex items-center gap-2 px-3.5 h-10 w-60 rounded-full border transition-colors focus-within:border-[var(--accent)]"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--bg-2)",
                }}
              >
                <Search
                  className="size-3.5"
                  style={{ color: "var(--muted)" }}
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search stories…"
                  className="bg-transparent outline-none text-sm w-full"
                  style={{ color: "var(--fg)" }}
                />
              </form>

              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center size-10 rounded-full border transition-colors hover:border-[var(--accent)]"
                style={{ borderColor: "var(--line)" }}
                aria-label="Toggle theme"
              >
                {dark ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>

              <a
                href="#subscribe"
                className="hidden sm:inline-flex items-center justify-center rounded-full px-5 h-10 text-sm font-semibold text-white transition-colors"
                style={{ background: "var(--accent)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--accent-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--accent)")
                }
              >
                Subscribe
              </a>

              <button
                onClick={() => setOpen((v) => !v)}
                className="lg:hidden inline-flex items-center justify-center size-10 rounded-full border"
                style={{ borderColor: "var(--line)" }}
                aria-label="Menu"
              >
                {open ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        {open && (
          <div
            className="lg:hidden border-t"
            style={{ borderColor: "var(--line)", background: "var(--bg)" }}
          >
            <div className="f-wide py-5 flex flex-col gap-4">
              {NAV.map((n) => (
                <Link
                  key={n.label}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="text-xl font-bold tracking-tight"
                  style={{ color: "var(--fg)" }}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
