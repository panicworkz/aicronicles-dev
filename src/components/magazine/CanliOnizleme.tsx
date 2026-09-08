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
    /* KOSUL BURADA, sunucuda degil.
       Once sayfa ?live=1 goruldugunde bu bileseni render ediyordu;
       ama sunucu tarafindaki o kosul tutmuyordu ve bilesen agaca hic
       girmiyordu — chunk yukleniyor, kod hic calismiyordu. Kosulu
       tarayiciya almak hem sorunu bitiriyor hem daha dogru: burada
       zaten pencerenin cerceve icinde olup olmadigina bakmak
       gerekiyor, o da yalnizca tarayicida bilinen bir sey.

       Okur icin bedeli yok: cerceve disinda ilk satirda cikiyor. */
    if (window === window.parent) return;
    if (new URLSearchParams(window.location.search).get("live") !== "1") return;

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

    /* ================= BLOK ARACLARI =================
       Istenen sey buydu: sayfanin uzerinde blogu tasimak, cogaltmak,
       silmek, araya yenisini koymak.

       Blogu ARAMAYA GEREK YOK: govde bloklardan uretildigi icin
       (lib/bloklar.ts) her ust duzey ogesi zaten bir blok. Yani DOM'un
       kendisi blok dizisi; ayri bir eslestirme tablosu tutmak
       gereksiz ve senkronu bozulabilecek bir sey olurdu.

       Arac cubugu govdenin DISINDA duruyor. Icine koysaydik
       contenteditable'in parcasi olur, kaydedilen HTML'e karisir ve
       okur dugmeleri gorurdu. */

    const araclar = document.createElement("div");
    araclar.style.cssText = [
      "position:fixed",
      "z-index:2147483000",
      "display:none",
      "gap:1px",
      "padding:3px",
      "border-radius:9px",
      "background:#0b1220",
      "box-shadow:0 8px 26px rgba(0,0,0,.3)",
      "font:500 12px/1 ui-sans-serif,system-ui,sans-serif",
    ].join(";");
    document.body.appendChild(araclar);

    let etkin: HTMLElement | null = null;

    const konumla = () => {
      if (!etkin || !etkin.isConnected) return gizle();
      const k = etkin.getBoundingClientRect();
      araclar.style.display = "flex";
      araclar.style.top = `${Math.max(6, k.top - 34)}px`;
      araclar.style.left = `${k.right - araclar.offsetWidth}px`;
    };

    const gizle = () => {
      araclar.style.display = "none";
      if (etkin) etkin.style.outline = "";
      etkin = null;
    };

    const secOlarakIsaretle = (oge: HTMLElement | null) => {
      if (etkin === oge) return;
      if (etkin) etkin.style.outline = "";
      etkin = oge;
      if (!etkin) return gizle();
      etkin.style.outline = "1px solid color-mix(in srgb, var(--accent,#0fb5ce) 55%, transparent)";
      etkin.style.outlineOffset = "6px";
      konumla();
    };

    const dugmeYap = (yazi: string, ipucu: string, is: () => void) => {
      const d = document.createElement("button");
      d.type = "button";
      d.textContent = yazi;
      d.title = ipucu;
      d.style.cssText =
        "all:unset;cursor:pointer;padding:5px 8px;border-radius:6px;color:#e6edf7;min-width:22px;text-align:center";
      d.addEventListener("mouseenter", () => (d.style.background = "#1d2a3d"));
      d.addEventListener("mouseleave", () => (d.style.background = "transparent"));
      /* mousedown'i durdurmak sart: yoksa tarayici odagi cubuga
         tasiyor, govdedeki imlec kayboluyor ve tikladigin blok
         "artik duzenlenmiyor" sayilıyordu. */
      d.addEventListener("mousedown", (e) => e.preventDefault());
      d.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        is();
        /* Degisiklik panele HEMEN gidiyor, 400 ms beklemeden: bunlar
           tus vurusu degil, tek seferlik islemler. */
        yolla();
        konumla();
      });
      araclar.appendChild(d);
      return d;
    };

    dugmeYap("↑", "Yukari tasi", () => {
      const o = etkin?.previousElementSibling;
      if (o && etkin) o.before(etkin);
    });

    dugmeYap("↓", "Asagi tasi", () => {
      const o = etkin?.nextElementSibling;
      if (o && etkin) o.after(etkin);
    });

    dugmeYap("⧉", "Cogalt", () => {
      if (!etkin) return;
      const kopya = etkin.cloneNode(true) as HTMLElement;
      kopya.style.outline = "";
      etkin.after(kopya);
    });

    dugmeYap("+", "Altina paragraf ekle", () => {
      if (!etkin) return;
      const yeni = document.createElement("p");
      yeni.innerHTML = "<br>";
      etkin.after(yeni);
      /* Yeni paragrafa imlec: eklemek ile yazmaya baslamak arasinda
         bir tiklama daha istemek gereksiz. */
      const aralik = document.createRange();
      aralik.selectNodeContents(yeni);
      aralik.collapse(true);
      const secim = window.getSelection();
      secim?.removeAllRanges();
      secim?.addRange(aralik);
      secOlarakIsaretle(yeni);
    });

    const silDugmesi = dugmeYap("✕", "Sil", () => {
      /* Son blok silinmiyor: govde tamamen bosalinca contenteditable
         icinde imlec koyacak yer kalmiyor ve yazi yazilamaz hale
         geliyor. */
      if (!etkin || govde!.children.length <= 1) return;
      const yerine = (etkin.nextElementSibling ??
        etkin.previousElementSibling) as HTMLElement | null;
      etkin.remove();
      secOlarakIsaretle(yerine);
    });
    silDugmesi.style.color = "#ff9b9b";

    /* Hangi blogun uzerindeyiz: fare govdenin icindeyken en yakin ust
       duzey ogeyi buluyoruz. */
    const uzerinde = (e: MouseEvent) => {
      const hedef = e.target as HTMLElement | null;
      if (!hedef || !govde) return;
      let d: HTMLElement | null = hedef;
      while (d && d.parentElement !== govde) d = d.parentElement;
      if (d) secOlarakIsaretle(d);
    };
    govde?.addEventListener("mousemove", uzerinde);

    /* Fare cubugun uzerine giderken blok secimi kaybolmamali; o yuzden
       yalnizca ikisinin de disina cikilinca gizleniyor. */
    const disari = (e: MouseEvent) => {
      const h = e.relatedTarget as Node | null;
      if (h && (govde?.contains(h) || araclar.contains(h))) return;
      gizle();
    };
    govde?.addEventListener("mouseleave", disari);
    araclar.addEventListener("mouseleave", disari);

    window.addEventListener("scroll", konumla, true);
    window.addEventListener("resize", konumla);

    /* Nereye tiklanabilecegini gostermek icin: uzerine gelince ince
       bir cerceve. Okur bunu hic gormuyor — yalnizca onizlemede. */
    const stil = document.createElement("style");
    stil.textContent = `
      /* Govdenin TAMAMINI cerceveleyen eski vurgu kaldirildi: artik
         her blok kendi cercevesini gosteriyor, ikisi ust uste binince
         hangi seyin secili oldugu okunmuyordu. */
      [data-canli="baslik"]:hover {
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent, #0fb5ce) 45%, transparent);
        border-radius: 2px;
      }
      [data-canli="baslik"] { transition: box-shadow 120ms; }
      [data-canli="govde"] > * { transition: outline-color 120ms; }
    `;
    document.head.appendChild(stil);

    /* Cerceve hazir: panel ilk icerigi yollayabilsin. Yoksa cerceve
       yuklenene kadar gonderilen mesajlar kayboluyordu. */
    window.parent.postMessage({ type: OLAY_HAZIR, source: "preview_frame" }, kok);

    return () => {
      window.removeEventListener("message", dinle);
      window.removeEventListener("scroll", konumla, true);
      window.removeEventListener("resize", konumla);
      govde?.removeEventListener("mousemove", uzerinde);
      govde?.removeEventListener("mouseleave", disari);
      if (zamanlayici) clearTimeout(zamanlayici);
      araclar.remove();
      stil.remove();
    };
  }, []);

  return null;
}
