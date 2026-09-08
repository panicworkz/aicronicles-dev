/**
 * FONT IKILILERI.
 *
 * Site genelinde tipografi buradan seciliyor — yazi yazarken degil,
 * ayarlardan, bir kez. Sebep: paragraf paragraf font secmek dergiyi
 * yazidan yaziya dagitir. Ikili secmek ise tasarim karari ve dogru
 * yeri burasi.
 *
 * NEDEN GUVENLE DEGISIYOR: sitenin butun CSS'i rol jetonlarindan
 * geciyor (--font-display, --font-sans, --font-mono). Hicbir kuralda
 * sabit font adi yok — olculdu. Jetonu degistirince baslik, buton,
 * menu, tarih satiri birlikte doner; hicbiri patlamaz.
 *
 * UC KURAL, ucu de gercek bir riski karsiliyor:
 *
 * 1. YALNIZCA DEGISKEN FONT. Tasarim 400/500/650/700 agirliklarini
 *    kullaniyor. Sabit agirlikli bir aile secilirse 650 en yakina
 *    yuvarlanir ya da tarayici SAHTE KALIN uretir; basliklar
 *    camurlasir. Buradaki her aile en az 400-700 araligini tek
 *    dosyada karsiliyor.
 *
 * 2. YALNIZCA SECILI IKILI YUKLENIR. On ikili yirmi aile demek;
 *    hepsi okura inseydi sayfa agirlasirdi. @font-face yalnizca
 *    secili ikili icin basiliyor (bkz. fontYuzu).
 *
 * 3. YEDEK YIGINI OPTIK OLARAK YAKIN. Font inene kadar gorunen sey
 *    yedek; boyu cok farkli bir yedek sayfayi zipla­tir.
 *
 * MONO SABIT: Geist Mono degismiyor. Kicker, folio ve gorsel
 * altyazilari onunla yaziliyor — Fabelo'nun "sesi" orada. Ikilinin
 * degismesi yaziyi degistirmeli, sesi degil.
 */

export type FontAilesi = {
  /* CSS'te kullanilacak ad. */
  ad: string;
  /* public/fonts altindaki dosya. */
  dosya: string;
  /* Degisken agirlik araligi. */
  agirlik: string;
  /* Italik dosyasi varsa. */
  italikDosya?: string;
  yedek: string[];
};

export type FontIkilisi = {
  id: string;
  ad: string;
  /* Ikilinin karakterini bir cumlede anlatir — ayarlarda gorunuyor. */
  aciklama: string;
  baslik: FontAilesi;
  govde: FontAilesi;
};

const SERIF_YEDEK = ["Iowan Old Style", "Palatino", "Georgia", "Times New Roman", "serif"];
const SANS_YEDEK = ["system-ui", "-apple-system", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"];

export const FONT_IKILILERI: FontIkilisi[] = [
  {
    id: "newsreader-inter",
    ad: "Newsreader + Inter",
    aciklama: "Sitenin bugunku hali. Klasik dergi serifi, notr govde.",
    baslik: { ad: "Newsreader", dosya: "newsreader.woff2", italikDosya: "newsreader-italic.woff2", agirlik: "200 800", yedek: SERIF_YEDEK },
    govde: { ad: "Inter", dosya: "inter.woff2", agirlik: "100 900", yedek: SANS_YEDEK },
  },
  {
    id: "fraunces-inter",
    ad: "Fraunces + Inter",
    aciklama: "Sicak ve karakterli basliklar; govde sakin kalir.",
    baslik: { ad: "Fraunces", dosya: "fraunces.woff2", agirlik: "100 900", yedek: SERIF_YEDEK },
    govde: { ad: "Inter", dosya: "inter.woff2", agirlik: "100 900", yedek: SANS_YEDEK },
  },
  {
    id: "playfair-sourcesans",
    ad: "Playfair Display + Source Sans 3",
    aciklama: "Yuksek kontrast, moda ve luks yayinlarin dili.",
    baslik: { ad: "Playfair Display", dosya: "playfair.woff2", agirlik: "400 900", yedek: SERIF_YEDEK },
    govde: { ad: "Source Sans 3", dosya: "sourcesans.woff2", agirlik: "200 900", yedek: SANS_YEDEK },
  },
  {
    id: "lora-karla",
    ad: "Lora + Karla",
    aciklama: "Yumusak serif, genis govde. Uzun metinde yormaz.",
    baslik: { ad: "Lora", dosya: "lora.woff2", agirlik: "400 700", yedek: SERIF_YEDEK },
    govde: { ad: "Karla", dosya: "karla.woff2", agirlik: "200 800", yedek: SANS_YEDEK },
  },
  {
    id: "literata-figtree",
    ad: "Literata + Figtree",
    aciklama: "Ekranda uzun okuma icin tasarlanmis serif.",
    baslik: { ad: "Literata", dosya: "literata.woff2", agirlik: "200 900", yedek: SERIF_YEDEK },
    govde: { ad: "Figtree", dosya: "figtree.woff2", agirlik: "300 900", yedek: SANS_YEDEK },
  },
  {
    id: "crimson-manrope",
    ad: "Crimson Pro + Manrope",
    aciklama: "Edebi ve ince; deneme ve uzun yazi icin.",
    baslik: { ad: "Crimson Pro", dosya: "crimson.woff2", agirlik: "200 900", yedek: SERIF_YEDEK },
    govde: { ad: "Manrope", dosya: "manrope.woff2", agirlik: "200 800", yedek: SANS_YEDEK },
  },
  {
    id: "garamond-jost",
    ad: "EB Garamond + Jost",
    aciklama: "Klasik kitap serifi, geometrik govde. Sakin kontrast.",
    baslik: { ad: "EB Garamond", dosya: "garamond.woff2", agirlik: "400 800", yedek: SERIF_YEDEK },
    govde: { ad: "Jost", dosya: "jost.woff2", agirlik: "100 900", yedek: SANS_YEDEK },
  },
  {
    id: "bitter-worksans",
    ad: "Bitter + Work Sans",
    aciklama: "Haber ve teknik icerik; kalin basliklarda net durur.",
    baslik: { ad: "Bitter", dosya: "bitter.woff2", agirlik: "100 900", yedek: SERIF_YEDEK },
    govde: { ad: "Work Sans", dosya: "worksans.woff2", agirlik: "100 900", yedek: SANS_YEDEK },
  },
  {
    id: "petrona-dmsans",
    ad: "Petrona + DM Sans",
    aciklama: "Modern serif, temiz govde. Genc ve okunakli.",
    baslik: { ad: "Petrona", dosya: "petrona.woff2", agirlik: "100 900", yedek: SERIF_YEDEK },
    govde: { ad: "DM Sans", dosya: "dmsans.woff2", agirlik: "100 1000", yedek: SANS_YEDEK },
  },
  {
    id: "spacegrotesk-inter",
    ad: "Space Grotesk + Inter",
    aciklama: "Serifsiz baslik. Teknoloji yayinlarinin dili.",
    baslik: { ad: "Space Grotesk", dosya: "spacegrotesk.woff2", agirlik: "300 700", yedek: SANS_YEDEK },
    govde: { ad: "Inter", dosya: "inter.woff2", agirlik: "100 900", yedek: SANS_YEDEK },
  },
];

export const VARSAYILAN_IKILI = FONT_IKILILERI[0];

export function ikiliyiBul(id?: string | null): FontIkilisi {
  return FONT_IKILILERI.find((i) => i.id === id) ?? VARSAYILAN_IKILI;
}

/** Bir aile icin @font-face bloklari. */
function fontYuzu(a: FontAilesi): string {
  const yuzler = [
    `@font-face{font-family:"${a.ad}";src:url("/fonts/${a.dosya}") format("woff2");font-weight:${a.agirlik};font-style:normal;font-display:optional}`,
  ];
  if (a.italikDosya) {
    yuzler.push(
      `@font-face{font-family:"${a.ad}";src:url("/fonts/${a.italikDosya}") format("woff2");font-weight:${a.agirlik};font-style:italic;font-display:optional}`
    );
  }
  return yuzler.join("");
}

const tirnakla = (yedek: string[]) =>
  yedek.map((y) => (y.includes(" ") ? `"${y}"` : y)).join(",");

/**
 * Secili ikilinin CSS'i: yalnizca o ikilinin @font-face'leri ve rol
 * jetonlari. Digerlerinin tek bayti bile okura inmiyor.
 */
export function ikiliCss(ikili: FontIkilisi): string {
  return (
    fontYuzu(ikili.baslik) +
    (ikili.govde.dosya === ikili.baslik.dosya ? "" : fontYuzu(ikili.govde)) +
    `:root{--font-display:"${ikili.baslik.ad}",${tirnakla(ikili.baslik.yedek)};` +
    `--font-sans:"${ikili.govde.ad}",${tirnakla(ikili.govde.yedek)}}`
  );
}

/** Onyukleme icin dosya listesi — ikilinin gorunur olmasi gecikmesin. */
export function ikiliDosyalari(ikili: FontIkilisi): string[] {
  const d = [`/fonts/${ikili.baslik.dosya}`];
  if (ikili.govde.dosya !== ikili.baslik.dosya) d.push(`/fonts/${ikili.govde.dosya}`);
  return d;
}
