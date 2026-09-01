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
      birakildi = true; // kaydirma bitene kadar KARISMA

      /**
       * Yumusak kaydirma suruyorken sabitlemeye baslarsak hareketi daha
       * basinda kesiyoruz ve sayfa "pat" diye ziplamis gibi oluyor.
       * Bu yuzden once kaydirmanin durmasini bekliyoruz: konum ust uste
       * uc olcumde ayni kalinca hareket bitmis demektir.
       */
      let sonKonum = -1;
      let sabitSayac = 0;
      const bekle = () => {
        const simdi = Math.round(window.scrollY);
        sabitSayac = simdi === sonKonum ? sabitSayac + 1 : 0;
        sonKonum = simdi;

        if (sabitSayac >= 3) {
          // Hareket bitti; simdi kisa sure hedefi yerinde tut
          birakildi = false;
          bitis = performance.now() + 1500;
          beklenenKonum = simdi;
          requestAnimationFrame(sabitle);
          return;
        }
        requestAnimationFrame(bekle);
      };
      requestAnimationFrame(bekle);
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
