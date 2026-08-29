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
  FileEdit,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link
            href="/panic/posts"
            className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Back to Articles"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-semibold text-white">Create New Publication</h1>
            <p className="text-xs text-slate-400">Draft a new article, analysis, or guide</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Creating...' : 'Publish / Save Draft'}</span>
          </Button>
        </div>
      </div>

      {/* Editor & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Editor Canvas */}
        <div className="lg:col-span-8 space-y-6">
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
              className="w-full resize-none bg-transparent text-2xl sm:text-3xl font-bold tracking-tight text-white placeholder:text-slate-600 focus:outline-none border-0 p-0 leading-snug"
            />

            {/* URL Slug & Reading Time Bar */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-[#0f172a]/60 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-500 truncate">fabelo.testworkz.com/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="custom-article-slug"
                  className="bg-transparent text-indigo-400 font-mono outline-none flex-1 min-w-[120px]"
                />
              </div>
              <div className="flex items-center gap-1 text-slate-400 border-l border-slate-800 pl-3">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  className="bg-transparent text-slate-300 w-20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* TipTap Visual Editor */}
          <div className="space-y-2">
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
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Publishing Settings */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0f172a]/60 p-5 backdrop-blur shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Publishing</span>
            </div>

            <div className="space-y-2">
              <Label>Publication Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Live on web)</option>
              </select>
            </div>
          </div>

          {/* Card 2: Featured Image */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0f172a]/60 p-5 backdrop-blur shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span>Featured Image</span>
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                type="text"
                placeholder="/media/default.webp"
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Card 3: Excerpt */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0f172a]/60 p-5 backdrop-blur shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <FileEdit className="w-4 h-4 text-indigo-400" />
              <span>Excerpt & Teaser</span>
            </div>

            <div className="space-y-2">
              <Label>Short Summary</Label>
              <textarea
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A concise summary of this guide..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Card 4: SEO */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0f172a]/60 p-5 backdrop-blur shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>SEO & AI Search</span>
            </div>

            <div className="space-y-3">
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
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Meta description"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500 leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
