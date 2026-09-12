/**
 * DEMO SEPET VE MESAJ — yalnizca STAGE icin.
 *
 * Amac: bos duran ekranlarin (Carts & Abandoned, Messages) gercek
 * veriyle nasil gorundugunu sinamak. Ekran bos oldugunda calisip
 * calismadigi anlasilmiyor.
 *
 * KIMLIKLER UYDURULMUYOR: adlar, e-postalar ve mesaj metinleri
 * dummyjson.com'dan geliyor. Urunler ise veritabanindaki GERCEK
 * urunler, fiyatlari da oradan — uydurma fiyat, rapordaki tutari
 * hicbir seye karsilik gelmeyen bir sayi yapardi.
 *
 * HEPSI SILINEBILIR: sepet belirtecleri "demo-" ile basliyor,
 * e-postalar "@demo.fabelo.invalid" alan adinda (RFC 2606 — asla
 * cozulmeyen bir alan, kazara e-posta gitmesin).
 *
 *   node --experimental-strip-types scripts/demo-sepet-mesaj.mjs --temizle
 *
 * CANLIDA CALISTIRILMAZ. Betik veritabani adini kontrol ediyor.
 */

import pg from "pg";

const temizle = process.argv.includes("--temizle");
const adres = process.env.DATABASE_URL ?? "";

/* Guvenlik kilidi: canliya demo veri yazmak, gercek siparislerin
   arasina sahte kayit karistirmak demek. */
if (!adres.includes("panic_cms_stage")) {
  console.error("Bu betik yalnizca panic_cms_stage uzerinde calisir.");
  process.exit(1);
}

const db = new pg.Client({ connectionString: adres });
await db.connect();

if (temizle) {
  const a = await db.query(`DELETE FROM carts WHERE token LIKE 'demo-%'`);
  const b = await db.query(`DELETE FROM contact_messages WHERE email LIKE '%@demo.fabelo.invalid'`);
  console.log(`Temizlendi — ${a.rowCount} sepet, ${b.rowCount} mesaj`);
  await db.end();
  process.exit(0);
}

const { rows: urunler } = await db.query(
  `SELECT id, title, slug, price, currency, product_type FROM products WHERE status='published' ORDER BY id`
);
if (!urunler.length) {
  console.error("Yayinda urun yok.");
  process.exit(1);
}

const yanit = await fetch("https://dummyjson.com/users?limit=10&select=firstName,lastName,email,phone");
if (!yanit.ok) {
  console.error(`dummyjson.com yanit vermedi (${yanit.status}).`);
  process.exit(1);
}
const { users } = await yanit.json();

const saat = 60 * 60 * 1000;
const eposta = (k) =>
  `${k.firstName}.${k.lastName}`.toLowerCase().replace(/[^a-z.]/g, "") + "@demo.fabelo.invalid";

/* --- SEPETLER ---
   Dokusu bilincli: bir kismi hala aliveriste (son bir saat icinde),
   bir kismi birakilmis, bir kismi siparise donmus, bir kismi adsiz.
   Hepsi ayni durumda olsaydi ekrandaki dort kutunun dogru calisip
   calismadigi anlasilmazdi. */
const DOKU = [
  { saatOnce: 0.3, adli: true,  durum: "active"  },
  { saatOnce: 0.6, adli: false, durum: "active"  },
  { saatOnce: 3,   adli: true,  durum: "active"  },
  { saatOnce: 9,   adli: false, durum: "active"  },
  { saatOnce: 26,  adli: true,  durum: "active"  },
  { saatOnce: 52,  adli: false, durum: "active"  },
  { saatOnce: 78,  adli: true,  durum: "active"  },
  { saatOnce: 30,  adli: true,  durum: "ordered" },
  { saatOnce: 96,  adli: true,  durum: "ordered" },
];

let sepetSayisi = 0;
for (const [i, d] of DOKU.entries()) {
  const k = users[i % users.length];
  const zaman = new Date(Date.now() - d.saatOnce * saat);

  const kalemler = [];
  let toplam = 0;
  for (let j = 0; j <= i % 3; j++) {
    const u = urunler[(i * 4 + j * 3) % urunler.length];
    const adet = 1 + ((i + j) % 2);
    toplam += Number(u.price) * adet;
    kalemler.push({
      urunId: u.id,
      baslik: u.title,
      slug: u.slug,
      tur: u.product_type,
      fiyat: Number(u.price),
      adet,
    });
  }

  await db.query(
    `INSERT INTO carts (token, email, name, items_json, item_count, subtotal, currency, status, ordered_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,'USD',$7,$8,$9,$9)
     ON CONFLICT (token) DO NOTHING`,
    [
      `demo-${1000 + i}-${Math.random().toString(36).slice(2, 10)}`,
      d.adli ? eposta(k) : null,
      d.adli ? `${k.firstName} ${k.lastName}` : null,
      JSON.stringify(kalemler),
      kalemler.reduce((t, x) => t + x.adet, 0),
      toplam.toFixed(2),
      d.durum,
      d.durum === "ordered" ? zaman : null,
      zaman,
    ]
  );
  sepetSayisi++;
  console.log(
    `  sepet ${d.durum.padEnd(7)} ${String(Math.round(d.saatOnce)).padStart(3)} saat once  ` +
      `$${toplam.toFixed(2).padStart(8)}  ${d.adli ? eposta(k) : "(adsiz)"}`
  );
}

/* --- MESAJLAR ---
   Sutunlar veritabanindan dogrulandi: topic/topic_label ve fields
   var, tab_id yok. Tahminle yazsaydim betik calismaz, ekran yine bos
   kalirdi. */
const { rows: sekmeler } = await db.query(
  `SELECT slug, name FROM contact_tabs ORDER BY id`
).catch(() => ({ rows: [] }));

const yanit2 = await fetch("https://dummyjson.com/comments?limit=6");
const { comments } = yanit2.ok ? await yanit2.json() : { comments: [] };

let mesajSayisi = 0;
const DURUMLAR = ["new", "new", "read", "replied", "archived", "new"];

for (const [i, c] of comments.entries()) {
  const k = users[(i + 3) % users.length];
  const sekme = sekmeler[i % Math.max(sekmeler.length, 1)];
  const zaman = new Date(Date.now() - (i + 1) * 19 * saat);

  await db.query(
    `INSERT INTO contact_messages
       (topic, topic_label, name, email, organization, subject, message, fields, source_url, status, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
    [
      sekme?.slug ?? "general",
      sekme?.name ?? "General",
      `${k.firstName} ${k.lastName}`,
      eposta(k),
      null,
      `About ${sekme?.name ?? "your guides"}`,
      c.body,
      JSON.stringify({ demo: true }),
      "https://panic.panic.pw/contact",
      DURUMLAR[i % DURUMLAR.length],
      zaman,
    ]
  );
  mesajSayisi++;
  console.log(`  mesaj  ${DURUMLAR[i % DURUMLAR.length].padEnd(8)} ${eposta(k)}`);
}

console.log(`\nTAMAM — ${sepetSayisi} sepet, ${mesajSayisi} mesaj. Geri almak: --temizle`);
await db.end();
