import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, inArray, and, lt, sql } from "drizzle-orm";
import { handleApiError, apiBadRequest } from "@/lib/api-response";
import { magazaGorunur } from "@/lib/magaza-durumu";

export const dynamic = "force-dynamic";

/**
 * SEPET GOLGESINI GUNCELLER.
 *
 * Tarayici sepeti degistikce buraya haber veriyor. Amaci sepeti
 * sunucuda TUTMAK degil — o hala tarayicida — ne oldugunu KAYDETMEK:
 * kac sepet acildi, kaci siparise dondu, birakilanlarda ne kadar para
 * duruyor.
 *
 * FIYAT ISTEMCIDEN ALINMIYOR. Gonderilen listede fiyat olsa bile
 * yok sayiliyor; tutar veritabanindaki urun fiyatindan hesaplaniyor.
 * Ayni kural odeme ucunde de var: tarayicidan gelen bir sayiyi paraya
 * cevirmek, alicinin kendi fiyatini yazabilmesi demek.
 *
 * E-POSTA ancak odeme adiminda YAZILDIGINDA geliyor ve o zaman
 * kaydediliyor. O ana kadar elimizde yalnizca rastgele bir belirtec
 * ve urun listesi var; kime ait oldugu bilinmiyor.
 *
 * MAGAZA KAPALIYKEN kayit tutulmuyor: kapali bir dukkanin sepetini
 * biriktirmenin anlami yok.
 */
export async function POST(req: Request) {
  try {
    if (!(await magazaGorunur())) {
      /* Sessiz kabul: istemciye hata dondurmek, kapali magazada
         konsolu hatayla doldurmaktan baska bir sey yapmaz. */
      return NextResponse.json({ success: true, kayit: false });
    }

    const g = await req.json().catch(() => ({}) as any);

    const token = String(g?.token ?? "").trim();
    /* Belirtec bicimi dogrulaniyor: serbest metin kabul etmek, tek bir
       istekle tablonun tamamini kirletmenin yolu olurdu. */
    if (!/^[a-zA-Z0-9-]{8,64}$/.test(token)) {
      return apiBadRequest("Invalid cart token.");
    }

    const gelen = Array.isArray(g?.items) ? g.items : [];
    const kimlikler: number[] = gelen
      .map((k: any) => Number(k?.urunId))
      .filter((n: number) => Number.isFinite(n) && n > 0);

    /* Urunler VERITABANINDAN: ad ve fiyat oradan geliyor. */
    const urunler = kimlikler.length
      ? await db
          .select({
            id: schema.products.id,
            title: schema.products.title,
            slug: schema.products.slug,
            price: schema.products.price,
            currency: schema.products.currency,
            productType: schema.products.productType,
          })
          .from(schema.products)
          .where(inArray(schema.products.id, Array.from(new Set<number>(kimlikler))))
      : [];

    const tablo = new Map(urunler.map((u) => [u.id, u]));

    let araToplam = 0;
    let adetToplam = 0;
    const kalemler = gelen
      .map((k: any) => {
        const u = tablo.get(Number(k?.urunId));
        if (!u) return null;
        const adet = Math.min(Math.max(parseInt(String(k?.adet ?? 1), 10) || 1, 1), 99);
        const fiyat = Number(u.price) || 0;
        araToplam += fiyat * adet;
        adetToplam += adet;
        return {
          urunId: u.id,
          baslik: u.title,
          slug: u.slug,
          tur: u.productType,
          fiyat,
          adet,
        };
      })
      .filter(Boolean);

    const paraBirimi = urunler[0]?.currency ?? "USD";
    const eposta = String(g?.email ?? "").trim().slice(0, 200) || null;
    const ad = String(g?.name ?? "").trim().slice(0, 120) || null;

    /* SAKLAMA SURESI — 90 gun.
       Kisisel veri (ad, e-posta) suresiz tutulamaz ve tutmanin bir
       faydasi da yok: uc ay once birakilmis bir sepet icin kimse
       kimseyi aramiyor. Temizlik ZAMANLANMIS BIR IS DEGIL, buradan
       yapiliyor — ayri bir is kurmak, o is bir gun calismayinca
       sessizce birikmeye devam eden bir tablo birakirdi.

       Siparise donenler kaliyor: onlar artik siparisin gecmisi. */
    const sinir = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await db
      .delete(schema.carts)
      .where(and(eq(schema.carts.status, "active"), lt(schema.carts.updatedAt, sinir)));

    const mevcut = await db.query.carts.findFirst({
      where: eq(schema.carts.token, token),
    });

    /* Sepet bosaldiysa kayit siliniyor: bos bir sepeti "birakilmis"
       diye raporda gostermek yaniltici olurdu. */
    if (kalemler.length === 0) {
      if (mevcut && mevcut.status === "active") {
        await db.delete(schema.carts).where(eq(schema.carts.id, mevcut.id));
      }
      return NextResponse.json({ success: true, kayit: false });
    }

    const veri = {
      itemsJson: kalemler,
      itemCount: adetToplam,
      subtotal: araToplam.toFixed(2),
      currency: paraBirimi,
      updatedAt: new Date(),
      /* E-posta bir kez yazildiysa siliniyormus gibi davranmiyoruz:
         sonraki istek onu bos gonderse bile eskisi duruyor. */
      ...(eposta ? { email: eposta } : {}),
      ...(ad ? { name: ad } : {}),
    };

    if (mevcut) {
      /* Siparise donmus bir sepete dokunulmuyor: o artik gecmis bir
         kayit ve uzerine yazmak siparisin izini bozardi. */
      if (mevcut.status === "ordered") {
        return NextResponse.json({ success: true, kayit: false });
      }
      await db.update(schema.carts).set(veri as any).where(eq(schema.carts.id, mevcut.id));
    } else {
      await db.insert(schema.carts).values({ token, ...veri } as any);
    }

    return NextResponse.json({ success: true, kayit: true });
  } catch (err: unknown) {
    return handleApiError(err, "POST /api/cart/track");
  }
}
