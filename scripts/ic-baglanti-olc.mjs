/**
 * IC BAGLANTI OLCUMU.
 *
 * Soru: sitede, baska hicbir yerden baglanti almayan yazi kaldi mi?
 *
 * Iki kaynak birden sayiliyor:
 *   1. GOVDE baglantilari — bir yazinin metninde gecen /slug adresleri
 *   2. ILGILI YAZILAR halkasi — sayfa sablonunun bastigi baglantilar
 *      (frontend/[slug]/page.tsx icindeki ayni kural birebir burada
 *      da uygulaniyor)
 *
 * Ikincisi eklenmeden olcum yaniltiyordu: rapor "24 yazi oksuz"
 * diyordu ama sablon zaten baglanti basiyordu — yalnizca hep AYNI
 * dokuz yaziya. Simdi ikisi birlikte olculuyor.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/ic-baglanti-olc.mjs
 */

import pg from "pg";
import { parse } from "node-html-parser";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { rows: yazilar } = await db.query(
  `SELECT id, slug, title, category_id, content_html
     FROM posts WHERE status = 'published' ORDER BY id`
);

/* --- 1. govde baglantilari --- */
const gelen = new Map(yazilar.map((y) => [y.slug, { govde: 0, halka: 0 }]));

for (const y of yazilar) {
  for (const a of parse(y.content_html ?? "").querySelectorAll("a")) {
    const h = (a.getAttribute("href") ?? "").split(/[?#]/)[0].replace(/\/$/, "");
    if (!h.startsWith("/")) continue;
    const hedef = h.slice(1);
    if (hedef === y.slug) continue;
    const kayit = gelen.get(hedef);
    if (kayit) kayit.govde++;
  }
}

/* --- 2. ilgili yazilar halkasi (sablonun kuralinin aynisi) --- */
for (const y of yazilar) {
  const kardesler = yazilar.filter((p) => p.category_id === y.category_id);
  const sira = kardesler.findIndex((p) => p.id === y.id);
  for (let k = 1; k <= 4 && k < kardesler.length; k++) {
    gelen.get(kardesler[(sira + k) % kardesler.length].slug).halka++;
  }
  const digerleri = yazilar.filter((p) => p.category_id !== y.category_id);
  if (digerleri.length) {
    const kayma = y.id % digerleri.length;
    for (let k = 0; k < Math.min(5, digerleri.length); k++) {
      gelen.get(digerleri[(kayma + k) % digerleri.length].slug).halka++;
    }
  }
}

/* --- sonuc --- */
const oksuz = yazilar.filter((y) => {
  const g = gelen.get(y.slug);
  return g.govde === 0 && g.halka === 0;
});

const govdesizAma = yazilar.filter((y) => {
  const g = gelen.get(y.slug);
  return g.govde === 0 && g.halka > 0;
});

const sayilar = yazilar.map((y) => gelen.get(y.slug).govde + gelen.get(y.slug).halka);
const enAz = Math.min(...sayilar);
const ortalama = (sayilar.reduce((a, b) => a + b, 0) / sayilar.length).toFixed(1);

console.log(`\nyazi: ${yazilar.length}`);
console.log(`  hicbir yerden baglanti almayan : ${oksuz.length}`);
console.log(`  yalnizca sablondan alan        : ${govdesizAma.length}`);
console.log(`  en az gelen baglanti           : ${enAz}`);
console.log(`  yazi basina ortalama           : ${ortalama}`);

for (const y of oksuz.slice(0, 10)) console.log(`  ✗ ${y.slug}`);

await db.end();
process.exit(oksuz.length ? 1 : 0);
