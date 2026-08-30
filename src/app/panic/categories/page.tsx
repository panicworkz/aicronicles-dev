'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Tag,
  Plus,
  ArrowRight,
  Edit3,
  Trash2,
  Save,
  X,
  FileText,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function PanicCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // Tag Modal
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [savingTag, setSavingTag] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, tagRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tags'),
      ]);
      const catData = await catRes.json();
      const tagData = await tagRes.json();

      if (catData.categories) setCategories(catData.categories);
      if (tagData.tags) setTags(tagData.tags);
    } catch (err) {
      toast.error('Failed to load taxonomies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateCat = () => {
    setEditingCat(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatModalOpen(true);
  };

  const openEditCat = (c: any) => {
    setEditingCat(c);
    setCatName(c.name);
    setCatSlug(c.slug);
    setCatDesc(c.description || '');
    setCatModalOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return toast.error('Category name required');

    setSavingCat(true);
    try {
      const url = '/api/categories';
      const method = editingCat ? 'PUT' : 'POST';
      const body = editingCat
        ? { id: editingCat.id, name: catName, slug: catSlug, description: catDesc }
        : { name: catName, slug: catSlug, description: catDesc };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingCat ? 'Category updated' : 'Category created');
        setCatModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (err) {
      toast.error('Error saving category');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCat = async (id: number, name: string) => {
    if (!confirm(`Delete editorial category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
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

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return toast.error('Tag name required');

    setSavingTag(true);
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName, slug: tagSlug }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Tag created');
        setTagModalOpen(false);
        setTagName('');
        setTagSlug('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to save tag');
      }
    } catch (err) {
      toast.error('Error saving tag');
    } finally {
      setSavingTag(false);
    }
  };

  const handleDeleteTag = async (id: number, name: string) => {
    if (!confirm(`Delete tag "${name}"?`)) return;

    try {
      const res = await fetch(`/api/tags?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Tag deleted');
        setTags(tags.filter((t) => t.id !== id));
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Error deleting tag');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Switcher Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">Content / Taxonomies</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Editorial Categories & Article Topics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize knowledge base articles, SEO guides, and technical publications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/panic/product-categories">
            <Button variant="outline" size="sm" className="h-8.5 gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10">
              <ShoppingBag className="size-3.5" />
              <span>Go to Product Categories</span>
              <ArrowRight className="size-3" />
            </Button>
          </Link>
          <Button onClick={openCreateCat} size="sm" className="h-8.5 gap-1.5 text-xs font-medium">
            <Plus className="size-3.5" />
            <span>New Category</span>
          </Button>
        </div>
      </div>

      {/* Info Callout Banner */}
      <div className="p-3.5 rounded-md border border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="size-4 text-primary shrink-0" />
          <span>
            These taxonomies are strictly for <strong>Editorial Articles & Guides</strong>. Store and E-Commerce collections are managed independently under Commerce.
          </span>
        </div>
        <Link href="/panic/product-categories" className="text-primary font-semibold hover:underline shrink-0 flex items-center gap-1">
          <span>Manage Store Products</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* 1. Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Publication Categories</h2>
            <p className="text-[11px] text-muted-foreground">Top-level vertical groupings for SEO architecture</p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{categories.length} categories</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id} className="group hover:border-primary/60 transition shadow-xs flex flex-col justify-between">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <FolderTree className="size-3.5" />
                      <span>{cat.name}</span>
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                      {cat.postCount || 0} Guides
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {cat.description || 'Editorial knowledge category.'}
                  </p>
                  <div className="text-[11px] text-muted-foreground font-mono pt-1">/{cat.slug}</div>
                </CardContent>

                <div className="p-2.5 bg-muted/20 border-t flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEditCat(cat)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Edit Category"
                  >
                    <Edit3 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDeleteCat(cat.id, cat.name)}
                    className="text-destructive hover:text-destructive"
                    title="Delete Category"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 2. Tags Section */}
      <div className="space-y-4 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Editorial Tags & Topics</h2>
            <p className="text-[11px] text-muted-foreground">Granular topic tags for search indexing and cross-linking</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTagModalOpen(true)}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Plus className="size-3.5" />
            <span>New Tag</span>
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading tags...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tags.map((tag) => (
              <Card key={tag.id} className="p-3 flex items-center justify-between hover:border-primary/50 transition shadow-xs group">
                <div className="space-y-0.5 truncate">
                  <div className="text-xs font-medium text-foreground truncate">{tag.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">#{tag.slug}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDeleteTag(tag.id, tag.name)}
                  className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive shrink-0 transition"
                  title="Delete Tag"
                >
                  <Trash2 className="size-3" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FolderTree className="size-4 text-primary" />
                <span>{editingCat ? 'Edit Editorial Category' : 'Create Editorial Category'}</span>
              </CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setCatModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleSaveCat}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category Name</Label>
                  <Input
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      if (!editingCat) {
                        setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                      }
                    }}
                    placeholder="e.g. AI Strategy & LLM Architectures"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">URL Slug</Label>
                  <Input
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="e.g. ai-strategy"
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Description</Label>
                  <Textarea
                    rows={3}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Brief description for SEO taxonomy pages..."
                    className="text-xs resize-none"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t bg-muted/10 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCatModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingCat} className="gap-1.5">
                  <Save className="size-3.5" />
                  <span>{savingCat ? 'Saving...' : 'Save Category'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Create Tag Modal */}
      {tagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                <span>Create New Tag</span>
              </CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setTagModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleSaveTag}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tag Name</Label>
                  <Input
                    value={tagName}
                    onChange={(e) => {
                      setTagName(e.target.value);
                      setTagSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                    }}
                    placeholder="e.g. Perplexity AI"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tag Slug</Label>
                  <Input
                    value={tagSlug}
                    onChange={(e) => setTagSlug(e.target.value)}
                    placeholder="e.g. perplexity-ai"
                    className="text-xs font-mono"
                    required
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t bg-muted/10 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setTagModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingTag} className="gap-1.5">
                  <Save className="size-3.5" />
                  <span>{savingTag ? 'Saving...' : 'Create Tag'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
