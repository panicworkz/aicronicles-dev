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

export type Reklam = {
  id: number;
  placement: string;
  imageUrl: string;
  alt: string | null;
  targetUrl: string;
};

export const yayindakiReklamlar = cache(async (): Promise<Reklam[]> => {
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
    }));
  } catch (hata) {
    // Reklam tablosu okunamazsa sayfa yine de basilsin — alan yer
    // tutucuya duser, icerik etkilenmez.
    console.error("[ads] okunamadi:", hata);
    return [];
  }
});

/**
 * Bir alan icin reklam sec.
 *
 * Ayni alanda birden fazla yayin varsa rastgele birini gosteriyoruz;
 * boylece reklamverenler gosterimi paylasiyor. En yeniyi secseydik
 * digerleri hic gorunmezdi.
 */
export async function alaniDoldur(placement: string): Promise<Reklam | null> {
  const uygun = (await yayindakiReklamlar()).filter((r) => r.placement === placement);
  if (!uygun.length) return null;
  return uygun[Math.floor(Math.random() * uygun.length)];
}
