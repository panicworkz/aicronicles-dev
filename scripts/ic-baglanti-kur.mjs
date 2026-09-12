/**
 * GOVDE ICINDEN IC BAGLANTI KURAR.
 *
 * SORUN: 24 yazi yalnizca "ilgili yazilar" listesinden baglanti
 * aliyordu. Liste baglantisi ise yariyor ama bir CUMLENIN ICINE
 * yazilmis baglanti daha degerli: arama motoru cevredeki metinden
 * baglantinin neyle ilgili oldugunu anliyor.
 *
 * KURAL: HICBIR CUMLE UYDURULMUYOR.
 * Yeni metin yazmiyoruz, "ilgili yazilar" diye paragraf eklemiyoruz.
 * Yalnizca bir yazinin metninde ZATEN GECEN bir ifade, o ifadeyi
 * anlatan yaziya baglaniyor. Yani cumle aynen kaliyor, sadece
 * uzerinde bir baglanti oluyor.
 *
 * Bu yuzden her hedef icin baglanti bulunamayabilir ve BU NORMAL:
 * zorlama baglanti, hic baglanti olmamasindan kotudur.
 *
 * KORUMALAR
 *   - Zaten bir baglantinin icindeki metne dokunulmuyor
 *   - Basliklarda degil, yalnizca paragraf ve liste maddelerinde
 *   - Bir yazidan ayni hedefe EN FAZLA BIR baglanti
 *   - Bir yaziya en fazla uc yeni baglanti eklenir (metni
 *     baglanti tarlasina cevirmemek icin)
 *   - Kendine baglanti yok
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/ic-baglanti-kur.mjs --dene
 *   node --experimental-strip-types scripts/ic-baglanti-kur.mjs
 */

import pg from "pg";
import { parse } from "node-html-parser";
import { htmlBloklara, bloklarHtmle } from "../src/lib/bloklar.ts";

const dene = process.argv.includes("--dene");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { rows: yazilar } = await db.query(
  `SELECT id, slug, title, category_id, content_html
     FROM posts WHERE status = 'published' ORDER BY id`
);

/* --- kimler govdeden baglanti almiyor --- */
const govdeBaglantisi = new Set();
for (const y of yazilar) {
  for (const a of parse(y.content_html ?? "").querySelectorAll("a")) {
    const h = (a.getAttribute("href") ?? "").split(/[?#]/)[0].replace(/\/$/, "");
    if (h.startsWith("/")) govdeBaglantisi.add(h.slice(1));
  }
}
const hedefler = yazilar.filter((y) => !govdeBaglantisi.has(y.slug));

/**
 * Basliktan aranacak ifadeler.
 *
 * Basligin tamami metinde nadiren aynen geciyor ("How To Invest In
 * Stocks: A Complete Step-by-Step Guide"). Isе yarayan kisim
 * iki noktadan onceki konu: "how to invest in stocks". Onun da
 * kalibi dusunce geriye cekirdek kaliyor: "invest in stocks".
 *
 * Uzun ifade once deneniyor: daha ozgul olan daha iyi baglanti.
 */
function ifadeler(baslik) {
  const konu = baslik.split(":")[0].trim();
  const kucuk = konu.toLowerCase();
  const liste = [kucuk];

  const kalip = kucuk
    .replace(/^(how to|what is|best|the)\s+/i, "")
    .replace(/\s+(guide|explained|meaning)$/i, "")
    .trim();
  if (kalip && kalip !== kucuk) liste.push(kalip);

  /* Cekirdek: ilk iki-uc kelime. "how to save money on gas" ->
     "save money on gas" -> "save money" gibi. Genelden ozele degil,
     OZELDEN GENELE siralaniyor: once en ozgul ifade deneniyor. */
  const kelimeler = kalip.split(/\s+/);
  if (kelimeler.length > 3) liste.push(kelimeler.slice(0, 3).join(" "));
  if (kelimeler.length > 2) liste.push(kelimeler.slice(0, 2).join(" "));

  /* Tek kelime ve cok kisa ifadeler disarida: "money" kelimesine
     baglanti vermek her yaziyi birbirine baglar, hicbiri anlam
     tasimaz. */
  return [...new Set(liste)].filter(
    (i) => i.length >= 10 && i.split(/\s+/).length >= 2
  );
}

/* Bir yaziya bu calismada kac baglanti eklendi. */
const eklenenSayisi = new Map();
const degisen = new Map(); // id -> yeni html
const rapor = [];

function govde(yaziId) {
  return degisen.get(yaziId) ?? yazilar.find((y) => y.id === yaziId).content_html ?? "";
}

for (const hedef of hedefler) {
  const aranacak = ifadeler(hedef.title);
  if (!aranacak.length) {
    rapor.push({ hedef, durum: "ifade-yok" });
    continue;
  }

  /* Ayni kategoridekiler once: konu yakinligi orada. */
  const adaylar = [...yazilar]
    .filter((y) => y.id !== hedef.id)
    .sort((a, b) => {
      const ak = a.category_id === hedef.category_id ? 0 : 1;
      const bk = b.category_id === hedef.category_id ? 0 : 1;
      return ak - bk;
    });

  let kuruldu = false;

  for (const kaynak of adaylar) {
    if (kuruldu) break;
    if ((eklenenSayisi.get(kaynak.id) ?? 0) >= 3) continue;

    const kok = parse(govde(kaynak.id));

    /* METIN DUGUMU DUZEYINDE calisiyor.
       Ilk halinde "icinde herhangi bir etiket varsa atla" diyordum
       ve neredeyse her paragrafta bir <strong> oldugu icin 24
       hedeften yalnizca 2'sine baglanti kurulabildi. Oysa sorun
       etiketin varligi degil, ifadenin BIR ETIKETIN ORTASINA denk
       gelmesi. Metin dugumlerinde arayinca o tehlike kalmiyor:
       degisim her zaman duz metnin icinde oluyor.

       Bir baglantinin ICINDEKI metne dokunulmuyor — ic ice
       baglanti gecersiz isaretleme. */
    for (const oge of kok.querySelectorAll("p, li")) {
      if (kuruldu) break;
      if (oge.closest("figure")) continue; // gorsel altyazisi

      for (const dugum of oge.childNodes) {
        if (kuruldu) break;
        /* nodeType 3 = metin dugumu. Etiketlerin icine girmiyoruz:
           <strong> ya da <em> icindeki metin de guvenli olurdu ama
           ilk seviyede kalmak yeterli ve daha ongorulebilir. */
        if (dugum.nodeType !== 3) continue;

        const metin = dugum.rawText;
        if (!metin || metin.length < 12) continue;

        for (const ifade of aranacak) {
          const yer = metin.toLowerCase().indexOf(ifade);
          if (yer === -1) continue;

          /* Kelime siniri: "invest in stocks" ararken
             "reinvest in stocks" icindeki parcayi yakalamayalim. */
          const onceki = yer === 0 ? " " : metin[yer - 1];
          const sonraki = metin[yer + ifade.length] ?? " ";
          if (/[a-zA-Z0-9]/.test(onceki) || /[a-zA-Z0-9]/.test(sonraki)) continue;

          const gorunen = metin.slice(yer, yer + ifade.length);
          const yeniMetin =
            metin.slice(0, yer) +
            `<a href="/${hedef.slug}">${gorunen}</a>` +
            metin.slice(yer + ifade.length);

          /* Dugumun kendisi degistiriliyor, ogenin tamami degil:
             paragraftaki diger etiketler oldugu gibi kaliyor. */
          dugum.rawText = yeniMetin;

          degisen.set(kaynak.id, kok.toString());
          eklenenSayisi.set(kaynak.id, (eklenenSayisi.get(kaynak.id) ?? 0) + 1);
          rapor.push({ hedef, kaynak, ifade: gorunen });
          kuruldu = true;
          break;
        }
      }
    }
  }

  if (!kuruldu) rapor.push({ hedef, durum: "eslesme-yok" });
}

/* --- rapor --- */
const kurulan = rapor.filter((r) => r.kaynak);
const kurulmayan = rapor.filter((r) => !r.kaynak);

console.log(`govdeden baglanti almayan yazi: ${hedefler.length}`);
console.log(`baglanti kurulan              : ${kurulan.length}`);
console.log(`dogal esleme bulunamayan      : ${kurulmayan.length}\n`);

for (const r of kurulan) {
  console.log(`  → "${r.ifade}"`);
  console.log(`     ${r.kaynak.slug.slice(0, 46)}`);
  console.log(`     ⇒ ${r.hedef.slug.slice(0, 46)}`);
}
if (kurulmayan.length) {
  console.log(`\n  — metninde gecmedigi icin atlananlar —`);
  for (const r of kurulmayan) console.log(`  · ${r.hedef.slug.slice(0, 60)}`);
}

/* --- yazma --- */
if (!dene) {
  for (const [id, html] of degisen) {
    /* Bloklar da yeniden uretiliyor: govde HTML ile blok dizisi
       ayrisirsa editor eski metni gosterir. */
    const bloklar = htmlBloklara(html);
    await db.query(
      `UPDATE posts SET content_html = $1, blocks_json = $2, updated_at = now() WHERE id = $3`,
      [bloklarHtmle(bloklar), JSON.stringify(bloklar), id]
    );
  }
  console.log(`\nTAMAM — ${degisen.size} yazi guncellendi`);
} else {
  console.log(`\nDENEME — ${degisen.size} yazi degisecekti`);
}

await db.end();
