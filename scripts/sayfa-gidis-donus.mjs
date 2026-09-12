/**
 * SABIT SAYFA GIDIS-DONUS OLCUMU.
 *
 * Sorulan soru: "sayfayi tuvalde acip hicbir sey degistirmeden
 * kaydedersem, icerik AYNI mi kaliyor?"
 *
 * Yol tam olarak su:
 *   blok -> isaretli HTML -> okuma aninda doldurma (kunye kartlari)
 *        -> (yazar burada duzenler) -> ayristirma -> blok
 *
 * Doldurma adimi onemli: kunye karti okuma aninda ad ve portre
 * BASIYOR. Bu enjekte edilen parcalar ayristirmada geri dusmezse her
 * kaydetmede sayfaya bir kez daha yazilir ve icerik sisirdi.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/sayfa-gidis-donus.mjs
 */

import pg from "pg";
import { htmlBloklara, bloklarHtmle } from "../src/lib/bloklar.ts";
import { isaretleriDoldurSenkron } from "../src/lib/blok-doldur.ts";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { rows: yazarlar } = await db.query(`SELECT id, name, slug, role, avatar_url FROM authors`);
const tablo = new Map(yazarlar.map((y) => [y.id, y]));

/* Yayindaki doldurucunun (lib/yazar-blogu.ts) urettigi isaretlemenin
   aynisi. Veritabani cagrisi olmadan calissin diye burada yeniden
   kuruluyor; sinanan sey ISARETLEMENIN SEKLI. */
function kunyeDoldur(html) {
  return isaretleriDoldurSenkron(html, "yazarlar", (o) => {
    const kartlar = o
      .querySelectorAll(".yazar-kart")
      .map((k) => {
        const y = tablo.get(Number(k.getAttribute("data-yazar")));
        if (!y) return "";
        return (
          `<div class="yazar-kart" data-yazar="${y.id}">` +
          `<div class="yazar-kimlik" contenteditable="false">` +
          (y.avatar_url
            ? `<img src="${y.avatar_url}" alt="" class="yazar-gorsel" loading="lazy">`
            : `<span class="yazar-harf" aria-hidden="true">${y.name[0]}</span>`) +
          `<a class="yazar-ad" href="/author/${y.slug}">${y.name}</a>` +
          (y.role ? `<span class="yazar-rol">${y.role}</span>` : "") +
          `</div>` +
          `<div class="yazar-govde">${k.querySelector(".yazar-govde")?.innerHTML ?? ""}</div>` +
          `</div>`
        );
      })
      .join("");
    return kartlar ? `<div class="yazarlar" data-blok="yazarlar">${kartlar}</div>` : "";
  });
}

const { rows } = await db.query(
  `SELECT id, slug, blocks_json FROM pages WHERE blocks_json IS NOT NULL ORDER BY id`
);

let temiz = 0;
const bozuk = [];

for (const s of rows) {
  const bloklar = s.blocks_json;
  /* Tuvalde gorunen isaretleme: isaretli uretim + doldurma. */
  const ekranda = kunyeDoldur(bloklarHtmle(bloklar, { isaretle: true }));
  const donen = htmlBloklara(ekranda);

  /* ANAHTAR SIRASI onemli degil: ayni blok, alanlari baska sirada
     yazilmis olabilir. Sirali karsilastirma yapmasaydik butun
     sayfalar "ayristi" gorunurdu — olcum degil gurultu. */
  const duzenle = (x) =>
    JSON.stringify(x, (_, d) =>
      d && typeof d === "object" && !Array.isArray(d)
        ? Object.fromEntries(Object.entries(d).sort(([m], [n]) => m.localeCompare(n)))
        : d
    );
  const a = duzenle(bloklar);
  const b = duzenle(donen);
  if (a === b) {
    temiz++;
    continue;
  }
  /* Hangi blokta ayrildigini soyle: "fark var" demek, bakan kisiyi
     iki bin satirlik iki JSON'u goz ile karsilastirmaya birakirdi. */
  const n = Math.max(bloklar.length, donen.length);
  const ayrik = [];
  for (let i = 0; i < n; i++) {
    if (duzenle(bloklar[i]) !== duzenle(donen[i])) {
      ayrik.push(`${i}: ${bloklar[i]?.t ?? "-"} -> ${donen[i]?.t ?? "-"}`);
    }
  }
  bozuk.push({ slug: s.slug, ayrik: ayrik.slice(0, 4) });
}

console.log(`\nsayfa: ${rows.length}  kayipsiz: ${temiz}  ayrisan: ${bozuk.length}`);
for (const b of bozuk) console.log(`  ✗ ${b.slug} — ${b.ayrik.join(" | ")}`);

await db.end();
process.exit(bozuk.length ? 1 : 0);
