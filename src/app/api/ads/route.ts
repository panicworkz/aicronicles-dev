import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc, eq, and, or, isNull, lte, gte } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiBadRequest } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const conditions: any[] = [];

    if (placement && placement !== 'all') {
      conditions.push(eq(schema.ads.placement, placement));
    }

    // By default for public requests or when active=1, filter active & valid date window
    if (active !== 'all') {
      const now = new Date();
      conditions.push(eq(schema.ads.isActive, true));
      conditions.push(or(isNull(schema.ads.startsAt), lte(schema.ads.startsAt, now)));
      conditions.push(or(isNull(schema.ads.endsAt), gte(schema.ads.endsAt, now)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const adsList = await db.query.ads.findMany({
      where: whereClause,
      orderBy: [desc(schema.ads.createdAt)],
      limit,
    });

    return NextResponse.json({
      success: true,
      ads: adsList,
      total: adsList.length,
    });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/ads');
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const body = await request.json().catch(() => ({}));
    const {
      name,
      placement,
      imageUrl,
      alt,
      targetUrl,
      isActive = true,
      startsAt,
      endsAt,
    } = body;

    if (!name || !placement || !imageUrl || !targetUrl) {
      return apiBadRequest('Name, placement, imageUrl, and targetUrl are required.');
    }

    const validPlacements = ['billboard', 'leaderboard', 'skyscraper', 'rectangle', 'inread', 'native'];
    if (!validPlacements.includes(placement)) {
      return apiBadRequest(`Invalid placement. Must be one of: ${validPlacements.join(', ')}`);
    }

    const [newAd] = await db
      .insert(schema.ads)
      .values({
        name: name.trim(),
        placement,
        imageUrl: imageUrl.trim(),
        alt: alt ? alt.trim() : null,
        targetUrl: targetUrl.trim(),
        isActive: Boolean(isActive),
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        impressions: 0,
        clicks: 0,
      } as any)
      .returning();

    return NextResponse.json({ success: true, ad: newAd }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/ads');
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const body = await request.json().catch(() => ({}));
    const {
      id,
      name,
      placement,
      imageUrl,
      alt,
      targetUrl,
      isActive,
      startsAt,
      endsAt,
    } = body;

    if (!id) {
      return apiBadRequest('Ad ID is required');
    }

    const adId = parseInt(String(id), 10);

    const [updatedAd] = await db
      .update(schema.ads)
      .set({
        name: name !== undefined ? name.trim() : undefined,
        placement: placement !== undefined ? placement : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl.trim() : undefined,
        alt: alt !== undefined ? (alt ? alt.trim() : null) : undefined,
        targetUrl: targetUrl !== undefined ? targetUrl.trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        startsAt: startsAt !== undefined ? (startsAt ? new Date(startsAt) : null) : undefined,
        endsAt: endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : undefined,
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.ads.id, adId))
      .returning();

    if (!updatedAd) {
      return apiBadRequest('Ad not found');
    }

    return NextResponse.json({ success: true, ad: updatedAd });
  } catch (err: unknown) {
    return handleApiError(err, 'PUT /api/ads');
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiBadRequest('Ad ID is required');
    }

    const adId = parseInt(id, 10);
    await db.delete(schema.ads).where(eq(schema.ads.id, adId));

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err, 'DELETE /api/ads');
  }
}
