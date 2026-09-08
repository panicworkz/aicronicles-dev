/**
 * BLOK GOCU — yazilarin govdesini bloklara cevirir.
 *
 * GUVENLIK: her yazi icin cevrim once BELLEKTE dogrulanir; bloklardan
 * uretilen HTML'in metni, baglantilari, gorselleri ve baslik kimlikleri
 * ozgunuyle bire bir ayni degilse O YAZI ATLANIR ve raporlanir.
 * Yani kotu bir cevrim veritabanina hic ulasmiyor.
 *
 * content_html'e DOKUNULMUYOR. Bloklar yaninda duruyor; okuma ekrani,
 * RSS, SSS cikarimi, AEO — hepsi eskisi gibi calismaya devam ediyor.
 * HTML'in bloklardan uretilmesi editorun kaydetmesiyle basliyor.
 * Bu sayede goc geri alinabilir: blocks_json sutununu bosaltmak
 * sistemi eski haline dondurur.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/blok-gocu.mjs --dene   (yazmaz)
 *   node --experimental-strip-types scripts/blok-gocu.mjs          (yazar)
 */

import pg from "pg";
import { parse } from "node-html-parser";
import { htmlBloklara, bloklarHtmle } from "../src/lib/bloklar.ts";

const dene = process.argv.includes("--dene");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

/* Sutun yoksa aciliyor. IF NOT EXISTS: betigin ikinci kez
   calistirilmasi hata vermesin. */
if (!dene) {
  await db.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS blocks_json jsonb`);
  await db.query(
    `ALTER TABLE post_revisions ADD COLUMN IF NOT EXISTS blocks_json jsonb`
  );
}

/* ---- dogrulama olcutleri (blok-gidis-donus.mjs ile ayni) -------- */

const metin = (h) => parse(h).textContent.replace(/\s+/g, "");
const kume = (h, sec, oz) =>
  parse(h)
    .querySelectorAll(sec)
    .map((e) => e.getAttribute(oz))
    .filter(Boolean)
    .sort()
    .join("|");

function guvenliMi(once, sonra) {
  if (metin(once) !== metin(sonra)) return "metin";
  for (const [ad, sec, oz] of [
    ["baglanti", "a", "href"],
    ["gorsel", "img", "src"],
    ["baslik kimligi", "h2,h3,h4", "id"],
  ]) {
    if (kume(once, sec, oz) !== kume(sonra, sec, oz)) return ad;
  }
  return null;
}

/* ---- goc ------------------------------------------------------- */

const { rows } = await db.query(
  `SELECT id, title, content_html FROM posts WHERE content_html IS NOT NULL ORDER BY id`
);

let yazilan = 0;
const atlanan = [];

for (const y of rows) {
  const bloklar = htmlBloklara(y.content_html);
  const kusur = guvenliMi(y.content_html, bloklarHtmle(bloklar));

  if (kusur) {
    atlanan.push({ id: y.id, baslik: y.title, kusur });
    continue;
  }
  if (!dene) {
    await db.query(`UPDATE posts SET blocks_json = $1 WHERE id = $2`, [
      JSON.stringify(bloklar),
      y.id,
    ]);
  }
  yazilan++;
}

console.log(
  `\n${dene ? "DENEME — hicbir sey yazilmadi" : "GOC TAMAM"}\n` +
    `  yazi:      ${rows.length}\n` +
    `  cevrilen:  ${yazilan}\n` +
    `  atlanan:   ${atlanan.length}`
);

for (const a of atlanan) {
  console.log(`  ✗ #${a.id} ${a.baslik.slice(0, 50)} — ${a.kusur} ayrisiyor`);
}

/* Atlanan yazilarin govdesi ESKISI GIBI calisiyor: blocks_json bos
   kaldigi icin lib/bloklar.ts okurken HTML'den uretiyor. Yani goc
   yarim kalsa bile hicbir yazi kirilmiyor. */

await db.end();
process.exit(atlanan.length ? 1 : 0);
