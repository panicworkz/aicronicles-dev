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

    /** Sayfanin basina yumusak donus (logo tiklamasi ve basa-don butonu icin) */
    const basaDon = () => {
      if (reducedMotion() || document.visibilityState === "hidden") {
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }
      const onceki = window.scrollY;
      lenis.scrollTo(0, { duration: 1.1 });
      window.setTimeout(() => {
        if (Math.abs(window.scrollY - onceki) < 2) window.scrollTo({ top: 0, behavior: "auto" });
      }, 150);
    };

    /** Hedefin, yapiskan kunyenin TAM altina gelecegi mutlak konum */
    const hedefKonum = (el: Element) =>
      Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - measureHeader()));

    /**
     * Varista kunye yuksekligi degismis olabilir (kaydirinca kisaliyor).
     * Bu yuzden hareket bitince olcup 1px'e kadar duzeltiyoruz; boylece
     * bolum her zaman kunyenin tam altina oturur, ustte bosluk kalmaz.
     */
    const duzelt = (el: Element) => {
      const fark = Math.round(el.getBoundingClientRect().top - measureHeader());
      if (Math.abs(fark) > 1) window.scrollTo({ top: window.scrollY + fark, behavior: "auto" });
    };

    const nativeTo = (el: Element) => {
      window.scrollTo({ top: hedefKonum(el), behavior: "auto" });
      requestAnimationFrame(() => duzelt(el));
      window.setTimeout(() => duzelt(el), 60);
    };

    /** Hedefe kunye payini birakarak yumusakca kaydir */
    const glideTo = (hash: string, animate = true) => {
      const el = document.querySelector(hash);
      if (!el) return false;

      if (!animate || reducedMotion() || document.visibilityState === "hidden") {
        nativeTo(el);
        return true;
      }

      const oncekiKonum = window.scrollY;
      // Eleman yerine MUTLAK KONUM veriyoruz: boylece CSS scroll-margin ile
      // Lenis'in kendi hesabi ust uste binip payi ikiye katlamiyor.
      lenis.scrollTo(hedefKonum(el), {
        duration: 1.2,
        onComplete: () => duzelt(el),
      });

      // Guvenlik agi: hareket hic baslamadiysa tarayiciya birak
      window.setTimeout(() => {
        if (Math.abs(window.scrollY - oncekiKonum) < 2) nativeTo(el);
      }, 150);

      // Kunye kisalmasi animasyon sirasinda oldugu icin sonda bir kez daha duzelt
      window.setTimeout(() => duzelt(el), 1400);

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
      // Cipa'siz ayni-sayfa baglantilarini da yakalamamiz gerekiyor (logo "/"),
      // bu yuzden burada "#" sarti aranmaz.
      if (!href) return;
      if (link.hasAttribute("download") || link.getAttribute("target") === "_blank") return;

      const url = new URL(href, window.location.href);
      // Farkli sayfaya gidiyorsa karisma
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;

      // Ayni sayfaya cipa'siz baglanti (ornegin ana sayfadayken logo) —
      // tarayici pat diye tepeye atmasin, yumusakca cikalim.
      if (!url.hash || url.hash === "#") {
        if (window.scrollY < 2) return; // zaten tepedeyiz, dokunma
        e.preventDefault();
        e.stopPropagation();
        basaDon();
        return;
      }

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

    // Basa-don butonu da ayni yumusak hareketi kullansin
    (window as any).__fabeloScrollTop = basaDon;

    return () => {
      delete (window as any).__fabeloScrollTop;
      document.removeEventListener("click", onClick, true);
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
