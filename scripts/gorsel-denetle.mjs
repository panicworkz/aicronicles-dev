/**
 * GOVDEDEKI GORSELLERI DENETLER.
 *
 * Yazilarin icindeki her <img> adresini TEK TEK cagirip gercekten
 * acilip acilmadigina bakiyor. Veritabaninda adres yazili olmasi
 * gorselin durdugu anlamina gelmiyor: Ghost'tan tasinirken yol
 * degismis, dosya silinmis ya da adres disarida bir siteyi
 * gosteriyor olabilir.
 *
 * DISARIDAKI adresler ayri sayiliyor: calisiyor olabilirler ama bizim
 * denetimimizde degiller — bir gun sessizce kaybolurlar.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/gorsel-denetle.mjs
 *   node --experimental-strip-types scripts/gorsel-denetle.mjs --kok https://fabelo.io
 */

import pg from "pg";
import { parse } from "node-html-parser";

const kokIndeks = process.argv.indexOf("--kok");
const KOK = kokIndeks > -1 ? process.argv[kokIndeks + 1] : "https://fabelo.io";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { rows: yazilar } = await db.query(
  `SELECT id, slug, title, content_html, featured_image_url
     FROM posts WHERE status = 'published' ORDER BY id`
);
const { rows: sayfalar } = await db.query(
  `SELECT id, slug, title, content_html, featured_image_url
     FROM pages WHERE status = 'published' ORDER BY id`
);

/* Adres -> onu kullanan kayitlar. Ayni gorsel bircok yazida
   gecebiliyor; her seferinde yeniden istek atmak gereksiz. */
const adresler = new Map();

/* DIKKAT: kayitin TAMAMI geciyor. Ilk yazdigimda yalnizca
   {id, slug, title} gonderiyordum ve fonksiyon content_html ile
   featured_image_url'i bulamiyordu — betik "0 adres" deyip temiz
   rapor veriyordu. Hicbir hata vermeyen, tamamen yanlis bir sonuc. */
function topla(kayit, tur) {
  const ekle = (src, yer) => {
    if (!src) return;
    const t = src.trim();
    if (!t || t.startsWith("data:")) return;
    if (!adresler.has(t)) adresler.set(t, []);
    adresler.get(t).push({ tur, id: kayit.id, slug: kayit.slug, title: kayit.title, yer });
  };

  ekle(kayit.featured_image_url, "kapak");
  for (const i of parse(kayit.content_html ?? "").querySelectorAll("img")) {
    ekle(i.getAttribute("src"), "govde");
  }
}

for (const y of yazilar) topla(y, "yazi");
for (const s of sayfalar) topla(s, "sayfa");

console.log(`denetlenecek farkli adres: ${adresler.size}\n`);

const kirik = [];
const disarida = [];
let saglam = 0;

for (const [adres, kullananlar] of adresler) {
  const disKaynak = /^https?:\/\//i.test(adres) && !adres.startsWith(KOK);
  const tam = /^https?:\/\//i.test(adres) ? adres : `${KOK}${adres.startsWith("/") ? "" : "/"}${adres}`;

  let durum = 0;
  try {
    /* HEAD bazi sunucularda desteklenmiyor; basarisizsa GET ile
       yeniden deneniyor, yoksa calisan bir gorsel kirik sayilirdi. */
    let y = await fetch(tam, { method: "HEAD", signal: AbortSignal.timeout(12000) });
    if (y.status === 405 || y.status === 501) {
      y = await fetch(tam, { method: "GET", signal: AbortSignal.timeout(12000) });
    }
    durum = y.status;
  } catch {
    durum = 0;
  }

  if (durum >= 200 && durum < 400) {
    saglam++;
    if (disKaynak) disarida.push({ adres, kullananlar });
  } else {
    kirik.push({ adres, durum, kullananlar, disKaynak });
  }
}

console.log(`saglam : ${saglam}`);
console.log(`kirik  : ${kirik.length}`);
console.log(`disarida barinan (calisiyor ama bizim degil): ${disarida.length}\n`);

for (const k of kirik) {
  console.log(`✗ [${k.durum || "ulasilamadi"}] ${k.adres}`);
  for (const u of k.kullananlar.slice(0, 4)) {
    console.log(`     ${u.tur} #${u.id} (${u.yer}) ${u.title.slice(0, 52)}`);
  }
  if (k.kullananlar.length > 4) console.log(`     +${k.kullananlar.length - 4} yerde daha`);
}

if (disarida.length) {
  console.log(`\n— disarida barinanlar —`);
  for (const d of disarida.slice(0, 10)) {
    console.log(`  ${d.adres.slice(0, 90)}  (${d.kullananlar.length} yerde)`);
  }
}

await db.end();
process.exit(kirik.length ? 1 : 0);
