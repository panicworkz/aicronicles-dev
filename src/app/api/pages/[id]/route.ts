import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const page = await db.query.pages.findFirst({
      where: eq(schema.pages.id, parseInt(id, 10)),
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (err: any) {
    console.error('Error fetching page:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch page' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
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
  } catch (err: any) {
    console.error('Error updating page:', err);
    return NextResponse.json({ error: err.message || 'Failed to update page' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(schema.pages).where(eq(schema.pages.id, parseInt(id, 10)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting page:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete page' }, { status: 500 });
  }
}
