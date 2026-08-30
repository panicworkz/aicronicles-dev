import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc, eq, ilike, or, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const authorId = searchParams.get('authorId');
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '100');

    const conditions = [];

    if (status && (status === 'published' || status === 'draft')) {
      conditions.push(eq(schema.posts.status, status));
    }
    if (categoryId) {
      conditions.push(eq(schema.posts.categoryId, parseInt(categoryId, 10)));
    }
    if (authorId) {
      conditions.push(eq(schema.posts.authorId, parseInt(authorId, 10)));
    }
    if (search) {
      conditions.push(
        or(
          ilike(schema.posts.title, `%${search}%`),
          ilike(schema.posts.slug, `%${search}%`)
        )
      );
    }

    let postsList = await db.query.posts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)],
      limit,
    });

    if (tag) {
      const cleanTag = tag.toLowerCase().trim();
      postsList = postsList.filter((p: any) => {
        const tags = Array.isArray(p.tagsJson) ? p.tagsJson : [];
        return tags.some((t: any) => {
          const str = typeof t === 'string' ? t : t?.name || '';
          return str.toLowerCase().includes(cleanTag);
        });
      });
    }

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
      categoryId: data.categoryId ? parseInt(String(data.categoryId), 10) : null,
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
