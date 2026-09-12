import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { BOS_TARIFE, tarifeyiOku, type KargoTarifesi } from "@/lib/kargo";

/**
 * KAYITLI KARGO TARIFESI — yalnizca sunucu.
 *
 * Hesabin kendisi lib/kargo.ts'de ve orada bilerek db cagrisi yok:
 * o dosyayi sepet de (tarayici) odeme ucu da (sunucu) kullaniyor.
 * Veritabani okumasi burada duruyor ki sunucu kodu tarayici
 * paketine sizmasin.
 */

const ANAHTAR = "kargo_tarifesi";

export const kargoTarifesi = cache(async (): Promise<KargoTarifesi> => {
  try {
    const kayit = await db.query.siteSettings.findFirst({
      where: eq(schema.siteSettings.key, ANAHTAR),
    });
    return tarifeyiOku(kayit?.value);
  } catch {
    /* Veritabani cevap vermezse ucret BILINMIYOR sayiliyor; uydurma
       bir rakamla siparis almaktansa "sonra bildirilecek" demek
       yeglenir. */
    return BOS_TARIFE;
  }
});
