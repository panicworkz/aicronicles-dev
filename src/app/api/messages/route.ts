import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq, sql } from 'drizzle-orm';
import { handleApiError, apiBadRequest } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * Iletisim mesajlari — panel ucu.
 *
 * Mesajlar contact_messages tablosunda duruyor (bkz. api/contact).
 * Bu uc yalnizca PANELDEN cagriliyor; middleware /api/* icin oturum
 * istiyor ve buraya bir istisna EKLENMEDI — iletisim kayitlari
 * kisisel veri, herkese acik olmamali.
 */

const GECERLI_DURUM = ['new', 'read', 'replied', 'archived'];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const durum = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10) || 200, 500);

    const kosul = durum && GECERLI_DURUM.includes(durum)
      ? eq(schema.contactMessages.status, durum)
      : undefined;

    const satirlar = await db.query.contactMessages.findMany({
      where: kosul,
      orderBy: [desc(schema.contactMessages.createdAt)],
      limit,
    });

    /* Durum sayaclari — panelde sekme rozetleri icin. Listeyi
       suzdugumuzde de TAM sayimi vermeli, o yuzden ayri sorgu. */
    const sayim = (await db.execute(sql`
      SELECT status, count(*)::int AS n FROM contact_messages GROUP BY status
    `)) as unknown as { rows?: { status: string; n: number }[] };
    const satir = Array.isArray(sayim) ? (sayim as any) : sayim.rows ?? [];
    const sayilar: Record<string, number> = {};
    for (const r of satir as any[]) sayilar[r.status] = Number(r.n);

    return NextResponse.json({ success: true, messages: satirlar, counts: sayilar });
  } catch (hata) {
    return handleApiError(hata, 'messages.GET');
  }
}

/** Durum degistir — okundu, cevaplandi, arsiv. */
export async function PUT(req: NextRequest) {
  try {
    const govde = await req.json().catch(() => ({} as any));
    const id = parseInt(String(govde?.id ?? ''), 10);
    const durum = String(govde?.status ?? '');
    if (!id) return apiBadRequest('id gerekli.');
    if (!GECERLI_DURUM.includes(durum)) {
      return apiBadRequest(`status su degerlerden biri olmali: ${GECERLI_DURUM.join(', ')}`);
    }

    const [guncel] = await db
      .update(schema.contactMessages)
      .set({ status: durum, updatedAt: new Date() } as any)
      .where(eq(schema.contactMessages.id, id))
      .returning();

    if (!guncel) return apiBadRequest('Kayit bulunamadi.');
    return NextResponse.json({ success: true, message: guncel });
  } catch (hata) {
    return handleApiError(hata, 'messages.PUT');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '', 10);
    if (!id) return apiBadRequest('id gerekli.');
    await db.delete(schema.contactMessages).where(eq(schema.contactMessages.id, id));
    return NextResponse.json({ success: true });
  } catch (hata) {
    return handleApiError(hata, 'messages.DELETE');
  }
}
