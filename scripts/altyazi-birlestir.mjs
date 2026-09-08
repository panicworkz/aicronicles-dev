/**
 * GORSEL KREDILERINI ALTYAZIYA TASIR.
 *
 * Sorun: "Photo by Daniil Komov on Pexels" gibi kaynak satirlari
 * govdede AYRI BIR PARAGRAF olarak duruyor. Yani teknik olarak
 * icerigin parcasilar: 17 punto Inter, tam govde rengi. Okurken
 * yazinin bir cumlesi gibi gorunuyorlar.
 *
 * Dogrusu: kredi, gorselin altyazisidir. Blok modelinde gorsel
 * blogunun zaten bir "altyazi" alani var ve figcaption olarak
 * basiliyor — kucuk, mono, soluk. Yani tasarim hazir; veri yanlis
 * yerde duruyordu.
 *
 * NEDEN CSS ILE YAPILMADI: "gorselden sonraki paragrafi kucult"
 * demek (img + p) gorselden sonra gelen HER paragrafi kucultur —
 * olculdu, cogu gercek govde metni. Ayrica kredi o zaman gorselin
 * ALANI olmaz; yazar onu gorselin ayar panelinden duzenleyemez.
 *
 * TEMKINLI ESLESME: yalnizca gorselin HEMEN ardindaki, kisa ve
 * taninan bir kalipla baslayan paragraf tasiniyor. Suphede birakiyor.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/altyazi-birlestir.mjs --dene
 *   node --experimental-strip-types scripts/altyazi-birlestir.mjs
 */

import pg from "pg";
import { parse } from "node-html-parser";
import { bloklarHtmle } from "../src/lib/bloklar.ts";

const dene = process.argv.includes("--dene");

/* Kalip listesi bilerek dar. "Bu fotograf..." diye baslayan gercek bir
   govde cumlesini altyaziya cevirmektense, birkac krediyi kacirmak
   yeglenir — ilki icerigi bozar, ikincisi yalnizca eksik birakir. */
const KALIP = /^\s*(photo|image|illustration|picture|source|credit|photograph)s?\b/i;
const AZAMI_UZUNLUK = 160;

const duzMetin = (h) => parse(h).textContent.replace(/\s+/g, " ").trim();

function birlestir(bloklar) {
  const cikti = [];
  let tasinan = 0;

  for (let i = 0; i < bloklar.length; i++) {
    const b = bloklar[i];
    const sonraki = bloklar[i + 1];

    if (
      b?.t === "gorsel" &&
      !b.altyazi &&
      sonraki?.t === "paragraf" &&
      KALIP.test(duzMetin(sonraki.html)) &&
      duzMetin(sonraki.html).length <= AZAMI_UZUNLUK
    ) {
      cikti.push({
        ...b,
        /* Baglantilar KORUNUYOR: kredi satirinin degeri zaten
           fotografciya giden baglantida. */
        altyazi: sonraki.html,
        /* Ciplak gorsel figure'e yukseliyor: figcaption ancak
           figure icinde basiliyor, yoksa altyazi hic gorunmezdi. */
        ciplak: undefined,
      });
      i++; // kredi paragrafi tuketildi
      tasinan++;
      continue;
    }
    cikti.push(b);
  }
  return { bloklar: cikti, tasinan };
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { rows } = await db.query(
  `SELECT id, title, slug, blocks_json FROM posts WHERE blocks_json IS NOT NULL ORDER BY id`
);

let toplam = 0;
const degisen = [];

for (const y of rows) {
  const { bloklar, tasinan } = birlestir(y.blocks_json);
  if (!tasinan) continue;
  toplam += tasinan;
  degisen.push({ slug: y.slug, tasinan });

  if (!dene) {
    /* content_html da bloklardan yeniden uretiliyor: RSS, llms.txt ve
       SSS cikarimi oradan okuyor. Guncellemezsek kredi satiri o
       yerlerde govde metni olarak kalmaya devam ederdi. */
    await db.query(`UPDATE posts SET blocks_json = $1, content_html = $2 WHERE id = $3`, [
      JSON.stringify(bloklar),
      bloklarHtmle(bloklar),
      y.id,
    ]);
  }
}

console.log(
  `\n${dene ? "DENEME — yazilmadi" : "TAMAM"}\n` +
    `  yazi:            ${rows.length}\n` +
    `  etkilenen yazi:  ${degisen.length}\n` +
    `  tasinan kredi:   ${toplam}`
);
for (const d of degisen.slice(0, 15)) console.log(`   · ${d.slug} (${d.tasinan})`);

await db.end();
