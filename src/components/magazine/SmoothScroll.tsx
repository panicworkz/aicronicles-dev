"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * Yapiskan kunyenin yuksekligi. Sayfa kaydirilinca kunye kisaliyor
 * (padding 1.15rem -> 0.55rem), bu yuzden hedefe varildigindaki "kisa"
 * yukseklige gore pay birakiyoruz + biraz nefes payi.
 */
const HEADER_OFFSET = 132;

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

    /** Hedefe kunye payini birakarak yumusakca kaydir */
    const glideTo = (hash: string, animate = true) => {
      const el = document.querySelector(hash);
      if (!el) return false;
      lenis.scrollTo(el as HTMLElement, {
        offset: -HEADER_OFFSET,
        duration: animate ? 1.2 : 0,
        immediate: !animate,
      });
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
