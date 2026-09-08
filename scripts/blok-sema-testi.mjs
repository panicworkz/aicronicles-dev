/**
 * SEMA TESTI — gecersiz isaretleme gercekten gecmiyor mu?
 *
 * "Ayristirici bunu temizler" demek yetmez; olculmesi gerekir.
 * Buradaki her girdi, kayit noktasindan gecirilip sonucun ne oldugu
 * kontrol ediliyor. Panel yetkili kisilere acik olsa bile iceriyi
 * disaridan yapistirilan metin besliyor.
 *
 * Kullanim: node --experimental-strip-types scripts/blok-sema-testi.mjs
 */

import { htmlBloklara, bloklarHtmle } from "../src/lib/bloklar.ts";

const gecir = (h) => bloklarHtmle(htmlBloklara(h));

const DENEMELER = [
  {
    ad: "script etiketi",
    girdi: '<p>Once</p><script>alert(1)</script><p>Sonra</p>',
    olmamali: [/script/i, /alert/],
    olmali: [/Once/, /Sonra/],
  },
  {
    ad: "olay ozniteligi (onerror)",
    girdi: '<p>Metin</p><img src="/x.jpg" onerror="alert(1)" alt="a">',
    olmamali: [/onerror/i, /alert/],
    olmali: [/x\.jpg/],
  },
  {
    ad: "javascript: adresi",
    girdi: '<p><a href="javascript:alert(1)">Tikla</a></p>',
    olmamali: [/javascript:/i],
    olmali: [/Tikla/],
  },
  {
    ad: "bosluklarla gizlenmis javascript: adresi",
    girdi: '<p><a href="java\tscript:alert(1)">Tikla</a></p>',
    olmamali: [/javascript:/i, /java\s*script:/i],
    olmali: [/Tikla/],
  },
  {
    ad: "iframe",
    girdi: '<p>A</p><iframe src="https://kotu.example"></iframe>',
    olmamali: [/iframe/i, /kotu\.example/],
    olmali: [/A/],
  },
  {
    ad: "form ve girdi alani",
    girdi: '<form action="https://kotu.example"><input name="parola"></form><p>B</p>',
    olmamali: [/<form/i, /<input/i, /parola/],
    olmali: [/B/],
  },
  {
    ad: "paragrafta satir ici stil",
    girdi: '<p style="font-size:44px;color:red">Metin</p>',
    olmamali: [/style=/i, /44px/],
    olmali: [/Metin/],
  },
  {
    ad: "span kabugu — metin KORUNMALI",
    girdi: '<p><span style="color:red">Kirmizi</span> metin</p>',
    olmamali: [/<span/i, /style=/i],
    olmali: [/Kirmizi/, /metin/],
  },
  {
    ad: "tabloda stil KORUNMALI",
    girdi: '<table style="width:100%"><tr><td style="border:1px solid">Hucre</td></tr></table>',
    olmamali: [],
    olmali: [/<table/i, /style=/, /Hucre/],
  },
  {
    ad: "baglanti oznitelikleri KORUNMALI",
    girdi: '<p><a href="https://ornek.com" rel="noopener" target="_blank">Baglanti</a></p>',
    olmamali: [],
    olmali: [/https:\/\/ornek\.com/, /rel=/, /target=/],
  },
  {
    ad: "data:image adresi KORUNMALI",
    girdi: '<p>A</p><img src="data:image/png;base64,iVBOR" alt="x">',
    olmamali: [],
    olmali: [/data:image\/png/],
  },
  {
    ad: "data:text/html adresi ENGELLENMELI",
    girdi: '<p><a href="data:text/html,<script>alert(1)</script>">Tikla</a></p>',
    olmamali: [/data:text\/html/i],
    olmali: [/Tikla/],
  },
];

let gecti = 0;
const kalanlar = [];

for (const d of DENEMELER) {
  const cikti = gecir(d.girdi);
  const hatalar = [];

  for (const k of d.olmamali) if (k.test(cikti)) hatalar.push(`GECTI: ${k}`);
  for (const k of d.olmali) if (!k.test(cikti)) hatalar.push(`KAYBOLDU: ${k}`);

  if (hatalar.length === 0) {
    gecti++;
    console.log(`  ✓ ${d.ad}`);
  } else {
    kalanlar.push({ ...d, cikti, hatalar });
    console.log(`  ✗ ${d.ad}`);
    for (const h of hatalar) console.log(`      ${h}`);
    console.log(`      cikti: ${cikti.replace(/\n/g, " ").slice(0, 120)}`);
  }
}

console.log(`\n${gecti}/${DENEMELER.length} gecti`);
process.exit(kalanlar.length ? 1 : 0);
