'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  ImageIcon,
  Sparkles,
  Globe,
  FileText,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { toast } from 'sonner';

export default function PanicNewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentJson, setContentJson] = useState<any>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('/media/default.webp');
  const [status, setStatus] = useState('draft');
  const [readingTime, setReadingTime] = useState('5 min read');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter an article title');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
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
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || excerpt,
        }),
      });

      const data = await res.json();
      if (data.success && data.post) {
        toast.success('Article created successfully');
        router.push(`/panic/posts/${data.post.id}`);
      } else {
        toast.error(data.error || 'Failed to create article');
      }
    } catch (err: any) {
      toast.error(err.message || 'Creation error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/panic/posts">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Back to Articles">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-semibold text-foreground">Create New Publication</h1>
            <p className="text-xs text-muted-foreground">Draft a new article, analysis, or guide</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 font-medium"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Creating...' : 'Publish / Save Draft'}</span>
          </Button>
        </div>
      </div>

      {/* Editor & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editor Canvas */}
        <div className="lg:col-span-8 space-y-4">
          {/* Frameless Large Title */}
          <div className="space-y-3">
            <textarea
              rows={1}
              value={title}
              onChange={(e) => {
                handleTitleChange(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Article Title..."
              className="w-full resize-none bg-transparent text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 focus:outline-none border-0 p-0 leading-snug"
            />

            {/* URL Slug & Reading Time Bar */}
            <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg border border-border bg-card text-xs">
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">fabelo.testworkz.com/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="custom-article-slug"
                  className="bg-transparent text-primary font-mono outline-none flex-1 min-w-[120px]"
                />
              </div>
              <div className="flex items-center gap-1 text-muted-foreground border-l border-border pl-3">
                <Clock className="w-3.5 h-3.5" />
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

        {/* Metadata Sidebar Cards */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Publishing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Publishing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Publication Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Live on web)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>Featured Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  type="text"
                  placeholder="/media/default.webp"
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-primary" />
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

          {/* Card 4: SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Globe className="w-4 h-4 text-primary" />
                <span>SEO & AI Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Meta Title</Label>
                <Input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Meta title"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label>Meta Description</Label>
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
