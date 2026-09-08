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

/**
 * Modellemedigimiz oznitelikler.
 *
 * Olcum sirasinda uc sey kayboluyordu: bir baslikta satir ici style,
 * bir gorselde title ve data-caption. Bunlari tek tek alanlara
 * cevirmek her yeni oznitelikte ayni isi tekrar yaptirirdi. Torba
 * yaklasimi kalici: tanimadigimiz ne varsa duruyor ve geri yaziliyor.
 */
export type BlokOz = Record<string, string>;

export type Blok =
  | { t: "paragraf"; html: string; oz?: BlokOz }
  | { t: "baslik"; seviye: 2 | 3 | 4; html: string; id?: string; sinif?: string; oz?: BlokOz }
  | { t: "liste"; sirali: boolean; ogeler: string[]; oz?: BlokOz }
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
      /* figure'un kendi sinifi — yeniden uretmek yerine oldugu gibi
         saklaniyor: Ghost'un sinif dizilimi surumden surume degisiyor. */
      sinif?: string;
      /* img uzerindeki modellenmemis oznitelikler (title, data-caption,
         width, height...). */
      oz?: BlokOz;
    }
  | { t: "tablo"; html: string }
  | { t: "ayrac" }
  | { t: "alinti"; html: string; oz?: BlokOz }
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

/** Ozniteliklerin tamamini geri yazar. */
function ozYaz(oz?: BlokOz): string {
  if (!oz) return "";
  return Object.entries(oz)
    .map(([k, v]) => oznitelik(k, v))
    .join("");
}

/**
 * Modellenmis olanlarin DISINDA kalan oznitelikler.
 * Bos deger tasiyanlar atiliyor: id="" gibi seyler HTML'de hicbir sey
 * yapmiyor, saklamak blogu gereksiz sisirirdi.
 */
function ozEk(oge: HTMLElement, modellenen: string[]) {
  const oz = kalanOz(oge, modellenen);
  return oz ? { oz } : {};
}

function kalanOz(oge: HTMLElement, modellenen: string[]): BlokOz | undefined {
  const kalan: BlokOz = {};
  for (const [k, v] of Object.entries(oge.attributes)) {
    if (modellenen.includes(k) || !v) continue;
    kalan[k] = v;
  }
  return Object.keys(kalan).length ? kalan : undefined;
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

    /* ISARETLER TEMIZLENIYOR.
       data-blok-i / data-blok-t sunucunun basim sirasinda ekledigi
       kolaylik isaretleri, icerigin parcasi degil. Onizlemede
       duzenlenen govde panele isaretleriyle birlikte gidiyor; burada
       silinmezlerse once "modellenmemis oznitelik" torbasina, oradan
       da veritabanina yazilirlar ve her kayitta birikirlerdi. */
    oge.removeAttribute("data-blok-i");
    oge.removeAttribute("data-blok-t");
    /* Duzenleme artiklari da temizleniyor: onizlemede her blok kendi
       duzenlenebilir alani oldugu icin govde panele contenteditable
       ve spellcheck ile birlikte gidiyor. Silinmezlerse veritabanina
       yazilir ve okurun sayfasinda da duzenlenebilir bloklar olurdu. */
    oge.removeAttribute("contenteditable");
    oge.removeAttribute("spellcheck");

    switch (etiket) {
      case "p":
        bloklar.push({ t: "paragraf", html: oge.innerHTML, ...ozEk(oge, []) });
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
          /* Sinif OLDUGU GIBI korunuyor, dayatilmiyor. Olcum gosterdi:
             basliklarin bir kismi "scroll-mt-24 font-serif" tasiyor,
             bir kismi ciplak. Hepsine ev stilini yazsaydik ciplak
             olanlar birden serif olur ve cipa boslugu kazanirdi —
             yani goc, kimsenin istemedigi bir tasarim degisikligi
             yapardi. Yeni baslik ekleyen editor sinifi kendisi verir. */
          ...(oge.getAttribute("class") ? { sinif: oge.getAttribute("class")! } : {}),
          ...ozEk(oge, ["id", "class"]),
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
          ...ozEk(oge, []),
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
            ...(oge.getAttribute("class") ? { sinif: oge.getAttribute("class")! } : {}),
            ...ozEk(img, ["src", "alt"]),
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
          ...ozEk(oge, ["src", "alt"]),
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
        bloklar.push({ t: "alinti", html: oge.innerHTML, ...ozEk(oge, []) });
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

/**
 * @param isaretle Her blogun KOK ETIKETINE data-blok-i (sira) ve
 *   data-blok-t (tur) yaziyor. Duzenleme katmani turu buradan okuyor;
 *   yoksa gorsel mi paragraf mi oldugunu DOM'u koklayarak tahmin etmek
 *   gerekirdi ve her yeni tur yeni bir ozel durum olurdu.
 *
 *   SARMALAYICI DIV EKLENMIYOR, bilerek. Yayin CSS'i dogrudan cocuk
 *   seciciye dayaniyor (.article-body > * + *); araya bir katman
 *   koysaydik yazinin butun dikey bosluklari cokerdi. Isaretler
 *   bloklarin kendi etiketine giriyor, DOM yapisi degismiyor.
 */
export function bloklarHtmle(
  bloklar?: Blok[] | null,
  { isaretle = false }: { isaretle?: boolean } = {}
): string {
  if (!Array.isArray(bloklar) || bloklar.length === 0) return "";

  const govde = bloklar
    .map((b) => {
      switch (b.t) {
        case "paragraf":
          return `<p${ozYaz(b.oz)}>${b.html}</p>`;

        case "baslik":
          return `<h${b.seviye}${oznitelik("id", b.id)}${oznitelik("class", b.sinif)}${ozYaz(b.oz)}>${b.html}</h${b.seviye}>`;

        case "liste": {
          const e = b.sirali ? "ol" : "ul";
          return `<${e}${ozYaz(b.oz)}>${b.ogeler.map((o) => `<li>${o}</li>`).join("")}</${e}>`;
        }

        case "gorsel": {
          const img = `<img${oznitelik("src", b.src)}${oznitelik("alt", b.alt)}${ozYaz(b.oz)}>`;
          /* Cerceve olmadan konmus gorsel oldugu gibi kaliyor: figure'e
             sarmak bosluk ve hizalama getirir, yazinin duzenini
             degistirirdi. */
          if (b.ciplak) return img;

          const sarili = b.baglanti
            ? `<a${oznitelik("href", b.baglanti)}>${img}</a>`
            : img;
          const altyazi = b.altyazi ? `<figcaption>${b.altyazi}</figcaption>` : "";
          /* Ozgun sinif varsa OLDUGU GIBI kullaniliyor. Yeniden
             uretmek Ghost'un sinif dizilimini tahmin etmek demek;
             bir surumde degisirse gorseller sessizce dar kolona
             duserdi. Yalnizca yeni eklenen gorseller icin uretiliyor. */
          const uretilen = b.genis
            ? "kg-card kg-image-card kg-width-wide"
            : "kg-card kg-image-card";
          const tamSinif =
            b.sinif ?? (b.altyazi ? `${uretilen} kg-card-hascaption` : uretilen);
          return `<figure class="${tamSinif}">${sarili}${altyazi}</figure>`;
        }

        case "tablo":
          return b.html;

        case "ayrac":
          return "<hr>";

        case "alinti":
          return `<blockquote${ozYaz(b.oz)}>${b.html}</blockquote>`;

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
    });

  if (!isaretle) return govde.join("\n");

  /* Isaret ilk etiketin icine, etiket adindan hemen sonra giriyor.
     Kok etiketi bulmak icin dizgeyi yeniden ayristirmiyoruz: her blok
     kendi HTML'ini burada uretti, yani ilk "<ad" her zaman kok. */
  return govde
    .map((h, i) => {
      const t = bloklar[i].t;
      return h.replace(/^<([a-zA-Z][a-zA-Z0-9]*)/, `<$1 data-blok-i="${i}" data-blok-t="${t}"`);
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
