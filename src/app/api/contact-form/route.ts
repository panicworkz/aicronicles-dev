import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { asc, eq } from 'drizzle-orm';
import { handleApiError, apiBadRequest } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * Iletisim formunun sekmeleri ve alanlari — panel ucu.
 *
 * Yayin tarafi bunlari okumak icin bu uca GELMIYOR; dogrudan
 * veritabanindan okuyor (contact/sekmeler.sunucu.ts). Bu uc yalnizca
 * DUZENLEME icin ve oturum istiyor — middleware'in public listesinde
 * yok.
 */

const TURLER = ['text', 'select'];

/** Sekmeyi alanlariyla birlikte kaydeder. */
async function alanlariYaz(tabId: number, alanlar: any[]) {
  await db.delete(schema.contactFields).where(eq(schema.contactFields.tabId, tabId));
  for (const [i, a] of (alanlar ?? []).entries()) {
    const ad = String(a?.name ?? '').trim();
    const etiket = String(a?.label ?? '').trim();
    if (!ad || !etiket) continue;
    await db.insert(schema.contactFields).values({
      tabId,
      name: ad.slice(0, 80),
      label: etiket.slice(0, 120),
      type: TURLER.includes(a?.type) ? a.type : 'text',
      hint: a?.hint ? String(a.hint).slice(0, 200) : null,
      required: Boolean(a?.required),
      options: Array.isArray(a?.options)
        ? a.options.map((o: unknown) => String(o).slice(0, 200)).filter(Boolean)
        : [],
      sortOrder: i,
    } as any);
  }
}

export async function GET() {
  try {
    const sekmeler = await db.query.contactTabs.findMany({
      orderBy: [asc(schema.contactTabs.sortOrder)],
    });
    const alanlar = await db.query.contactFields.findMany({
      orderBy: [asc(schema.contactFields.sortOrder)],
    });
    return NextResponse.json({
      success: true,
      tabs: (sekmeler as any[]).map((t) => ({
        ...t,
        fields: (alanlar as any[]).filter((a) => a.tabId === t.id),
      })),
    });
  } catch (hata) {
    return handleApiError(hata, 'contact-form.GET');
  }
}

/** Yeni sekme. */
export async function POST(req: NextRequest) {
  try {
    const g = await req.json().catch(() => ({} as any));
    const key = String(g?.key ?? '').trim().toLowerCase();
    const title = String(g?.title ?? '').trim();
    if (!/^[a-z0-9-]{2,40}$/.test(key)) {
      return apiBadRequest('key yalnizca kucuk harf, rakam ve tire icerebilir (2-40).');
    }
    if (!title) return apiBadRequest('title gerekli.');

    const varMi = await db.query.contactTabs.findFirst({ where: eq(schema.contactTabs.key, key) });
    if (varMi) return apiBadRequest(`"${key}" zaten kullaniliyor.`);

    const hepsi = await db.query.contactTabs.findMany();
    const [yeni] = await db
      .insert(schema.contactTabs)
      .values({
        key,
        no: String(hepsi.length + 1).padStart(2, '0'),
        title: title.slice(0, 120),
        summary: g?.summary ? String(g.summary).slice(0, 400) : null,
        page: g?.page ? String(g.page).slice(0, 120) : null,
        messageLabel: String(g?.messageLabel ?? 'Your message').slice(0, 160),
        sortOrder: hepsi.length,
      } as any)
      .returning();

    if (Array.isArray(g?.fields)) await alanlariYaz(yeni.id, g.fields);
    return NextResponse.json({ success: true, tab: yeni });
  } catch (hata) {
    return handleApiError(hata, 'contact-form.POST');
  }
}

/** Sekmeyi ve alanlarini gunceller. */
export async function PUT(req: NextRequest) {
  try {
    const g = await req.json().catch(() => ({} as any));
    const id = parseInt(String(g?.id ?? ''), 10);
    if (!id) return apiBadRequest('id gerekli.');

    /* key degistirilebiliyor ama uyarisi panelde: statik sayfalardaki
       /contact?type=... baglantilari bu degeri kullaniyor. */
    const yama: Record<string, unknown> = { updatedAt: new Date() };
    if (g?.key !== undefined) {
      const key = String(g.key).trim().toLowerCase();
      if (!/^[a-z0-9-]{2,40}$/.test(key)) {
        return apiBadRequest('key yalnizca kucuk harf, rakam ve tire icerebilir (2-40).');
      }
      yama.key = key;
    }
    if (g?.no !== undefined) yama.no = String(g.no).slice(0, 4);
    if (g?.title !== undefined) yama.title = String(g.title).slice(0, 120);
    if (g?.summary !== undefined) yama.summary = g.summary ? String(g.summary).slice(0, 400) : null;
    if (g?.page !== undefined) yama.page = g.page ? String(g.page).slice(0, 120) : null;
    if (g?.messageLabel !== undefined) yama.messageLabel = String(g.messageLabel).slice(0, 160);
    if (g?.sortOrder !== undefined) yama.sortOrder = parseInt(String(g.sortOrder), 10) || 0;
    if (g?.isActive !== undefined) yama.isActive = Boolean(g.isActive);

    const [guncel] = await db
      .update(schema.contactTabs)
      .set(yama as any)
      .where(eq(schema.contactTabs.id, id))
      .returning();
    if (!guncel) return apiBadRequest('Sekme bulunamadi.');

    if (Array.isArray(g?.fields)) await alanlariYaz(id, g.fields);
    return NextResponse.json({ success: true, tab: guncel });
  } catch (hata) {
    return handleApiError(hata, 'contact-form.PUT');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '', 10);
    if (!id) return apiBadRequest('id gerekli.');

    /* Son sekme silinemez: form sekmesiz kalirsa ziyaretci bos bir
       sayfa gorur. Kapatmak icin isActive var. */
    const hepsi = await db.query.contactTabs.findMany();
    if (hepsi.length <= 1) {
      return apiBadRequest('Son sekme silinemez — kapatmak icin devre disi birakin.');
    }

    await db.delete(schema.contactTabs).where(eq(schema.contactTabs.id, id));
    return NextResponse.json({ success: true });
  } catch (hata) {
    return handleApiError(hata, 'contact-form.DELETE');
  }
}
