/**
 * SABIT SAYFA GOCU — sayfa govdesini bloklara cevirir.
 *
 * Iki is yapiyor:
 *
 *   1. HTML -> blok (yazilardaki gocun aynisi).
 *   2. KOD'DAKI DUZENI BLOGA CEVIRIR. About / Advertise / Sponsor
 *      sayfalarinin kart izgarasi, seridi, kunye kartlari ve kapanis
 *      bandi bir eslesme tablosundan geliyordu (CmsPage'in DUZEN
 *      sabiti): "advertise sayfasinin 'advertising-formats' basligi
 *      altindaki ilk liste kart olsun". Yazar bir basligin kimligini
 *      degistirdiginde duzen sessizce dagiliyordu, yeni bir sayfada
 *      ise hicbir sey olmuyordu. Bu betik o tabloyu bir kereligine
 *      uyguluyor ve sonucu BLOK olarak yaziyor; tablo sonra siliniyor.
 *
 * DOGRULAMA: cevrim once bellekte olculuyor. Metin (noktalama disi),
 * baglantilar ve gorseller ozgunuyle ayni degilse O SAYFA ATLANIR.
 *
 * Kullanim:
 *   node --experimental-strip-types scripts/sayfa-blok-gocu.mjs --dene
 *   node --experimental-strip-types scripts/sayfa-blok-gocu.mjs
 */

import pg from "pg";
import { parse } from "node-html-parser";
import { htmlBloklara, bloklarHtmle } from "../src/lib/bloklar.ts";

const dene = process.argv.includes("--dene");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

/* ---- eski DUZEN tablosu ---------------------------------------- */

/** baslik kimligi -> hedef blok turu */
const DUZEN = {
  about: {
    "who-writes-for-fabelo": "yazarlar",
    contact: "bant",
  },
  advertise: {
    "audience-snapshot": "kartlar",
    "advertising-formats": "kartlar-numarali",
    "get-in-touch": "bant",
  },
  sponsor: {
    "sponsorship-options": "kartlar-numarali",
    "why-fabelo": "kartlar",
    "start-a-conversation": "bant",
  },
};

/* ---- yardimcilar ------------------------------------------------ */

/** "<strong>Label:</strong> text" -> { baslik, html } */
function maddeyiKarta(html) {
  const o = parse(`<li>${html}</li>`).querySelector("li");
  const guclu = o.querySelector("strong, b");
  if (!guclu) return { baslik: "", html: o.innerHTML.trim() };

  const baslik = guclu.textContent.replace(/[:\u2014-]\s*$/, "").trim();
  guclu.remove();
  /* Etiketten sonra gelen ayirici (":", "—") kartta gereksiz:
     baslik ayri satirda duruyor. */
  const govde = o.innerHTML.replace(/^\s*(?:[:\u2014-]|&mdash;)\s*/, "").trim();
  return { baslik, html: govde };
}

/** Yazarin adindan kimligi — About'taki h3 basliklariyla eslestirmek icin */
function yazarKimligi(ad, yazarlar) {
  const a = ad.trim().toLowerCase();
  const bul = yazarlar.find(
    (y) => a === y.name.toLowerCase() || a.startsWith(y.name.toLowerCase())
  );
  return bul?.id ?? null;
}

/**
 * Bloklari, eski DUZEN tablosuna gore yeniden duzenler.
 *
 * Bir h2'nin kimligi tabloda geciyorsa, o basliktan sonraki bloklar
 * hedef bloga toplaniyor. Baslik KALIYOR: sayfanin icindekiler rayi
 * ve baglantilari h2 kimliklerine dayaniyor.
 */
function duzeniUygula(bloklar, slug, yazarlar, uyarilar, tuketilen) {
  const tablo = DUZEN[slug];
  if (!tablo) return bloklar;

  const cikti = [];
  let i = 0;

  while (i < bloklar.length) {
    const b = bloklar[i];
    cikti.push(b);
    i++;

    if (b.t !== "baslik" || b.seviye !== 2) continue;
    const hedef = tablo[b.id ?? ""];
    if (!hedef) continue;

    /* Bir sonraki h2'ye kadar olan her sey bu bolume ait. */
    const bolum = [];
    while (i < bloklar.length && !(bloklar[i].t === "baslik" && bloklar[i].seviye === 2)) {
      bolum.push(bloklar[i]);
      i++;
    }

    if (hedef === "yazarlar") {
      /* h3 + peşinden gelen paragraflar = bir kunye karti. */
      const ogeler = [];
      for (const p of bolum) {
        if (p.t === "baslik" && p.seviye === 3) {
          const ad = parse(p.html).textContent;
          const kimlik = yazarKimligi(ad, yazarlar);
          if (kimlik) {
            ogeler.push({ yazarId: kimlik, html: "" });
            /* Baslik metni BILEREK dusuyor: kartta gorunecek ad ve rol
               artik yazar kaydindan geliyor. Olcumden dusulmezse
               "Fabelo Editorial Team" gibi kayda birebir esit olmayan
               bir baslik, kayip metin olarak sayilirdi. */
            tuketilen.push(ad);
          } else {
            uyarilar.push(`${slug}: "${ad}" adli yazar kaydi yok`);
          }
        } else if (ogeler.length && p.t === "paragraf") {
          ogeler[ogeler.length - 1].html += `<p>${p.html}</p>`;
        } else {
          cikti.push(p);
        }
      }
      if (ogeler.length) cikti.push({ t: "yazarlar", ogeler });
      continue;
    }

    if (hedef === "bant") {
      const govde = bolum
        .map((p) => (p.t === "paragraf" ? `<p>${p.html}</p>` : null))
        .filter(Boolean)
        .join("");
      if (govde) {
        /* Baslik banda tasınıyor: bant kendi basligini basiyor ve
           disarida ikinci bir h2 birakmak ayni metni iki kez
           gostermek olurdu. */
        cikti.pop();
        cikti.push({ t: "bant", baslik: parse(b.html).textContent, html: govde });
        for (const p of bolum) if (p.t !== "paragraf") cikti.push(p);
      } else {
        cikti.push(...bolum);
      }
      continue;
    }

    /* kartlar / kartlar-numarali */
    const liste = bolum.find((p) => p.t === "liste");
    if (!liste) {
      cikti.push(...bolum);
      continue;
    }
    const kart = {
      t: "kartlar",
      sutun: liste.ogeler.length === 4 ? 4 : liste.ogeler.length === 2 ? 2 : 3,
      ...(hedef === "kartlar-numarali" ? { numarali: true } : {}),
      ogeler: liste.ogeler.map(maddeyiKarta),
    };
    for (const p of bolum) {
      if (p === liste) cikti.push(kart);
      else cikti.push(p);
    }
  }

  return cikti;
}

/* ---- dogrulama -------------------------------------------------- */

/* Noktalama disi metin: kart cevriminde etiketten sonraki ":" ve
   kunye kartinda h3 -> yazar adi degisimi bilerek yapiliyor. */
const metin = (h) =>
  parse(h)
    .textContent.replace(/[\s:\u2014-]+/g, "")
    .toLowerCase();

const kume = (h, sec, oz) =>
  parse(h)
    .querySelectorAll(sec)
    .map((e) => e.getAttribute(oz))
    .filter(Boolean)
    .sort()
    .join("|");

/* ---- goc -------------------------------------------------------- */

const { rows: yazarlar } = await db.query(`SELECT id, name FROM authors`);
const { rows } = await db.query(
  `SELECT id, slug, title, content_html FROM pages WHERE content_html IS NOT NULL ORDER BY id`
);

let yazilan = 0;
const atlanan = [];
const uyarilar = [];

for (const s of rows) {
  const tuketilen = [];
  const ham = htmlBloklara(s.content_html);
  const bloklar = duzeniUygula(ham, s.slug, yazarlar, uyarilar, tuketilen);
  const yeni = bloklarHtmle(bloklar);

  /* Kunye kartina donusen basliklar olcumden dusuyor: o metnin yerini
     yazar kaydi aliyor (ad, rol, portre) ve okuma aninda basiliyor. */
  let ozgun = s.content_html;
  for (const dusen of tuketilen) ozgun = ozgun.split(dusen).join("");

  const kusur =
    metin(ozgun) !== metin(yeni)
      ? "metin"
      : kume(ozgun, "a", "href") !== kume(yeni, "a", "href")
        ? "baglanti"
        : kume(ozgun, "img", "src") !== kume(yeni, "img", "src")
          ? "gorsel"
          : null;

  if (kusur) {
    atlanan.push({ id: s.id, slug: s.slug, kusur });
    continue;
  }

  if (!dene) {
    /* content_html DA yeniden yaziliyor: yazilardan farkli olarak
       sabit sayfalarin duzeni degisiyor ve eski HTML artik sayfanin
       gorunumunu anlatmiyor. Ikisi ayni anda yaziliyor ki hicbir an
       birbirini yalanlamasinlar. */
    await db.query(`UPDATE pages SET blocks_json = $1, content_html = $2 WHERE id = $3`, [
      JSON.stringify(bloklar),
      yeni,
      s.id,
    ]);
  }
  yazilan++;
}

console.log(
  `\n${dene ? "DENEME — hicbir sey yazilmadi" : "GOC TAMAM"}\n` +
    `  sayfa:     ${rows.length}\n` +
    `  cevrilen:  ${yazilan}\n` +
    `  atlanan:   ${atlanan.length}`
);
for (const u of new Set(uyarilar)) console.log(`  ! ${u}`);
for (const a of atlanan) console.log(`  ✗ #${a.id} ${a.slug} — ${a.kusur} ayrisiyor`);

await db.end();
process.exit(atlanan.length ? 1 : 0);
