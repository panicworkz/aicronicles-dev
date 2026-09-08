/**
 * BLOK GOCU ICIN GUVENLIK TESTI.
 *
 * Tek isi su soruyu olcmek: 47 yazinin HTML'ini bloklara cevirip
 * geri HTML'e urettigimizde ANLAMLI bir sey kayboluyor mu?
 *
 * Neden veritabanina yazmadan once: goc geri alinamayan bir sey.
 * Bloklarin dogruluk kaynagi olmasi, HTML'in onlardan uretilmesi
 * demek — cevrimde kaybolan bir sey varsa 47 yayindaki yazinin
 * govdesinden kalici olarak silinir. O yuzden once olculuyor.
 *
 * Nasil olcuyor: bicimsel farki degil ANLAMI karsilastiriyor.
 *   - metin: tum etiketler atilip yalnizca kelimeler
 *   - iskelet: etiket adlarinin sirasi (p, h2, ul, li...)
 *   - baglantilar / gorseller / baslik kimlikleri: birebir kume
 * Bosluk, tirnak bicimi, oznitelik sirasi gibi farklar onemsiz;
 * eksilen bir cumle, kaybolan bir baglanti ya da dusen bir baslik
 * kimligi onemli.
 *
 * Kullanim:  node scripts/blok-gidis-donus.mjs <yedek.sql>
 */

import fs from "node:fs";
import { parse } from "node-html-parser";
import { htmlBloklara, bloklarHtmle } from "../src/lib/bloklar.ts";

const yol = process.argv[2];
if (!yol) {
  console.error("kullanim: node scripts/blok-gidis-donus.mjs <yedek.sql>");
  process.exit(1);
}

/* ---- yedekten yazilari cikar ---------------------------------- */

const satirlar = fs.readFileSync(yol, "utf8").split("\n");
const basI = satirlar.findIndex((s) => s.startsWith("COPY public.posts "));
if (basI < 0) {
  console.error("yedekte posts tablosu bulunamadi");
  process.exit(1);
}
const sutunlar = satirlar[basI]
  .slice(satirlar[basI].indexOf("(") + 1, satirlar[basI].indexOf(")"))
  .split(",")
  .map((s) => s.trim());
const iBaslik = sutunlar.indexOf("title");
const iHtml = sutunlar.indexOf("content_html");

/* pg_dump COPY bicimi: alanlar sekme ile ayrilir, satir sonlari ve
   sekmeler \n \t olarak kacislanir. Kacislari cozmezsek HTML yanlis
   ayrisir ve test gercekte olmayan bir hata gosterir. */
function kacisCoz(s) {
  return s
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

const yazilar = [];
for (let i = basI + 1; i < satirlar.length; i++) {
  if (satirlar[i] === "\\.") break;
  const alanlar = satirlar[i].split("\t");
  if (alanlar.length < sutunlar.length) continue;
  const html = alanlar[iHtml];
  if (!html || html === "\\N") continue;
  yazilar.push({ baslik: kacisCoz(alanlar[iBaslik]), html: kacisCoz(html) });
}

/* ---- anlam olcumleri ------------------------------------------ */

/* BOSLUKLAR TAMAMEN ATILIYOR — bilerek.
   Ozgun HTML bloklari bitisik yaziyor (</p><p>), bizim urettigimiz
   arasina satir sonu koyuyor. Tarayici ikisini ayni basiyor ama duz
   metne cevirince "...proje.Bu" ile "...proje. Bu" ayri gorunuyor.
   Bu bir kayip degil, bicim farki; olcume karistirirsa 47 yazinin
   hepsi bosuna kirmizi yanar ve GERCEK kayiplari orter.
   Bir kelimenin dusmesi bu olcumden yine kacamaz: harfler eksilir. */
const metin = (h) => parse(h).textContent.replace(/\s+/g, "");

/* Bosluk farki yine de raporlaniyor — ayri bir satirda, uyari olarak.
   Sessizce yutmak, gercekten bosluk yiyen bir hatayi gizlerdi. */
const metinBoslukla = (h) => parse(h).textContent.replace(/\s+/g, " ").trim();

/* Etiket sirasi. Ilgilendigimiz sey duzenin korunmasi: bir h2'nin
   p'ye donusmesi ya da bir listenin dagilmasi burada yakalanir. */
const iskelet = (h) => {
  const cik = [];
  const gez = (d) => {
    for (const c of d.childNodes) {
      if (c.nodeType === 1) {
        cik.push(c.tagName.toLowerCase());
        gez(c);
      }
    }
  };
  gez(parse(h));
  return cik;
};

const kume = (h, sec, oz) =>
  parse(h)
    .querySelectorAll(sec)
    .map((e) => e.getAttribute(oz))
    .filter(Boolean)
    .sort();

const fark = (a, b) => {
  const eksik = a.filter((x) => !b.includes(x));
  const fazla = b.filter((x) => !a.includes(x));
  return { eksik, fazla };
};

/* ---- test ------------------------------------------------------ */

let temiz = 0;
let boslukFarki = 0;
const sorunlar = [];
const blokSayaci = {};

for (const y of yazilar) {
  const bloklar = htmlBloklara(y.html);
  for (const b of bloklar) blokSayaci[b.t] = (blokSayaci[b.t] ?? 0) + 1;

  const geri = bloklarHtmle(bloklar);
  const kusur = [];

  const a = metin(y.html);
  const b = metin(geri);
  if (a !== b) {
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    kusur.push(
      `METIN KAYBI (${a.length}→${b.length} karakter), ${i}. karakterde:\n` +
        `      once: ...${a.slice(Math.max(0, i - 40), i + 60)}\n` +
        `      sonra: ...${b.slice(Math.max(0, i - 40), i + 60)}`
    );
  } else if (metinBoslukla(y.html) !== metinBoslukla(geri)) {
    boslukFarki++;
  }

  const i1 = iskelet(y.html).join(",");
  const i2 = iskelet(geri).join(",");
  if (i1 !== i2) {
    const f = fark(iskelet(y.html), iskelet(geri));
    kusur.push(
      `ISKELET ayrisiyor — dusen: ${[...new Set(f.eksik)].join(" ") || "-"} / eklenen: ${[...new Set(f.fazla)].join(" ") || "-"}`
    );
  }

  for (const [ad, sec, oz] of [
    ["baglanti", "a", "href"],
    ["gorsel", "img", "src"],
    ["baslik kimligi", "h2,h3,h4", "id"],
  ]) {
    const f = fark(kume(y.html, sec, oz), kume(geri, sec, oz));
    if (f.eksik.length || f.fazla.length) {
      kusur.push(
        `${ad.toUpperCase()} kaybi — dusen ${f.eksik.length}: ${f.eksik.slice(0, 3).join(" | ")}`
      );
    }
  }

  if (kusur.length === 0) temiz++;
  else sorunlar.push({ baslik: y.baslik, kusur });
}

/* ---- rapor ----------------------------------------------------- */

console.log(`\nyazi: ${yazilar.length}   temiz: ${temiz}   sorunlu: ${sorunlar.length}`);
console.log(`yalnizca blok arasi bosluk farki (zararsiz): ${boslukFarki}\n`);
console.log("blok dagilimi:");
for (const [t, n] of Object.entries(blokSayaci).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t.padEnd(10)} ${n}`);
}

if (sorunlar.length) {
  console.log("\n--- SORUNLAR ---");
  for (const s of sorunlar.slice(0, 8)) {
    console.log(`\n▸ ${s.baslik}`);
    for (const k of s.kusur) console.log(`    ${k}`);
  }
  if (sorunlar.length > 8) console.log(`\n... ve ${sorunlar.length - 8} yazi daha`);
}

/* Cikis kodu: goc betigi bu testi gecmeden calismamali. */
process.exit(sorunlar.length ? 1 : 0);
