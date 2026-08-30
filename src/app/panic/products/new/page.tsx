'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  Layers,
  FileCheck,
  Plus,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PanicNewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('29.00');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [sku, setSku] = useState('');
  const [inventory, setInventory] = useState('100');
  const [unlimitedStock, setUnlimitedStock] = useState(false);
  const [type, setType] = useState('digital');
  const [digitalAssetUrl, setDigitalAssetUrl] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [status, setStatus] = useState('published');
  const [variants, setVariants] = useState<{ title: string; sku: string; price: string; inventory: string }[]>([]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const addVariant = () => {
    setVariants([...variants, { title: '', sku: '', price, inventory: '50' }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const updated = [...variants];
    (updated[index] as any)[field] = value;
    setVariants(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) {
      toast.error('Title and Slug are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          description,
          price: parseFloat(price) || 0,
          compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
          sku,
          inventory: parseInt(inventory, 10) || 0,
          unlimitedStock,
          type,
          digitalAssetUrl,
          featuredImageUrl,
          status,
          variants,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Product created successfully');
        router.push('/panic/products');
      } else {
        toast.error(data.error || 'Failed to create product');
      }
    } catch (err) {
      toast.error('Error saving product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-20">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/panic/products">
            <Button variant="outline" size="icon" title="Back to Products">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Create Product</h1>
            <p className="text-xs text-muted-foreground">Add a new physical item, software license, or digital course</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={saving}
            className="gap-1.5 font-medium"
          >
            <Save className="size-3.5" />
            <span>{saving ? 'Creating...' : 'Create Product'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Details (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Package className="size-4 text-primary" />
                <span>General Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Product Title</Label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. AI Prompt Engineering Playbook 2026"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>URL Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ai-prompt-engineering-playbook-2026"
                  className="text-xs font-mono text-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed product features, inclusions, and benefits..."
                  className="text-xs leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="size-4 text-primary" />
                <span>Pricing & Inventory</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Price (USD $)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="text-xs font-medium"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Compare-At Price (Discount Slash $)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="Optional original price"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label>SKU (Stock Keeping Unit)</Label>
                  <Input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="FAB-PROMPT-01"
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Inventory (Stock Quantity)</Label>
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={unlimitedStock}
                        onChange={(e) => setUnlimitedStock(e.target.checked)}
                        className="rounded text-primary focus:ring-0"
                      />
                      <span>Unlimited Stock</span>
                    </label>
                  </div>
                  <Input
                    type="number"
                    disabled={unlimitedStock}
                    value={inventory}
                    onChange={(e) => setInventory(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants Builder */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Layers className="size-4 text-primary" />
                <span>Product Variants (Options)</span>
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={addVariant}
                className="gap-1 text-xs"
              >
                <Plus className="size-3.5" />
                <span>Add Variant</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {variants.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                  No variants defined. This product will sell as a single standard item.
                </p>
              ) : (
                variants.map((v, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-muted/20">
                    <div className="flex-1 min-w-[140px]">
                      <Label className="text-[10px]">Variant Title</Label>
                      <Input
                        value={v.title}
                        onChange={(e) => updateVariant(idx, 'title', e.target.value)}
                        placeholder="e.g. Lifetime License"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-[10px]">Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={v.price}
                        onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-[10px]">Stock</Label>
                      <Input
                        type="number"
                        value={v.inventory}
                        onChange={(e) => updateVariant(idx, 'inventory', e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="pt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(idx)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status & Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Status & Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Publication Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-8 rounded-lg border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="published">Published (Available in Store)</option>
                  <option value="draft">Draft (Private)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Product Type</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-8 rounded-lg border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="digital">Digital Download / Software</option>
                  <option value="physical">Physical Merchandise</option>
                  <option value="service">Consultation / Service</option>
                </select>
              </div>

              {type === 'digital' && (
                <div className="space-y-1.5 pt-2 border-t">
                  <Label className="flex items-center gap-1.5">
                    <FileCheck className="size-3.5 text-primary" />
                    <span>Digital File / Asset URL</span>
                  </Label>
                  <Input
                    value={digitalAssetUrl}
                    onChange={(e) => setDigitalAssetUrl(e.target.value)}
                    placeholder="https://cdn.../file.zip or /media/..."
                    className="text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Sent securely via signed expiring link after payment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ImageIcon className="size-4 text-primary" />
                <span>Featured Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuredImageUrl ? (
                <div className="aspect-square w-full rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={featuredImageUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square w-full rounded-lg border border-dashed bg-muted/30 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                  <Package className="size-8" />
                  <span>No image selected</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="/media/product.webp"
                  className="text-xs font-mono"
                />
                <Link
                  href="/panic/media"
                  target="_blank"
                  className="text-xs text-primary hover:underline inline-block mt-1"
                >
                  Upload in Media Library →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
