"use client";

import { useEffect } from "react";

/**
 * Cipa baglantilari icin hedefi TAKIP EDEN yumusak kaydirma.
 *
 * Sorun neydi: hem tarayicinin kendi yumusak kaydirmasi hem de butun hazir
 * kutuphaneler, hedefin piksel konumunu TIKLAMA ANINDA bir kez hesaplar ve o
 * sabit noktaya dogru yol alir. Yolculuk ~700ms surer; bu sirada ekrana giren
 * tembel gorseller yuklenir, sayfa yeniden yerlesir ve hedef kayar. Tarayici
 * ise hala eski noktaya gittigi icin yanlis yerde durur.
 *
 * Aninda kaydirmada bu olmaz: yolculuk yoktur, hedefe hemen varilir ve
 * sonraki yerlesmelerde tarayicinin kendi kaydirma cipasi konumu korur.
 * Kullanicinin gozlemi de tam boyleydi - "pat diye" calisiyor, yumusakta
 * sasiyordu.
 *
 * Cozum: her karede hedefin GUNCEL konumunu yeniden olcup oraya dogru
 * ilerliyoruz. Yol boyunca sayfa yeniden yerlesse bile hedefi kaybetmiyoruz.
 */

const SURE = 650; // ms

export default function AnchorPin() {
  useEffect(() => {
    let calisiyor = false;
    let iptal = false;

    const kunye = () => {
      const el = document.querySelector("header");
      return el ? Math.round(el.getBoundingClientRect().height) : 145;
    };

    /**
     * Ust pay: oncelik hedefin kendi scroll-margin-top degerinde. CSS'te
     * varsayilan olarak kunye yuksekligi yazili, ama tek tek hedefler bunu
     * artirabiliyor (footer'daki abonelik sutunu gibi). Burada sabit kunye
     * yuksekligi kullansaydik, tarayicinin kendi cipa davranisiyla bizimki
     * ayri yerlere gider, iki farkli sonuc cikardi.
     */
    const ustPay = (el: Element) => {
      const v = parseFloat(getComputedStyle(el).scrollMarginTop || "");
      return Number.isFinite(v) && v > 0 ? v : kunye();
    };

    const hedefKonumu = (el: Element) =>
      Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - ustPay(el)));

    const git = (el: Element) => {
      const baslangic = window.scrollY;
      const t0 = performance.now();
      calisiyor = true;
      iptal = false;

      const kare = (simdi: number) => {
        if (iptal) {
          calisiyor = false;
          return;
        }

        const p = Math.min(1, (simdi - t0) / SURE);
        // yumusak giris-cikis (ease-out cubic)
        const e = 1 - Math.pow(1 - p, 3);

        // HEDEFI HER KAREDE YENIDEN OLC — yol boyunca sayfa kayabilir
        const hedef = hedefKonumu(el);
        const y = Math.round(baslangic + (hedef - baslangic) * e);

        window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });

        if (p < 1) {
          requestAnimationFrame(kare);
        } else {
          // Son karede tam hedefe otur
          window.scrollTo({ top: hedefKonumu(el), behavior: "instant" as ScrollBehavior });
          calisiyor = false;
        }
      };

      requestAnimationFrame(kare);

      // Sekme arka plandaysa kare dongusu calismaz; tiklama sonucsuz kalmasin
      // diye kisa bir sure sonra hareket baslamadiysa dogrudan hedefe git.
      window.setTimeout(() => {
        if (calisiyor && Math.abs(window.scrollY - baslangic) < 2) {
          iptal = true;
          window.scrollTo({ top: hedefKonumu(el), behavior: "instant" as ScrollBehavior });
        }
      }, 200);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = (e.target as HTMLElement)?.closest?.("a");
      const href = link?.getAttribute("href");
      if (!href) return;

      /**
       * Iki bicimi de karsiliyoruz:
       *   "#subscribe"        — ayni sayfada
       *   "/#dispatch"        — yol + cipa; yalnizca ZATEN o sayfadaysak.
       * Ikincisi yazi sayfasindan tiklandiginda dokunmuyoruz, tarayici ana
       * sayfaya gitsin. Ana sayfadayken ise gereksiz yeniden yukleme yerine
       * yumusak kaydirma yapiyoruz.
       */
      let cipa: string | null = null;
      if (href.startsWith("#")) {
        cipa = href;
      } else if (href.startsWith("/") && href.includes("#")) {
        const [yol, parca] = href.split("#");
        if (parca && yol === window.location.pathname) cipa = `#${parca}`;
      }
      if (!cipa || cipa === "#") return;

      let el: Element | null = null;
      try {
        el = document.querySelector(cipa);
      } catch {
        return;
      }
      if (!el) return;

      e.preventDefault();

      const azaltilmis = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      if (azaltilmis) {
        window.scrollTo({ top: hedefKonumu(el), behavior: "instant" as ScrollBehavior });
      } else {
        git(el);
      }

      history.replaceState(null, "", cipa);
    };

    // Kullanici araya girerse hareketi birak
    const birak = () => {
      if (calisiyor) iptal = true;
    };

    document.addEventListener("click", onClick);
    window.addEventListener("wheel", birak, { passive: true });
    window.addEventListener("touchstart", birak, { passive: true });
    window.addEventListener("keydown", birak);

    return () => {
      iptal = true;
      document.removeEventListener("click", onClick);
      window.removeEventListener("wheel", birak);
      window.removeEventListener("touchstart", birak);
      window.removeEventListener("keydown", birak);
    };
  }, []);

  return null;
}
