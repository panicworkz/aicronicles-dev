import React from 'react';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { StoreHeader } from '@/components/store/StoreHeader';
import { CurrencyProvider } from '@/providers/currency-provider';
import { ProductDetailClient } from './ProductDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await db.query.products.findFirst({
    where: eq(schema.products.slug, slug),
  });

  if (!product) notFound();

  const variants = await db.query.productVariants.findMany({
    where: eq(schema.productVariants.productId, product.id),
  });

  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        <StoreHeader />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/store" className="hover:text-foreground">Store</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">{product.title}</span>
          </div>

          <ProductDetailClient product={product} variants={variants} />
        </main>

        <footer className="border-t border-border bg-muted/20 py-12 mt-20 text-muted-foreground text-xs">
          <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
            <p>© {new Date().getFullYear()} Fabelo Store. Multi-Currency Enabled.</p>
            <Link href="/store" className="text-primary hover:underline font-medium">Back to Store</Link>
          </div>
        </footer>
      </div>
    </CurrencyProvider>
  );
}
