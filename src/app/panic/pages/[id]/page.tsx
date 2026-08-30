'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Globe,
  Trash2,
  Sparkles,
  FileText,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { toast } from 'sonner';

export default function PanicEditPageStudio({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const pageId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentJson, setContentJson] = useState<any>(null);
  const [status, setStatus] = useState('published');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/pages/${pageId}`);
        const data = await res.json();
        if (data.page) {
          const p = data.page;
          setTitle(p.title || '');
          setSlug(p.slug || '');
          setContentHtml(p.contentHtml || '');
          setContentJson(p.contentJson || null);
          setStatus(p.status || 'published');
          setMetaTitle(p.metaTitle || '');
          setMetaDescription(p.metaDescription || '');
          setUpdatedAt(p.updatedAt || null);
        } else {
          toast.error('Page not found');
          router.push('/panic/pages');
        }
      } catch (err) {
        toast.error('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [pageId, router]);

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error('Title and Slug are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          contentHtml,
          contentJson,
          status,
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || '',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Page updated successfully');
        setUpdatedAt(new Date().toISOString());
      } else {
        toast.error(data.error || 'Failed to update page');
      }
    } catch (err: any) {
      toast.error(err.message || 'Saving error');
    } finally {
      setSaving(false);
    }
  };

  const handleAiAutoFill = () => {
    if (!title.trim()) {
      toast.error('Please enter a page title first');
      return;
    }

    setGeneratingAi(true);
    setTimeout(() => {
      setMetaTitle(`${title} | Official Documentation & Policies`);
      setMetaDescription(
        `Comprehensive details, guidelines, and official information regarding ${title} on Fabelo.`
      );
      setGeneratingAi(false);
      toast.success('AI SEO metadata generated!');
    }, 400);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/pages/${pageId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Page deleted');
        router.push('/panic/pages');
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Error deleting page');
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-xs text-muted-foreground animate-pulse">Loading page studio...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/panic/pages">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Back to Pages">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground truncate max-w-md">
                {title || 'Edit Page'}
              </h1>
              <Badge variant={status === 'published' ? 'default' : 'secondary'} className="text-[10px] uppercase font-mono">
                {status}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              Live URL: /{slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${slug}`} target="_blank">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
              <ExternalLink className="size-3.5 text-muted-foreground" />
              <span>Live Preview</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Save className="size-3.5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Content Editor (Left) & Sidebar Settings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Title & TipTap Rich Editor */}
        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Page Title</Label>
            <Input
              type="text"
              placeholder="e.g. About Us, Privacy Policy, Sponsor..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-semibold h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Page Content (Rich Visual Editor)</Label>
            <TipTapEditor
              content={contentHtml}
              onChange={(html, json) => {
                setContentHtml(html);
                setContentJson(json);
              }}
            />
          </div>
        </div>

        {/* Right Column (4 cols): Publishing & SEO Settings */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Status & Slug */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="size-4 text-primary" />
                <span>Publishing Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 font-medium"
                >
                  <option value="published">Published (Public)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">URL Slug</Label>
                <div className="flex items-center">
                  <span className="h-8 px-2.5 bg-muted/60 border border-r-0 border-input rounded-l-md text-xs text-muted-foreground font-mono flex items-center">
                    /
                  </span>
                  <Input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="about-us"
                    className="rounded-l-none text-xs font-mono h-8"
                  />
                </div>
              </div>

              {updatedAt && (
                <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="size-3" />
                  <span>Last Updated: {new Date(updatedAt).toLocaleTimeString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: SEO Meta Settings */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>SEO Metadata</span>
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleAiAutoFill}
                disabled={generatingAi}
                className="h-6 gap-1 text-[11px] text-primary hover:text-primary font-medium"
              >
                <Sparkles className="size-3" />
                <span>{generatingAi ? 'Generating...' : 'AI Auto-Fill ✨'}</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Meta Title (Google Tab Title)</Label>
                <Input
                  type="text"
                  placeholder={title ? `${title} - Fabelo` : 'Meta Title'}
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Meta Description (SERP Snippet)</Label>
                <Textarea
                  rows={3}
                  placeholder="Short description for Google Search snippets..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="text-xs resize-none leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-destructive">Delete Page</p>
                <p className="text-[10px] text-muted-foreground">Permanently remove this page from site</p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="h-8 gap-1.5 text-xs"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
