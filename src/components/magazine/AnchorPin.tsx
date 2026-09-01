"use client";

import { useEffect } from "react";

/**
 * Cipa hedefini varista YERINDE TUTAR.
 *
 * Tarayicinin cipa mantigi hedefin konumunu tiklama aninda cozer. Sayfa o
 * andan sonra yeniden yerlesirse (yazi tipi degisimi, gec yuklenen bir gorsel,
 * gomulu icerik) hedef kayar ve okuyucu yanlis yerde kalir. Hicbir kutuphane
 * bunu cozmez; hepsi ayni sekilde tek seferlik olcum yapar.
 *
 * Burada tiklamadan sonra kisa bir sure hedefi izliyoruz: hedef kayarsa VE
 * kullanici bu sirada kendisi kaydirmadiysa, sayfayi sessizce hedefe geri
 * sabitliyoruz. Kullanici kaydirmaya baslarsa derhal birakiyoruz.
 */
export default function AnchorPin() {
  useEffect(() => {
    let hedef: Element | null = null;
    let birakildi = true;
    let beklenenKonum = 0;
    let bitis = 0;

    const kunye = () => {
      const el = document.querySelector("header");
      return el ? Math.round(el.getBoundingClientRect().height) : 145;
    };

    const sabitle = () => {
      if (birakildi || !hedef) return;
      if (performance.now() > bitis) {
        birakildi = true;
        return;
      }
      const olmasiGereken = Math.round(
        hedef.getBoundingClientRect().top + window.scrollY - kunye()
      );
      // Hedef kaydiysa (sayfa yeniden yerlesti) sessizce geri hizala
      if (Math.abs(olmasiGereken - Math.round(window.scrollY)) > 2) {
        beklenenKonum = olmasiGereken;
        window.scrollTo({ top: olmasiGereken, behavior: "instant" as ScrollBehavior });
      }
      requestAnimationFrame(sabitle);
    };

    const onClick = (e: MouseEvent) => {
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

      hedef = el;
      birakildi = false;
      bitis = performance.now() + 2500; // en fazla 2.5sn izle
      beklenenKonum = Math.round(window.scrollY);
      requestAnimationFrame(sabitle);
    };

    // Kullanici kendi kaydirmaya baslarsa karisma
    const kullaniciMudahalesi = () => {
      if (!birakildi && Math.abs(window.scrollY - beklenenKonum) > 120) birakildi = true;
    };

    document.addEventListener("click", onClick);
    window.addEventListener("wheel", () => (birakildi = true), { passive: true });
    window.addEventListener("touchstart", () => (birakildi = true), { passive: true });
    window.addEventListener("keydown", () => (birakildi = true));
    window.addEventListener("scroll", kullaniciMudahalesi, { passive: true });

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", kullaniciMudahalesi);
      birakildi = true;
    };
  }, []);

  return null;
}
