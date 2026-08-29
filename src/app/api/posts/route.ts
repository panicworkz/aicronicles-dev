import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc, eq, ilike, or } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const conditions = [];
    if (status && (status === 'published' || status === 'draft')) {
      conditions.push(eq(schema.posts.status, status));
    }
    if (search) {
      conditions.push(or(
        ilike(schema.posts.title, `%${search}%`),
        ilike(schema.posts.slug, `%${search}%`)
      ));
    }

    const postsList = await db.query.posts.findMany({
      where: conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : or(...conditions)) : undefined,
      orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)],
      limit,
    });

    return NextResponse.json({ posts: postsList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [newPost] = await db.insert(schema.posts).values({
      title: data.title || 'Untitled Post',
      slug,
      excerpt: data.excerpt || '',
      contentHtml: data.contentHtml || '',
      contentJson: data.contentJson || null,
      featuredImageUrl: data.featuredImageUrl || '/media/default.webp',
      featuredImageId: data.featuredImageId || null,
      status: data.status || 'draft',
      authorId: data.authorId || session.userId,
      tagsJson: data.tagsJson || [],
      readingTime: data.readingTime || '5 min read',
      metaTitle: data.metaTitle || data.title,
      metaDescription: data.metaDescription || data.excerpt,
      publishedAt: data.status === 'published' ? new Date() : null,
    } as any).returning();

    return NextResponse.json({ success: true, post: newPost });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
