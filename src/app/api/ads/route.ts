import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc, eq, and, or, isNull, lte, gte } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiBadRequest } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * Bir konuya kac kampanya daha sigar.
 *
 * Bir sayfada dort reklam yuvasi var (measure, feature, panel, rail);
 * dolayisiyla bir kategori ya da etiket icin AYNI TARIHLERDE en cok
 * dort kampanya olabilir. Besincisi yuva bulamaz, yalnizca kurayi
 * seyreltir ve olcumu bozar.
 *
 * Tarih penceresi bos birakilabiliyor: baslangici olmayan kampanya
 * "hep basladi", bitisi olmayan "hic bitmiyor" sayiliyor. Iki pencere
 * ancak biri otekinin tamamen oncesinde ya da sonrasinda ise
 * cakismiyor.
 */
const KONU_SINIRI = 4;

function pencereCakisiyor(
  aBas: Date | null, aBit: Date | null,
  bBas: Date | null, bBit: Date | null
): boolean {
  if (aBit && bBas && aBit < bBas) return false;
  if (bBit && aBas && bBit < aBas) return false;
  return true;
}

async function konuDolulugu(
  kategoriler: string[],
  etiketler: string[],
  anaSayfa: boolean,
  basla: Date | null,
  bitir: Date | null,
  hariçId?: number
): Promise<{ konu: string; tur: string; sayi: number }[]> {
  if (!kategoriler.length && !etiketler.length && !anaSayfa) return [];
  const hepsi = await db.query.ads.findMany({ where: eq(schema.ads.isActive, true) });
  const dolu: { konu: string; tur: string; sayi: number }[] = [];
  const say = (tur: "category" | "tag", konu: string) =>
    hepsi.filter((r: any) => {
      if (hariçId && r.id === hariçId) return false;
      const liste = (tur === "category" ? r.targetCategories : r.targetTags) ?? [];
      if (!liste.includes(konu)) return false;
      return pencereCakisiyor(basla, bitir, r.startsAt ?? null, r.endsAt ?? null);
    }).length;
  for (const k of kategoriler) {
    const n = say("category", k);
    if (n >= KONU_SINIRI) dolu.push({ konu: k, tur: "category", sayi: n });
  }
  for (const e of etiketler) {
    const n = say("tag", e);
    if (n >= KONU_SINIRI) dolu.push({ konu: e, tur: "tag", sayi: n });
  }
  if (anaSayfa) {
    // Ana sayfa da dort yuva tasiyor; besinci ev reklamina yer yok.
    const n = hepsi.filter((r: any) =>
      (!hariçId || r.id !== hariçId) && r.targetHome &&
      pencereCakisiyor(basla, bitir, r.startsAt ?? null, r.endsAt ?? null)).length;
    if (n >= KONU_SINIRI) dolu.push({ konu: "home", tur: "home", sayi: n });
  }
  return dolu;
}

/** Sinir asildiysa 400 dondurur, degilse null. */
async function konuDolulukKontrol(
  kategoriler: string[],
  etiketler: string[],
  anaSayfa: boolean,
  basla: Date | null,
  bitir: Date | null,
  hariçId?: number
) {
  const dolu = await konuDolulugu(kategoriler, etiketler, anaSayfa, basla, bitir, hariçId);
  if (!dolu.length) return null;
  const liste = dolu
    .map((d) => `${d.tur}:${d.konu} (${d.sayi}/${KONU_SINIRI})`)
    .join(", ");
  return apiBadRequest(
    `A page carries four ad slots, so a topic can hold at most ${KONU_SINIRI} campaigns ` +
    `with overlapping dates. Already full: ${liste}. Free a slot or change the dates.`
  );
}

function dizi(v: unknown): string[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

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
      targetCategories,
      targetTags,
      targetHome,
    } = body;

    if (!name || !placement || !imageUrl || !targetUrl) {
      return apiBadRequest('Name, placement, imageUrl, and targetUrl are required.');
    }

    const kats = dizi(targetCategories) ?? [];
    const etks = dizi(targetTags) ?? [];
    const bas = startsAt ? new Date(startsAt) : null;
    const bit = endsAt ? new Date(endsAt) : null;
    const ana = Boolean(targetHome);
    if (isActive) {
      const dolu = await konuDolulukKontrol(kats, etks, ana, bas, bit);
      if (dolu) return dolu;
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
        targetCategories: kats,
        targetTags: etks,
        targetHome: ana,
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
      targetCategories,
      targetTags,
      targetHome,
    } = body;

    if (!id) {
      return apiBadRequest('Ad ID is required');
    }

    const adId = parseInt(String(id), 10);

    // Guncellemede de sinir gecerli: kampanya yeni bir konuya
    // tasindiginda o konu dolmus olabilir.
    const kats = dizi(targetCategories);
    const etks = dizi(targetTags);
    if (isActive !== false && (kats?.length || etks?.length || targetHome)) {
      const mevcut = await db.query.ads.findFirst({ where: eq(schema.ads.id, adId) });
      const bas = startsAt !== undefined
        ? (startsAt ? new Date(startsAt) : null)
        : ((mevcut?.startsAt as Date | null) ?? null);
      const bit = endsAt !== undefined
        ? (endsAt ? new Date(endsAt) : null)
        : ((mevcut?.endsAt as Date | null) ?? null);
      const dolu = await konuDolulukKontrol(kats ?? [], etks ?? [], Boolean(targetHome),
                                            bas, bit, adId);
      if (dolu) return dolu;
    }

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
        targetCategories: kats,
        targetTags: etks,
        targetHome: targetHome !== undefined ? Boolean(targetHome) : undefined,
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
