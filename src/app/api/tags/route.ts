import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiBadRequest } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const tagList = await db.query.tags.findMany({
      orderBy: [desc(schema.tags.createdAt)],
    });

    const postsList = await db.query.posts.findMany();

    const tagsWithCounts = tagList.map((tag) => {
      const tagNameLower = tag.name.toLowerCase();
      const count = postsList.filter((p: any) => {
        const postTags = Array.isArray(p.tagsJson) ? p.tagsJson : [];
        return postTags.some((t: any) => {
          const str = typeof t === 'string' ? t : t?.name || '';
          return str.toLowerCase() === tagNameLower || str.toLowerCase().includes(tag.slug);
        });
      }).length;

      return {
        ...tag,
        postCount: count,
      };
    });

    return NextResponse.json({ success: true, tags: tagsWithCounts });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/tags');
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
      return apiBadRequest('Tag name is required');
    }

    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [newTag] = await db.insert(schema.tags).values({
      name: data.name,
      slug,
      description: data.description || '',
      color: data.color || '#2563eb',
    } as any).returning();

    return NextResponse.json({ success: true, tag: newTag });
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/tags');
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return apiBadRequest('ID required');

    await db.delete(schema.tags).where(eq(schema.tags.id, parseInt(id, 10)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err, 'DELETE /api/tags');
  }
}
