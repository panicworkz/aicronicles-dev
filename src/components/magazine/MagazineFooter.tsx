"use client";

import React from "react";
import Link from "next/link";

// fabelo.io footer yapısı — birebir (signup + topics + legal)
export default function MagazineFooter() {
  return (
    <footer
      style={{ background: "var(--bg-2)", borderTop: "1px solid var(--line)" }}
    >
      <div className="f-wide py-16">
        {/* Brand + signup */}
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/fabelo-logo.webp"
              alt="Fabelo"
              className="h-11 w-auto"
            />
            <p
              className="mt-5 max-w-md text-[15.5px] leading-[1.7]"
              style={{ color: "var(--muted)" }}
            >
              Personal finance tips, career strategies, and AI tool reviews for
              ambitious professionals.
            </p>
          </div>

          <div id="subscribe" className="f-newsletter p-8">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/80">
              Newsletter
            </p>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
              Get smarter about money &amp; AI.
            </h3>
            <p className="mt-2 text-[14.5px] text-white/85">
              One curated dispatch, twice a week. No spam.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-5 flex flex-col sm:flex-row gap-2"
            >
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="flex-1 h-12 px-4 text-sm rounded-full outline-none"
              />
              <button
                className="h-12 px-6 rounded-full text-sm font-bold"
                style={{ background: "#15171a", color: "#fff" }}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <hr className="f-rule my-12" />

        {/* Menüler — fabelo.io birebir */}
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p
              className="text-[12px] font-bold uppercase tracking-[0.16em] mb-4"
              style={{ color: "var(--muted)" }}
            >
              Topics
            </p>
            <div className="flex flex-col gap-2.5 text-[14.5px]">
              <Link
                href="/tag/personal-finance"
                className="f-link"
                style={{ color: "var(--fg)" }}
              >
                Personal Finance
              </Link>
              <Link
                href="/tag/career"
                className="f-link"
                style={{ color: "var(--fg)" }}
              >
                Career
              </Link>
              <Link
                href="/tag/ai-tech"
                className="f-link"
                style={{ color: "var(--fg)" }}
              >
                AI &amp; Tech
              </Link>
            </div>
          </div>
          <div>
            <p
              className="text-[12px] font-bold uppercase tracking-[0.16em] mb-4"
              style={{ color: "var(--muted)" }}
            >
              Company
            </p>
            <div className="flex flex-col gap-2.5 text-[14.5px]">
              <Link
                href="/about"
                className="f-link"
                style={{ color: "var(--fg)" }}
              >
                About
              </Link>
              <Link
                href="/advertise"
                className="f-link"
                style={{ color: "var(--fg)" }}
              >
                Advertise
              </Link>
              <Link
                href="/sponsor"
                className="f-link"
                style={{ color: "var(--fg)" }}
              >
                Sponsor
              </Link>
            </div>
          </div>
          <div>
            <p
              className="text-[12px] font-bold uppercase tracking-[0.16em] mb-4"
              style={{ color: "var(--muted)" }}
            >
              Legal
            </p>
            <div className="flex flex-col gap-2.5 text-[14.5px]">
              <Link
                href="/terms-and-conditions"
                className="f-link"
                style={{ color: "var(--fg)" }}
              >
                Terms &amp; conditions
              </Link>
              <Link
                href="/data-and-privacy"
                className="f-link"
                style={{ color: "var(--fg)" }}
              >
                Data &amp; privacy
              </Link>
            </div>
          </div>
        </div>

        <hr className="f-rule my-10" />

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px]"
          style={{ color: "var(--muted)" }}
        >
          <span>© {new Date().getFullYear()} Fabelo. All rights reserved.</span>
          <span className="f-mono text-[11px] uppercase tracking-[0.18em]">
            Powered by Panic CMS
          </span>
        </div>
      </div>
    </footer>
  );
}
