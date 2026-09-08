import { parse } from "node-html-parser";
import { isaretleriDoldurSenkron } from "./blok-doldur.ts";

/**
 * ICINDEKILER BLOGUNU OKUMA ANINDA BASAR.
 *
 * Govdede duran sey yalnizca bir isaret:
 *   <div data-blok="icindekiler" data-seviye="2,3"></div>
 * Liste, yazinin KENDI basliklarindan her acilista uretiliyor.
 *
 * NEDEN BOYLE: eskiden icindekiler elle yazilmis bir baglanti
 * listesiydi. Sonucu su oldu — basliklar degistiginde liste eski
 * kaldi, ustelik editor o baglantilara target="_blank" ve nofollow
 * yazinca okur icindekilere tikladiginda AYNI SAYFA yeni bir sekmede
 * acilmaya basladi. Ikisi de kimsenin fark etmedigi, sessiz
 * bozulmalardi.
 *
 * Uretilen liste yazinin gercek durumunu gosteriyor; yanlis olmasi
 * mumkun degil.
 */

function kacir(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function icindekileriDoldur(html?: string | null): string {
  if (!html) return "";

  /* Basliklar govdenin KENDISINDEN okunuyor: ayri bir yerde tutulan
     bir liste, govdeyle senkronu bozulabilecek ikinci bir dogruluk
     kaynagi olurdu. */
  const kok = parse(html);

  return isaretleriDoldurSenkron(html, "icindekiler", (isaretOge) => {
    const ham = isaretOge.getAttribute("data-seviye") ?? "2,3";
    const seviyeler = (ham || "2,3")
      .split(",")
      .map((x: string) => Number(x.trim()))
      .filter((x: number) => x >= 2 && x <= 4);
    if (!seviyeler.length) seviyeler.push(2, 3);

    const secici = seviyeler.map((s: number) => `h${s}`).join(",");
    const basliklar = kok
      .querySelectorAll(secici)
      /* Kimligi olmayan baslik hedefsizdir; ona baglanti vermek
         okuru hicbir yere goturmez. Kimlikler kayit aninda
         uretiliyor (lib/bloklar.ts), yani bu durum yalnizca cok eski
         icerikte olabilir. */
      .filter((b) => b.getAttribute("id"));

    /* Tek basligi olan bir yazida icindekiler anlamsiz: iki satirlik
       bir kutu, okura hicbir sey anlatmadan yer kaplar. */
    if (basliklar.length < 2) return "";

    const enUst = Math.min(...basliklar.map((b) => Number(b.tagName[1])));

    const maddeler = basliklar
      .map((b) => {
        const derinlik = Number(b.tagName[1]) - enUst;
        const metin = b.textContent.trim();
        return (
          `<li class="icindekiler-madde" data-derinlik="${derinlik}">` +
          `<a href="#${kacir(b.getAttribute("id")!)}">${kacir(metin)}</a></li>`
        );
      })
      .join("");

    /* nav + aria-label: ekran okuyucuda "icindekiler" diye
       duyuruluyor, sayfadaki diger listelerden ayirt ediliyor. */
    /* ISARET BASILAN LISTEDE DE DURUYOR (data-blok/data-seviye).
       Onizleme kayitli yaziyi gosteriyor; oradan panele geri giden
       govde bu nav'i tasiyor. Isaret olmasaydi ayristirici onu
       taniyamaz, "ham HTML" blogu olarak saklar ve icindekiler bir
       daha kendini guncellemezdi — donmus bir liste. */
    return (
      `<nav class="icindekiler" aria-label="Contents"` +
      ` data-blok="icindekiler" data-seviye="${seviyeler.join(",")}">` +
      `<div class="icindekiler-baslik">Contents</div>` +
      `<ol class="icindekiler-liste">${maddeler}</ol>` +
      `</nav>`
    );
  });
}
