import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allPages = await db.query.pages.findMany({
      orderBy: [desc(schema.pages.createdAt)],
    });
    return NextResponse.json({ pages: allPages });
  } catch (err: any) {
    console.error('Error fetching pages:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch pages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, slug, contentHtml, contentJson, status, metaTitle, metaDescription } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and Slug are required' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)+/g, '');

    const insertData: any = {
      title,
      slug: cleanSlug,
      contentHtml: contentHtml || '',
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
  } catch (err: any) {
    console.error('Error creating page:', err);
    return NextResponse.json({ error: err.message || 'Failed to create page' }, { status: 500 });
  }
}
