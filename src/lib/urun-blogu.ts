import { db, schema } from "@/db";
import { inArray } from "drizzle-orm";
import { fiyat, stokta, turu, TUR_ADI } from "@/lib/magaza";
import { magazaGorunur } from "@/lib/magaza-durumu";

/**
 * URUN KARTI BLOGUNU OKUMA ANINDA DOLDURUR.
 *
 * Govdede duran sey yalnizca bir isaret:
 *   <div data-blok="urun" data-urun-id="12"></div>
 * Kartin icerigi — ad, fiyat, stok, gorsel — burada, okuma aninda
 * veritabanindan geliyor.
 *
 * NEDEN BOYLE: fiyati yazinin govdesine yazsaydik, urun zamlandiginda
 * ya da tukendiginde yazi yalan soylemeye baslardi ve bunu kimse fark
 * etmezdi. Yazar yalnizca "su urun burada dursun" diyor; dogru bilgiyi
 * her seferinde veri veriyor.
 *
 * MAGAZA KAPALIYKEN KART BASILMIYOR. Kapali magazanin urunlerini yazi
 * govdesinden sizdirmak, kapatma kararini anlamsiz kilardi — fiyat da
 * satin alma baglantisi da disariya acik kalirdi.
 */

const ISARET = /<div data-blok="urun" data-urun-id="(\d+)"><\/div>/g;

function kacir(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function urunBloklariniDoldur(html?: string | null): Promise<string> {
  if (!html) return "";

  const kimlikler = [...html.matchAll(ISARET)].map((e) => Number(e[1]));
  if (kimlikler.length === 0) return html;

  /* Magaza kapaliysa isaretler TEMIZLENIYOR — bos div birakmak
     sayfada aciklanamayan bir bosluk yaratirdi. */
  if (!(await magazaGorunur())) return html.replace(ISARET, "");

  const urunler = await db
    .select()
    .from(schema.products)
    .where(inArray(schema.products.id, [...new Set(kimlikler)]));

  const tablo = new Map(urunler.map((u) => [u.id, u]));

  return html.replace(ISARET, (_, kimlik) => {
    const u = tablo.get(Number(kimlik));

    /* Urun silinmis ya da yayindan kaldirilmissa kart basilmiyor.
       "Urun bulunamadi" kutusu birakmak okura hicbir sey anlatmiyor,
       yalnizca yazinin bakimsiz gorunmesini sagliyor. */
    if (!u || u.status !== "published") return "";

    const t = turu(u.productType);
    const var_ = stokta(u);
    const gorsel = u.featuredImageUrl
      ? `<img src="${kacir(u.featuredImageUrl)}" alt="${kacir(u.title)}" class="urun-blogu-gorsel">`
      : "";

    return `<aside class="urun-blogu" data-blok="urun" data-urun-id="${u.id}">
  <a href="/store/${kacir(u.slug)}" class="urun-blogu-baglanti">
    ${gorsel}
    <div class="urun-blogu-metin">
      <span class="urun-blogu-tur">${kacir(TUR_ADI[t])}</span>
      <strong class="urun-blogu-ad">${kacir(u.title)}</strong>
      <span class="urun-blogu-fiyat">${kacir(fiyat(u.price, u.currency))}${
        var_ ? "" : ` <em class="urun-blogu-tukendi">tukendi</em>`
      }</span>
    </div>
  </a>
</aside>`;
  });
}
