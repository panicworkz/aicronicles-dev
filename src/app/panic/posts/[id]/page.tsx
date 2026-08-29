'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  Eye,
  ArrowLeft,
  Columns,
  Sparkles,
  Image as ImageIcon,
  Clock,
  Globe,
  Tag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PanicPostEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showSplitPreview, setShowSplitPreview] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('/media/default.webp');
  const [status, setStatus] = useState('published');
  const [readingTime, setReadingTime] = useState('5 min read');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${id}`);
        const data = await res.json();
        if (data.post) {
          const p = data.post;
          setPost(p);
          setTitle(p.title || '');
          setSlug(p.slug || '');
          setExcerpt(p.excerpt || '');
          setContentHtml(p.contentHtml || '');
          setFeaturedImageUrl(p.featuredImageUrl || '/media/default.webp');
          setStatus(p.status || 'published');
          setReadingTime(p.readingTime || '5 min read');
          setMetaTitle(p.metaTitle || '');
          setMetaDescription(p.metaDescription || '');
        }
      } catch (err) {
        console.error('Fetch post error:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchPost();
  }, [id]);

  const handleSave = async (targetStatus?: string) => {
    setSaving(true);
    setMessage('');

    const newStatus = targetStatus || status;

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          contentHtml,
          featuredImageUrl,
          status: newStatus,
          readingTime,
          metaTitle,
          metaDescription,
        }),
      });

      if (!res.ok) throw new Error('Failed to update post');
      const data = await res.json();
      setPost(data.post);
      setStatus(newStatus);
      setMessage('Post saved successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error saving post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-neutral-500 font-mono">Loading editor...</div>;
  }

  if (!post) {
    return <div className="p-12 text-center text-red-500 font-mono">Post not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/panic/posts"
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Back to Posts"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-500">ID #{id} •</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase tracking-wider ${
                  status === 'published'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {message && (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {message}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowSplitPreview(!showSplitPreview)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              showSplitPreview
                ? 'bg-neutral-800 text-amber-400 border-amber-500/50'
                : 'border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{showSplitPreview ? 'Hide Preview' : 'Split Preview'}</span>
          </button>

          <Link
            href={`/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Live</span>
          </Link>

          <Button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="bg-white text-black hover:bg-neutral-200"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? 'Saving...' : 'Publish / Update'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Editor on Left, Meta on Right (or Split Preview) */}
      <div className={`grid grid-cols-1 ${showSplitPreview ? 'lg:grid-cols-12' : 'lg:grid-cols-3'} gap-6`}>
        {/* Editor Column */}
        <div className={`${showSplitPreview ? 'lg:col-span-6' : 'lg:col-span-2'} space-y-6`}>
          <div className="space-y-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 backdrop-blur shadow-sm">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Guide Title</Label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title..."
                className="w-full text-2xl sm:text-3xl font-black font-serif bg-transparent text-white border-b border-neutral-800 pb-2 focus:border-amber-500 focus:outline-none placeholder:text-neutral-600"
              />
            </div>

            {/* Slug & Excerpt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="article-url-slug"
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
              <Label htmlFor="excerpt">Short Excerpt / Teaser</Label>
              <textarea
                id="excerpt"
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary shown on homepage and social cards..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 text-xs text-neutral-300 placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* TipTap Visual Block Editor */}
          <div className="space-y-2">
            <Label>Visual Article Body (TipTap Editor)</Label>
            <TipTapEditor
              content={contentHtml}
              onChange={(html) => setContentHtml(html)}
              placeholder="Click here and start typing your article..."
            />
          </div>
        </div>

        {/* Live Preview Column if Enabled */}
        {showSplitPreview ? (
          <div className="lg:col-span-6 border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 flex flex-col h-[850px] sticky top-20 shadow-2xl">
            <div className="h-10 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between text-xs text-neutral-400 font-mono">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Render Preview</span>
              </span>
              <span>fabelo.testworkz.com/{slug}</span>
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-neutral-950 text-neutral-100">
              <h1 className="text-3xl font-black font-serif text-white mb-4 leading-tight">{title}</h1>
              <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono border-y border-neutral-800 py-3 mb-6">
                <span>Fabelo Editorial</span>
                <span>•</span>
                <span>{readingTime}</span>
              </div>
              {featuredImageUrl && (
                <div className="mb-6 rounded-lg overflow-hidden border border-neutral-800 aspect-video bg-neutral-900">
                  <img src={featuredImageUrl} alt={title} className="w-full h-full object-cover" />
                </div>
              )}
              <div
                className="prose prose-invert prose-lg max-w-none font-sans leading-relaxed
                  prose-headings:font-serif prose-headings:text-white
                  prose-a:text-amber-500 hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </div>
          </div>
        ) : (
          /* Sidebar Settings Column */
          <div className="space-y-6">
            {/* Publishing Settings */}
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-4 backdrop-blur shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>Publishing Status</span>
              </h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-950/60 cursor-pointer hover:border-neutral-700">
                  <span className="text-xs font-medium text-neutral-200">Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-neutral-900 text-xs text-white border border-neutral-700 rounded px-2.5 py-1 focus:outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Featured Image */}
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-4 backdrop-blur shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Featured Image</span>
              </h3>

              <div className="space-y-3">
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                  <img
                    src={featuredImageUrl || '/media/default.webp'}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Input
                  type="text"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="/media/filename.webp"
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-neutral-500 font-mono">
                  Enter media URL or pick from Media Library.
                </p>
              </div>
            </div>

            {/* SEO & AEO Metadata */}
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-4 backdrop-blur shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>SEO & AEO (AI Search)</span>
              </h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Search engine title..."
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <textarea
                    id="metaDescription"
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Search engine description snippet..."
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 text-xs text-neutral-300 placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
