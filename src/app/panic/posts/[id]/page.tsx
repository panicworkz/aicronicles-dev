'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  ExternalLink,
  SplitSquareVertical,
  ImageIcon,
  Sparkles,
  Globe,
  FileText,
  Clock,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { toast } from 'sonner';

export default function PanicPostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const postId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [splitPreview, setSplitPreview] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentJson, setContentJson] = useState<any>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [status, setStatus] = useState('published');
  const [readingTime, setReadingTime] = useState('5 min read');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();
        if (data.post) {
          const p = data.post;
          setTitle(p.title || '');
          setSlug(p.slug || '');
          setExcerpt(p.excerpt || '');
          setContentHtml(p.contentHtml || '');
          setContentJson(p.contentJson || null);
          setFeaturedImageUrl(p.featuredImageUrl || '');
          setStatus(p.status || 'draft');
          setReadingTime(p.readingTime || '5 min read');
          setMetaTitle(p.metaTitle || p.title || '');
          setMetaDescription(p.metaDescription || p.excerpt || '');
        } else {
          toast.error('Article not found');
        }
      } catch (err) {
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          contentHtml,
          contentJson,
          featuredImageUrl,
          status,
          readingTime,
          metaTitle,
          metaDescription,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Guide updated successfully');
      } else {
        toast.error(data.error || 'Failed to save changes');
      }
    } catch (err: any) {
      toast.error(err.message || 'Save error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this guide? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Guide deleted');
        router.push('/panic/posts');
      }
    } catch (err) {
      toast.error('Failed to delete guide');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-muted-foreground font-medium animate-pulse">Loading visual editor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/panic/posts">
            <Button variant="outline" size="icon" className="size-8" title="Back to Articles">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={status === 'published' ? 'default' : 'secondary'} className="capitalize text-xs font-normal">
              {status}
            </Badge>
            <span className="text-xs text-muted-foreground">ID #{postId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSplitPreview(!splitPreview)}
            className="gap-1.5 text-xs"
          >
            <SplitSquareVertical className="size-3.5" />
            <span>{splitPreview ? 'Close Preview' : 'Split Preview'}</span>
          </Button>

          <Link href={`/${slug}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ExternalLink className="size-3.5 text-muted-foreground" />
              <span>View Live</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 text-xs font-medium"
          >
            <Save className="size-3.5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Editor & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editor Canvas */}
        <div className={splitPreview ? 'lg:col-span-6 space-y-4' : 'lg:col-span-8 space-y-4'}>
          {/* Frameless Large Title */}
          <div className="space-y-3">
            <textarea
              rows={1}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Article Title..."
              className="w-full resize-none bg-transparent text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 focus:outline-none border-0 p-0 leading-snug"
            />

            {/* URL Slug & Reading Time Bar */}
            <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg border bg-card text-xs">
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                <Globe className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">fabelo.testworkz.com/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="bg-transparent text-primary font-mono outline-none flex-1 min-w-[120px]"
                />
              </div>
              <div className="flex items-center gap-1 text-muted-foreground border-l pl-3">
                <Clock className="size-3.5" />
                <input
                  type="text"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  className="bg-transparent text-foreground w-20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* TipTap Visual Editor */}
          <div>
            <TipTapEditor
              content={contentHtml}
              onChange={(html, json) => {
                setContentHtml(html);
                setContentJson(json);
              }}
            />
          </div>
        </div>

        {/* Split Preview Panel (when active) */}
        {splitPreview && (
          <div className="lg:col-span-6 rounded-xl border bg-card p-6 overflow-y-auto max-h-[85vh] space-y-6">
            <div className="border-b pb-4">
              <Badge variant="outline" className="text-xs text-primary mb-2">Live Reader Preview</Badge>
              <h1 className="text-2xl font-bold text-foreground font-serif">{title}</h1>
              <p className="text-muted-foreground text-xs mt-2">{excerpt}</p>
            </div>
            <div
              className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        )}

        {/* Metadata Sidebar Cards */}
        <div className={splitPreview ? 'hidden' : 'lg:col-span-4 space-y-4'}>
          {/* Card 1: Publishing Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" />
                <span>Publishing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Publication Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-9 rounded-lg border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="published">Published (Live on web)</option>
                  <option value="draft">Draft (Private)</option>
                </select>
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-destructive hover:opacity-80 font-medium inline-flex items-center gap-1.5 transition"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete Guide</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Featured Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ImageIcon className="size-4 text-primary" />
                <span>Featured Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredImageUrl ? (
                <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={featuredImageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] w-full rounded-lg border border-dashed bg-muted/30 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                  <ImageIcon className="size-6" />
                  <span>No cover image selected</span>
                </div>
              )}

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  type="text"
                  placeholder="/media/guide-cover.webp"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  className="text-xs font-mono"
                />
                <Link
                  href="/panic/media"
                  target="_blank"
                  className="text-xs text-primary hover:underline inline-block mt-1"
                >
                  Open Media Library to upload new image →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Excerpt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4 text-primary" />
                <span>Excerpt & Teaser</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label>Short Summary</Label>
              <Textarea
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A concise summary of this guide for card teasers and search results..."
                className="text-xs leading-relaxed resize-none"
              />
            </CardContent>
          </Card>

          {/* Card 4: SEO & AEO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Globe className="size-4 text-primary" />
                <span>SEO & AI Search (AEO)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <Label>Meta Title</Label>
                  <span className="text-[10px] text-muted-foreground">{metaTitle.length}/60</span>
                </div>
                <Input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <Label>Meta Description</Label>
                  <span className="text-[10px] text-muted-foreground">{metaDescription.length}/160</span>
                </div>
                <Textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Meta description for Google & LLM citations..."
                  className="text-xs leading-relaxed resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
