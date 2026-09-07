import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { cache } from "react";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Magaza acik mi, kapali mi — TEK KAYNAK.
 *
 * Once kapi store/layout.tsx'te sabitti ve magazayi acmak dort ayri
 * yerde el degistirmek demekti: kapiyi kaldirmak, iki sayfadaki
 * noindex'i silmek, robots.txt'ten /store'u cikarmak ve kunyeye
 * baglantiyi geri koymak. Birini unutmak sessiz bir hata birakirdi —
 * ornegin magaza acilir ama Google'a hala "girme" denirdi.
 *
 * Simdi hepsi bu degeri okuyor. Panelden degistirilebilsin diye
 * veritabaninda (site_settings), kodda degil:
 *
 *   INSERT INTO site_settings (key, value) VALUES ('magaza_acik', 'true')
 *   ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = now();
 *
 * Kayit yoksa KAPALI sayiliyor. Varsayilanin kapali olmasi bilincli:
 * bir yapilandirma hatasi magazayi yanlislikla acmasin.
 */

const ANAHTAR = "magaza_acik";
const COOKIE = "panic_session";

/** Istek basina bir kez okunuyor; ayni sayfada uc kez sorulabiliyor. */
export const magazaAcik = cache(async (): Promise<boolean> => {
  try {
    const kayit = await db.query.siteSettings.findFirst({
      where: eq(schema.siteSettings.key, ANAHTAR),
    });
    return kayit?.value === true || kayit?.value === "true";
  } catch {
    /* Veritabani cevap vermezse KAPALI davraniyoruz: acik saymak,
       hazir olmayan bir dukkani disariya acardi. */
    return false;
  }
});

/** Oturum acmis personel magazayi kapaliyken de goruyor. */
export const personelMi = cache(async (): Promise<boolean> => {
  const gizli = process.env.JWT_SECRET;
  if (!gizli) return false;
  const jeton = (await cookies()).get(COOKIE)?.value;
  if (!jeton) return false;
  try {
    await jwtVerify(jeton, new TextEncoder().encode(gizli));
    return true;
  } catch {
    return false;
  }
});

/** Bu istek magazayi gorebilir mi? */
export async function magazaGorunur(): Promise<boolean> {
  return (await magazaAcik()) || (await personelMi());
}

/**
 * Arama motoru ayari.
 *
 * Magaza kapaliyken noindex; acilinca kendiliginden kalkiyor. Sepet ve
 * siparis sayfalari BUNUN DISINDA — onlar kisiye ozel ekranlar, magaza
 * acik olsa da dizine girmemeliler.
 */
export async function magazaRobots() {
  return (await magazaAcik()) ? undefined : { index: false, follow: false };
}
