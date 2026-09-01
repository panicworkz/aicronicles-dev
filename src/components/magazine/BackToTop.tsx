"use client";

import React, { useEffect, useRef } from "react";

const BOYUT = 54; // px
const CIZGI = 1.5; // ilerleme halkasi kalinligi
const YARICAP = (BOYUT - CIZGI) / 2;
const CEVRE = 2 * Math.PI * YARICAP;

/**
 * Basa don. Editoryel dil: ince daire, okuma ilerlemesini gosteren halka,
 * mono "TOP" etiketi.
 *
 * Iki onemli davranis:
 *  - Koyu footer uzerine gelince renk ters cevriliyor; aksi halde buton da
 *    footer da ayni murekkep rengi oldugu icin gorunmez oluyordu.
 *  - Gorunurluk React state yerine dogrudan DOM'dan yonetiliyor; sekme arka
 *    plandayken React guncellemeleri ertelenip buton kayboluyordu.
 */
export default function BackToTop() {
  const kokRef = useRef<HTMLButtonElement>(null);
  const halkaRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const kok = kokRef.current;
    if (!kok) return;

    const guncelle = () => {
      const halka = halkaRef.current;
      const uzunluk = document.documentElement.scrollHeight - window.innerHeight;
      const oran = uzunluk > 0 ? Math.min(1, Math.max(0, window.scrollY / uzunluk)) : 0;

      // Bir ekran boyu inilince belir
      const goster = window.scrollY > window.innerHeight * 0.6;
      kok.style.opacity = goster ? "1" : "0";
      kok.style.transform = goster ? "translateY(0) scale(1)" : "translateY(10px) scale(0.96)";
      kok.style.pointerEvents = goster ? "auto" : "none";
      kok.setAttribute("aria-hidden", goster ? "false" : "true");
      kok.setAttribute("tabindex", goster ? "0" : "-1");

      if (halka) halka.style.strokeDashoffset = String(CEVRE * (1 - oran));
    };

    const onScroll = () => {
      guncelle();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const yukari = () => {
    // SmoothScroll'un Lenis ornegiyle ayni hareket
    const glide = (window as any).__fabeloScrollTop;
    if (typeof glide === "function") {
      glide();
      return;
    }
    const azaltilmis = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    window.scrollTo({ top: 0, behavior: azaltilmis ? "auto" : "smooth" });
  };

  return (
    <button
      ref={kokRef}
      onClick={yukari}
      aria-label="Sayfanın başına dön"
      className="mag group fixed bottom-8 right-8 z-50 grid place-items-center rounded-full"
      style={{
        width: BOYUT,
        height: BOYUT,
        background: "var(--ink)",
        color: "var(--paper)",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "var(--ink)",
        boxShadow: "0 0 0 2px var(--paper), 0 10px 30px -12px rgba(0,0,0,.45)",
        opacity: 0,
        transform: "translateY(10px) scale(0.96)",
        pointerEvents: "none",
        transition: "opacity .45s cubic-bezier(.22,1,.36,1), transform .45s cubic-bezier(.22,1,.36,1), background .35s, color .35s, border-color .35s",
      }}
    >
      {/* Okuma ilerlemesi halkasi */}
      <svg
        width={BOYUT}
        height={BOYUT}
        viewBox={`0 0 ${BOYUT} ${BOYUT}`}
        className="pointer-events-none absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          ref={halkaRef}
          cx={BOYUT / 2}
          cy={BOYUT / 2}
          r={YARICAP}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={CIZGI}
          strokeLinecap="round"
          strokeDasharray={CEVRE}
          strokeDashoffset={CEVRE}
          style={{ transition: "stroke-dashoffset .12s linear" }}
        />
      </svg>

      {/* Ok — hover'da yukari kayar */}
      <span className="relative block h-4 w-3 overflow-hidden">
        <svg
          viewBox="0 0 12 16"
          fill="none"
          className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-4"
        >
          <path d="M6 15V2M6 2L1.5 6.5M6 2l4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <svg
          viewBox="0 0 12 16"
          fill="none"
          className="absolute inset-0 translate-y-4 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0"
        >
          <path d="M6 15V2M6 2L1.5 6.5M6 2l4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>

      {/* Mono etiket — hover'da belirir */}
      <span
        className="pointer-events-none absolute right-full mr-3 whitespace-nowrap opacity-0 transition-all duration-300 group-hover:opacity-100"
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          color: "var(--ink-3)",
        }}
      >
        BAŞA DÖN
      </span>
    </button>
  );
}
