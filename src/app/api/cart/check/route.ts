import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { handleApiError } from "@/lib/api-response";
import { turu, stokta } from "@/lib/magaza";

export const dynamic = "force-dynamic";

/**
 * Sepeti sunucuyla karsilastirir.
 *
 * NEDEN GEREKLI: sepet tarayicida duruyor ve orada SURESIZ kaliyor.
 * Silinmis bir urun sepette oyle bir durdu ki listede gorunuyor,
 * toplama ekleniyor, ama siparis verilince "One of the items is no
 * longer available" deyip her seyi reddediyordu — okur hangi kalemin
 * sorunlu oldugunu bile goremiyordu. Ayni sey fiyat icin de gecerli:
 * sepete iki hafta once eklenen bir urunun fiyati degismis olabilir ve
 * sepette eski tutar yaziyordu.
 *
 * Bu uc yalnizca OKUYOR: hangi kalemler hala gecerli ve guncel
 * bilgileri ne. Neyin silinecegine sepetin kendisi karar veriyor.
 *
 * Oturum istemiyor — sepet herkese acik. Yalnizca yayindaki urunlerin
 * zaten herkese gorunen bilgilerini donuyor.
 */

export async function POST(req: NextRequest) {
  try {
    const g = await req.json().catch(() => ({}) as any);
    const istenen = (Array.isArray(g?.items) ? g.items : [])
      .map((k: any) => parseInt(String(k?.urunId), 10))
      .filter((n: number) => Number.isFinite(n))
      .slice(0, 50);

    if (istenen.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    const urunler = await db.query.products.findMany({
      where: inArray(schema.products.id, Array.from(new Set(istenen))),
    });

    const varyantlar = await db.query.productVariants.findMany({
      where: inArray(
        schema.productVariants.productId,
        Array.from(new Set(istenen))
      ),
    });
    const varyantById = new Map((varyantlar as any[]).map((v) => [v.id, v]));

    /* Yalnizca YAYINDA olanlar geri donuyor; taslaga cekilmis bir urun
       de silinmis sayiliyor. Sepette durmasi, satin alinamayacak bir
       seyi satin alinabilir gostermek olurdu. */
    const gecerli = (urunler as any[])
      .filter((u) => u.status === "published")
      .map((u) => ({
        urunId: u.id,
        slug: u.slug,
        baslik: u.title,
        fiyat: Number(u.price ?? 0),
        paraBirimi: u.currency || "USD",
        tur: turu(u.productType),
        gorsel: u.featuredImageUrl ?? null,
        stokta: stokta(u),
        varyantlar: (varyantlar as any[])
          .filter((v) => v.productId === u.id)
          .map((v) => ({ id: v.id, title: v.title, price: v.price })),
      }));

    return NextResponse.json({ success: true, items: gecerli });
  } catch (hata) {
    return handleApiError(hata, "cart.check.POST");
  }
}
