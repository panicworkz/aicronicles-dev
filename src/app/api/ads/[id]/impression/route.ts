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
