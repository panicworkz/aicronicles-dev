/**
 * KAYITLI YAZILARI SEMADAN GECIRIR.
 *
 * Neden gerekti: panelde bir yazi acilip kaydedildiginde TipTap butun
 * baglantilari yeniden yaziyordu — kendi panel sinifini, target="_blank"
 * ve nofollow ekliyordu. Icindekiler listesindeki "#baslik"
 * baglantilari boylece bozuldu: okur icindekilere tikladiginda AYNI
 * SAYFA yeni bir sekmede acilmaya basladi. Ustelik madde icerikleri
 * <p> ile sarilmisti.
 *
 * Ayristirici artik bunlari kayit aninda duzeltiyor, ama ZATEN
 * KAYDEDILMIS yazilar bozuk duruyor. Bu betik onlari bir kez daha
 * ayni suzgecten geciriyor.
 *
 * Yalnizca DEGISEN yazilara dokunuyor ve her degisikligi sayiyor;
 * "hicbir sey olmadi" ile "sessizce bozdum" ayirt edilebilsin diye.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/blok-normallestir.mjs --dene
 *   node --experimental-strip-types scripts/blok-normallestir.mjs
 */

import pg from "pg";
import { htmlBloklara, bloklarHtmle } from "../src/lib/bloklar.ts";

const dene = process.argv.includes("--dene");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { rows } = await db.query(
  `SELECT id, slug, content_html FROM posts WHERE content_html IS NOT NULL ORDER BY id`
);

let degisen = 0;
const sayac = { hedefBlank: 0, nofollow: 0, panelSinifi: 0, maddeIcindeP: 0 };
const ornekler = [];

for (const y of rows) {
  const once = y.content_html;

  /* Neyin duzeldigi ONCEDEN sayiliyor: sonucu "degisti" diye gecmek,
     ne duzeldigini bilmeden veri yazmak olurdu. */
  const icBaglantilar = [...once.matchAll(/<a\b[^>]*href="#[^"]*"[^>]*>/g)].map((m) => m[0]);
  for (const a of icBaglantilar) {
    if (/target=/.test(a)) sayac.hedefBlank++;
    if (/nofollow/.test(a)) sayac.nofollow++;
  }
  sayac.panelSinifi += (once.match(/class="text-primary underline[^"]*"/g) || []).length;
  sayac.maddeIcindeP += (once.match(/<li><p>/g) || []).length;

  const bloklar = htmlBloklara(once);
  const sonra = bloklarHtmle(bloklar);
  if (sonra === once) continue;

  degisen++;
  if (ornekler.length < 3) {
    const i = [...once].findIndex((h, k) => h !== sonra[k]);
    ornekler.push({
      slug: y.slug,
      once: once.slice(Math.max(0, i - 40), i + 110),
      sonra: sonra.slice(Math.max(0, i - 40), i + 110),
    });
  }

  if (!dene) {
    await db.query(`UPDATE posts SET blocks_json = $1, content_html = $2 WHERE id = $3`, [
      JSON.stringify(bloklar),
      sonra,
      y.id,
    ]);
  }
}

console.log(
  `\n${dene ? "DENEME — yazilmadi" : "TAMAM"}\n` +
    `  yazi:            ${rows.length}\n` +
    `  degisen yazi:    ${degisen}\n\n` +
    `  ic baglantida target="_blank": ${sayac.hedefBlank}\n` +
    `  ic baglantida nofollow:        ${sayac.nofollow}\n` +
    `  yayina sizmis panel sinifi:    ${sayac.panelSinifi}\n` +
    `  <li><p> sarmali:               ${sayac.maddeIcindeP}`
);

for (const o of ornekler) {
  console.log(`\n▸ ${o.slug}\n   once : …${o.once}…\n   sonra: …${o.sonra}…`);
}

await db.end();
