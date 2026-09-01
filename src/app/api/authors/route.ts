import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiBadRequest } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const authorsList = await db.query.authors.findMany({
      orderBy: [desc(schema.authors.createdAt)],
    });

    const postsList = await db.query.posts.findMany();

    const authorsWithCount = authorsList.map((a) => {
      const count = postsList.filter((p: any) => p.authorId === a.id).length;
      return {
        ...a,
        postCount: count,
      };
    });

    return NextResponse.json({ success: true, authors: authorsWithCount });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/authors');
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const data = await req.json().catch(() => ({}));
    if (!data.name) {
      return apiBadRequest('Name is required');
    }

    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [newAuthor] = await db.insert(schema.authors).values({
      name: data.name,
      slug,
      role: data.role || 'Author',
      bio: data.bio || '',
      avatarUrl: data.avatarUrl || '',
      socialLinks: data.socialLinks || {},
    } as any).returning();

    return NextResponse.json({ success: true, author: newAuthor });
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/authors');
  }
}
