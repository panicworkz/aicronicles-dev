/**
 * DEMO URUNLERI dummyJSON'dan yukler.
 *
 * Neden dis kaynak: elle uydurma urun yazmak bu projede bir kez zaten
 * soruna donustu — 350 dolarlik sahte bir "danismanlik", stok
 * fotografli gorsel ve var olmayan odeme adresleri canliya cikmisti.
 * Uydurma veri inandirici gorundugu icin fark edilmiyor; dis
 * kaynaktan gelen veri ise demo oldugunu belli ediyor.
 *
 * HER KAYIT ISARETLI: sku alani "DEMO-" ile basliyor. Temizlemek icin
 *   DELETE FROM products WHERE sku LIKE 'DEMO-%';
 * tek basina yeterli. Yayina/gercek satisa gecmeden once silinmeli.
 *
 * Kullanim:
 *   node scripts/demo-urun-yukle.mjs [adet]     (varsayilan 12)
 *   node scripts/demo-urun-yukle.mjs --temizle  (yalnizca siler)
 */

import pg from "pg";

const KAYNAK = "https://dummyjson.com";
const ISARET = "DEMO-";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const temizle = process.argv.includes("--temizle");
const adet = Math.min(50, parseInt(process.argv[2], 10) || 12);

/* Once her halukarda eski demo kayitlari gidiyor: betigi ikinci kez
   calistirmak ayni urunleri cogaltmasin. */
const silinen = await db.query(
  `DELETE FROM products WHERE sku LIKE $1 RETURNING id`,
  [`${ISARET}%`]
);
console.log(`temizlenen demo urun: ${silinen.rowCount}`);

if (temizle) {
  await db.end();
  process.exit(0);
}

/* Kategoriler. dummyJSON'un kendi kategorileri geliyor; bizim
   product_categories tablosunda karsiligi yoksa aciliyor. Var olan
   kategorilere DOKUNULMUYOR — onlar gercek yapinin parcasi. */
const kategoriler = await (await fetch(`${KAYNAK}/products/categories`)).json();

const urunler = (
  await (
    await fetch(
      `${KAYNAK}/products?limit=${adet}&select=title,description,price,category,thumbnail,images,stock,tags,brand`
    )
  ).json()
).products;

const kategoriId = new Map();
for (const u of urunler) {
  if (kategoriId.has(u.category)) continue;
  const ad = kategoriler.find((k) => k.slug === u.category)?.name ?? u.category;
  const slug = `demo-${u.category}`;
  const mevcut = await db.query(`SELECT id FROM product_categories WHERE slug = $1`, [slug]);
  if (mevcut.rows[0]) {
    kategoriId.set(u.category, mevcut.rows[0].id);
  } else {
    const yeni = await db.query(
      `INSERT INTO product_categories (name, slug) VALUES ($1, $2) RETURNING id`,
      [ad, slug]
    );
    kategoriId.set(u.category, yeni.rows[0].id);
  }
}

let n = 0;
for (const u of urunler) {
  /* Slug'a da demo oneki: gercek bir urunle adres cakismasin. */
  const slug =
    "demo-" +
    u.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

  /* Tur dagitimi: hepsi "physical" olsaydi dijital ve hizmet
     akislarini (adres istememe, kapida odemenin kapanmasi, cayma
     istisnasi) ekranda hic goremezdik. */
  const tur = n % 5 === 0 ? "digital" : n % 7 === 0 ? "service" : "physical";

  await db.query(
    `INSERT INTO products
       (title, slug, description, price, currency, sku, inventory,
        unlimited_stock, product_type, status, category_id,
        featured_image_url, gallery_urls, tags_json)
     VALUES ($1,$2,$3,$4,'USD',$5,$6,$7,$8,'published',$9,$10,$11,$12)
     ON CONFLICT (slug) DO NOTHING`,
    [
      u.title,
      slug,
      u.description,
      u.price,
      `${ISARET}${String(u.id).padStart(4, "0")}`,
      u.stock ?? 0,
      tur !== "physical",
      tur,
      kategoriId.get(u.category) ?? null,
      /* Kapak gorseli olarak thumbnail DEGIL, galerinin ilki
         kullaniliyor. dummyJSON'un thumbnail dosyasi urunun etrafinda
         daha fazla bosluk tasiyor; urun sayfasinda ilk gorsel
         otekilerden uzakta duruyordu. Ayni cekimin ayni kadraji
         olsun diye ikisi de images dizisinden geliyor. */
      u.images?.[0] ?? u.thumbnail ?? null,
      JSON.stringify((u.images ?? []).slice(1)),
      JSON.stringify(u.tags ?? []),
    ]
  );
  n++;
}

const sayim = await db.query(
  `SELECT product_type, count(*) FROM products WHERE sku LIKE $1 GROUP BY product_type ORDER BY 1`,
  [`${ISARET}%`]
);
console.log(`yuklenen demo urun: ${n}`);
for (const r of sayim.rows) console.log(`  ${r.product_type}: ${r.count}`);
console.log(`\ntemizlemek icin: node scripts/demo-urun-yukle.mjs --temizle`);

await db.end();
