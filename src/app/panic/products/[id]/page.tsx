'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Coins,
  Layers,
  FileDown,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadDropzone } from '@/components/ui/image-upload-dropzone';
import { ProductSeoAeoSuite } from '@/components/studio/ProductSeoAeoSuite';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';

export default function PanicEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const productId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.00');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [sku, setSku] = useState('');
  const [inventory, setInventory] = useState('100');
  const [unlimitedStock, setUnlimitedStock] = useState(false);
  const [type, setType] = useState('physical');
  const [digitalAssetUrl, setDigitalAssetUrl] = useState('');
  const [status, setStatus] = useState('published');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (data.product) {
          const p = data.product;
          setTitle(p.title || '');
          setSlug(p.slug || '');
          setDescription(p.description || '');
          setPrice(p.price || '0.00');
          setCompareAtPrice(p.compareAtPrice || '');
          setSku(p.sku || '');
          setInventory(String(p.inventory || 100));
          setUnlimitedStock(Boolean(p.unlimitedStock));
          setType(p.productType || 'physical');
          setDigitalAssetUrl(p.digitalAssetUrl || '');
          setStatus(p.status || 'published');
          setFeaturedImageUrl(p.featuredImageUrl || '');
          setMetaTitle(p.metaTitle || '');
          setMetaDescription(p.metaDescription || '');
          setVariants(data.variants || []);
        } else {
          toast.error('Product not found');
        }
      } catch (err) {
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: Date.now(),
        title: 'New Variant Option',
        sku: `${sku || 'SKU'}-${variants.length + 1}`,
        price: price || '0.00',
        inventory: 50,
      },
    ]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          description,
          price: parseFloat(price),
          compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
          sku,
          inventory: parseInt(inventory, 10) || 0,
          unlimitedStock,
          type,
          digitalAssetUrl,
          status,
          featuredImageUrl,
          metaTitle,
          metaDescription,
          variants,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Product updated successfully');
      } else {
        toast.error(data.error || 'Failed to update product');
      }
    } catch (err: any) {
      toast.error(err.message || 'Save error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product deleted');
        router.push('/panic/products');
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-muted-foreground animate-pulse font-medium">Loading product studio...</div>
      </div>
    );
  }

  const parsedPrice = parseFloat(price) || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/panic/products">
            <Button variant="outline" size="icon-sm" type="button">
              <ArrowLeft className="size-3.5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/store/${slug}`} target="_blank">
            <Button variant="outline" type="button" className="gap-1.5">
              <ExternalLink className="size-3.5" />
              <span>Storefront View</span>
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive text-xs"
          >
            <Trash2 className="size-3.5 mr-1" />
            <span>Delete</span>
          </Button>
          <Button type="submit" disabled={saving} className="gap-1.5 font-medium">
            <Save className="size-3.5" />
            <span>{saving ? 'Saving...' : 'Save Product'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Product Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>URL Slug</Label>
                <div className="flex items-center rounded-lg border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
                  <span>fabelo.testworkz.com/store/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="bg-transparent text-primary font-mono outline-none flex-1 ml-1"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs resize-none leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Multi-Currency Converter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Coins className="size-4 text-primary" />
                <span>Pricing & Multi-Currency Engine</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Base Price (USD $)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Compare At Price (Discount $)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Automatic Multi-Market Conversion Box */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Automatic Multi-Market Exchange Rates
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-background border">
                    <span className="text-[10px] text-muted-foreground block font-mono">USD ($)</span>
                    <span className="text-xs font-bold text-foreground">{formatPrice(parsedPrice, 'USD')}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-background border">
                    <span className="text-[10px] text-muted-foreground block font-mono">EUR (€)</span>
                    <span className="text-xs font-bold text-primary">{formatPrice(parsedPrice, 'EUR')}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-background border">
                    <span className="text-[10px] text-muted-foreground block font-mono">TRY (₺)</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(parsedPrice, 'TRY')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product SEO, AEO & SERP Simulator */}
          <ProductSeoAeoSuite
            title={title}
            slug={slug}
            price={price}
            description={description}
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            onMetaTitleChange={(v) => setMetaTitle(v)}
            onMetaDescriptionChange={(v) => setMetaDescription(v)}
          />

          {/* Dynamic Variants Builder */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  <span>Product Variants & Options</span>
                </CardTitle>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1.5 text-xs font-medium">
                <Plus className="size-3.5" />
                <span>Add Variant</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {variants.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                  No variants defined for this product.
                </div>
              ) : (
                variants.map((v, idx) => (
                  <div key={v.id || idx} className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Input
                        value={v.title}
                        onChange={(e) => updateVariant(idx, 'title', e.target.value)}
                        className="text-xs font-medium"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeVariant(idx)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Variant SKU</Label>
                        <Input
                          value={v.sku || ''}
                          onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                          className="text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Price ($ USD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={v.price || ''}
                          onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Inventory Stock</Label>
                        <Input
                          type="number"
                          value={v.inventory || 0}
                          onChange={(e) => updateVariant(idx, 'inventory', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Direct 1-Click Image Upload Dropzone */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Featured Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploadDropzone
                value={featuredImageUrl}
                onChange={(url) => setFeaturedImageUrl(url)}
                label=""
              />
            </CardContent>
          </Card>

          {/* Product Type & Delivery */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Classification & Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Product Type</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-8 rounded-lg border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="physical">📦 Physical Good (Shipped)</option>
                  <option value="digital">⚡ Digital Download (Instant File Access)</option>
                  <option value="service">💼 Consultation / Professional Service</option>
                </select>
              </div>

              {type === 'digital' && (
                <div className="space-y-1.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Label className="text-xs text-primary flex items-center gap-1.5">
                    <FileDown className="size-3.5" />
                    <span>Digital Asset Download URL</span>
                  </Label>
                  <Input
                    value={digitalAssetUrl}
                    onChange={(e) => setDigitalAssetUrl(e.target.value)}
                    placeholder="https://assets.fabelo.com/bundle-2026.zip"
                    className="text-xs font-mono"
                  />
                </div>
              )}

              {type === 'service' && (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
                  <span className="font-semibold flex items-center gap-1.5"><Briefcase className="size-3.5" /> Service / Consulting</span>
                  <p className="text-[11px] text-muted-foreground">Order confirmation will prompt calendar scheduling and client onboarding questionnaire.</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Publication Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-8 rounded-lg border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="published">Published (Live in Storefront)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory & SKU */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Inventory Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Primary SKU</Label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Available Stock Quantity</Label>
                <Input
                  type="number"
                  value={inventory}
                  onChange={(e) => setInventory(e.target.value)}
                  disabled={unlimitedStock}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="unlimitedStock"
                  checked={unlimitedStock}
                  onChange={(e) => setUnlimitedStock(e.target.checked)}
                  className="rounded border-border size-4 text-primary focus:ring-primary"
                />
                <Label htmlFor="unlimitedStock" className="cursor-pointer text-xs font-normal">
                  Unlimited Stock (Always available)
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
