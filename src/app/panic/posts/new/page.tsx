'use client';

import React, { useState, useEffect } from 'react';
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
  Bot,
  Layers,
  FolderTree,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { BlockInsertToolbar } from '@/components/studio/BlockInsertToolbar';
import { AeoScoreMeter } from '@/components/studio/AeoScoreMeter';
import { SerpSocialPreview } from '@/components/studio/SerpSocialPreview';
import { toast } from 'sonner';

export default function PanicNewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'ai_aeo' | 'metadata'>('editor');
  const [categories, setCategories] = useState<any[]>([]);

  // Post State
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
  const [categoryId, setCategoryId] = useState<number | null>(null);

  // Fetch Categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleInsertHtml = (htmlToInsert: string) => {
    setContentHtml((prev) => `${prev || ''}\n\n${htmlToInsert}`);
    toast.success('AI Block added to publication');
  };

  // AI Auto-Fill for Excerpt & SEO Metadata
  const handleAiAutoFillMeta = () => {
    if (!title.trim()) {
      toast.error('Please enter an article title first');
      return;
    }

    setGeneratingAi(true);
    setTimeout(() => {
      const generatedExcerpt = `A comprehensive, step-by-step masterclass exploring ${title}. Learn proven frameworks, industry benchmarks, and actionable implementation strategies.`;
      const generatedMetaTitle = `${title} | Complete Guide (2026)`;
      const generatedMetaDesc = `Master ${title} with expert insights, actionable checklists, and architectural strategies. Updated for 2026.`;

      setExcerpt(generatedExcerpt);
      setMetaTitle(generatedMetaTitle);
      setMetaDescription(generatedMetaDesc);
      setGeneratingAi(false);
      toast.success('AI Excerpt and SEO Metadata synthesized!');
    }, 400);
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
            <div className="flex items-center gap-2">
              <Badge variant={status === 'published' ? 'default' : 'secondary'} className="capitalize text-[11px] font-normal">
                {status}
              </Badge>
              <h1 className="text-base font-semibold text-foreground">Create New Publication</h1>
            </div>
            <p className="text-xs text-muted-foreground">Draft a new article, analysis, or guide with AI Copilot</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
          <Button
            variant={activeTab === 'editor' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('editor')}
          >
            Visual Editor
          </Button>
          <Button
            variant={activeTab === 'ai_aeo' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('ai_aeo')}
            className="gap-1 text-primary"
          >
            <Sparkles className="size-3" />
            <span>AI & AEO Suite</span>
          </Button>
          <Button
            variant={activeTab === 'metadata' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('metadata')}
          >
            Publishing & SEO
          </Button>
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
        {/* Main Left Column (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          {activeTab === 'editor' && (
            <div className="space-y-4">
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

              {/* Rich Block Quick Insert Toolbar */}
              <BlockInsertToolbar
                title={title}
                contentHtml={contentHtml}
                onInsertHtml={handleInsertHtml}
              />

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
          )}

          {activeTab === 'ai_aeo' && (
            <div className="space-y-6">
              <AeoScoreMeter
                title={title}
                contentHtml={contentHtml}
                excerpt={excerpt}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
              />

              <SerpSocialPreview
                title={title}
                slug={slug}
                excerpt={excerpt}
                featuredImageUrl={featuredImageUrl}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
              />
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">SEO & Google Search Snippet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Meta Title</Label>
                    <Input
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder={title || 'Meta Title for Search Engines'}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Meta Description</Label>
                    <Textarea
                      rows={3}
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Meta description for search engines and AI citations..."
                      className="text-xs resize-none leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>

              <SerpSocialPreview
                title={title}
                slug={slug}
                excerpt={excerpt}
                featuredImageUrl={featuredImageUrl}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
              />
            </div>
          )}
        </div>

        {/* Right Metadata Sidebar (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Fast Assistant Card */}
          <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>AI Metadata Copilot</span>
              </span>
              <p className="text-[11px] text-muted-foreground">
                Synthesize summary, meta title & descriptions
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiAutoFillMeta}
              disabled={generatingAi}
              className="gap-1.5 text-xs text-primary font-semibold shrink-0"
            >
              <Bot className="size-3.5" />
              <span>{generatingAi ? 'Generating...' : 'Auto-Fill'}</span>
            </Button>
          </div>

          {/* Card 1: Publishing Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Publishing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Publication Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Live on web)</option>
                </select>
              </div>

              {categories.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Editorial Category</Label>
                  <select
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Featured Cover Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>Featured Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuredImageUrl ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={featuredImageUrl}
                    alt={title || 'Cover'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label className="text-xs">Image URL</Label>
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
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="size-3" />
                  <span>Open Media Library to select or upload image →</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Excerpt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-primary" />
                <span>Excerpt & Teaser</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label className="text-xs">Short Summary</Label>
              <Textarea
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A concise summary of this guide for card teasers and search results..."
                className="text-xs leading-relaxed resize-none"
              />
            </CardContent>
          </Card>

          {/* Card 4: SEO Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Globe className="w-4 h-4 text-primary" />
                <span>SEO & AI Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Meta Title</Label>
                <Input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Meta title"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Meta Description</Label>
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
