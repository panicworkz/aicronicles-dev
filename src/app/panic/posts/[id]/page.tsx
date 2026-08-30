'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  ImageIcon,
  Sparkles,
  Globe,
  FileText,
  Clock,
  Trash2,
  RefreshCw,
  History,
  Check,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { AeoScoreMeter } from '@/components/studio/AeoScoreMeter';
import { SerpSocialPreview } from '@/components/studio/SerpSocialPreview';
import { BlockInsertToolbar } from '@/components/studio/BlockInsertToolbar';
import { RevisionHistoryDrawer } from '@/components/studio/RevisionHistoryDrawer';
import { MediaPickerModal } from '@/components/studio/MediaPickerModal';
import { ImageStudioDrawer, type ImageStudioTarget } from '@/components/studio/ImageStudioDrawer';
import { ImageUploadDropzone } from '@/components/ui/image-upload-dropzone';
import { toast } from 'sonner';

export default function PanicSplitLiveStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const postId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'editor' | 'ai_aeo' | 'metadata'>('editor');
  const [iframeKey, setIframeKey] = useState(0);
  const [showRevisions, setShowRevisions] = useState(false);
  const [splitPickerOpen, setSplitPickerOpen] = useState(false);
  const [targetReplaceImg, setTargetReplaceImg] = useState<{ src: string; alt?: string; isCover?: boolean } | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioTarget, setStudioTarget] = useState<ImageStudioTarget | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentJson, setContentJson] = useState<any>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [status, setStatus] = useState('published');
  const [readingTime, setReadingTime] = useState('5 min read');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contentHtmlRef = useRef(contentHtml);
  contentHtmlRef.current = contentHtml;
  const titleRef = useRef(title);
  titleRef.current = title;
  const featuredImageUrlRef = useRef(featuredImageUrl);
  featuredImageUrlRef.current = featuredImageUrl;

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
          setFeaturedImageAlt(p.metaTitle || p.title || '');
          setStatus(p.status || 'published');
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

    // Listen for real-time edits or image manage requests made on the right-side live canvas
    const handleLiveMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PANIC_LIVE_TO_STUDIO_SYNC') {
        const { title: liveTitle, contentHtml: liveHtml } = event.data.payload || {};
        if (liveTitle !== undefined) setTitle(liveTitle);
        if (liveHtml !== undefined) setContentHtml(liveHtml);
      }

      if (event.data?.type === 'PANIC_OPEN_IMAGE_STUDIO') {
        const { src, alt, title: imgTitle, caption: imgCaption, isCover } = event.data.payload || {};
        setStudioTarget({
          src,
          alt,
          title: imgTitle,
          caption: imgCaption,
          isCover,
          onSave: (newData) => {
            if (isCover) {
              setFeaturedImageUrl(newData.src);
              if (newData.alt) setFeaturedImageAlt(newData.alt);
              broadcastLiveSync(titleRef.current, contentHtmlRef.current, newData.src);
            } else {
              const currentHtml = contentHtmlRef.current || '';
              const parser = new DOMParser();
              const doc = parser.parseFromString(currentHtml, 'text/html');
              const imgs = doc.querySelectorAll('img');
              let matched = false;

              imgs.forEach((im) => {
                const imSrc = im.getAttribute('src') || '';
                if (imSrc === src || src.endsWith(imSrc) || imSrc.endsWith(src) || im.src === src) {
                  matched = true;
                  im.setAttribute('src', newData.src);
                  im.setAttribute('alt', newData.alt || '');
                  if (newData.title) im.setAttribute('title', newData.title);
                  else im.removeAttribute('title');
                }
              });

              let updatedHtml = doc.body.innerHTML;
              if (!matched && src !== newData.src) {
                updatedHtml = currentHtml.replaceAll(src, newData.src);
              }

              setContentHtml(updatedHtml);
              broadcastLiveSync(titleRef.current, updatedHtml, featuredImageUrlRef.current);
            }
          },
          onDelete: () => {
            if (isCover) {
              setFeaturedImageUrl('');
              broadcastLiveSync(titleRef.current, contentHtmlRef.current, '');
            } else {
              const currentHtml = contentHtmlRef.current || '';
              const parser = new DOMParser();
              const doc = parser.parseFromString(currentHtml, 'text/html');
              const imgs = doc.querySelectorAll('img');
              imgs.forEach((im) => {
                const imSrc = im.getAttribute('src') || '';
                if (imSrc === src || src.endsWith(imSrc) || imSrc.endsWith(src) || im.src === src) {
                  const parent = im.parentElement;
                  if (parent && parent.tagName === 'FIGURE') parent.remove();
                  else im.remove();
                }
              });
              const updatedHtml = doc.body.innerHTML;
              setContentHtml(updatedHtml);
              broadcastLiveSync(titleRef.current, updatedHtml, featuredImageUrlRef.current);
            }
          },
        });
        setStudioOpen(true);
      }

      if (event.data?.type === 'PANIC_REPLACE_IMAGE_REQUEST') {
        const { src, alt, isCover } = event.data.payload || {};
        setTargetReplaceImg({ src, alt, isCover });
        setSplitPickerOpen(true);
      }

      if (event.data?.type === 'PANIC_UPDATE_COVER_ALT') {
        const { alt } = event.data.payload || {};
        if (alt) setFeaturedImageAlt(alt);
        toast.success('Cover alt text updated');
      }

      if (event.data?.type === 'PANIC_DELETE_COVER_REQUEST') {
        setFeaturedImageUrl('');
        broadcastLiveSync(title, contentHtml, '');
        toast.info('Cover image removed');
      }
    };

    window.addEventListener('message', handleLiveMessage);
    return () => window.removeEventListener('message', handleLiveMessage);
  }, [postId]);

  // Live Sync from left editor to right iframe via postMessage
  const broadcastLiveSync = (newTitle: string, newHtml: string, newCover: string) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'PANIC_STUDIO_LIVE_UPDATE',
          payload: {
            title: newTitle,
            contentHtml: newHtml,
            featuredImageUrl: newCover,
          },
        },
        '*'
      );
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    broadcastLiveSync(val, contentHtml, featuredImageUrl);
  };

  const handleContentChange = (html: string, json: any) => {
    setContentHtml(html);
    setContentJson(json);
    broadcastLiveSync(title, html, featuredImageUrl);
  };

  const handleInsertHtml = (htmlToAppend: string) => {
    const updated = (contentHtml || '') + htmlToAppend;
    handleContentChange(updated, null);
  };

  const handleSave = async (isSilent = false) => {
    if (!isSilent) setSaving(true);
    else setAutosaving(true);

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
        if (!isSilent) {
          toast.success('Guide updated successfully');
          // Create revision log
          fetch(`/api/posts/${postId}/revisions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, contentHtml, contentJson, excerpt }),
          });
        }
      } else {
        if (!isSilent) toast.error(data.error || 'Failed to save changes');
      }
    } catch (err: any) {
      if (!isSilent) toast.error(err.message || 'Save error');
    } finally {
      setSaving(false);
      setAutosaving(false);
    }
  };

  // Restore revision snapshot
  const handleRestoreRevision = (rev: any) => {
    if (rev.title) setTitle(rev.title);
    if (rev.contentHtml) setContentHtml(rev.contentHtml);
    if (rev.contentJson) setContentJson(rev.contentJson);
    if (rev.excerpt) setExcerpt(rev.excerpt);
    broadcastLiveSync(rev.title || title, rev.contentHtml || contentHtml, featuredImageUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-xs text-muted-foreground font-medium animate-pulse">
          Initializing Next-Gen Split Live Studio...
        </div>
      </div>
    );
  }

  const getFrameWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'w-[375px]';
      case 'tablet':
        return 'w-[768px]';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-6 overflow-hidden">
      {/* Studio Header Toolbar */}
      <div className="flex h-12 items-center justify-between gap-3 border-b bg-background px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/panic/posts">
            <Button variant="outline" size="icon-sm" title="Back to Articles">
              <ArrowLeft className="size-3.5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={status === 'published' ? 'default' : 'secondary'} className="capitalize text-[11px] font-normal">
              {status}
            </Badge>
            <span className="text-xs text-muted-foreground truncate max-w-[200px] font-medium hidden sm:inline">
              {title || 'Untitled'}
            </span>
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
            SEO & Metadata
          </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => setShowRevisions(true)}
            className="gap-1.5 text-xs"
          >
            <History className="size-3.5" />
            <span className="hidden sm:inline">Revisions</span>
          </Button>

          <Link href={`/${slug}`} target="_blank">
            <Button variant="outline" size="default" className="gap-1.5 hidden md:inline-flex">
              <ExternalLink className="size-3.5" />
              <span>Live URL</span>
            </Button>
          </Link>

          <Button
            size="default"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="gap-1.5 font-medium"
          >
            <Save className="size-3.5" />
            <span>{saving ? 'Saving...' : autosaving ? 'Autosaving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Main Split Body: Left 50% Editor / Right 50% Live Web Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL (50%) */}
        <div className="w-full lg:w-1/2 border-r bg-background overflow-y-auto p-6 space-y-6">
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
                <div className="flex flex-wrap items-center gap-3 p-2 rounded-lg border bg-muted/20 text-xs">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                    <Globe className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">fabelo.testworkz.com/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="bg-transparent text-primary font-mono outline-none flex-1 min-w-[100px]"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground border-l pl-3">
                    <Clock className="size-3.5" />
                    <input
                      type="text"
                      value={readingTime}
                      onChange={(e) => setReadingTime(e.target.value)}
                      className="bg-transparent text-foreground w-16 outline-none"
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

              {/* TipTap Rich Editor */}
              <div>
                <TipTapEditor
                  content={contentHtml}
                  onChange={handleContentChange}
                  articleTitle={title}
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
                  <CardTitle className="text-sm font-semibold">Publishing Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Publication Status</Label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-8 rounded-lg border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="published">Published (Live on web)</option>
                      <option value="draft">Draft (Private)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Featured Cover Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ImageUploadDropzone
                    value={featuredImageUrl}
                    onChange={(url) => {
                      setFeaturedImageUrl(url);
                      broadcastLiveSync(title, contentHtml, url);
                    }}
                    altValue={featuredImageAlt}
                    onAltChange={(alt) => setFeaturedImageAlt(alt)}
                    label=""
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold">SEO & Google Search</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={async () => {
                      if (!title.trim()) {
                        toast.error('Please enter an article title first');
                        return;
                      }
                      try {
                        const res = await fetch('/api/ai/copilot', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'generateSeoMeta',
                            title,
                            slug,
                            contentHtml,
                            excerpt,
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          if (data.metaTitle) setMetaTitle(data.metaTitle);
                          if (data.metaDescription) setMetaDescription(data.metaDescription);
                          toast.success('Dynamic AI SEO metadata generated!');
                        }
                      } catch (e) {
                        toast.error('AI synthesis failed');
                      }
                    }}
                    className="h-6 gap-1 text-[11px] text-primary hover:text-primary font-medium"
                  >
                    <Sparkles className="size-3" />
                    <span>AI Auto-Fill ✨</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Meta Title</Label>
                    <Input
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder={title}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meta Description</Label>
                    <Textarea
                      rows={3}
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Meta description for search engines..."
                      className="text-xs resize-none leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Live Web Studio (50%) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col bg-muted/30 overflow-hidden">
          {/* Live Studio Bar */}
          <div className="flex h-10 items-center justify-between gap-2 border-b bg-background/80 backdrop-blur-xs px-4 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live In-Context Canvas</span>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
              <Button
                variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={() => setDeviceMode('desktop')}
                title="Desktop 100%"
              >
                <Monitor className="size-3" />
              </Button>
              <Button
                variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={() => setDeviceMode('tablet')}
                title="Tablet 768px"
              >
                <Tablet className="size-3" />
              </Button>
              <Button
                variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={() => setDeviceMode('mobile')}
                title="Mobile 375px"
              >
                <Smartphone className="size-3" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setIframeKey((prev) => prev + 1)}
              title="Reload Frame"
            >
              <RefreshCw className="size-3" />
            </Button>
          </div>

          {/* Responsive Live Frame Canvas */}
          <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
            <div
              className={`h-full transition-all duration-300 rounded-xl overflow-hidden border border-border bg-background shadow-lg mx-auto ${getFrameWidth()}`}
            >
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={`/${slug}?live=1`}
                className="w-full h-full border-0 bg-background"
                title="Live Web Preview"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Revision History Drawer */}
      <RevisionHistoryDrawer
        postId={postId}
        isOpen={showRevisions}
        onClose={() => setShowRevisions(false)}
        onRestore={handleRestoreRevision}
      />

      {/* Slide-Over Image Studio & AI Optimizer Drawer for Live Canvas */}
      <ImageStudioDrawer
        isOpen={studioOpen}
        onClose={() => {
          setStudioOpen(false);
          setStudioTarget(null);
        }}
        target={studioTarget}
        articleTitle={title}
        articleContent={contentHtml}
      />

      {/* Split Live Canvas & Editor Image Replace Modal */}
      <MediaPickerModal
        isOpen={splitPickerOpen}
        onClose={() => {
          setSplitPickerOpen(false);
          setTargetReplaceImg(null);
        }}
        onSelect={(newUrl, newAlt) => {
          if (targetReplaceImg?.isCover) {
            setFeaturedImageUrl(newUrl);
            broadcastLiveSync(title, contentHtml, newUrl);
            toast.success('Cover image replaced live!');
          } else if (targetReplaceImg?.src) {
            const oldSrc = targetReplaceImg.src;
            const updatedHtml = (contentHtml || '').replaceAll(oldSrc, newUrl);
            setContentHtml(updatedHtml);
            broadcastLiveSync(title, updatedHtml, featuredImageUrl);
            toast.success('Image replaced in content!');
          }
          setSplitPickerOpen(false);
          setTargetReplaceImg(null);
        }}
        title={targetReplaceImg?.isCover ? 'Replace Cover Image' : 'Replace Image in Content'}
        currentUrl={targetReplaceImg?.src}
      />
    </div>
  );
}
