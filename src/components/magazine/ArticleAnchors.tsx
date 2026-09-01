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

      const git = () => {
        const y = Math.max(
          0,
          Math.round(hedef!.getBoundingClientRect().top + window.scrollY - kunyeYuksekligi())
        );
        const azaltilmis = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        window.scrollTo({ top: y, behavior: azaltilmis ? "auto" : "smooth" });
        // Adres cubugunu guncelle ama yeniden yonlendirme tetikleme
        history.replaceState(null, "", href);
      };

      /**
       * Sayfa yeni acildiysa yazi tipleri hala yedek fontla cizilmis olabilir.
       * Newsreader/Inter yuklenince metin olculeri degisiyor, satirlar yeniden
       * kiriliyor ve TUM basliklar kayiyor. Olcumu bundan once yaparsak ilk
       * tiklama hedefi kaciriyor; ikinci tiklamada fontlar yerlestigi icin
       * dogru calisiyordu. Hedefi konumlandirmadan once yerlesmeyi bekliyoruz.
       *
       * Ayni sekilde hedefin USTUNDE kalan, henuz yuklenmemis gorseller de
       * konumu asagi iter; onlari da bekliyoruz. Bekleme her durumda
       * sinirlanir, tiklama asla asili kalmaz.
       */
      const hedefUstu = hedef.getBoundingClientRect().top + window.scrollY;
      const ustteBekleyenGorseller = [...document.images].filter(
        (img) => !img.complete && img.getBoundingClientRect().top + window.scrollY < hedefUstu
      );

      const yerlesme: Promise<unknown>[] = [];
      if (document.fonts && document.fonts.status !== "loaded") yerlesme.push(document.fonts.ready);
      for (const img of ustteBekleyenGorseller) {
        yerlesme.push(new Promise((r) => { img.addEventListener("load", r, { once: true });
                                           img.addEventListener("error", r, { once: true }); }));
      }

      if (yerlesme.length === 0) {
        git();
        return;
      }

      const sinir = new Promise((r) => setTimeout(r, 600));
      Promise.race([Promise.all(yerlesme), sinir]).then(git);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
