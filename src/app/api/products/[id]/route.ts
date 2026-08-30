import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, productId),
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const variants = await db.query.productVariants.findMany({
      where: eq(schema.productVariants.productId, productId),
    });

    return NextResponse.json({ success: true, product, variants });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    const body = await request.json();

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

    const [updatedProduct] = await db
      .update(schema.products)
      .set({
        title,
        slug,
        description,
        contentHtml,
        contentJson,
        featuredImageUrl,
        galleryUrls,
        price: price !== undefined ? String(price) : undefined,
        compareAtPrice: compareAtPrice ? String(compareAtPrice) : null,
        currency,
        sku,
        inventory: inventory !== undefined ? parseInt(String(inventory), 10) : undefined,
        unlimitedStock: unlimitedStock !== undefined ? Boolean(unlimitedStock) : undefined,
        productType: type || 'physical',
        digitalAssetUrl,
        checkoutUrl,
        status,
        categoryId: categoryId ? parseInt(String(categoryId), 10) : null,
        tagsJson,
        specificationsJson,
        metaTitle,
        metaDescription,
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.products.id, productId))
      .returning();

    // Update variants if provided
    if (variants && Array.isArray(variants)) {
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

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    // Delete variants first
    await db.delete(schema.productVariants).where(eq(schema.productVariants.productId, productId));
    await db.delete(schema.products).where(eq(schema.products.id, productId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
