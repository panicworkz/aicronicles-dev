import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { handleApiError, apiBadRequest } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * Site ayarlari.
 *
 * Once boyle bir uc YOKTU: /panic/settings ekrani "Save Settings"
 * diyor, bir bildirim gosteriyor ve HICBIR SEY kaydetmiyordu. Alan
 * adi duzenlenebilir gorunuyordu, magaza anahtari da bir seye bagli
 * degildi. Editor ayari degistirdigini saniyordu.
 *
 * Yazilabilir ayarlar BEYAZ LISTEDE. Uc herkese acik degil (oturum
 * istiyor) ama yine de rastgele anahtar yazilmasina izin vermiyoruz:
 * yarin bir ekran yanlis bir ad gonderirse sessizce cop birikirdi.
 */

const YAZILABILIR = ["magaza_acik"] as const;
type Anahtar = (typeof YAZILABILIR)[number];

export async function GET() {
  try {
    const satirlar = await db.query.siteSettings.findMany();
    const ayarlar: Record<string, unknown> = {};
    for (const s of satirlar as any[]) ayarlar[s.key] = s.value;
    /* Kayit yoksa magaza KAPALI sayiliyor — lib/magaza-durumu.ts ile
       ayni varsayilan. Iki yerde iki turlu davranmasin. */
    if (ayarlar.magaza_acik === undefined) ayarlar.magaza_acik = false;
    return NextResponse.json({ success: true, settings: ayarlar });
  } catch (hata) {
    return handleApiError(hata, "settings.GET");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const g = await req.json().catch(() => ({}) as any);
    const anahtar = String(g?.key ?? "") as Anahtar;
    if (!YAZILABILIR.includes(anahtar)) {
      return apiBadRequest(`Unknown setting: ${anahtar}`);
    }

    const deger = Boolean(g?.value);

    await db
      .insert(schema.siteSettings)
      .values({ key: anahtar, value: deger } as any)
      .onConflictDoUpdate({
        target: schema.siteSettings.key,
        set: { value: deger, updatedAt: new Date() } as any,
      });

    const kayit = await db.query.siteSettings.findFirst({
      where: eq(schema.siteSettings.key, anahtar),
    });
    return NextResponse.json({ success: true, key: anahtar, value: kayit?.value });
  } catch (hata) {
    return handleApiError(hata, "settings.PUT");
  }
}
