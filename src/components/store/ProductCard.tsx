'use client';

import React from 'react';
import Link from 'next/link';
import { Package, FileDown, Briefcase, ArrowRight } from 'lucide-react';
import { useCurrency } from '@/providers/currency-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ProductCard({ product }: { product: any }) {
  const { format } = useCurrency();

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'digital':
        return <Badge variant="secondary" className="gap-1 text-[10px] font-normal"><FileDown className="size-3 text-primary" /> Digital Asset</Badge>;
      case 'service':
        return <Badge variant="secondary" className="gap-1 text-[10px] font-normal"><Briefcase className="size-3 text-emerald-500" /> Consulting</Badge>;
      case 'physical':
      default:
        return <Badge variant="secondary" className="gap-1 text-[10px] font-normal"><Package className="size-3 text-amber-500" /> Physical</Badge>;
    }
  };

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Product Image */}
      <Link href={`/store/${product.slug}`} className="block relative aspect-4/3 bg-muted/30 overflow-hidden">
        {product.featuredImageUrl ? (
          <img
            src={product.featuredImageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        <div className="absolute top-3 left-3">
          {getTypeBadge(product.productType)}
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <span className="text-[11px] text-muted-foreground font-mono">{product.sku || 'PROD-001'}</span>
          <Link href={`/store/${product.slug}`} className="block font-bold text-sm text-foreground group-hover:text-primary transition line-clamp-1">
            {product.title}
          </Link>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description || 'Premium resource with instant fulfillment and guarantee.'}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-border/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground block font-mono text-[10px]">Price</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-foreground font-mono">
                {format(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through font-mono">
                  {format(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>

          <Link href={`/store/${product.slug}`}>
            <Button size="sm" className="gap-1.5 h-8 text-xs font-medium">
              <span>Details</span>
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
