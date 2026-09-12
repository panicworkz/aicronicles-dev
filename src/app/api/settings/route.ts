import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { tarifeyiOku } from "@/lib/kargo";
import { FONT_IKILILERI } from "@/lib/fontlar";
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

const YAZILABILIR = ["magaza_acik", "font_ikilisi", "kargo_tarifesi"] as const;
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

    /* Her ayarin degeri ayni turden degil: magaza_acik bir anahtar,
       font_ikilisi ise bir kimlik. Hepsini Boolean'a cevirmek
       font secimini "true" yapardi.

       Font kimligi BILINEN LISTEYE karsi dogrulaniyor: dogrudan CSS
       ve dosya yoluna giren bir deger, serbest metin olarak kabul
       edilmemeli. */
    let deger: unknown;
    if (anahtar === "kargo_tarifesi") {
      /* Serbest gelen deger SUZULUYOR: panele girilen "12,50" gibi
         bir metin sayiya, bos alan null'a duser. Ham nesneyi oldugu
         gibi yazsaydik, bir siparis aninda sayi olmayan bir degerle
         carpim yapilirdi. */
      deger = tarifeyiOku(g?.value);
    } else if (anahtar === "font_ikilisi") {
      const istenen = String(g?.value ?? "");
      if (!FONT_IKILILERI.some((i) => i.id === istenen)) {
        return apiBadRequest(`Unknown font pairing: ${istenen}`);
      }
      deger = istenen;
    } else {
      deger = Boolean(g?.value);
    }

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
