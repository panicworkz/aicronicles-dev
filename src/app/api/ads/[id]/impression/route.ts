import { NextResponse, type NextRequest } from 'next/server';
import { db, schema } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { checkRateLimit, recordAttempt } from '@/lib/rate-limiter';
import { handleApiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adId = parseInt(id, 10);
    if (isNaN(adId)) {
      return NextResponse.json({ error: 'Invalid Ad ID' }, { status: 400 });
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = realIp || (forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1');

    // Rate limit: Max 60 impressions per minute per IP per ad
    const rateKey = `ad_imp:${adId}:${clientIp}`;
    const check = checkRateLimit(rateKey, 60, 60 * 1000);
    if (!check.success) {
      return NextResponse.json({ success: false, message: 'Throttled' }, { status: 429 });
    }
    recordAttempt(rateKey);


    /* Olayi KENDI BAGLAMIYLA kaydediyoruz. ads.impressions/clicks yalnizca
       toplam tutuyor; bir reklam bes ayri konu sayfasinda donunce hangi
       sayfanin tiklama getirdigi kayboluyordu. Kol ve hedef dili de olay
       anindaki degeriyle yaziliyor — reklamin kolu sonra degisse bile
       gecmis olcum bozulmasin. */
    const govde = await request.json().catch(() => ({} as any));
    const reklam = await db.query.ads.findFirst({ where: eq(schema.ads.id, adId) });
    try {
      await db.insert(schema.adEvents).values({
        adId,
        kind: "impression",
        pagePath: typeof govde?.path === "string" ? govde.path.slice(0, 300) : null,
        contextType: typeof govde?.contextType === "string" ? govde.contextType : null,
        contextSlug: typeof govde?.contextSlug === "string" ? govde.contextSlug : null,
        arm: (reklam as any)?.arm ?? null,
        destLang: (reklam as any)?.destLang ?? null,
      } as any);
    } catch (e) {
      // Olay kaydi tutulamazsa sayac yine de islesin
      console.error("[ads] olay kaydedilemedi:", e);
    }
    await db
      .update(schema.ads)
      .set({
        impressions: sql`${schema.ads.impressions} + 1`,
      } as any)
      .where(eq(schema.ads.id, adId));

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/ads/[id]/impression');
  }
}
