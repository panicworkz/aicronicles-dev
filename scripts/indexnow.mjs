/**
 * IndexNow — degisen adresleri arama motorlarina ANINDA bildirir.
 *
 * NE ISE YARAR, NE ISE YARAMAZ
 * Bing, Yandex, Seznam ve Naver IndexNow'i okuyor. GOOGLE OKUMUYOR;
 * Google icin yol hala sitemap ve Search Console. Yani bu betik
 * "Google bizi hemen bulsun" sorusunun cevabi degil, oteki motorlarin
 * cevabi. Bir motora bildirmek hepsine bildirmek demek: protokol
 * katilimcilar arasinda paylasiyor.
 *
 * ANAHTAR
 * IndexNow anahtari GIZLI DEGIL — sitede acikca yayinlanmasi gerekiyor,
 * dogrulama boyle yapiliyor: public/<anahtar>.txt icinde anahtarin
 * kendisi duruyor ve motor once onu okuyup adresin gercekten bize ait
 * oldugunu anliyor.
 *
 * .env'deki eski anahtar GECERSIZDI: icinde alt cizgi vardi, oysa
 * protokol yalnizca harf, rakam ve tire kabul ediyor. Hicbir yerde de
 * kullanilmiyordu.
 *
 * KULLANIM
 *   node scripts/indexnow.mjs                 # sitemap'teki her adres
 *   node scripts/indexnow.mjs /bir-yazi /baska  # yalnizca verilenler
 *
 * Toplu bildirim gunde bir kereden fazla yapilmamali; protokol
 * "degisen" adresleri bekliyor, degismeyeni tekrar tekrar gondermek
 * itibar kaybettirir. Gunluk isleyis icin tek tek yazi gondermek dogru.
 */
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://fabelo.io').replace(/\/+$/, '');
const ANAHTAR = process.env.INDEXNOW_KEY;
const UC = 'https://api.indexnow.org/IndexNow';

if (!ANAHTAR) {
  console.error('INDEXNOW_KEY tanimli degil.');
  process.exit(1);
}
if (!/^[A-Za-z0-9-]{8,128}$/.test(ANAHTAR)) {
  console.error(`INDEXNOW_KEY bicimi gecersiz: yalnizca harf, rakam ve tire olabilir.`);
  process.exit(1);
}

/** Anahtar dosyasi gercekten yayinda mi — motorun ilk bakacagi yer. */
async function anahtarDosyasiniDogrula() {
  const adres = `${SITE}/${ANAHTAR}.txt`;
  const y = await fetch(adres, { headers: { 'User-Agent': 'fabelo-indexnow' } });
  if (!y.ok) throw new Error(`${adres} -> HTTP ${y.status}. Anahtar dosyasi yayinda degil.`);
  const govde = (await y.text()).trim();
  if (govde !== ANAHTAR) throw new Error(`${adres} icerigi anahtarla eslesmiyor.`);
  console.log(`  anahtar dosyasi dogrulandi: ${adres}`);
}

async function sitemaptenAdresler() {
  const y = await fetch(`${SITE}/sitemap.xml`, { headers: { 'User-Agent': 'fabelo-indexnow' } });
  if (!y.ok) throw new Error(`sitemap.xml -> HTTP ${y.status}`);
  const xml = await y.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const argv = process.argv.slice(2);
const adresler = argv.length
  ? argv.map((y) => (y.startsWith('http') ? y : `${SITE}${y.startsWith('/') ? '' : '/'}${y}`))
  : await sitemaptenAdresler();

await anahtarDosyasiniDogrula();
console.log(`  bildirilecek adres: ${adresler.length}`);

/* Protokol tek istekte en cok 10.000 adres kabul ediyor; bizde o kadari
   yok ama sinir yazili dursun. */
const govde = {
  host: new URL(SITE).host,
  key: ANAHTAR,
  keyLocation: `${SITE}/${ANAHTAR}.txt`,
  urlList: adresler.slice(0, 10000),
};

const yanit = await fetch(UC, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(govde),
});

/* 200 = alindi, 202 = alindi ama anahtar henuz dogrulanmadi.
   Ikisi de basarili; 4xx gercek hata. */
const metin = await yanit.text();
console.log(`  IndexNow -> HTTP ${yanit.status} ${metin.slice(0, 120)}`);
if (yanit.status >= 400) process.exit(1);
console.log('  gonderildi.');
