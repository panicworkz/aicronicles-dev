/**
 * KIRIK GORSEL YOLLARINI DUZELTIR.
 *
 * BULGU: bes gorsel 404 doniyordu ve hepsinde ayni hata vardi —
 * Pexels adresi "pexels-image-<id>.jpeg" yazilmis, dogrusu
 * "pexels-photo-<id>.jpeg". Ayni klasordeki calisan gorseller
 * "photo" kullaniyor; yani bir yerde tek kelime yanlis yazilmis ve
 * bes yazida gorsel acilmamis.
 *
 * Degisiklik HEM bloklara HEM govde HTML'ine yaziliyor: ikisi
 * ayrisirsa hangisinin dogru oldugu belirsiz kalir.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/gorsel-yolu-duzelt.mjs --dene
 *   node --experimental-strip-types scripts/gorsel-yolu-duzelt.mjs
 */
import pg from "pg";

const dene = process.argv.includes("--dene");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

/* Yalnizca bu kalip: genel bir "image->photo" degisimi metindeki
   masum kelimeleri de bozardi. */
const KALIP = /pexels-image-(\d+)\.jpeg/g;
const YENI = "pexels-photo-$1.jpeg";

const { rows } = await db.query(
  `SELECT id, slug, title, content_html, blocks_json
     FROM posts WHERE content_html LIKE '%pexels-image-%' ORDER BY id`
);

console.log(`etkilenen yazi: ${rows.length}\n`);
let yazilan = 0;

for (const y of rows) {
  const yeniHtml = y.content_html.replace(KALIP, YENI);
  const yeniBlok = y.blocks_json
    ? JSON.parse(JSON.stringify(y.blocks_json).replace(KALIP, YENI))
    : y.blocks_json;

  const sayi = (y.content_html.match(KALIP) ?? []).length;
  console.log(`  #${y.id} ${y.title.slice(0, 48)} — ${sayi} gorsel`);

  if (!dene) {
    await db.query(
      `UPDATE posts SET content_html = $1, blocks_json = $2, updated_at = now() WHERE id = $3`,
      [yeniHtml, yeniBlok ? JSON.stringify(yeniBlok) : null, y.id]
    );
  }
  yazilan++;
}

/* Kontrol: kalip hicbir yerde kalmamali. */
const { rows: [kalan] } = await db.query(
  `SELECT count(*)::int n FROM posts WHERE content_html LIKE '%pexels-image-%'
      OR blocks_json::text LIKE '%pexels-image-%'`
);

console.log(
  `\n${dene ? "DENEME" : "TAMAM"} — ${yazilan} yazi` +
    (dene ? "" : `\nkalan hatali adres: ${kalan.n}`)
);
await db.end();
