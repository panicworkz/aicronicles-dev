'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PanicNewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [contentHtml, setContentHtml] = useState('<p>Start typing your guide here...</p>');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('/media/default.webp');
  const [status, setStatus] = useState('published');
  const [readingTime, setReadingTime] = useState('5 min read');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleSave = async () => {
    if (!title) {
      alert('Please enter a title');
      return;
    }
    setSaving(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          excerpt,
          contentHtml,
          featuredImageUrl,
          status,
          readingTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create post');

      router.push(`/panic/posts/${data.post.id}`);
    } catch (err: any) {
      alert(err.message || 'Error creating post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/panic/posts"
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-white">Create New Article</h1>
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-white text-black hover:bg-neutral-200">
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? 'Creating...' : 'Save & Publish'}
        </Button>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Article Title</Label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. 10 Best AI Productivity Tools in 2026..."
              className="w-full text-2xl sm:text-3xl font-black font-serif bg-transparent text-white border-b border-neutral-800 pb-2 focus:border-amber-500 focus:outline-none placeholder:text-neutral-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article-slug"
                className="font-mono text-xs text-amber-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="readingTime">Reading Time</Label>
              <Input
                id="readingTime"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                placeholder="5 min read"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="excerpt">Excerpt</Label>
            <textarea
              id="excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary of the article..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 text-xs text-neutral-300 placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Content Body</Label>
          <TipTapEditor
            content={contentHtml}
            onChange={(html) => setContentHtml(html)}
          />
        </div>
      </div>
    </div>
  );
}
