'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Plus,
  Package,
  ExternalLink,
  Edit3,
  Trash2,
  Save,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatCard } from '@/components/dashboard/stat-card';
import { toast } from 'sonner';

export default function PanicProductCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/product-categories');
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      toast.error('Failed to load product categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.imageUrl || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');

    setSaving(true);
    try {
      const url = '/api/product-categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory
        ? { id: editingCategory.id, name, slug, description, imageUrl }
        : { name, slug, description, imageUrl };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingCategory ? 'Category updated' : 'Category created');
        setModalOpen(false);
        fetchCategories();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (err) {
      toast.error('Error saving product category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, catName: string) => {
    if (!confirm(`Delete product category "${catName}"?`)) return;

    try {
      const res = await fetch(`/api/product-categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Category deleted');
        setCategories(categories.filter((c) => c.id !== id));
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Error deleting category');
    }
  };

  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">Commerce / Catalog</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Product Categories & Collections</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize store products, physical goods, digital assets, and consulting services into curated storefront collections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/store" target="_blank">
            <Button variant="outline" size="sm" className="h-8.5 gap-1.5 text-xs font-medium">
              <ExternalLink className="size-3.5" />
              <span>View Storefront</span>
            </Button>
          </Link>
          <Button onClick={openCreateModal} size="sm" className="h-8.5 gap-1.5 text-xs font-medium">
            <Plus className="size-3.5" />
            <span>New Product Category</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Product Collections"
          value={categories.length}
          change="Catalog taxonomies"
          icon={FolderTree}
          trend="up"
        />
        <StatCard
          title="Categorized Products"
          value={totalProducts}
          change="Across all store items"
          icon={Package}
          trend="up"
        />
        <StatCard
          title="Commerce Architecture"
          value="Payload Standard"
          change="Multi-type support"
          icon={Layers}
          trend="up"
        />
      </div>

      {/* Categories Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Store Categories & Catalog Hierarchy</h2>
          <span className="text-xs text-muted-foreground font-mono">{categories.length} collections</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">Loading product categories...</div>
        ) : categories.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <FolderTree className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold">No product categories created yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id} className="group hover:border-primary/60 transition shadow-xs flex flex-col justify-between">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <FolderTree className="size-3.5" />
                        <span>{cat.name}</span>
                      </span>
                      <div className="text-[11px] text-muted-foreground font-mono">/store?category={cat.slug}</div>
                    </div>

                    <Badge variant="secondary" className="text-xs font-mono shrink-0">
                      {cat.productCount || 0} Products
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {cat.description || 'Curated store collection for catalog products.'}
                  </p>
                </CardContent>

                <div className="p-3 bg-muted/20 border-t flex items-center justify-between gap-2">
                  <Link
                    href={`/store`}
                    target="_blank"
                    className="text-[11px] font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition"
                  >
                    <ExternalLink className="size-3" />
                    <span>View Store</span>
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEditModal(cat)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Edit Category"
                    >
                      <Edit3 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="text-destructive hover:text-destructive"
                      title="Delete Category"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FolderTree className="size-4 text-primary" />
                <span>{editingCategory ? 'Edit Product Category' : 'Create Product Category'}</span>
              </CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleSave}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category / Collection Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingCategory) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                      }
                    }}
                    placeholder="e.g. Minimalist Workspace Gear"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">URL Slug</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. workspace-gear"
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Collection Description</Label>
                  <Textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed explanation of products included in this category..."
                    className="text-xs resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Cover / Banner Image URL (Optional)</Label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/media/workspace-banner.webp"
                    className="text-xs font-mono"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t bg-muted/10 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
                  <Save className="size-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Collection'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
