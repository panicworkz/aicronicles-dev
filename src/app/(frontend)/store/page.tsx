import React from 'react';
import Link from 'next/link';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { StoreHeader } from '@/components/store/StoreHeader';
import { CurrencyProvider } from '@/providers/currency-provider';
import { ProductCard } from '@/components/store/ProductCard';

export const dynamic = 'force-dynamic';

export default async function StorefrontPage() {
  const productList = await db.query.products.findMany({
    where: eq(schema.products.status, 'published'),
    orderBy: [desc(schema.products.createdAt)],
  });

  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        <StoreHeader />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          {/* Hero Banner */}
          <div className="text-center space-y-3 py-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium">
              <span>Verified Direct Storefront</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif text-foreground">
              Official Products & Digital Assets
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Curated physical goods, digital frameworks, and 1-on-1 strategic consulting with multi-currency support (USD, EUR, TRY).
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {productList.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </main>

        <footer className="border-t border-border bg-muted/20 py-12 mt-20 text-muted-foreground text-xs">
          <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
            <p>© {new Date().getFullYear()} Fabelo Store. Multi-Currency Enabled.</p>
            <Link href="/" className="text-primary hover:underline font-medium">Back to Articles</Link>
          </div>
        </footer>
      </div>
    </CurrencyProvider>
  );
}
