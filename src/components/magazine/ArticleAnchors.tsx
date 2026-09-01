"use client";

import { useEffect } from "react";

/**
 * Yazi icindeki icindekiler (TOC) baglantilarini yonetir.
 *
 * Neden gerekli: hedefin kunyenin altina oturmasi CSS'teki scroll-margin-top'a
 * birakildiginda, tiklama aninda araya baska seyler girebiliyordu (Next'in
 * hash yonetimi, hedefin konumunun o an henuz kesinlesmemis olmasi). Burada
 * tiklamayi tamamen ustleniyoruz: kunyeyi O AN olcuyoruz, hedefin guncel
 * konumunu O AN hesapliyoruz ve tek bir yumusak kaydirma yapiyoruz.
 *
 * Kaydirma motoru yok, varista duzeltme turu yok - tek atis.
 */
export default function ArticleAnchors() {
  useEffect(() => {
    const kunyeYuksekligi = () => {
      const el = document.querySelector("header");
      return el ? Math.round(el.getBoundingClientRect().height) : 145;
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = (e.target as HTMLElement)?.closest?.("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;

      let hedef: Element | null = null;
      try {
        hedef = document.querySelector(href);
      } catch {
        return;
      }
      if (!hedef) return;

      e.preventDefault();

      const y = Math.max(
        0,
        Math.round(hedef.getBoundingClientRect().top + window.scrollY - kunyeYuksekligi())
      );

      const azaltilmis = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      window.scrollTo({ top: y, behavior: azaltilmis ? "auto" : "smooth" });

      // Adres cubugunu guncelle ama yeniden yonlendirme tetikleme
      history.replaceState(null, "", href);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
