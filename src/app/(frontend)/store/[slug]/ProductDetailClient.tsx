'use client';

import React, { useState } from 'react';
import { Package, FileDown, Briefcase, ShoppingCart, Check, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { useCurrency } from '@/providers/currency-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function ProductDetailClient({ product, variants = [] }: { product: any; variants: any[] }) {
  const { format } = useCurrency();
  const [selectedVariant, setSelectedVariant] = useState<any>(variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const activePrice = selectedVariant?.price ? selectedVariant.price : product.price;

  const handleAddToCart = () => {
    setAdded(true);
    toast.success(`Added ${product.title} (${selectedVariant?.title || 'Standard'}) to cart!`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Left 6 cols: Gallery Image */}
      <div className="lg:col-span-6 space-y-4">
        <div className="aspect-square rounded-2xl overflow-hidden border border-border bg-muted/20 shadow-md">
          {product.featuredImageUrl ? (
            <img src={product.featuredImageUrl} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No image available
            </div>
          )}
        </div>
      </div>

      {/* Right 6 cols: Product Options & Purchase */}
      <div className="lg:col-span-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize text-xs font-normal">
              {product.productType}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">{product.sku || 'SKU-001'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground font-serif">
            {product.title}
          </h1>

          {/* Dynamic Multi-Currency Price */}
          <div className="flex items-baseline gap-3 pt-2">
            <span className="text-3xl font-extrabold text-foreground font-mono">
              {format(activePrice)}
            </span>
            {product.compareAtPrice && (
              <span className="text-base text-muted-foreground line-through font-mono">
                {format(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {product.description || 'High-performance resource crafted to accelerate outcome and provide immediate business leverage.'}
        </p>

        {/* Variants Selection */}
        {variants.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <label className="text-xs font-semibold text-foreground">Select Option / Variant:</label>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    selectedVariant?.id === v.id
                      ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                      : 'border-border bg-card text-foreground hover:bg-muted/40'
                  }`}
                >
                  <span>{v.title}</span>
                  {v.price && (
                    <span className="ml-2 font-mono text-[11px] text-muted-foreground">({format(v.price)})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity & Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <div className="flex items-center rounded-lg border border-border bg-card h-10 px-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-2 text-muted-foreground hover:text-foreground font-bold"
            >
              -
            </button>
            <span className="px-3 font-semibold text-foreground">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="px-2 text-muted-foreground hover:text-foreground font-bold"
            >
              +
            </button>
          </div>

          <Button
            size="default"
            onClick={handleAddToCart}
            className="flex-1 h-10 gap-2 font-medium text-xs shadow-md"
          >
            {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
            <span>{added ? 'Added to Cart!' : 'Add to Cart / Buy Now'}</span>
          </Button>
        </div>

        {/* Guarantee badges */}
        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
            <span>Encrypted Checkout & Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-primary shrink-0" />
            <span>Instant Digital & Global Dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
