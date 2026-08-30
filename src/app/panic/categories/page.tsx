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
  BookOpen,
  ExternalLink,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  // Article List Slide-Over Drawer
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<{ type: 'category' | 'tag'; item: any } | null>(null);
  const [drawerPosts, setDrawerPosts] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

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

  const openCategoryPosts = async (cat: any) => {
    setSelectedTaxonomy({ type: 'category', item: cat });
    setDrawerLoading(true);
    try {
      const res = await fetch(`/api/posts?categoryId=${cat.id}`);
      const data = await res.json();
      setDrawerPosts(data.posts || []);
    } catch (e) {
      toast.error('Failed to load articles');
    } finally {
      setDrawerLoading(false);
    }
  };

  const openTagPosts = async (t: any) => {
    setSelectedTaxonomy({ type: 'tag', item: t });
    setDrawerLoading(true);
    try {
      const res = await fetch(`/api/posts?tag=${encodeURIComponent(t.name)}`);
      const data = await res.json();
      setDrawerPosts(data.posts || []);
    } catch (e) {
      toast.error('Failed to load articles');
    } finally {
      setDrawerLoading(false);
    }
  };

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
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-serif">Editorial Taxonomies</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Manage editorial categories and topics. Click any card to inspect and manage its assigned articles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={openCreateCat} size="sm" className="gap-1.5 font-medium shadow-xs">
            <Plus className="size-4" />
            <span>New Category</span>
          </Button>
          <Button onClick={() => setTagModalOpen(true)} variant="outline" size="sm" className="gap-1.5 font-medium shadow-xs">
            <Plus className="size-4" />
            <span>New Tag</span>
          </Button>
        </div>
      </div>

      {/* 1. EDITORIAL CATEGORIES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="size-4 text-primary" />
            <h2 className="text-base font-bold font-serif">Editorial Categories</h2>
            <Badge variant="outline" className="font-mono text-[11px]">{categories.length}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              onClick={() => openCategoryPosts(cat)}
              className="relative overflow-hidden border border-border bg-card/60 hover:border-primary/50 hover:shadow-md transition duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold font-serif group-hover:text-primary transition">
                      {cat.name}
                    </CardTitle>
                    <span className="text-[10px] font-mono text-muted-foreground">/{cat.slug}</span>
                  </div>

                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEditCat(cat)}
                      className="size-6 text-muted-foreground hover:text-foreground"
                      title="Edit Category"
                    >
                      <Edit3 className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDeleteCat(cat.id, cat.name)}
                      className="size-6 text-destructive hover:bg-destructive/10"
                      title="Delete Category"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {cat.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-primary font-semibold">
                    <BookOpen className="size-3" />
                    {cat.postCount || 0} Articles
                  </span>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground flex items-center gap-0.5">
                    View list <ChevronRight className="size-3 group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 2. TOPIC TAGS SECTION */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-primary" />
            <h2 className="text-base font-bold font-serif">Editorial Topic Tags</h2>
            <Badge variant="outline" className="font-mono text-[11px]">{tags.length}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              onClick={() => openTagPosts(tag)}
              className="p-3.5 rounded-xl border border-border bg-card/60 hover:border-primary/50 hover:shadow-sm transition cursor-pointer flex items-center justify-between gap-2 group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs text-foreground group-hover:text-primary transition">
                    #{tag.name}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px] h-4 px-1.5">
                    {tag.postCount || 0}
                  </Badge>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">/tag/{tag.slug}</span>
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/tag/${tag.slug}`}
                  target="_blank"
                  className="p-1 text-muted-foreground hover:text-foreground rounded"
                  title="View Public Tag Page"
                >
                  <ExternalLink className="size-3" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag.id, tag.name)}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded"
                  title="Delete Tag"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLIDE-OVER DRAWER: LIST OF POSTS IN SELECTED CATEGORY / TAG */}
      {selectedTaxonomy && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl h-full bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {selectedTaxonomy.type === 'category' ? (
                    <FolderTree className="size-4 text-primary" />
                  ) : (
                    <Tag className="size-4 text-primary" />
                  )}
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {selectedTaxonomy.type === 'category' ? 'Category Articles' : 'Tag Articles'}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-serif text-foreground">
                  {selectedTaxonomy.item.name}
                </h3>
              </div>

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSelectedTaxonomy(null)}
                className="size-8"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {drawerLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-xs">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Loading articles...</span>
                </div>
              ) : drawerPosts.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <BookOpen className="size-10 text-muted-foreground mx-auto opacity-40" />
                  <p className="text-xs text-muted-foreground">
                    No articles currently assigned to this {selectedTaxonomy.type}.
                  </p>
                  <Link href="/panic/posts/new">
                    <Button size="xs" variant="outline" className="gap-1 mt-2">
                      <Plus className="size-3" />
                      <span>Write First Article</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-xs font-mono text-muted-foreground pb-1">
                    Showing {drawerPosts.length} assigned articles:
                  </div>
                  {drawerPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-3.5 rounded-xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40 transition flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={post.status === 'published' ? 'default' : 'secondary'}
                            className="capitalize text-[10px] h-4 px-1.5"
                          >
                            {post.status}
                          </Badge>
                          <span className="text-xs font-semibold text-foreground truncate block font-serif">
                            {post.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate font-mono">
                          /{post.slug}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Link href={`/panic/posts/${post.id}`}>
                          <Button variant="outline" size="xs" className="h-7 text-xs gap-1">
                            <Edit3 className="size-3" />
                            <span>Edit</span>
                          </Button>
                        </Link>
                        <Link href={`/${post.slug}`} target="_blank">
                          <Button variant="ghost" size="icon-xs" className="size-7" title="View Live Article">
                            <ExternalLink className="size-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">
                Total: <b>{drawerPosts.length}</b> articles
              </span>
              <Button size="sm" variant="outline" onClick={() => setSelectedTaxonomy(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold font-serif">
                {editingCat ? 'Edit Category' : 'Create New Category'}
              </h3>
              <Button variant="ghost" size="icon-xs" onClick={() => setCatModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveCat} className="space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs">Category Name *</Label>
                <Input
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!editingCat) {
                      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                    }
                  }}
                  placeholder="e.g. AI & Machine Learning"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">URL Slug</Label>
                <Input
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="ai-machine-learning"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Short description for editorial topic..."
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setCatModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingCat} className="gap-1.5">
                  <Save className="size-3.5" />
                  <span>{savingCat ? 'Saving...' : 'Save Category'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TAG MODAL */}
      {tagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold font-serif">Create New Tag</h3>
              <Button variant="ghost" size="icon-xs" onClick={() => setTagModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveTag} className="space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs">Tag Name *</Label>
                <Input
                  value={tagName}
                  onChange={(e) => {
                    setTagName(e.target.value);
                    setTagSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }}
                  placeholder="e.g. React 19"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">URL Slug</Label>
                <Input
                  value={tagSlug}
                  onChange={(e) => setTagSlug(e.target.value)}
                  placeholder="react-19"
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setTagModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingTag} className="gap-1.5">
                  <Save className="size-3.5" />
                  <span>{savingTag ? 'Saving...' : 'Save Tag'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
