import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { htmlBloklara, bloklarHtmle } from '@/lib/bloklar';
import { desc } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiBadRequest } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const allPages = await db.query.pages.findMany({
      orderBy: [desc(schema.pages.createdAt)],
    });
    return NextResponse.json({ pages: allPages });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/pages');
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const body = await req.json().catch(() => ({}));
    const { title, slug, contentHtml, contentJson, status, metaTitle, metaDescription } = body;

    /* SABIT SAYFALAR DA SEMADAN GECIYOR.
       Bu sayfalarin editoru artik dogrudan HTML yazilan bir kutu;
       suzgec olmasaydi yapistirilan bir script ya da satir ici stil
       oldugu gibi yayina cikardi. Etkisi once olculdu: dokuz sayfanin
       dokuzu da cevrimden kayipsiz geciyor. */
    const temizHtml =
      typeof contentHtml === 'string' ? bloklarHtmle(htmlBloklara(contentHtml)) : contentHtml;

    if (!title || !slug) {
      return apiBadRequest('Title and Slug are required');
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)+/g, '');

    const insertData: any = {
      title,
      slug: cleanSlug,
      contentHtml: temizHtml || '',
      contentJson: contentJson || null,
      status: status || 'published',
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || '',
    };

    const [newPage] = await db
      .insert(schema.pages)
      .values(insertData)
      .returning();

    return NextResponse.json({ success: true, page: newPage });
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/pages');
  }
}
