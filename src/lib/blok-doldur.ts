import { parse, HTMLElement } from "node-html-parser";

/**
 * ISARETLI BLOKLARI OKUMA ANINDA DOLDURUR.
 *
 * Urun karti, icindekiler ve video govdede yalnizca bir isaret olarak
 * duruyor; icerikleri burada basiliyor.
 *
 * NEDEN AYRISTIRICI, NEDEN DUZENLI IFADE DEGIL:
 * Her doldurucu once kendi duzenli ifadesini kullaniyordu, ornegin
 *   /<div data-blok="urun" data-urun-id="(\d+)"><\/div>/
 * Sonra govde "isaretli" basilmaya baslandi ve uretilen etiket
 *   <div data-blok-i="2" data-blok-t="urun" data-blok="urun" ...>
 * haline geldi. Kalip artik HICBIR SEYLE eslesmiyordu: ne urun karti
 * ne icindekiler basiliyordu, hicbir hata da vermiyordu — isaret
 * oldugu gibi sayfada kaliyor ve gorunmez bir bos div olarak
 * duruyordu. Sessiz bir bozulma.
 *
 * Oznitelik SIRASINA ve SAYISINA bagli olmayan tek dogru yol
 * ayristirmak. Bir daha ayni tuzaga dusmemek icin uc doldurucu da
 * buradan geciyor.
 */

/** Bir turdeki butun isaretleri, uretilen HTML ile degistirir. */
export async function isaretleriDoldur(
  html: string,
  tur: string,
  uret: (oge: HTMLElement) => string | Promise<string>
): Promise<string> {
  if (!html || !html.includes(`data-blok="${tur}"`)) return html;

  const kok = parse(html);
  const hedefler = kok.querySelectorAll(`[data-blok="${tur}"]`);
  if (!hedefler.length) return html;

  for (const oge of hedefler) {
    const yeni = await uret(oge);
    /* Bos dize DE gecerli bir sonuc: silinmis bir urun ya da iki
       basliktan az bir yazi icin hicbir sey basmiyoruz. */
    oge.replaceWith(parse(yeni) as unknown as HTMLElement);
  }

  return kok.toString();
}

/** Es zamansiz uretici gerekmeyen haller icin. */
export function isaretleriDoldurSenkron(
  html: string,
  tur: string,
  uret: (oge: HTMLElement) => string
): string {
  if (!html || !html.includes(`data-blok="${tur}"`)) return html;

  const kok = parse(html);
  const hedefler = kok.querySelectorAll(`[data-blok="${tur}"]`);
  if (!hedefler.length) return html;

  for (const oge of hedefler) {
    oge.replaceWith(parse(uret(oge)) as unknown as HTMLElement);
  }
  return kok.toString();
}
