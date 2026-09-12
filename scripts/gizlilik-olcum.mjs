/**
 * GIZLILIK SAYFASINDAKI OLCUM ANLATIMINI DUZELTIR.
 *
 * NEDEN: sayfa "We use Cloudflare Web Analytics" diyordu. Kodda
 * boyle bir sey YOKTU — ne beacon betigi ne bir yapilandirma; aranip
 * bakildi, hicbir yerde gecmiyor. Yani hukuki bir belge, yapmadigimiz
 * bir olcumu ve kullanmadigimiz bir saglayiciyi anlatiyordu. Bu,
 * eksik bilgi vermekten daha kotu: yanlis bilgi vermek.
 *
 * Artik Umami var (kendi sunucumuzda, cerezsiz) ve metin ONU
 * anlatiyor — yani ilk kez dogru soyluyor.
 *
 * CLOUDFLARE'IN KENDISI KALIYOR. Once onu da silecektim; olctum:
 * fabelo.io yanitinda cf-ray basligi var, yani site gercekten
 * Cloudflare uzerinden sunuluyor. "Sunum ve guvenlik" maddesi ile
 * "guvenlik cerezi" cumlesi DOGRU. Yanlis olan tek sey, hic
 * kurulmamis olan Cloudflare Web Analytics'ti.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/gizlilik-olcum.mjs --dene
 *   node --experimental-strip-types scripts/gizlilik-olcum.mjs
 */

import pg from "pg";
import { bloklarHtmle } from "../src/lib/bloklar.ts";

const dene = process.argv.includes("--dene");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { rows: [sayfa] } = await db.query(
  `SELECT id, blocks_json FROM pages WHERE slug = 'data-and-privacy'`
);
if (!sayfa) {
  console.error("data-and-privacy sayfasi yok.");
  process.exit(1);
}

/* Metne gore bulunuyor, sira numarasina gore degil: sayfaya bir
   paragraf eklendigi anda numara kayar ve yanlis blok degisirdi. */
const DEGISIM = [
  {
    ara: "Cloudflare Web Analytics",
    yeni:
      "<strong>Analytics:</strong> We use Umami, an open-source, cookieless " +
      "analytics tool that we run on our own server. It records page-level " +
      "measurements — the page visited, the referring page, general country, " +
      "device and browser category. It sets no cookies, does not follow you " +
      "across other sites, and does not build a profile of you. The " +
      "measurements never leave our infrastructure and are not shared with " +
      "any advertising network.",
  },
  {
    ara: "retained by Cloudflare according to its Web Analytics retention period",
    yeni:
      "Analytics measurements are aggregate and are held on our own server. " +
      "Server and security logs are kept for a limited operational period and " +
      "then discarded. Email addresses are retained for as long as you remain " +
      "a subscriber. You may unsubscribe or request deletion at any time, and " +
      "we will remove the address and the sign-up record that accompanies it.",
  },
];

let bloklar = sayfa.blocks_json;
let degisen = 0;

/* PARAGRAF DA LISTE MADDESI DE taraniyor.
   Ilk yazdigimda yalnizca paragraflara bakiyordum; calistirdigimda
   "Analytics" maddesinin bir LISTE icinde oldugu ortaya cikti ve o
   satir hic degismedi. Sessizce yarim duzeltilmis bir gizlilik
   metni kalirdi. */
for (const d of DEGISIM) {
  let bulundu = false;

  bloklar = bloklar.map((b) => {
    if (b.t === "paragraf" && b.html.includes(d.ara)) {
      bulundu = true;
      return { ...b, html: d.yeni };
    }
    if (b.t === "liste" && Array.isArray(b.ogeler)) {
      const ogeler = b.ogeler.map((o) => {
        if (typeof o === "string" && o.includes(d.ara)) {
          bulundu = true;
          return d.yeni;
        }
        return o;
      });
      return bulundu ? { ...b, ogeler } : b;
    }
    return b;
  });

  if (bulundu) {
    degisen++;
    console.log(`  → duzeltildi: "${d.ara.slice(0, 38)}…"`);
  } else {
    console.log(`  · "${d.ara.slice(0, 38)}…" bulunamadi (belki zaten duzeltilmis)`);
  }
}

if (degisen && !dene) {
  await db.query(
    `UPDATE pages SET blocks_json = $1, content_html = $2, updated_at = now() WHERE id = $3`,
    [JSON.stringify(bloklar), bloklarHtmle(bloklar), sayfa.id]
  );
}

/* Son kontrol: "Cloudflare Web Analytics" ifadesi kalmamali.
   "Cloudflare" tek basina kalabilir ve KALMALI — site gercekten
   onun uzerinden sunuluyor (yanitta cf-ray basligi var). */
const kalan = bloklarHtmle(bloklar).includes("Cloudflare Web Analytics");
console.log(
  `\n${dene ? "DENEME" : "TAMAM"} — ${degisen} paragraf` +
    (kalan ? "\n  ! DIKKAT: sayfada hala 'Cloudflare' geciyor, elle bakin." : "")
);

await db.end();
process.exit(kalan ? 1 : 0);
