/**
 * GIZLILIK SAYFASINA SEPET MADDESI EKLER.
 *
 * NEDEN: sepet golgesi (carts tablosu) kisisel veri isliyor —
 * sepetteki urunler, ve odeme adiminda yazildiysa ad ve e-posta.
 * Yapilan bir islemi gizlilik metninde anlatmamak, daha once
 * "Cloudflare Web Analytics kullaniyoruz" diye yazip kullanmamakla
 * ayni hata: belge ile gercek ayrisiyor.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/gizlilik-sepet.mjs --dene
 *   node --experimental-strip-types scripts/gizlilik-sepet.mjs
 */
import pg from "pg";
import { bloklarHtmle } from "../src/lib/bloklar.ts";

const dene = process.argv.includes("--dene");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { rows: [sayfa] } = await db.query(
  `SELECT id, blocks_json FROM pages WHERE slug = 'data-and-privacy'`
);
if (!sayfa) { console.error("sayfa yok"); process.exit(1); }

const MADDE =
  "<strong>Your basket:</strong> When you put something in the basket we " +
  "record what is in it on our own server, so we can see which products " +
  "people want and whether baskets are being left behind. Until you reach " +
  "the checkout form this record carries no name — only a random identifier " +
  "kept in your browser. If you fill in the checkout form, your name and " +
  "email are attached to it so we can help with an order that did not go " +
  "through. Emptying the basket deletes the record.";

let bloklar = sayfa.blocks_json;
let eklendi = false;

bloklar = bloklar.map((b) => {
  if (eklendi) return b;
  /* Toplanan verilerin anlatildigi listeye ekleniyor — ayri bir
     paragraf olarak sonuna atmak, konuyu ait oldugu yerden
     koparirdi. */
  if (b.t === "liste" && Array.isArray(b.ogeler) &&
      b.ogeler.some((o) => typeof o === "string" && o.includes("<strong>Analytics:"))) {
    if (b.ogeler.some((o) => o.includes("Your basket:"))) return b;
    eklendi = true;
    const i = b.ogeler.findIndex((o) => o.includes("<strong>Newsletter:"));
    const yeni = [...b.ogeler];
    yeni.splice(i === -1 ? yeni.length : i, 0, MADDE);
    return { ...b, ogeler: yeni };
  }
  return b;
});

if (!eklendi) {
  console.log("  · madde zaten var ya da liste bulunamadi");
} else {
  console.log("  → sepet maddesi eklendi");
  if (!dene) {
    await db.query(
      `UPDATE pages SET blocks_json = $1, content_html = $2, updated_at = now() WHERE id = $3`,
      [JSON.stringify(bloklar), bloklarHtmle(bloklar), sayfa.id]
    );
  }
}
console.log(`\n${dene ? "DENEME" : "TAMAM"}`);
await db.end();
