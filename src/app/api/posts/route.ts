import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc, eq, ilike, or, and } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiBadRequest } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const authorId = searchParams.get('authorId');
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

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

    // Get true total counts
    const allPosts = await db.query.posts.findMany({
      columns: { id: true, status: true },
    });

    const total = allPosts.length;
    const publishedTotal = allPosts.filter((p) => p.status === 'published').length;

    return NextResponse.json({
      posts: postsList,
      total,
      publishedTotal,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/posts');
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const body = await req.json().catch(() => ({}));
    const { title, slug, contentHtml, excerpt, featuredImageUrl, status, categoryId, authorId, tagsJson } = body;

    if (!title || !slug) {
      return apiBadRequest('Title and Slug are required');
    }

    const newPost = await db.insert(schema.posts).values({
      title,
      slug,
      contentHtml: contentHtml || '',
      excerpt: excerpt || null,
      featuredImageUrl: featuredImageUrl || null,
      status: status || 'draft',
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      authorId: authorId ? parseInt(authorId, 10) : session.userId,
      tagsJson: tagsJson || [],
      publishedAt: status === 'published' ? new Date() : null,
    } as any).returning();

    return NextResponse.json({ post: newPost[0] }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/posts');
  }
}
