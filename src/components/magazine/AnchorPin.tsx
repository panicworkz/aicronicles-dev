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

    const hedefKonumu = (el: Element) =>
      Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - kunye()));

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
      if (!href || !href.startsWith("#") || href === "#") return;

      let el: Element | null = null;
      try {
        el = document.querySelector(href);
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

      history.replaceState(null, "", href);
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
