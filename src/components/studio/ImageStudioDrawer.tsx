'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  RefreshCw,
  Trash2,
  Check,
  Eye,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MediaPickerModal } from './MediaPickerModal';
import { toast } from 'sonner';

export interface ImageStudioTarget {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
  isCover?: boolean;
  onSave?: (data: { src: string; alt: string; title: string; caption?: string }) => void;
  onDelete?: () => void;
}

interface ImageStudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  target: ImageStudioTarget | null;
  articleTitle?: string;
  articleContent?: string;
}

export function ImageStudioDrawer({
  isOpen,
  onClose,
  target,
  articleTitle,
  articleContent,
}: ImageStudioDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [aeoContext, setAeoContext] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (target) {
      setSrc(target.src || '');
      setAlt(target.alt || '');
      setTitle(target.title || '');
      setCaption(target.caption || '');
      setAeoContext('');
    }
  }, [target]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const handleGenerateAiMetadata = async () => {
    setGeneratingAi(true);
    try {
      const filename = src.split('/').pop() || '';
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateMediaSeo',
          filename,
          articleTitle: articleTitle || '',
          articleContent: articleContent || '',
          currentAlt: alt,
          currentTitle: title,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.alt) setAlt(data.alt);
        if (data.title) setTitle(data.title);
        if (data.caption) setCaption(data.caption);
        if (data.aeoContext) setAeoContext(data.aeoContext);
        toast.success('AI Image SEO & Alt text generated!');
      } else {
        toast.error('AI generation failed');
      }
    } catch (err) {
      toast.error('AI connection error');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleApplyChanges = () => {
    if (target?.onSave) {
      target.onSave({
        src,
        alt: alt.trim(),
        title: title.trim(),
        caption: caption.trim(),
      });
      toast.success('Image settings applied!');
    }
    onClose();
  };

  const handleDeleteImage = () => {
    if (window.confirm('Are you sure you want to remove this image from the article?')) {
      if (target?.onDelete) {
        target.onDelete();
        toast.info('Image removed from article');
      }
      onClose();
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[99999] transition-all duration-300 pointer-events-none ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Smooth Dark Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-card border-l border-border shadow-2xl flex flex-col pointer-events-auto transition-transform duration-300 ease-in-out z-10 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>Image Studio & AI</span>
                {target?.isCover && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary bg-primary/5">
                    Cover Image
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">SEO Alt Text, Caption & Asset Management</p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="rounded-xl text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Image Preview & Quick Replace Card */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3 shadow-xs">
            <div className="relative rounded-xl overflow-hidden border border-border aspect-video bg-black/10 flex items-center justify-center">
              <img
                src={src}
                alt={alt || 'Preview'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/media/fabelo-card-25.webp';
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[240px]">
                {src.split('/').pop()}
              </span>

              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => setPickerOpen(true)}
                className="gap-1.5 text-xs font-medium shrink-0 rounded-lg"
              >
                <RefreshCw className="size-3" />
                <span>Replace Image</span>
              </Button>
            </div>
          </div>

          {/* AI Auto-Generate All Banner */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Wand2 className="size-3.5" />
                <span>AI SEO Assistant</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Auto-generate contextual Alt text, title, and AEO semantic summary based on article context.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleGenerateAiMetadata}
              disabled={generatingAi}
              className="gap-1.5 shrink-0 rounded-xl text-xs font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className={`size-3.5 ${generatingAi ? 'animate-spin' : ''}`} />
              <span>{generatingAi ? 'Generating...' : 'AI Auto-Fill'}</span>
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Alt Text (SEO & Accessibility) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="altText" className="text-xs font-medium text-foreground">
                  Alt Text (Google SEO & Accessibility)
                </Label>
                <span className="text-[10px] text-muted-foreground">{alt.length} / 120</span>
              </div>
              <Input
                id="altText"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="e.g. Person using laptop for AI productivity workflows"
                className="text-xs rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">
                Descriptive text for search engines, screen readers, and image indexation.
              </p>
            </div>

            {/* Title / Tooltip */}
            <div className="space-y-1.5">
              <Label htmlFor="imageTitle" className="text-xs font-medium text-foreground">
                Image Title (Tooltip)
              </Label>
              <Input
                id="imageTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI Workspace Setup"
                className="text-xs rounded-xl"
              />
            </div>

            {/* Caption / Description */}
            <div className="space-y-1.5">
              <Label htmlFor="imageCaption" className="text-xs font-medium text-foreground">
                Caption / Figure Description
              </Label>
              <Textarea
                id="imageCaption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Editorial caption displayed beneath the image in article context..."
                rows={2}
                className="text-xs rounded-xl resize-none"
              />
            </div>

            {/* AEO Context Card */}
            {aeoContext && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1">
                <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Eye className="size-3 text-primary" />
                  <span>AEO / Answer Engine Semantic Context:</span>
                </div>
                <p className="text-xs text-muted-foreground italic leading-relaxed">{aeoContext}</p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 px-6 border-t border-border bg-muted/30 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeleteImage}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1.5 rounded-xl"
          >
            <Trash2 className="size-3.5" />
            <span>Remove Image</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyChanges}
              className="text-xs font-semibold gap-1.5 rounded-xl shadow-md"
            >
              <Check className="size-3.5" />
              <span>Apply Changes</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3-in-1 Media Picker for Replacing Image */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(newUrl, newAlt) => {
          setSrc(newUrl);
          if (newAlt) setAlt(newAlt);
          setPickerOpen(false);
          toast.success('New image selected!');
        }}
        title="Replace Image (Library, Upload, or URL)"
        currentUrl={src}
      />
    </div>,
    document.body
  );
}
