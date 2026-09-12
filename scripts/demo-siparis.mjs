/**
 * DEMO SIPARISLERI — rapor ekranlarini gercek veriyle gormek icin.
 *
 * CANLIDA CALISTIRILMAZ. Betik veritabani adini kontrol ediyor:
 * panic_cms_stage degilse hicbir sey yapmadan cikiyor.
 *
 * MUSTERI KIMLIKLERI UYDURULMUYOR: adlar, e-postalar ve adresler
 * dummyjson.com'dan geliyor. Elle yazilmis "ornek" veri inandirici
 * gorundugu icin fark edilmiyor ve bir sure sonra gercek sanilyor;
 * disaridan gelen veri ise acikca demo oldugunu belli ediyor.
 *
 * HER KAYIT SILINEBILIR: siparis numarasi DEMO- ile basliyor.
 *   node --experimental-strip-types scripts/demo-siparis.mjs --temizle
 * tek komutla hepsini geri aliyor. Yayina gecmeden once CALISTIRILMALI.
 *
 * URUNLER GERCEK: satir kalemleri veritabanindaki yayinda urunlerden
 * secilyor, fiyatlari da oradan. Uydurma fiyat yazsaydik rapordaki
 * ciro rakami hicbir seye karsilik gelmezdi.
 *
 * SIPARISLER ZAMANA YAYILIYOR ve durumlari karisik: rapor ekrani
 * "odenen / bekleyen", haftalik seyir ve durum dagilimi gosteriyor.
 * Hepsi ayni gun ve ayni durumda olsaydi o kutularin dogru calisip
 * calismadigi anlasilmazdi.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/demo-siparis.mjs
 *   node --experimental-strip-types scripts/demo-siparis.mjs --temizle
 */

import pg from "pg";

const temizle = process.argv.includes("--temizle");
const adres = process.env.DATABASE_URL ?? "";

/* Guvenlik kilidi: canliya demo veri yazmak, gercek siparislerin
   arasina sahte kayit karistirmak demek. Temizleme de kilitli —
   canliya yanlislikla baglanan bir --temizle, gercek siparislerden
   DEMO- ile baslayan varsa onlari silerdi. */
if (!adres.includes("panic_cms_stage")) {
  console.error("Bu betik yalnizca panic_cms_stage uzerinde calisir.");
  process.exit(1);
}

const db = new pg.Client({ connectionString: adres });
await db.connect();

const ONEK = "DEMO-";

if (temizle) {
  /* Once satir kalemleri: siparise bagliler. */
  const { rowCount: kalem } = await db.query(
    `DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE $1)`,
    [ONEK + "%"]
  );
  const { rowCount: siparis } = await db.query(
    `DELETE FROM orders WHERE order_number LIKE $1`,
    [ONEK + "%"]
  );
  /* Musteri kayitlari da demo: e-postalari dummyjson alan adindan. */
  const { rowCount: musteri } = await db.query(
    `DELETE FROM customers WHERE email LIKE '%@demo.fabelo.invalid'`
  );
  console.log(`Temizlendi — ${siparis} siparis, ${kalem} kalem, ${musteri} musteri`);
  await db.end();
  process.exit(0);
}

/* ---- kaynak veriler --------------------------------------------- */

const { rows: urunler } = await db.query(
  `SELECT id, title, slug, price, currency, product_type FROM products WHERE status = 'published'`
);
if (!urunler.length) {
  console.error("Yayinda urun yok — once urunleri yukleyin.");
  process.exit(1);
}

const yanit = await fetch("https://dummyjson.com/users?limit=12&select=firstName,lastName,email,phone,address");
if (!yanit.ok) {
  console.error(`dummyjson.com yanit vermedi (${yanit.status}). Ag baglantisini kontrol edin.`);
  process.exit(1);
}
const { users } = await yanit.json();

/* Ulkeler: kargo bolgelerinin UCUNU de kapsayacak sekilde. Hepsi
   ayni bolgede olsaydi bolgeye gore ucret dogru mu, anlasilmazdi. */
const ULKELER = ["TR", "DE", "GB", "US", "FR", "AU", "TR", "NL", "US", "TR", "CA", "IT"];

/* Kargo tarifesi kayitliysa oradan; degilse sifir — rapor
   ekranindaki "delivery" satiri da boylece gercegi gosteriyor. */
const { rows: [ayar] } = await db.query(
  `SELECT value FROM site_settings WHERE key = 'kargo_tarifesi'`
);
const tarife = ayar?.value ?? {};
const AVRUPA = new Set(["DE", "GB", "FR", "NL", "IT", "ES", "IE", "SE", "NO", "CH", "AT", "BE", "DK", "FI", "PL", "PT"]);
const kargoUcreti = (ulke) => {
  const b = ulke === "TR" ? "tr" : AVRUPA.has(ulke) ? "avrupa" : "dunya";
  const u = Number(tarife?.[b]);
  return Number.isFinite(u) && u >= 0 ? u : 0;
};

/* ---- siparis dokusu ---------------------------------------------
   Durumlar GERCEKCI bir dagilimda: cogu tamamlanmis, bir kismi
   yolda, bir kismi odeme bekliyor, biri iptal. Boyle olmasi lazim
   cunku rapor "odenen / bekleyen" ayrimini gosteriyor ve o ayrimin
   dogru calistigi ancak ikisi de doluyken gorunuyor. */
const DOKU = [
  { gunOnce: 79, odeme: "paid", siparis: "delivered", yontem: "bank_transfer" },
  { gunOnce: 72, odeme: "paid", siparis: "delivered", yontem: "bank_transfer" },
  { gunOnce: 61, odeme: "paid", siparis: "delivered", yontem: "cash_on_delivery" },
  { gunOnce: 54, odeme: "paid", siparis: "delivered", yontem: "bank_transfer" },
  { gunOnce: 47, odeme: "refunded", siparis: "cancelled", yontem: "bank_transfer" },
  { gunOnce: 40, odeme: "paid", siparis: "delivered", yontem: "bank_transfer" },
  { gunOnce: 33, odeme: "paid", siparis: "shipped", yontem: "bank_transfer" },
  { gunOnce: 26, odeme: "paid", siparis: "shipped", yontem: "cash_on_delivery" },
  { gunOnce: 19, odeme: "paid", siparis: "processing", yontem: "bank_transfer" },
  { gunOnce: 12, odeme: "pending", siparis: "processing", yontem: "bank_transfer" },
  { gunOnce: 5, odeme: "pending", siparis: "processing", yontem: "cash_on_delivery" },
  { gunOnce: 1, odeme: "pending", siparis: "processing", yontem: "bank_transfer" },
];

const gun = 24 * 60 * 60 * 1000;
const para = (n) => Number(n).toFixed(2);

let sayac = 0;
for (const [i, d] of DOKU.entries()) {
  const k = users[i % users.length];
  const ulke = ULKELER[i % ULKELER.length];
  const tarih = new Date(Date.now() - d.gunOnce * gun);

  /* E-posta alan adi .invalid: RFC 2606'ya gore hicbir zaman
     cozulmeyen bir alan. Demo bir adrese kazara e-posta gitmesi
     mumkun olmasin. */
  const eposta = `${k.firstName}.${k.lastName}`.toLowerCase().replace(/[^a-z.]/g, "") + "@demo.fabelo.invalid";
  const ad = `${k.firstName} ${k.lastName}`;

  /* Kapida odeme yalnizca Turkiye'ye ve yalnizca fiziksel urunde —
     odeme ucundeki kuralin aynisi. Demo veri, kodun izin vermedigi
     bir durumu uretmemeli; yoksa rapor gercekte olamayacak bir sey
     gosterir. */
  const yalnizFiziksel = d.yontem === "cash_on_delivery";
  const havuz = yalnizFiziksel
    ? urunler.filter((u) => u.product_type === "physical")
    : urunler;
  const yontem = yalnizFiziksel && ulke !== "TR" ? "bank_transfer" : d.yontem;

  /* Bir ya da iki kalem. */
  const kalemSayisi = 1 + (i % 2);
  const secilen = [];
  for (let j = 0; j < kalemSayisi; j++) {
    secilen.push(havuz[(i * 3 + j * 5) % havuz.length]);
  }

  const kalemler = secilen.map((u) => {
    const adet = 1 + ((u.id + i) % 2);
    return {
      urun: u,
      adet,
      birim: Number(u.price),
      toplam: Number(u.price) * adet,
    };
  });

  const araToplam = kalemler.reduce((t, k2) => t + k2.toplam, 0);
  const fizikselVar = kalemler.some((k2) => k2.urun.product_type === "physical");
  const kargo = fizikselVar ? kargoUcreti(ulke) : 0;

  const adres = fizikselVar
    ? {
        line1: k.address?.address ?? "",
        line2: "",
        city: k.address?.city ?? "",
        postcode: k.address?.postalCode ?? "",
        country: ulke,
      }
    : null;

  /* Musteri kaydi — ayni e-posta ikinci kez gelirse yeni kayit
     acilmiyor, tıpkı odeme ucundeki gibi. */
  const { rows: [mevcut] } = await db.query(`SELECT id FROM customers WHERE email = $1`, [eposta]);
  let musteriId = mevcut?.id;
  if (!musteriId) {
    const { rows: [yeni] } = await db.query(
      `INSERT INTO customers (email, name, phone, shipping_address_json, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$5) RETURNING id`,
      [eposta, ad, k.phone ?? null, adres, tarih]
    );
    musteriId = yeni.id;
  }

  const numara = `${ONEK}${String(1000 + i)}`;
  const { rows: [siparis] } = await db.query(
    `INSERT INTO orders
      (order_number, customer_id, customer_email, customer_name, subtotal, shipping, tax, discount,
       total, currency, payment_status, order_status, payment_method, shipping_address_json,
       carrier, tracking_number, terms_accepted_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,'0.00','0.00',$7,'USD',$8,$9,$10,$11,$12,$13,$14,$14,$14)
     RETURNING id`,
    [
      numara,
      musteriId,
      eposta,
      ad,
      para(araToplam),
      para(kargo),
      para(araToplam + kargo),
      d.odeme,
      d.siparis,
      yontem,
      adres,
      /* Kargo bilgisi yalnizca gercekten yola cikmis siparislerde:
         "processing" durumundaki bir siparise takip numarasi
         yazmak, panelde olmayan bir gonderiyi aratirdi. */
      ["shipped", "delivered"].includes(d.siparis) ? "PTT Kargo" : null,
      ["shipped", "delivered"].includes(d.siparis) ? `TR${900000000 + i * 7717}` : null,
      tarih,
    ]
  );

  for (const k2 of kalemler) {
    await db.query(
      `INSERT INTO order_items
        (order_id, product_id, title, quantity, unit_price, total_price, product_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [siparis.id, k2.urun.id, k2.urun.title, k2.adet, para(k2.birim), para(k2.toplam), k2.urun.product_type]
    );
  }

  /* Musteri ozeti — panelde "kac siparis, ne kadar" dogru gorunsun. */
  await db.query(
    `UPDATE customers SET order_count = coalesce(order_count,0) + 1,
       total_spent = coalesce(total_spent,0) + $1, updated_at = $2 WHERE id = $3`,
    [para(araToplam + kargo), tarih, musteriId]
  );

  sayac++;
  console.log(
    `  ${numara}  ${tarih.toISOString().slice(0, 10)}  ${ulke}  ` +
      `${d.odeme}/${d.siparis}  $${para(araToplam + kargo)}`
  );
}

console.log(`\n${sayac} demo siparis yazildi. Geri almak icin: --temizle`);
await db.end();
