/**
 * FONT IKILILERININ DOSYALARINI INDIRIR.
 *
 * Google Fonts'a CALISMA ANINDA baglanmiyoruz — fontlar kendi
 * sunucumuzdan iniyor. Sebebi somut: bir derleme Google'dan font
 * cekerken kirilmisti, ayrica her okurun tarayicisini uctan bir
 * baglantiya zorlamak hem gizlilik hem hiz meselesi.
 *
 * Google'in css2 ucundan LATIN ve LATIN-EXT dilimleri aliniyor.
 * Turkce harfler (ğ Ğ ş Ş İ) latin-ext'te; yalnizca latin alsaydik
 * sitedeki "ŞİLE" gibi yerler yedek fontla basilirdi. Tarayici
 * latin-ext'i ancak o harfler sayfada gecince indiriyor. Indirilen
 * dosyalar DEGISKEN
 * (variable) — tasarim 650 gibi ara agirliklar kullaniyor, sabit
 * agirlikli dosyayla tarayici sahte kalin uretirdi.
 *
 * Kullanim:  node scripts/font-indir.mjs
 */

import fs from "node:fs";
import path from "node:path";

/* Tarayici kimligi SART: css2 ucu eski istemcilere woff2 yerine ttf
   veriyor. Bunu yollamazsak elimize dort kat buyuk dosyalar gecer. */
const TARAYICI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/* Aile adi -> (dosya adi, wght araligi, italik ister mi) */
const AILELER = [
  ["Newsreader", "newsreader", "200..800", true],
  ["Inter", "inter", "100..900", false],
  ["Fraunces", "fraunces", "100..900", false],
  ["Playfair Display", "playfair", "400..900", false],
  ["Source Sans 3", "sourcesans", "200..900", false],
  ["Lora", "lora", "400..700", false],
  ["Karla", "karla", "200..800", false],
  ["Literata", "literata", "200..900", false],
  ["Figtree", "figtree", "300..900", false],
  ["Crimson Pro", "crimson", "200..900", false],
  ["Manrope", "manrope", "200..800", false],
  ["EB Garamond", "garamond", "400..800", false],
  ["Jost", "jost", "100..900", false],
  ["Bitter", "bitter", "100..900", false],
  ["Work Sans", "worksans", "100..900", false],
  ["Petrona", "petrona", "100..900", false],
  ["DM Sans", "dmsans", "100..1000", false],
  ["Space Grotesk", "spacegrotesk", "300..700", false],
];

const HEDEF = path.join(process.cwd(), "public", "fonts");
fs.mkdirSync(HEDEF, { recursive: true });

async function css(aile, aralik, italik) {
  const ad = aile.replace(/ /g, "+");
  const eksen = italik ? `ital,wght@0,${aralik};1,${aralik}` : `wght@${aralik}`;
  const adres = `https://fonts.googleapis.com/css2?family=${ad}:${eksen}&display=optional`;
  const c = await fetch(adres, { headers: { "User-Agent": TARAYICI } });
  if (!c.ok) throw new Error(`${aile}: css alinamadi (${c.status})`);
  return c.text();
}

/* IKI DILIM DE ALINIYOR: latin VE latin-ext.
   TURKCE HARFLER LATIN-EXT'TE: ğ Ğ ş Ş İ (U+011E, U+011F, U+015E,
   U+015F, U+0130). Yalnizca latin alsaydik sitedeki "ŞİLE" gibi
   yerler yedek fontla basilir, harfler birbirine uymazdi. Yalnizca
   "ı" (U+0131) latin dilimindedir — bu tuzaga dusmek kolay.

   Cyrillic ve Yunanca alinmiyor: sitede karsiligi yok, dosyayi
   buyutur. Tarayici latin-ext'i ancak o harfler sayfada gecince
   indiriyor (unicode-range), yani maliyeti yok. */
function yuzBul(metin, italikMi, dilim) {
  const isaret = dilim === "latin" ? "U+0000-00FF" : "U+0100-02BA";
  const bloklar = metin.split("@font-face").slice(1);
  for (const b of bloklar) {
    if (!b.includes(isaret)) continue;
    /* latin-ext blogu latin'i de icerebiliyor; ayirt etmek icin
       latin dilimi ararken latin-ext isaretini disliyoruz. */
    if (dilim === "latin" && b.includes("U+0100-02BA")) continue;
    const italikTasiyor = /font-style:\s*italic/.test(b);
    if (italikTasiyor !== italikMi) continue;
    const m = b.match(/src:\s*url\((https:[^)]+\.woff2)\)/);
    if (m) return m[1];
  }
  return null;
}

async function indir(adres, hedef) {
  const c = await fetch(adres, { headers: { "User-Agent": TARAYICI } });
  if (!c.ok) throw new Error(`indirilemedi (${c.status})`);
  const veri = Buffer.from(await c.arrayBuffer());
  fs.writeFileSync(hedef, veri);
  return veri.length;
}

let toplam = 0;
for (const [aile, dosya, aralik, italik] of AILELER) {
  try {
    const metin = await css(aile, aralik, italik);

    let satir = `${aile.padEnd(20)}`;

    for (const [dilim, ek] of [["latin", ""], ["latin-ext", "-ext"]]) {
      const duz = yuzBul(metin, false, dilim);
      if (!duz) {
        if (dilim === "latin") throw new Error("latin dilimi bulunamadi");
        satir += `  ${dilim}: yok`;
        continue;
      }
      const n = await indir(duz, path.join(HEDEF, `${dosya}${ek}.woff2`));
      toplam += n;
      satir += `  ${dilim} ${(n / 1024).toFixed(0)} KB`;

      if (italik) {
        const it = yuzBul(metin, true, dilim);
        if (it) {
          const m = await indir(it, path.join(HEDEF, `${dosya}${ek}-italic.woff2`));
          toplam += m;
          satir += ` (+it ${(m / 1024).toFixed(0)})`;
        }
      }
    }
    console.log(satir);
  } catch (e) {
    console.log(`${aile.padEnd(20)} HATA: ${e.message}`);
  }
}

console.log(`\ntoplam ${(toplam / 1024 / 1024).toFixed(2)} MB (depoda durur, okura yalnizca secili ikili iner)`);
