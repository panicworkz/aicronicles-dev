import { cache } from "react";
import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Yayindaki reklamlar.
 *
 * /api/ads ile ayni kurallari uyguluyor ama HTTP uzerinden degil, dogrudan
 * veritabanindan okuyor: reklam alanlari sunucu bileseni, kendi sitesine
 * istek atmasinin anlami yok.
 *
 * React'in cache'i sayesinde tek bir sayfa isteginde tablo bir kez
 * okunuyor; bir sayfada dort reklam alani olsa da sorgu tek.
 */

export type Baglam = {
  /** home | category | tag | author | article */
  tur: string;
  /** kategori/etiket/yazar kimligi; ana sayfada bos */
  slug?: string | null;
};

export type Reklam = {
  id: number;
  placement: string;
  imageUrl: string;
  alt: string | null;
  targetUrl: string;
  arm: string | null;
  destLang: string | null;
};

type HamReklam = Reklam & {
  targetCategories: string[] | null;
  targetTags: string[] | null;
};

export const yayindakiReklamlar = cache(async (): Promise<HamReklam[]> => {
  const simdi = new Date();
  try {
    const satirlar = await db.query.ads.findMany({
      where: and(
        eq(schema.ads.isActive, true),
        or(isNull(schema.ads.startsAt), lte(schema.ads.startsAt, simdi)),
        or(isNull(schema.ads.endsAt), gte(schema.ads.endsAt, simdi))
      ),
    });
    return satirlar.map((r: any) => ({
      id: r.id,
      placement: r.placement,
      imageUrl: r.imageUrl,
      alt: r.alt ?? null,
      targetUrl: r.targetUrl,
      arm: r.arm ?? null,
      destLang: r.destLang ?? null,
      targetCategories: r.targetCategories ?? [],
      targetTags: r.targetTags ?? [],
    }));
  } catch (hata) {
    // Reklam tablosu okunamazsa sayfa yine de basilsin — alan yer
    // tutucuya duser, icerik etkilenmez.
    console.error("[ads] okunamadi:", hata);
    return [];
  }
});

/** Reklam bu sayfada cikabilir mi? Bos hedef listesi = her yerde. */
function uygunMu(r: HamReklam, baglam?: Baglam): boolean {
  const kategoriler = r.targetCategories ?? [];
  const etiketler = r.targetTags ?? [];
  if (!kategoriler.length && !etiketler.length) return true;
  if (!baglam?.slug) return false;

  if (baglam.tur === "category") return kategoriler.includes(baglam.slug);
  if (baglam.tur === "tag") return etiketler.includes(baglam.slug);
  // Yazi ve yazar sayfalari: yazinin kategorisi/etiketleri slug olarak
  // geliyor; ikisinden birinde eslesme yeterli.
  return kategoriler.includes(baglam.slug) || etiketler.includes(baglam.slug);
}

/**
 * Bir alan icin reklam sec.
 *
 * Once sayfanin konusuna gore suzuyor, sonra kalanlardan rastgele birini
 * veriyor. Rastgelelik onemli: en yeniyi secseydik ayni alandaki ikinci
 * reklamveren hic gorunmezdi ve deneyde kollar esit gosterim almazdi.
 *
 * Hedeflenmis reklam varsa yalnizca onlarin arasindan seciyoruz; hicbiri
 * yoksa hedefsiz (her yerde cikabilen) reklamlara duşuyoruz. Boylece
 * konuya ozel kampanya, genel kampanyayi bastiriyor.
 */
export async function alaniDoldur(
  placement: string,
  baglam?: Baglam
): Promise<Reklam | null> {
  const hepsi = (await yayindakiReklamlar()).filter((r) => r.placement === placement);
  if (!hepsi.length) return null;

  const hedefli = hepsi.filter(
    (r) => (r.targetCategories?.length || r.targetTags?.length) && uygunMu(r, baglam)
  );
  const genel = hepsi.filter((r) => !r.targetCategories?.length && !r.targetTags?.length);

  const havuz = hedefli.length ? hedefli : genel;
  if (!havuz.length) return null;
  return havuz[Math.floor(Math.random() * havuz.length)];
}
