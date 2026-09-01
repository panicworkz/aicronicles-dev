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

    const categories = await db.query.productCategories.findMany({
      orderBy: [desc(schema.productCategories.id)],
    });

    const products = await db.query.products.findMany();
    
    // Count products per category
    const categoriesWithCount = categories.map((cat) => {
      const count = products.filter((p) => p.categoryId === cat.id).length;
      return {
        ...cat,
        productCount: count,
      };
    });

    return NextResponse.json({ success: true, categories: categoriesWithCount });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/product-categories');
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
      return apiBadRequest('Category name is required');
    }

    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [newCategory] = await db.insert(schema.productCategories).values({
      name: data.name,
      slug,
      description: data.description || '',
      imageUrl: data.imageUrl || null,
    } as any).returning();

    return NextResponse.json({ success: true, category: newCategory });
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/product-categories');
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const data = await req.json().catch(() => ({}));
    if (!data.id) return apiBadRequest('Category ID required');

    const [updated] = await db
      .update(schema.productCategories)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
      } as any)
      .where(eq(schema.productCategories.id, parseInt(String(data.id), 10)))
      .returning();

    return NextResponse.json({ success: true, category: updated });
  } catch (err: unknown) {
    return handleApiError(err, 'PUT /api/product-categories');
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
    if (!id) return apiBadRequest('Category ID required');

    await db.delete(schema.productCategories).where(eq(schema.productCategories.id, parseInt(id, 10)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err, 'DELETE /api/product-categories');
  }
}
