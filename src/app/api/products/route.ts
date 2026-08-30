import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, like, or, eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          like(schema.products.title, `%${search}%`),
          like(schema.products.slug, `%${search}%`),
          like(schema.products.sku, `%${search}%`)
        )
      );
    }

    if (status && status !== 'all') {
      conditions.push(eq(schema.products.status, status));
    }

    if (categoryId && categoryId !== 'all') {
      conditions.push(eq(schema.products.categoryId, parseInt(categoryId, 10)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const productList = await db.query.products.findMany({
      where: whereClause,
      orderBy: [desc(schema.products.createdAt)],
      limit,
    });

    return NextResponse.json({ success: true, products: productList });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      description,
      contentHtml,
      contentJson,
      featuredImageUrl,
      galleryUrls = [],
      price,
      compareAtPrice,
      currency = 'USD',
      sku,
      inventory = 100,
      unlimitedStock = false,
      type = 'physical',
      digitalAssetUrl,
      checkoutUrl,
      status = 'published',
      categoryId,
      tagsJson = [],
      specificationsJson = [],
      metaTitle,
      metaDescription,
      variants = [],
    } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and Slug are required' }, { status: 400 });
    }

    const [newProduct] = await db
      .insert(schema.products)
      .values({
        title,
        slug,
        description,
        contentHtml,
        contentJson,
        featuredImageUrl,
        galleryUrls,
        price: price ? String(price) : '0.00',
        compareAtPrice: compareAtPrice ? String(compareAtPrice) : null,
        currency,
        sku,
        inventory: inventory ? parseInt(String(inventory), 10) : 100,
        unlimitedStock: Boolean(unlimitedStock),
        productType: type || 'physical',
        digitalAssetUrl,
        checkoutUrl,
        status,
        categoryId: categoryId ? parseInt(String(categoryId), 10) : null,
        tagsJson,
        specificationsJson,
        metaTitle,
        metaDescription,
      } as any)
      .returning();

    // Insert variants if provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        await db.insert(schema.productVariants).values({
          productId: newProduct.id,
          title: v.title,
          sku: v.sku || null,
          price: v.price ? String(v.price) : null,
          inventory: v.inventory ? parseInt(String(v.inventory), 10) : 50,
          optionsJson: v.optionsJson || {},
        } as any);
      }
    }

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
