"use client";

import { useEffect } from "react";
import { blokYuzeyiKur } from "@/components/magazine/blok-yuzeyi";

/**
 * YERINDE DUZENLEME — "Live In-Context".
 *
 * Bu dosya MESAJLASMA katmani: panelle konusur, duzenleme yuzeyini
 * kurar. Bloklarin kendi denetimleri blok-yuzeyi.ts'de.
 *
 * Iki yonlu:
 *   panel  → cerceve   yazdikca onizleme guncelleniyor
 *   cerceve → panel    onizlemede yazdikca editor guncelleniyor
 *
 * UC KOSUL saglanmadan hicbir sey olmuyor:
 *   1. Sayfa bir CERCEVE icinde (window !== window.parent)
 *   2. Adreste ?live=1
 *   3. Mesaj AYNI KAYNAKTAN geliyor
 * Ucuncusu onemli: postMessage'i herkes yollayabilir. Kaynak
 * dogrulanmasaydi baska bir sekme okurun gordugu yaziyi
 * degistirebilirdi.
 */

/* Panel bu adlari ZATEN dinliyor (posts/[id]/page.tsx). Yeni ad
   uydurmak, iki tarafi baglamayan olu bir kanal birakirdi. */
const OLAY_GIDEN = "PANIC_LIVE_TO_STUDIO_SYNC";
const OLAY_GELEN = "PANIC_STUDIO_LIVE_UPDATE";
const OLAY_HAZIR = "PANIC_STUDIO_PREVIEW_READY";
const OLAY_GORSEL = "PANIC_OPEN_IMAGE_STUDIO";

export default function CanliOnizleme() {
  useEffect(() => {
    /* KOSUL BURADA, sunucuda degil. Once sayfa ?live=1 goruldugunde bu
       bileseni render ediyordu; sunucudaki o kosul tutmuyor ve bilesen
       agaca hic girmiyordu — chunk yukleniyor, kod hic calismiyordu.
       Burada zaten pencerenin cerceve icinde olup olmadigina bakmak
       gerekiyor, o da yalnizca tarayicida bilinen bir sey. */
    if (window === window.parent) return;
    if (new URLSearchParams(window.location.search).get("live") !== "1") return;

    const kok = window.location.origin;
    const baslik = document.querySelector<HTMLElement>('[data-canli="baslik"]');
    const ozet = document.querySelector<HTMLElement>('[data-canli="ozet"]');
    const govde = document.querySelector<HTMLElement>('[data-canli="govde"]');
    const kapak = document.querySelector<HTMLImageElement>('[data-canli="kapak"]');

    /* --- cerceve → panel --- */
    const yolla = () => {
      window.parent.postMessage(
        {
          type: OLAY_GIDEN,
          source: "preview_frame",
          payload: {
            title: baslik?.textContent ?? undefined,
            /* Ozet EKLENDI. Once yalnizca baslik, govde ve kapak
               gidiyordu; basligin altindaki aciklama hicbir yonde
               eslesmiyordu, yani duzenlemek mumkun degildi. */
            excerpt: ozet?.textContent ?? undefined,
            contentHtml: govde?.innerHTML ?? undefined,
          },
        },
        kok
      );
    };

    /* --- panel → cerceve --- */
    const dinle = (olay: MessageEvent) => {
      if (olay.origin !== kok) return;
      const v = olay.data;
      if (!v || v.type !== OLAY_GELEN) return;

      const { title, excerpt, contentHtml, featuredImageUrl } = v.payload ?? {};

      /* O an duzenlenen ogeye DOKUNULMUYOR: yoksa panelde yazan biri
         her harfte kendi imlecini kaybederdi. */
      const odakta = document.activeElement;

      if (baslik && odakta !== baslik && typeof title === "string") {
        baslik.textContent = title;
      }
      if (ozet && odakta !== ozet && typeof excerpt === "string") {
        ozet.textContent = excerpt;
      }
      if (govde && odakta !== govde && typeof contentHtml === "string") {
        govde.innerHTML = contentHtml;
      }
      if (kapak && typeof featuredImageUrl === "string" && featuredImageUrl) {
        kapak.src = featuredImageUrl;
      }
    };
    window.addEventListener("message", dinle);

    /* Panele her tusta degil, yazma durunca haber veriliyor: her harfte
       mesaj yollamak editorun durumunu gereksizce doverdi. */
    let zamanlayici: ReturnType<typeof setTimeout> | null = null;
    const degisti = () => {
      if (zamanlayici) clearTimeout(zamanlayici);
      zamanlayici = setTimeout(yolla, 400);
    };

    const duzenlenebilirYap = (oge: HTMLElement | null) => {
      if (!oge) return;
      oge.contentEditable = "true";
      oge.spellcheck = false;
      oge.style.outline = "none";
      oge.addEventListener("input", degisti);
      oge.addEventListener("blur", yolla);
      oge.addEventListener("focus", () => {
        oge.style.boxShadow = "0 0 0 2px var(--accent, #0fb5ce)";
      });
      oge.addEventListener("blur", () => {
        oge.style.boxShadow = "none";
      });
    };

    duzenlenebilirYap(baslik);
    duzenlenebilirYap(ozet);
    duzenlenebilirYap(govde);

    /**
     * GORSEL DUZENLEME PENCERESI.
     *
     * Panel bu mesaji bastan beri dinliyordu ama GONDEREN KIMSE YOKTU:
     * gorsel studyosu yazilmis, kablosu takilmamisti. Onizlemede bir
     * gorsele tiklamak hicbir sey yapmiyor, bu yuzden gorsel
     * degistirmek mumkun olmuyordu — yalnizca silmek.
     */
    const gorselAc = (img: HTMLImageElement) => {
      window.parent.postMessage(
        {
          type: OLAY_GORSEL,
          source: "preview_frame",
          payload: {
            src: img.getAttribute("src") || "",
            alt: img.getAttribute("alt") || "",
            title: img.getAttribute("title") || "",
            caption:
              img.closest("figure")?.querySelector("figcaption")?.textContent ||
              img.getAttribute("data-caption") ||
              "",
            /* Kapak gorseli yaziya degil kayda ait; panel onu ayri
               kaydediyor. */
            isCover: img.dataset.canli === "kapak",
          },
        },
        kok
      );
    };

    /* Kapak gorseline cift tiklamak da ayni pencereyi aciyor. */
    const kapakTik = (e: MouseEvent) => {
      e.preventDefault();
      gorselAc(kapak!);
    };
    kapak?.addEventListener("dblclick", kapakTik);

    /* Blok denetimleri: tur farkindaligi burada degil, blok-yuzeyi.ts
       icinde ve BLOK_TANIMLARI kaydindan besleniyor. */
    const yuzeyiKaldir = govde
      ? blokYuzeyiKur({ govde, yolla, gorselAc })
      : () => {};

    /* Uzerine gelince ince bir isaret — okur bunu hic gormuyor. */
    const stil = document.createElement("style");
    stil.textContent = `
      [data-canli="baslik"]:hover, [data-canli="ozet"]:hover {
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent, #0fb5ce) 45%, transparent);
        border-radius: 2px;
      }
      [data-canli="baslik"], [data-canli="ozet"] { transition: box-shadow 120ms; }
      [data-canli="govde"] > * { transition: outline-color 120ms; }
      [data-canli="govde"] img { cursor: pointer; }
    `;
    document.head.appendChild(stil);

    /* Cerceve hazir: panel ilk icerigi yollayabilsin. Yoksa cerceve
       yuklenene kadar gonderilen mesajlar kayboluyordu. */
    window.parent.postMessage({ type: OLAY_HAZIR, source: "preview_frame" }, kok);

    return () => {
      window.removeEventListener("message", dinle);
      kapak?.removeEventListener("dblclick", kapakTik);
      yuzeyiKaldir();
      if (zamanlayici) clearTimeout(zamanlayici);
      stil.remove();
    };
  }, []);

  return null;
}
