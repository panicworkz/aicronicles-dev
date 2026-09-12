/**
 * SABIT SAYFALARI ULUSLARARASI DUZENE CEKER.
 *
 * NE YAPIYOR VE NEDEN:
 *
 * 1. Turkce iki belge TASLAGA aliniyor (silinmiyor).
 *    "On Bilgilendirme Formu" ve "Mesafeli Satis Sozlesmesi" TURK
 *    MEVZUATININ bicimi — 6502 sayili kanun ve Mesafeli Sozlesmeler
 *    Yonetmeligi bu IKI AYRI belgeyi isim isim istiyor. Yurt disinda
 *    ayni ISLEVI goren bir sey var ama ayni BICIM yok: AB'de
 *    2011/83/EU, Birlesik Krallik'ta 2013 tarihli Consumer Contracts
 *    Regulations, "sozlesme oncesi bilgilendirme + 14 gunluk cayma
 *    hakki" diyor ve bunlar ayri belgeler degil, satis sartlari ile
 *    iade politikasinin icine yaziliyor. ABD'de dengi bir sozlesme
 *    zorunlulugu yok; FTC'nin 30 gun kurali ve iade politikasinin
 *    aciklanmasi var. Yani belgeler cevrilmiyor, ISLEVLERI zaten
 *    Ingilizce sayfalara tasinmis durumda.
 *
 *    Silmek yerine taslak: magaza Turkiye'ye acildiginda ayni metin
 *    geri gerekiyor ve yeniden yazdirmanin bir anlami yok.
 *
 * 2. terms-of-sale'deki "Turkiye'den aliyorsaniz sunlar baglayicidir"
 *    paragrafi kaldiriliyor. Kaldirilmasa yayindaki bir sayfa artik
 *    gizli olan iki sayfaya baglanti verirdi — okur 404 gorurdu.
 *
 * 3. CAYMA BILDIRIM FORMU ekleniyor. AB ve BK, saticinin standart bir
 *    cayma formu SUNMASINI istiyor (kullanmak zorunlu degil, sunmak
 *    zorunlu). Sayfalarda 14 gun / 14 gun / 30 gun zaten yaziyordu,
 *    eksik olan tek sey buydu.
 *
 * Metin HUKUKCU ONAYINDAN GECMEDI. Yapisi mevzuatin istedigi
 * basliklara gore kuruldu ama bu bir avukat incelemesinin yerine
 * gecmez.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/sayfa-uluslararasi.mjs --dene
 *   node --experimental-strip-types scripts/sayfa-uluslararasi.mjs
 */

import pg from "pg";
import { bloklarHtmle } from "../src/lib/bloklar.ts";

const dene = process.argv.includes("--dene");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const TURKCE = ["on-bilgilendirme-formu", "mesafeli-satis-sozlesmesi"];

/* ---- 1. Turkce belgeler taslaga ---------------------------------- */

const { rows: turkce } = await db.query(
  `SELECT id, slug, status FROM pages WHERE slug = ANY($1)`,
  [TURKCE]
);

for (const s of turkce) {
  if (s.status === "draft") {
    console.log(`  · ${s.slug} zaten taslak`);
    continue;
  }
  if (!dene) {
    await db.query(`UPDATE pages SET status = 'draft', updated_at = now() WHERE id = $1`, [s.id]);
  }
  console.log(`  → ${s.slug} taslaga alindi`);
}

/* ---- 2a. delivery-and-returns'teki baglanti ---------------------- */

/* Ayni sorun burada da vardi: "Turkiye'deki alicilar icin Mesafeli
   Satis Sozlesmesi" diyen bir cumle, artik gizli olan bir sayfaya
   baglaniyordu. Cumlenin geri kalani duruyor. */
const { rows: [teslimat] } = await db.query(
  `SELECT id, blocks_json FROM pages WHERE slug = 'delivery-and-returns'`
);
if (teslimat) {
  const yeniBloklar = teslimat.blocks_json.map((b) =>
    b.t === "paragraf" && b.html.includes("/mesafeli-satis-sozlesmesi")
      ? {
          ...b,
          html:
            'The short version. The binding text is in ' +
            '<a href="/terms-of-sale">Terms of Sale</a>.',
        }
      : b
  );
  const degisti = JSON.stringify(yeniBloklar) !== JSON.stringify(teslimat.blocks_json);
  if (degisti && !dene) {
    await db.query(
      `UPDATE pages SET blocks_json = $1, content_html = $2, updated_at = now() WHERE id = $3`,
      [JSON.stringify(yeniBloklar), bloklarHtmle(yeniBloklar), teslimat.id]
    );
  }
  console.log(
    degisti
      ? "  → delivery-and-returns: gizli sayfaya baglanti kaldirildi"
      : "  · delivery-and-returns zaten temiz"
  );
}

/* ---- 2 + 3. terms-of-sale ---------------------------------------- */

const { rows: [satis] } = await db.query(
  `SELECT id, blocks_json FROM pages WHERE slug = 'terms-of-sale'`
);
if (!satis) {
  console.log("  ! terms-of-sale bulunamadi — atlaniyor");
  await db.end();
  process.exit(0);
}

let bloklar = satis.blocks_json;

/* Turkiye paragrafi: METNE gore bulunuyor, sira numarasina gore
   degil. Sira numarasi yazilsaydi sayfaya bir paragraf eklendigi
   anda betik yanlis blogu silerdi. */
const turkiyeParagrafi = (b) =>
  b.t === "paragraf" && b.html.includes("/mesafeli-satis-sozlesmesi");

const once = bloklar.length;
bloklar = bloklar.filter((b) => !turkiyeParagrafi(b));
console.log(
  bloklar.length < once
    ? "  → Turkiye paragrafi kaldirildi (gizli sayfalara baglanti veriyordu)"
    : "  · Turkiye paragrafi zaten yok"
);

/* Cayma formu — "Cancelling and refunds" bolumunun sonuna.
   Bolumun sonu = bir sonraki h2'nin hemen oncesi. */
const varMi = bloklar.some((b) => b.t === "kutu" && b.html.includes("cancel my contract"));

if (!varMi) {
  const basIndeks = bloklar.findIndex(
    (b) => b.t === "baslik" && b.seviye === 2 && /cancel/i.test(b.html)
  );
  if (basIndeks === -1) {
    console.log("  ! 'Cancelling' basligi bulunamadi — form eklenmedi");
  } else {
    let son = basIndeks + 1;
    while (son < bloklar.length && !(bloklar[son].t === "baslik" && bloklar[son].seviye === 2)) {
      son++;
    }

    const form = {
      t: "kutu",
      tur: "ozet",
      baslik: "Cancellation form",
      html:
        "<p>You do not have to use this wording — any clear statement that you " +
        "are cancelling will do. It is here because you are entitled to be " +
        "offered it. Copy it into the <a href=\"/contact\">contact form</a>.</p>" +
        "<p><em>To Fabelo: I give notice that I cancel my contract of sale for " +
        "the following goods, or for the supply of the following service:</em></p>" +
        "<ul>" +
        "<li>What you ordered</li>" +
        "<li>Order number</li>" +
        "<li>Date you ordered it, and the date it reached you</li>" +
        "<li>Your name and address</li>" +
        "<li>Today's date</li>" +
        "</ul>",
    };

    bloklar = [...bloklar.slice(0, son), form, ...bloklar.slice(son)];
    console.log("  → Cayma bildirim formu eklendi");
  }
}

/* ---- 4. Kur cumlesi ---------------------------------------------- */

/* Sayfada "We do not convert prices at today's rate" yaziyordu ama
   currency.ts tam olarak bunu yapiyor: USD fiyati TCMB kurundan
   EUR/TRY'ye ceviriyor. Dogru olan kisim, tutarin siparis aninda
   KILITLENMESI. Yasal metnin kodu yalanladigi bir cumle, uyusmazlikta
   satici aleyhine okunur. */
bloklar = bloklar.map((b) =>
  b.t === "paragraf" && b.html.includes("do not convert prices")
    ? {
        ...b,
        html: b.html.replace(
          /We do not convert prices at today[^.]*\./,
          "Prices in other currencies are converted from US dollars at the " +
            "day&rsquo;s rate. The amount shown when you place the order is the " +
            "amount you pay — it is fixed at that moment and does not move " +
            "afterwards."
        ),
      }
    : b
);

if (!dene) {
  /* Ikisi BIRLIKTE yaziliyor: content_html bloklardan uretiliyor ve
     hicbir an birbirlerini yalanlamiyorlar. */
  await db.query(`UPDATE pages SET blocks_json = $1, content_html = $2, updated_at = now() WHERE id = $3`, [
    JSON.stringify(bloklar),
    bloklarHtmle(bloklar),
    satis.id,
  ]);
}

console.log(`\n${dene ? "DENEME — hicbir sey yazilmadi" : "TAMAM"}`);
await db.end();
