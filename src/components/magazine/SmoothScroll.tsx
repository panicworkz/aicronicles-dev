"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * Cipa hedefi, yapiskan kunyenin TAM altina otursun; ustte bosluk kalmasin.
 * Kunye yuksekligi duruma gore degisiyor (kaydirinca kisaliyor, mobilde farkli),
 * bu yuzden sabit sayi yerine tiklama aninda olcuyoruz.
 */
const measureHeader = () => {
  const el = document.querySelector("header");
  return el ? Math.round(el.getBoundingClientRect().height) : 148;
};

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenisRef.current = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const reducedMotion = () =>
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    /** Yedek: Lenis calismazsa tarayicinin kendi kaydirmasi (CSS scroll-margin devrede) */
    const nativeTo = (el: Element) => {
      const y = el.getBoundingClientRect().top + window.scrollY - measureHeader();
      window.scrollTo({ top: Math.max(0, y), behavior: "auto" });
    };

    /** Hedefe kunye payini birakarak yumusakca kaydir */
    const glideTo = (hash: string, animate = true) => {
      const el = document.querySelector(hash);
      if (!el) return false;

      // Sekme arka plandaysa veya kullanici hareketi azaltmayi sectiyse
      // rAF durur; Lenis animasyon suremez. Dogrudan tarayiciya birak.
      if (!animate || reducedMotion() || document.visibilityState === "hidden") {
        nativeTo(el);
        return true;
      }

      const oncekiKonum = window.scrollY;
      lenis.scrollTo(el as HTMLElement, {
        offset: -measureHeader(),
        duration: 1.2,
      });

      // Guvenlik agi: 150ms icinde hicbir hareket yoksa (rAF bogulmus,
      // Lenis olmemis vb.) kullanici tiklayip hicbir sey olmadigini
      // gormesin diye tarayicinin kendi kaydirmasina dus.
      window.setTimeout(() => {
        if (Math.abs(window.scrollY - oncekiKonum) < 2) nativeTo(el);
      }, 150);

      return true;
    };

    /**
     * Ayni sayfadaki cipa baglantilarini yakala. Tarayicinin sert ziplamasi
     * yerine Lenis ile kaydir; boylece hem hareket yumusak olur hem de
     * hedef baslik kunyenin altinda kalmaz.
     */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = (e.target as HTMLElement)?.closest?.("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || !href.includes("#")) return;

      const url = new URL(href, window.location.href);
      // Farkli sayfaya gidiyorsa karisma
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      if (!url.hash || url.hash === "#") return;

      if (glideTo(url.hash)) {
        // Yakalama fazindayiz: Next.js Link kendi anlik kaydirmasini
        // yapmadan once olayi burada bitiriyoruz.
        e.preventDefault();
        e.stopPropagation();
        window.history.pushState(null, "", url.hash);
      }
    };

    // Yakalama fazi (true): Next.js Link'in tiklamayi almasindan ONCE calisir
    document.addEventListener("click", onClick, true);

    // Sayfa dogrudan /#dispatch ile acildiysa dogru konuma yerlestir
    if (window.location.hash) {
      requestAnimationFrame(() => glideTo(window.location.hash, false));
    }

    return () => {
      document.removeEventListener("click", onClick, true);
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
