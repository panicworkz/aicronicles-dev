import { db, schema } from "@/db";
import { inArray } from "drizzle-orm";
import { isaretleriDoldur } from "@/lib/blok-doldur";

/**
 * KUNYE KARTLARINI OKUMA ANINDA DOLDURUR.
 *
 * Govdede duran sey yari isaret, yari metin:
 *   <div class="yazar-kart" data-yazar="1">
 *     <div class="yazar-govde">Bu sayfaya ozel tanitim yazisi</div>
 *   </div>
 *
 * Kisinin ADI, ROLU ve GORSELI burada, yazar kaydindan geliyor;
 * yanindaki tanitim yazisi sayfanin kendi metni olarak kaliyor.
 *
 * NEDEN IKIYE BOLUNDU: adi ve gorseli sayfaya kopyalasaydik, biri
 * adini degistirdiginde ya da yeni bir portre yukledginde About
 * sayfasi eskisini gostermeye devam ederdi — ve kimse fark etmezdi.
 * Tanitim yazisini yazar kaydindaki kunyeden alsaydik da bu sefer
 * sayfanin kendi sesi giderdi: "Fabelo'da AI konularini yaziyor"
 * cumlesi o sayfaya ait, kisinin genel ozgecmisine degil.
 *
 * ENJEKTE EDILEN PARCALAR contenteditable="false": panelde sayfanin
 * uzerinde yaziliyor ve isim alani duzenlenebilir gorunseydi, yazar
 * oraya yazdigi seyin kaydedilmedigini ancak sayfayi yeniledikten
 * sonra anlardi.
 */

function kacir(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Gorsel yoksa adin bas harfi — bos bir daire birakmaktan iyi. */
function bosluk(ad: string): string {
  const harf = ad.trim().charAt(0).toUpperCase() || "?";
  return `<span class="yazar-harf" aria-hidden="true">${kacir(harf)}</span>`;
}

export async function yazarBloklariniDoldur(html?: string | null): Promise<string> {
  if (!html || !html.includes('data-blok="yazarlar"')) return html ?? "";

  /* Kimlikler once toplaniyor: kart basina bir sorgu, uc kisilik bir
     kunyede uc sorgu demekti. */
  const kimlikler: number[] = [];
  await isaretleriDoldur(html, "yazarlar", (o) => {
    for (const k of o.querySelectorAll(".yazar-kart")) {
      const kimlik = Number(k.getAttribute("data-yazar"));
      if (Number.isFinite(kimlik) && kimlik > 0) kimlikler.push(kimlik);
    }
    return "";
  });
  if (kimlikler.length === 0) return html;

  const kayitlar = await db
    .select()
    .from(schema.authors)
    .where(inArray(schema.authors.id, [...new Set(kimlikler)]));

  const tablo = new Map(kayitlar.map((y) => [y.id, y]));

  return isaretleriDoldur(html, "yazarlar", (o) => {
    const kartlar = o
      .querySelectorAll(".yazar-kart")
      .map((k) => {
        const kimlik = Number(k.getAttribute("data-yazar"));
        const y = tablo.get(kimlik);
        /* Yazar silinmisse kart basilmiyor: adsiz bir portre
           cercevesi okura hicbir sey anlatmaz. */
        if (!y) return "";

        const gorsel = y.avatarUrl
          ? `<img src="${kacir(y.avatarUrl)}" alt="" class="yazar-gorsel" loading="lazy">`
          : bosluk(y.name);

        return (
          `<div class="yazar-kart" data-yazar="${y.id}">` +
          `<div class="yazar-kimlik" contenteditable="false">` +
          gorsel +
          `<a class="yazar-ad" href="/author/${kacir(y.slug)}">${kacir(y.name)}</a>` +
          (y.role ? `<span class="yazar-rol">${kacir(y.role)}</span>` : "") +
          `</div>` +
          `<div class="yazar-govde">${k.querySelector(".yazar-govde")?.innerHTML ?? ""}</div>` +
          `</div>`
        );
      })
      .join("");

    /* Hicbir kart kalmadiysa blok tamamen kalkiyor — bos bir izgara
       sayfada aciklanamayan bir bosluk birakirdi. */
    if (!kartlar) return "";
    return `<div class="yazarlar" data-blok="yazarlar">${kartlar}</div>`;
  });
}
