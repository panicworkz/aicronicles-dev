import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const productId = parseInt(id, 10);

    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, productId),
    });

    if (!product) {
      return apiNotFound('Product not found');
    }

    const variants = await db.query.productVariants.findMany({
      where: eq(schema.productVariants.productId, productId),
    });

    return NextResponse.json({ success: true, product, variants });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/products/[id]');
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    const body = await request.json().catch(() => ({}));

    const {
      title,
      slug,
      description,
      contentHtml,
      contentJson,
      featuredImageUrl,
      galleryUrls,
      price,
      compareAtPrice,
      currency,
      sku,
      inventory,
      unlimitedStock,
      type,
      digitalAssetUrl,
      checkoutUrl,
      status,
      categoryId,
      tagsJson,
      specificationsJson,
      metaTitle,
      metaDescription,
      variants,
    } = body;

    const [updated] = await db
      .update(schema.products)
      .set({
        title: title !== undefined ? title : undefined,
        slug: slug !== undefined ? slug : undefined,
        description: description !== undefined ? description : undefined,
        contentHtml: contentHtml !== undefined ? contentHtml : undefined,
        contentJson: contentJson !== undefined ? contentJson : undefined,
        featuredImageUrl: featuredImageUrl !== undefined ? featuredImageUrl : undefined,
        galleryUrls: galleryUrls !== undefined ? galleryUrls : undefined,
        price: price !== undefined ? String(price) : undefined,
        compareAtPrice: compareAtPrice !== undefined ? (compareAtPrice ? String(compareAtPrice) : null) : undefined,
        currency: currency !== undefined ? currency : undefined,
        sku: sku !== undefined ? sku : undefined,
        inventory: inventory !== undefined ? parseInt(String(inventory), 10) : undefined,
        unlimitedStock: unlimitedStock !== undefined ? Boolean(unlimitedStock) : undefined,
        productType: type !== undefined ? type : undefined,
        digitalAssetUrl: digitalAssetUrl !== undefined ? digitalAssetUrl : undefined,
        checkoutUrl: checkoutUrl !== undefined ? checkoutUrl : undefined,
        status: status !== undefined ? status : undefined,
        categoryId: categoryId !== undefined ? (categoryId ? parseInt(String(categoryId), 10) : null) : undefined,
        tagsJson: tagsJson !== undefined ? tagsJson : undefined,
        specificationsJson: specificationsJson !== undefined ? specificationsJson : undefined,
        metaTitle: metaTitle !== undefined ? metaTitle : undefined,
        metaDescription: metaDescription !== undefined ? metaDescription : undefined,
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.products.id, productId))
      .returning();

    // Re-sync variants if provided
    if (variants !== undefined && Array.isArray(variants)) {
      await db.delete(schema.productVariants).where(eq(schema.productVariants.productId, productId));
      for (const v of variants) {
        await db.insert(schema.productVariants).values({
          productId,
          title: v.title,
          sku: v.sku || null,
          price: v.price ? String(v.price) : null,
          inventory: v.inventory ? parseInt(String(v.inventory), 10) : 50,
          optionsJson: v.optionsJson || {},
        } as any);
      }
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    return handleApiError(err, 'PUT /api/products/[id]');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const productId = parseInt(id, 10);

    await db.delete(schema.productVariants).where(eq(schema.productVariants.productId, productId));
    await db.delete(schema.products).where(eq(schema.products.id, productId));

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err, 'DELETE /api/products/[id]');
  }
}
