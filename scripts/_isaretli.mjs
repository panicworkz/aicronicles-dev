/* ASIL KACIRDIGIM DURUM: govde ISARETLI basiliyor.
   Onceki olcumlerim isaretsiz HTML kullaniyordu, o yuzden
   doldurucularin kirildigini gormedim. */
import { htmlBloklara, bloklarHtmle } from "../src/lib/bloklar.ts";
import { icindekileriDoldur } from "../src/lib/icindekiler.ts";
import { videoBloklariniDoldur } from "../src/lib/video.ts";

const govde = '<h2 id="a">Bir</h2><div data-blok="icindekiler" data-seviye="2"></div><h2 id="b">Iki</h2>'
  + '<div data-blok="video" data-saglayici="youtube" data-video="dQw4w9WgXcQ"></div>'
  + '<div data-blok="urun" data-urun-id="7"></div>';

const isaretli = bloklarHtmle(htmlBloklara(govde), { isaretle: true });
console.log("ISARETLI GOVDE:\n ", isaretli.replace(/\n/g,"\n  ").slice(0,340));

const sonra = videoBloklariniDoldur(icindekileriDoldur(isaretli));
console.log("\nicindekiler basildi mi:", /icindekiler-madde/.test(sonra) ? "EVET" : "HAYIR");
console.log("video basildi mi      :", /video-kapak/.test(sonra) ? "EVET" : "HAYIR");
console.log("urun isareti duruyor  :", /data-blok="urun"/.test(sonra) ? "evet (doldurucu ayri, DB gerekiyor)" : "hayir");
console.log("\nGERI AYRISTIRMA:", JSON.stringify(htmlBloklara(sonra).map(b=>b.t)));
