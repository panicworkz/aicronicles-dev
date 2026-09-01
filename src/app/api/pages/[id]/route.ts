import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const page = await db.query.pages.findFirst({
      where: eq(schema.pages.id, parseInt(id, 10)),
    });

    if (!page) {
      return apiNotFound('Page not found');
    }

    return NextResponse.json({ page });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/pages/[id]');
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { title, slug, contentHtml, contentJson, status, metaTitle, metaDescription } = body;

    const updateData: any = {
      title,
      contentHtml: contentHtml || '',
      contentJson: contentJson || null,
      status: status || 'published',
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || '',
      updatedAt: new Date(),
    };

    if (slug) {
      updateData.slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const [updatedPage] = await db
      .update(schema.pages)
      .set(updateData)
      .where(eq(schema.pages.id, parseInt(id, 10)))
      .returning();

    return NextResponse.json({ success: true, page: updatedPage });
  } catch (err: unknown) {
    return handleApiError(err, 'PUT /api/pages/[id]');
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    await db.delete(schema.pages).where(eq(schema.pages.id, parseInt(id, 10)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err, 'DELETE /api/pages/[id]');
  }
}
