"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Sayfanin basina don. Bir ekran boyu asagi inilince beliriyor.
 * Kaydirma, cipa baglantilariyla ayni yumusak hareketi kullanir;
 * rAF bogulmussa (arka plan sekmesi) veya kullanici hareketi azaltmayi
 * sectiyse aninda yukari cikar.
 */
export default function BackToTop() {
  const [gorunur, setGorunur] = useState(false);

  useEffect(() => {
    const onScroll = () => setGorunur(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const yukari = () => {
    const azaltilmisHareket =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (azaltilmisHareket || document.visibilityState === "hidden") {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const baslangic = window.scrollY;
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Guvenlik agi: 150ms icinde hareket yoksa dogrudan tepeye git
    window.setTimeout(() => {
      if (Math.abs(window.scrollY - baslangic) < 2) window.scrollTo({ top: 0, behavior: "auto" });
    }, 150);
  };

  return (
    <button
      onClick={yukari}
      aria-label="Sayfanın başına dön"
      title="Başa dön"
      className="group fixed bottom-7 right-7 z-40 grid size-12 place-items-center transition-all duration-500"
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        border: "1px solid var(--ink)",
        opacity: gorunur ? 1 : 0,
        transform: gorunur ? "translateY(0)" : "translateY(12px)",
        pointerEvents: gorunur ? "auto" : "none",
      }}
    >
      <ArrowUp className="size-[18px] transition-transform duration-300 group-hover:-translate-y-0.5" />
      <span
        className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap px-2 py-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.62rem",
          letterSpacing: "0.14em",
        }}
      >
        TOP
      </span>
    </button>
  );
}
