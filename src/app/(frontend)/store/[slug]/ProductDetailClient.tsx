'use client';

import React, { useState } from 'react';
import { Package, FileDown, Briefcase, ShoppingCart, Check, ShieldCheck, Truck, ChevronLeft, ChevronRight, ExternalLink, Sliders } from 'lucide-react';
import { useCurrency } from '@/providers/currency-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function ProductDetailClient({ product, variants = [] }: { product: any; variants: any[] }) {
  const { format } = useCurrency();
  const [selectedVariant, setSelectedVariant] = useState<any>(variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Combine featured cover image + all gallery images
  const allImages: string[] = [
    product.featuredImageUrl,
    ...(Array.isArray(product.galleryUrls) ? product.galleryUrls : []),
  ].filter(Boolean);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const currentImage = allImages[activeImageIndex] || product.featuredImageUrl;

  const activePrice = selectedVariant?.price ? selectedVariant.price : product.price;

  const handleAddToCart = () => {
    if (product.checkoutUrl) {
      window.open(product.checkoutUrl, '_blank');
      return;
    }
    setAdded(true);
    toast.success(`Added ${product.title} (${selectedVariant?.title || 'Standard'}) to cart!`);
    setTimeout(() => setAdded(false), 2000);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  const specifications: any[] = Array.isArray(product.specificationsJson) ? product.specificationsJson : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Left 6 cols: Interactive Gallery with Thumbnails */}
      <div className="lg:col-span-6 space-y-4">
        {/* Main Photo View */}
        <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/20 shadow-xs group">
          {currentImage ? (
            <img
              key={currentImage}
              src={currentImage}
              alt={product.title}
              className="w-full h-full object-cover transition-all duration-300 animate-in fade-in"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No image available
            </div>
          )}

          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-8 rounded-md bg-background/90 backdrop-blur border border-border text-foreground flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                title="Previous photo"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-8 rounded-md bg-background/90 backdrop-blur border border-border text-foreground flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                title="Next photo"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Navigation Strip */}
        {allImages.length > 1 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative aspect-square w-18 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-primary ring-1 ring-primary/30 shadow-xs'
                    : 'border-border opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Specifications & Highlights Box */}
        {specifications.length > 0 && (
          <div className="p-4 rounded-xl border border-border bg-card space-y-3 mt-6">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="size-3.5 text-primary" />
              <span>Specifications & Deliverables</span>
            </h3>
            <div className="divide-y divide-border text-xs">
              {specifications.map((spec, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-foreground">{spec.key}</span>
                  <span className="text-muted-foreground font-mono">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right 6 cols: Product Options & Purchase */}
      <div className="lg:col-span-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize text-xs font-normal rounded-md">
              {product.productType}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">{product.sku || 'SKU-001'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
            {product.title}
          </h1>

          {/* Dynamic Multi-Currency Price */}
          <div className="flex items-baseline gap-3 pt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {format(activePrice)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through font-mono">
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
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-foreground">Select Option / Variant:</label>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition cursor-pointer ${
                    selectedVariant?.id === v.id
                      ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                      : 'border-border bg-card text-foreground hover:bg-muted/40'
                  }`}
                >
                  <span>{v.title}</span>
                  {v.price && (
                    <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">({format(v.price)})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity & Action Buttons */}
        <div className="flex items-center gap-3 pt-3">
          <div className="flex items-center rounded-md border border-border bg-card h-8.5 px-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-2 text-muted-foreground hover:text-foreground font-bold"
            >
              -
            </button>
            <span className="px-2.5 font-semibold text-foreground">{quantity}</span>
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
            className="flex-1 h-8.5 gap-2 font-medium text-xs rounded-md shadow-xs"
          >
            {added ? <Check className="size-3.5" /> : product.checkoutUrl ? <ExternalLink className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
            <span>{added ? 'Added to Cart!' : product.checkoutUrl ? 'Buy Now with Stripe' : 'Add to Cart / Buy Now'}</span>
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
