import { parse, HTMLElement, NodeType } from "node-html-parser";

/**
 * BLOK MODELI.
 *
 * Yazi govdesi tek parca HTML yerine bir blok dizisi olarak tutuluyor.
 * Boylece bir paragrafi tasimak, cogaltmak, silmek ya da araya yeni bir
 * TUR blok koymak mumkun oluyor — sayfanin uzerinde, yerinde.
 *
 * ---------------------------------------------------------------
 * EN ONEMLI KARAR: contentHtml SILINMIYOR, TURETILIYOR.
 *
 * Bloklar dogruluk kaynagi; content_html ise her kayitta bloklardan
 * yeniden uretilen bir kopya. Sebebi somut: content_html'e bagli 22
 * dosya var — RSS, llms.txt, SSS cikarimi (lib/faq.ts), AEO puani,
 * surum gecmisi, kopilot, magaza urunleri, sabit sayfalar. Bloklari
 * dogruluk kaynagi yapip HTML'i uretmek, o 22 dosyanin HICBIRINE
 * dokunmadan blok duzenlemeyi mumkun kiliyor.
 *
 * Alternatifi — HTML'i tamamen kaldirmak — her birini yeniden yazmak
 * ve 47 yayindaki yaziyi riske atmak olurdu.
 * ---------------------------------------------------------------
 *
 * KAYIP OLMAMASI: taninmayan her sey "ham" bloguna dusuyor ve oldugu
 * gibi basiliyor. Yani ayristirici bir seyi anlamasa bile icerik
 * kaybolmuyor, yalnizca duzenlenebilir olmuyor. Gocun guvenli olmasini
 * saglayan sey bu.
 */

export type Blok =
  | { t: "paragraf"; html: string }
  | { t: "baslik"; seviye: 2 | 3 | 4; html: string; id?: string }
  | { t: "liste"; sirali: boolean; ogeler: string[] }
  | {
      t: "gorsel";
      src: string;
      alt?: string;
      altyazi?: string;
      genis?: boolean;
      /* Gorseli saran baglanti. Ghost'ta gorsele tiklayinca gidilen
         adres boyle tutuluyor; bir yazida video baglantisi yalnizca
         burada duruyordu. */
      baglanti?: string;
      /* figure'suz, dogrudan govdeye konmus gorsel. Isaretlenmezse
         cikista figure'e sariliyor ve sayfa duzeni degisiyor. */
      ciplak?: boolean;
    }
  | { t: "tablo"; html: string }
  | { t: "ayrac" }
  | { t: "alinti"; html: string }
  /* URUN KARTI — blok modelinin asil gerekcesi.
     HTML'in ifade edemedigi bir sey: govdede duran sey bir isaret,
     icerigi (ad, fiyat, stok, gorsel) okuma aninda veritabanindan
     geliyor. Yazinin icine fiyat yazsaydik urun degistiginde yazi
     yalan soylerdi. Yazar yalnizca "su urun burada dursun" diyor. */
  | { t: "urun"; urunId: number }
  /* Kacis kapisi: ayristiricinin tanimadigi her sey. Oldugu gibi
     basiliyor, yani icerik asla kaybolmuyor. */
  | { t: "ham"; html: string };

/** Ozniteliklerin HTML'e geri yazilmasi icin. */
function oznitelik(ad: string, deger?: string | null): string {
  if (!deger) return "";
  const kacisli = deger
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return ` ${ad}="${kacisli}"`;
}

/* ==================================================================
   HTML  →  BLOKLAR
   ================================================================== */

export function htmlBloklara(html?: string | null): Blok[] {
  if (!html || !html.trim()) return [];

  const kok = parse(html, {
    /* Bosluklar korunuyor: aralarindaki bosluklari yutmak, ayni
       satirda duran ogelerin birlesmesine yol aciyor. */
    blockTextElements: { script: true, style: true, pre: true },
  });

  const bloklar: Blok[] = [];

  for (const dugum of kok.childNodes) {
    /* CIPLAK METIN. Veride 152 tane var; yalnizca ogelere baksaydik
       hepsi sessizce kaybolurdu. Paragrafa sariliyorlar. */
    if (dugum.nodeType === NodeType.TEXT_NODE) {
      const metin = dugum.rawText.trim();
      if (metin) bloklar.push({ t: "paragraf", html: metin });
      continue;
    }
    if (dugum.nodeType !== NodeType.ELEMENT_NODE) continue;

    const oge = dugum as HTMLElement;
    const etiket = oge.tagName?.toLowerCase();

    switch (etiket) {
      case "p":
        bloklar.push({ t: "paragraf", html: oge.innerHTML });
        break;

      case "h2":
      case "h3":
      case "h4":
        bloklar.push({
          t: "baslik",
          seviye: Number(etiket[1]) as 2 | 3 | 4,
          html: oge.innerHTML,
          /* Kimlik KORUNUYOR: icindekiler baglantilari ve SSS cikarimi
             (lib/faq.ts) bu kimlikleri kullaniyor. Atsaydik sayfa ici
             baglantilar ve arama sonucundaki SSS kirilirdi. */
          ...(oge.getAttribute("id") ? { id: oge.getAttribute("id")! } : {}),
        });
        break;

      case "ul":
      case "ol":
        bloklar.push({
          t: "liste",
          sirali: etiket === "ol",
          ogeler: oge
            .querySelectorAll("li")
            /* Yalnizca DOGRUDAN cocuklar: ic ice listelerde alttaki
               ogeler iki kez sayilirdi. */
            .filter((li) => li.parentNode === oge)
            .map((li) => li.innerHTML),
        });
        break;

      case "figure": {
        const img = oge.querySelector("img");
        const alt = oge.querySelector("figcaption");
        if (img) {
          /* Gorseli SARAN baglanti — altyazinin icindeki baglanti
             degil. Ayrimi yapmazsak altyazidaki bir kaynak baglantisi
             gorselin adresi sanilir. */
          const saran = img.closest("a");
          bloklar.push({
            t: "gorsel",
            src: img.getAttribute("src") ?? "",
            ...(img.getAttribute("alt") ? { alt: img.getAttribute("alt")! } : {}),
            ...(alt ? { altyazi: alt.innerHTML } : {}),
            ...(saran?.getAttribute("href")
              ? { baglanti: saran.getAttribute("href")! }
              : {}),
            /* Ghost'tan gelen genis gorseller: kg-width-wide. Sinifi
               atsaydik gorseller dar kolona sikisirdi. */
            ...(oge.getAttribute("class")?.includes("kg-width-wide")
              ? { genis: true }
              : {}),
          });
        } else {
          bloklar.push({ t: "ham", html: oge.outerHTML });
        }
        break;
      }

      case "img":
        bloklar.push({
          t: "gorsel",
          src: oge.getAttribute("src") ?? "",
          ...(oge.getAttribute("alt") ? { alt: oge.getAttribute("alt")! } : {}),
          ciplak: true,
        });
        break;

      case "table":
        /* Tablo icerigi HTML olarak tutuluyor: satir/sutun modeline
           cevirmek birlestirilmis hucrelerde bilgi kaybettirir. */
        bloklar.push({ t: "tablo", html: oge.outerHTML });
        break;

      case "hr":
        bloklar.push({ t: "ayrac" });
        break;

      case "blockquote":
        bloklar.push({ t: "alinti", html: oge.innerHTML });
        break;

      default:
        /* Kaydirma sarmali icine alinmis tablo. Veride bes tane var ve
           hepsi ayni bicimde: dar ekranda tasmasin diye tablo bir
           div'in icine konmus. Tanimasaydik "ham" kalir, yani
           editorde duzenlenemezdi. Sarmal HTML'in icinde duruyor,
           yani yatay kaydirma da bozulmuyor. */
        /* Urun karti isareti. Turetilen HTML'de yalnizca bos bir
           yer tutucu duruyor; kart okuma aninda dolduruluyor
           (lib/urun-blogu.ts). Boylece gidis-donus de kayipsiz. */
        if (oge.getAttribute("data-blok") === "urun") {
          const kimlik = Number(oge.getAttribute("data-urun-id"));
          if (Number.isFinite(kimlik) && kimlik > 0) {
            bloklar.push({ t: "urun", urunId: kimlik });
          } else {
            /* Kimliksiz isaret ise: atmak yerine ham birakiliyor,
               yoksa yazarin koydugu sey sessizce yok olurdu. */
            bloklar.push({ t: "ham", html: oge.outerHTML });
          }
        } else if (etiket === "div" && oge.querySelector("table")) {
          bloklar.push({ t: "tablo", html: oge.outerHTML });
        } else {
          bloklar.push({ t: "ham", html: oge.outerHTML });
        }
    }
  }

  return bloklar;
}

/* ==================================================================
   BLOKLAR  →  HTML
   ================================================================== */

export function bloklarHtmle(bloklar?: Blok[] | null): string {
  if (!Array.isArray(bloklar) || bloklar.length === 0) return "";

  return bloklar
    .map((b) => {
      switch (b.t) {
        case "paragraf":
          return `<p>${b.html}</p>`;

        case "baslik":
          /* Sinif da geri yaziliyor: yayin tarafinda basliklarin
             cipa boslugu bu sinifla veriliyor (scroll-mt-24). */
          return `<h${b.seviye}${oznitelik("id", b.id)} class="scroll-mt-24 font-serif">${b.html}</h${b.seviye}>`;

        case "liste": {
          const e = b.sirali ? "ol" : "ul";
          return `<${e}>${b.ogeler.map((o) => `<li>${o}</li>`).join("")}</${e}>`;
        }

        case "gorsel": {
          const img = `<img${oznitelik("src", b.src)}${oznitelik("alt", b.alt)}>`;
          /* Cerceve olmadan konmus gorsel oldugu gibi kaliyor: figure'e
             sarmak bosluk ve hizalama getirir, yazinin duzenini
             degistirirdi. */
          if (b.ciplak) return img;

          const sarili = b.baglanti
            ? `<a${oznitelik("href", b.baglanti)}>${img}</a>`
            : img;
          const sinif = b.genis
            ? "kg-card kg-image-card kg-width-wide"
            : "kg-card kg-image-card";
          const altyazi = b.altyazi ? `<figcaption>${b.altyazi}</figcaption>` : "";
          const tamSinif = b.altyazi ? `${sinif} kg-card-hascaption` : sinif;
          return `<figure class="${tamSinif}">${sarili}${altyazi}</figure>`;
        }

        case "tablo":
          return b.html;

        case "ayrac":
          return "<hr>";

        case "alinti":
          return `<blockquote>${b.html}</blockquote>`;

        case "urun":
          /* Yalnizca isaret. Kartin kendisi okuma aninda basiliyor;
             RSS ve llms.txt gibi ham HTML okuyan yerlerde de bos bir
             div kaliyor, yani hicbir yerde bozuk fiyat gorunmuyor. */
          return `<div data-blok="urun" data-urun-id="${b.urunId}"></div>`;

        case "ham":
          return b.html;

        default:
          return "";
      }
    })
    .join("\n");
}

/**
 * Bir yazinin bloklari — kayitli blok yoksa HTML'den uretiliyor.
 *
 * Gocun yapilmadigi ya da bir yazinin henuz cevrilmedigi durumda da
 * blok duzenleme calissin diye: eski yazilar okunurken cevriliyor,
 * ilk kayitta blok olarak yaziliyor.
 */
export function yazininBloklari(yazi: {
  blocksJson?: unknown;
  contentHtml?: string | null;
}): Blok[] {
  const kayitli = yazi.blocksJson;
  if (Array.isArray(kayitli) && kayitli.length > 0) return kayitli as Blok[];
  return htmlBloklara(yazi.contentHtml);
}
