"use client";

import { useEffect } from "react";
import { blokYuzeyiKur, duzenlenebilirlikUygula } from "@/components/magazine/blok-yuzeyi";

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
const OLAY_GORSEL_SONUC = "PANIC_STUDIO_IMAGE_RESULT";
const OLAY_URUN = "PANIC_OPEN_PRODUCT_PICKER";
const OLAY_URUN_SONUC = "PANIC_STUDIO_PRODUCT_RESULT";
const OLAY_ODAK = "PANIC_STUDIO_FOCUS";

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
      if (!v) return;
      if (v.type === OLAY_ODAK) {
        odakUygula(Boolean(v.payload?.acik));
        odakSonrasiOlc();
        return;
      }
      if (v.type !== OLAY_GELEN && v.type !== OLAY_GORSEL_SONUC && v.type !== OLAY_URUN_SONUC) return;

      if (v.type === OLAY_GORSEL_SONUC) {
        const { istek, src, alt, title: baslikOz, caption } = v.payload ?? {};
        const img = bekleyen.get(istek) as HTMLImageElement | undefined;
        if (!img) return;
        bekleyen.delete(istek);
        if (src) img.setAttribute("src", src);
        img.setAttribute("alt", alt ?? "");
        if (baslikOz) img.setAttribute("title", baslikOz);
        else img.removeAttribute("title");

        /* Altyazi figure icine yaziliyor: figcaption ancak orada
           basiliyor, yoksa girilen metin sessizce kaybolurdu. */
        const cerceve = img.closest("figure");
        if (cerceve) {
          let alt2 = cerceve.querySelector("figcaption");
          if (caption) {
            if (!alt2) {
              alt2 = document.createElement("figcaption");
              cerceve.appendChild(alt2);
              cerceve.classList.add("kg-card-hascaption");
            }
            alt2.textContent = caption;
          } else if (alt2) {
            alt2.remove();
            cerceve.classList.remove("kg-card-hascaption");
          }
        }
        yolla();
        return;
      }

      if (v.type === OLAY_URUN_SONUC) {
        const { istek, urun } = v.payload ?? {};
        const blok = bekleyen.get(istek);
        if (!blok || !urun) return;
        bekleyen.delete(istek);
        blok.setAttribute("data-blok", "urun");
        blok.setAttribute("data-urun-id", String(urun.id));
        /* Onizlemede bir KART TASLAGI ciziliyor: gercek kart sunucuda
           basiliyor (fiyat ve stok veriden gelir), ama yazar
           kaydedene kadar bos bir kutu gormemeli. Bu taslak
           kaydedilmiyor — ayristirici data-blok="urun" goren her
           ogeyi {t:"urun"} blogu olarak aliyor ve icerigini atiyor. */
        const gorsel = urun.featuredImageUrl
          ? `<img src="${urun.featuredImageUrl}" alt="" class="urun-blogu-gorsel">`
          : "";
        blok.className = "urun-blogu";
        blok.innerHTML =
          `<span class="urun-blogu-baglanti">${gorsel}` +
          `<span class="urun-blogu-metin">` +
          `<span class="urun-blogu-tur">PRODUCT</span>` +
          `<strong class="urun-blogu-ad"></strong>` +
          `<span class="urun-blogu-fiyat"></span>` +
          `</span></span>`;
        /* Ad ve fiyat metin olarak yaziliyor, HTML olarak degil:
           urun adinda gecen bir isaret sayfayi bozmasin. */
        blok.querySelector(".urun-blogu-ad")!.textContent = urun.title ?? "";
        blok.querySelector(".urun-blogu-fiyat")!.textContent =
          `${urun.price ?? ""} ${urun.currency ?? ""}`.trim();
        yolla();
        return;
      }

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
      if (govde && !govde.contains(odakta) && typeof contentHtml === "string") {
        govde.innerHTML = contentHtml;
        /* Panelin bastigi HTML'de contenteditable yok: yeniden
           uygulanmazsa yazi bloklari duzenlenemez hale gelir. */
        duzenlenebilirlikUygula(govde);
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

    /* GOVDE ARTIK TEK PARCA DUZENLENEBILIR DEGIL.
       Oyleydi: contentEditable govdenin tamamina veriliyor, tiklayinca
       butun yazi odaklaniyor ve cerceve yaziyi bastan sona sariyordu.
       Yani ekranda tek bir dev metin kutusu vardi, blok yok.
       Duzenlenebilirlik artik blok basina veriliyor (blok-yuzeyi.ts);
       govde yalnizca olaylari topluyor. */
    if (govde) {
      govde.addEventListener("input", degisti);
      /* focusout, blur'un kabaran hali: blur kabarmadigi icin blok
         basina gecince yakalanamiyordu. */
      govde.addEventListener("focusout", yolla);
    }

    /**
     * GORSEL DUZENLEME PENCERESI.
     *
     * Panel bu mesaji bastan beri dinliyordu ama GONDEREN KIMSE YOKTU:
     * gorsel studyosu yazilmis, kablosu takilmamisti. Onizlemede bir
     * gorsele tiklamak hicbir sey yapmiyor, bu yuzden gorsel
     * degistirmek mumkun olmuyordu — yalnizca silmek.
     */
    /* Bekleyen istekler. Ogeyi TANIYAN taraf burasi: panel sonucu
       geri yolluyor, uygulamayi biz yapiyoruz. Once panel govde
       HTML'ini src'ye gore arayip degistiriyordu; yeni eklenen
       gorselin src'si bos oldugu icin hicbir seyle eslesmiyordu. */
    const bekleyen = new Map<string, HTMLElement>();
    let sayac = 0;

    const gorselAc = (img: HTMLImageElement) => {
      const istek = `g${++sayac}`;
      bekleyen.set(istek, img);
      window.parent.postMessage(
        {
          type: OLAY_GORSEL,
          source: "preview_frame",
          payload: {
            istek,
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

    /** Urun karti icin secici acar. */
    const urunAc = (blok: HTMLElement) => {
      const istek = `u${++sayac}`;
      bekleyen.set(istek, blok);
      window.parent.postMessage(
        { type: OLAY_URUN, source: "preview_frame", payload: { istek } },
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
      ? blokYuzeyiKur({ govde, yolla, gorselAc, urunAc })
      : () => {};

    /* Uzerine gelince ince bir isaret — okur bunu hic gormuyor. */
    const stil = document.createElement("style");
    stil.textContent = `
      [data-canli="baslik"]:hover, [data-canli="ozet"]:hover {
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent, #0fb5ce) 45%, transparent);
        border-radius: 2px;
      }
      [data-canli="baslik"], [data-canli="ozet"] { transition: box-shadow 120ms; }
      /* Odak cercevesi BLOK basina. Once govdenin tamamina
         veriliyordu ve butun yaziyi sariyordu. */
      [data-canli="govde"] > [contenteditable]:focus {
        outline: 2px solid var(--accent, #0fb5ce);
        outline-offset: 6px;
        border-radius: 2px;
      }
      [data-canli="govde"] > * { transition: outline-color 120ms; }
      [data-canli="govde"] img { cursor: pointer; }
    `;
    document.head.appendChild(stil);

    /**
     * ICERIK DISI ALANLAR ETKISIZ.
     *
     * Onizleme gercek sayfayi gosteriyor — menu, reklam, "en cok
     * okunanlar", altbilgi. BUNLARIN DURMASI GEREKIYOR: yerinde
     * duzenlemenin butun degeri yaziyi gercek cevresinde gormek.
     * Manşetin logonun altinda nasil durdugu, reklamin metni nerede
     * boldugu ancak boyle gorunuyor.
     *
     * Ama TIKLANABILIR olmalari gerekmiyor: menudeki bir baglantiya
     * tiklamak cerceveyi baska bir sayfaya goturuyor ve duzenlenen
     * yazi ekrandan kayboluyordu. Duzenlenebilir alanlarin DISINDA
     * kalan her tiklama artik durduruluyor.
     *
     * Duzenlenebilir alanlar disarida: baslik, ozet, govde ve kapak.
     */
    const disariTikla = (e: MouseEvent) => {
      const h = e.target as HTMLElement | null;
      if (!h) return;
      /* Editorun kendi arayuzu bu engelin DISINDA: arac cubugu, blok
         menusu ve ayar paneli govdenin disinda yasiyor ve dugmeleri
         birer <button>. Isaretlemeseydik kendi denetimlerimizi de
         engellemis olurduk — nitekim bir sure oyle oldu. */
      if (h.closest("[data-panic-yuzey]")) return;

      const duzenlenebilirIcinde =
        h.closest('[data-canli="baslik"]') ||
        h.closest('[data-canli="ozet"]') ||
        h.closest('[data-canli="govde"]') ||
        h.closest('[data-canli="kapak"]');
      if (duzenlenebilirIcinde) return;

      const etkilesimli = h.closest("a,button,summary,label,input,select");
      if (!etkilesimli) return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("click", disariTikla, true);

    /* Duzenlenemeyen alan belli olsun: uzerine gelince imlec
       degismiyor ve hafifce soluyor. Yazar neye dokunabilecegini
       denemeden anliyor. */
    const disStil = document.createElement("style");
    disStil.textContent = `
      body > *:not(script):not(style) a:hover,
      body > *:not(script):not(style) button:hover { cursor: default; }
      [data-canli="baslik"] *, [data-canli="ozet"] *,
      [data-canli="govde"] *, [data-canli="kapak"] { cursor: auto; }
      [data-canli="govde"] a:hover { cursor: text; }
    `;
    document.head.appendChild(disStil);

    /**
     * ODAK KIPI — icerik disi alanlari gizler.
     *
     * Menu, reklam ve altbilgi duzenlenemiyor; bazen de yalnizca
     * yaziya bakmak isteniyor. Ama bunlari SECICIYLE gizlemek
     * (header, footer, aside...) tasarim degisince sessizce kirilir.
     * Onun yerine yazinin bulundugu daldan yukari cikip her
     * seviyedeki KARDESLERI gizliyoruz: yapinin kendisini izliyor.
     */
    const odakStili = document.createElement("style");
    document.head.appendChild(odakStili);

    const odakUygula = (acik: boolean) => {
      const isaretliler = [...document.querySelectorAll<HTMLElement>("[data-odak]")];
      /* Isaret yoksa (ornegin sabit sayfa) hicbir sey yapilmiyor:
         yanlis bir seyi gizlemektense hic gizlememek yeglenir. */
      if (!isaretliler.length) return;

      for (const o of Array.from(document.querySelectorAll("[data-panic-gizli]"))) {
        o.removeAttribute("data-panic-gizli");
      }
      if (!acik) {
        odakStili.textContent = "";
        return;
      }

      /* YAZI BIRDEN COK PARCA olabiliyor: baslik blogu ve metin
         sutunu ayri ogeler. Her isaretliden yukari cikip kardesleri
         gizliyoruz — ama ICINDE BASKA BIR ISARETLI OLAN kardese
         dokunmuyoruz, yoksa biri digerini gizlerdi. */
      for (const isaretli of isaretliler) {
        let d: HTMLElement | null = isaretli;
        while (d && d.parentElement && d.parentElement !== document.documentElement) {
          for (const kardes of Array.from(d.parentElement.children)) {
            if (kardes === d) continue;
            /* EDITORUN KENDI YUZEYI GIZLENMIYOR.
               Arac cubugu, blok menusu ve ayar paneli document.body'ye
               takili, yani govdenin atasiyla KARDES. Bu kontrol
               olmadan odak kipi onlari da "icerik disi" sayip
               gizliyordu: odaga gecince duzenleme arayuzunun tamami
               kayboluyordu. */
            if (kardes.hasAttribute("data-panic-yuzey")) continue;

            const icindeIsaretliVar = isaretliler.some(
              (i) => kardes.contains(i) || kardes === i
            );
            if (!icindeIsaretliVar) kardes.setAttribute("data-panic-gizli", "1");
          }
          d = d.parentElement;
        }
      }
      odakStili.textContent = "[data-panic-gizli]{display:none !important}";
    };

    /* Odak acilip kapaninca sayfanin duzeni degisiyor ve secili
       blogun yeri kayiyor; arac cubugu eski koordinatlarda kaliyordu
       — kullanici odaktan tam sayfaya donunce cubugu blogun cok
       uzaginda goruyordu. Yuzey zaten resize'i dinliyor. */
    const odakSonrasiOlc = () => {
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };

    /* Cerceve hazir: panel ilk icerigi yollayabilsin. Yoksa cerceve
       yuklenene kadar gonderilen mesajlar kayboluyordu. */
    window.parent.postMessage({ type: OLAY_HAZIR, source: "preview_frame" }, kok);

    return () => {
      window.removeEventListener("message", dinle);
      document.removeEventListener("click", disariTikla, true);
      disStil.remove();
      kapak?.removeEventListener("dblclick", kapakTik);
      yuzeyiKaldir();
      if (zamanlayici) clearTimeout(zamanlayici);
      stil.remove();
      odakStili.remove();
    };
  }, []);

  return null;
}
