"use client";

import { useEffect } from "react";

/**
 * YERINDE DUZENLEME — "Live In-Context" onizlemesinin calisan hali.
 *
 * NE BOZUKTU: panel, yazi duzenlenirken cerceveye her tus vurusunda
 * bir mesaj yolluyordu (PANIC_STUDIO_LIVE_UPDATE) ama YAYIN SAYFASINDA
 * O MESAJI DINLEYEN KIMSE YOKTU. Cerceve yayindaki KAYITLI sayfayi
 * gosteriyor, yazilan hicbir sey yansimiyordu. Ustundeki yesil nokta
 * "Live" diyordu; canli olan bir sey yoktu.
 *
 * Simdi iki yonlu:
 *   panel  → cerceve   yazdikca onizleme guncelleniyor
 *   cerceve → panel    onizlemede yazdikca editor guncelleniyor
 *
 * Ikincisi asil istenen sey: sayfanin uzerinde, gercek tasarimin
 * icinde yazmak. Baslik ve govde dogrudan duzenlenebilir hale
 * geliyor; degisiklik panele geri gidiyor ve oradan kaydediliyor.
 *
 * UC KOSUL saglanmadan hicbir sey olmuyor:
 *   1. Sayfa bir CERCEVE icinde (window !== window.parent)
 *   2. Adreste ?live=1
 *   3. Mesaj AYNI KAYNAKTAN geliyor
 * Ucuncusu onemli: postMessage'i herkes yollayabilir. Kaynak
 * dogrulanmasaydi baska bir sekme okurun gordugu yaziyi
 * degistirebilirdi.
 */

/* Panel bu adi ZATEN dinliyor (posts/[id]/page.tsx). Yeni bir ad
   uydurmak, iki tarafi birbirine baglamayan olu bir kanal birakirdi. */
const OLAY_GIDEN = "PANIC_LIVE_TO_STUDIO_SYNC";
const OLAY_GELEN = "PANIC_STUDIO_LIVE_UPDATE";
const OLAY_HAZIR = "PANIC_STUDIO_PREVIEW_READY";

export default function CanliOnizleme() {
  useEffect(() => {
    if (window === window.parent) return;

    const kok = window.location.origin;
    const baslik = document.querySelector<HTMLElement>('[data-canli="baslik"]');
    const govde = document.querySelector<HTMLElement>('[data-canli="govde"]');
    const kapak = document.querySelector<HTMLImageElement>('[data-canli="kapak"]');

    /* --- panel → cerceve --- */
    const dinle = (olay: MessageEvent) => {
      if (olay.origin !== kok) return;
      const v = olay.data;
      if (!v || v.type !== OLAY_GELEN) return;

      const { title, contentHtml, featuredImageUrl } = v.payload ?? {};

      /* Yazarken imlecin kacmamasi icin: o an duzenlenen ogeye
         DOKUNMUYORUZ. Yoksa panelde yazan biri her harfte kendi
         imlecini kaybederdi. */
      const odakta = document.activeElement;

      if (baslik && odakta !== baslik && typeof title === "string") {
        baslik.textContent = title;
      }
      if (govde && odakta !== govde && typeof contentHtml === "string") {
        govde.innerHTML = contentHtml;
      }
      if (kapak && typeof featuredImageUrl === "string" && featuredImageUrl) {
        kapak.src = featuredImageUrl;
      }
    };
    window.addEventListener("message", dinle);

    /* --- cerceve → panel: YERINDE DUZENLEME --- */
    const yolla = () => {
      window.parent.postMessage(
        {
          type: OLAY_GIDEN,
          source: "preview_frame",
          payload: {
            title: baslik?.textContent ?? undefined,
            contentHtml: govde?.innerHTML ?? undefined,
          },
        },
        kok
      );
    };

    /* Panele her tusta degil, yazma durunca haber veriliyor: her harfte
       mesaj yollamak editorun durumunu gereksizce dovuyordu. */
    let zamanlayici: ReturnType<typeof setTimeout> | null = null;
    const degisti = () => {
      if (zamanlayici) clearTimeout(zamanlayici);
      zamanlayici = setTimeout(yolla, 400);
    };

    const duzenlenebilirYap = (oge: HTMLElement | null) => {
      if (!oge) return;
      oge.contentEditable = "true";
      oge.spellcheck = false;
      /* Tarayicinin kendi mavi cercevesi tasarimi bozuyor; yerine
         okurun gordugu duzeni bozmayan ince bir isaret. */
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
    duzenlenebilirYap(govde);

    /* Nereye tiklanabilecegini gostermek icin: uzerine gelince ince
       bir cerceve. Okur bunu hic gormuyor — yalnizca onizlemede. */
    const stil = document.createElement("style");
    stil.textContent = `
      [data-canli="baslik"]:hover, [data-canli="govde"]:hover {
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent, #0fb5ce) 45%, transparent);
        border-radius: 2px;
      }
      [data-canli="baslik"], [data-canli="govde"] { transition: box-shadow 120ms; }
    `;
    document.head.appendChild(stil);

    /* Cerceve hazir: panel ilk icerigi yollayabilsin. Yoksa cerceve
       yuklenene kadar gonderilen mesajlar kayboluyordu. */
    window.parent.postMessage({ type: OLAY_HAZIR, source: "preview_frame" }, kok);

    return () => {
      window.removeEventListener("message", dinle);
      if (zamanlayici) clearTimeout(zamanlayici);
      stil.remove();
    };
  }, []);

  return null;
}
