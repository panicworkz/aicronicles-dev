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
 *    yedek; boyu cok farkli bir yedek sayfayi ziplatir.
 *
 * 4. LATIN-EXT AYRI DOSYADA. Turkce harfler (ğ Ğ ş Ş İ) orada;
 *    almasaydik "ŞİLE" gibi yerler yedek fontla basilirdi. Tarayici
 *    o dilimi ancak ilgili harf sayfada gecince indiriyor.
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
    aciklama: "The current look. Classic magazine serif with a neutral body.",
    baslik: { ad: "Newsreader", dosya: "newsreader.woff2", italikDosya: "newsreader-italic.woff2", agirlik: "200 800", yedek: SERIF_YEDEK },
    govde: { ad: "Inter", dosya: "inter.woff2", agirlik: "100 900", yedek: SANS_YEDEK },
  },
  {
    id: "fraunces-inter",
    ad: "Fraunces + Inter",
    aciklama: "Warm, characterful headlines over a calm body text.",
    baslik: { ad: "Fraunces", dosya: "fraunces.woff2", agirlik: "100 900", yedek: SERIF_YEDEK },
    govde: { ad: "Inter", dosya: "inter.woff2", agirlik: "100 900", yedek: SANS_YEDEK },
  },
  {
    id: "playfair-sourcesans",
    ad: "Playfair Display + Source Sans 3",
    aciklama: "High contrast \u2014 the language of fashion and luxury titles.",
    baslik: { ad: "Playfair Display", dosya: "playfair.woff2", agirlik: "400 900", yedek: SERIF_YEDEK },
    govde: { ad: "Source Sans 3", dosya: "sourcesans.woff2", agirlik: "200 900", yedek: SANS_YEDEK },
  },
  {
    id: "lora-karla",
    ad: "Lora + Karla",
    aciklama: "Soft serif, roomy body. Easy on long reads.",
    baslik: { ad: "Lora", dosya: "lora.woff2", agirlik: "400 700", yedek: SERIF_YEDEK },
    govde: { ad: "Karla", dosya: "karla.woff2", agirlik: "200 800", yedek: SANS_YEDEK },
  },
  {
    id: "literata-figtree",
    ad: "Literata + Figtree",
    aciklama: "A serif designed for long reading on screens.",
    baslik: { ad: "Literata", dosya: "literata.woff2", agirlik: "200 900", yedek: SERIF_YEDEK },
    govde: { ad: "Figtree", dosya: "figtree.woff2", agirlik: "300 900", yedek: SANS_YEDEK },
  },
  {
    id: "crimson-manrope",
    ad: "Crimson Pro + Manrope",
    aciklama: "Literary and fine \u2014 suits essays and long features.",
    baslik: { ad: "Crimson Pro", dosya: "crimson.woff2", agirlik: "200 900", yedek: SERIF_YEDEK },
    govde: { ad: "Manrope", dosya: "manrope.woff2", agirlik: "200 800", yedek: SANS_YEDEK },
  },
  {
    id: "garamond-jost",
    ad: "EB Garamond + Jost",
    aciklama: "Classic book serif with a geometric body. Quiet contrast.",
    baslik: { ad: "EB Garamond", dosya: "garamond.woff2", agirlik: "400 800", yedek: SERIF_YEDEK },
    govde: { ad: "Jost", dosya: "jost.woff2", agirlik: "100 900", yedek: SANS_YEDEK },
  },
  {
    id: "bitter-worksans",
    ad: "Bitter + Work Sans",
    aciklama: "News and technical writing; stays crisp at heavy weights.",
    baslik: { ad: "Bitter", dosya: "bitter.woff2", agirlik: "100 900", yedek: SERIF_YEDEK },
    govde: { ad: "Work Sans", dosya: "worksans.woff2", agirlik: "100 900", yedek: SANS_YEDEK },
  },
  {
    id: "petrona-dmsans",
    ad: "Petrona + DM Sans",
    aciklama: "Modern serif, clean body. Young and highly legible.",
    baslik: { ad: "Petrona", dosya: "petrona.woff2", agirlik: "100 900", yedek: SERIF_YEDEK },
    govde: { ad: "DM Sans", dosya: "dmsans.woff2", agirlik: "100 1000", yedek: SANS_YEDEK },
  },
  {
    id: "spacegrotesk-inter",
    ad: "Space Grotesk + Inter",
    aciklama: "Sans headlines \u2014 the voice of technology titles.",
    baslik: { ad: "Space Grotesk", dosya: "spacegrotesk.woff2", agirlik: "300 700", yedek: SANS_YEDEK },
    govde: { ad: "Inter", dosya: "inter.woff2", agirlik: "100 900", yedek: SANS_YEDEK },
  },
];

export const VARSAYILAN_IKILI = FONT_IKILILERI[0];

export function ikiliyiBul(id?: string | null): FontIkilisi {
  return FONT_IKILILERI.find((i) => i.id === id) ?? VARSAYILAN_IKILI;
}

/* Unicode araliklari. Iki dilim ayri dosyada ve tarayici latin-ext'i
   ANCAK o harfler sayfada gecince indiriyor — Turkce icerik olmayan
   bir sayfa icin maliyeti sifir.
   TURKCE HARFLER LATIN-EXT'TE: ğ Ğ ş Ş İ. Yalnizca "ı" latin'de. */
const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

/** Bir aile icin @font-face bloklari (iki dilim, iki stil). */
function fontYuzu(a: FontAilesi): string {
  const yuz = (dosya: string, stil: string, aralik: string) =>
    `@font-face{font-family:"${a.ad}";src:url("/fonts/${dosya}") format("woff2");` +
    `font-weight:${a.agirlik};font-style:${stil};font-display:optional;unicode-range:${aralik}}`;

  const ek = a.dosya.replace(/\.woff2$/, "-ext.woff2");
  const yuzler = [yuz(a.dosya, "normal", LATIN), yuz(ek, "normal", LATIN_EXT)];

  if (a.italikDosya) {
    const ekIt = a.italikDosya.replace(/\.woff2$/, "-ext.woff2");
    yuzler.push(yuz(a.italikDosya, "italic", LATIN));
    yuzler.push(yuz(ekIt, "italic", LATIN_EXT));
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
