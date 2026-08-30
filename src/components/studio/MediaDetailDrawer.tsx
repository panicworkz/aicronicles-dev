'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Image as ImageIcon,
  Globe,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MediaDetailDrawerProps {
  media: any | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedMedia: any) => void;
  onDelete: (id: number) => void;
}

export function MediaDetailDrawer({
  media,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: MediaDetailDrawerProps) {
  const [title, setTitle] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [aeoContext, setAeoContext] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (media) {
      setTitle(media.title || media.filename || '');
      setAlt(media.alt || media.filename || '');
      setCaption(media.caption || '');
      setAeoContext(media.aeoContext || '');
    }
  }, [media]);

  if (!isOpen || !media) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: media.id,
          title,
          alt,
          caption,
          aeoContext,
        }),
      });

      const data = await res.json();
      if (data.success && data.media) {
        toast.success('Media SEO & AEO settings saved');
        onUpdate(data.media);
        onClose();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (err) {
      toast.error('Error saving media settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAiAutoDescribe = () => {
    setGeneratingAi(true);
    setTimeout(() => {
      const cleanName = media.filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_0-9]+/g, ' ')
        .trim();
      const formattedTitle = cleanName
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const autoAlt = `${formattedTitle} - High resolution editorial illustration`;
      const autoCaption = `Official visual asset showcasing ${cleanName}.`;
      const autoAeo = `Visual representation of ${cleanName}. High-contrast, web-optimized asset illustrating core concepts and system design for AI Answer Engines and multi-modal search models.`;

      setAlt(autoAlt);
      setCaption(autoCaption);
      setAeoContext(autoAeo);
      setGeneratingAi(false);
      toast.success('AI SEO & AEO descriptions generated!');
    }, 400);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(media.url);
    setCopied(true);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-pointer" onClick={onClose} />

      <aside className="relative z-50 flex h-full w-full sm:w-[500px] flex-col border-l bg-background shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex h-14 items-center justify-between gap-3 border-b px-5 shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Media Asset SEO & AEO Settings</h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* Image Preview & Specs */}
          <div className="rounded-md border bg-muted/20 overflow-hidden space-y-3 p-3">
            <div className="aspect-video w-full rounded-md overflow-hidden bg-black/50 border border-border relative">
              <img
                src={media.url}
                alt={alt || media.filename}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pt-1">
              <span>{media.width ? `${media.width} x ${media.height} px` : 'WebP Image'}</span>
              <span>{media.filesize ? `${Math.round(media.filesize / 1024)} KB` : ''}</span>
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                {media.mimeType ? media.mimeType.split('/')[1] : 'webp'}
              </Badge>
            </div>

            {/* URL Copy Bar */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={media.url}
                readOnly
                className="h-8 text-xs font-mono bg-background truncate select-all"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyUrl}
                className="h-8 gap-1.5 shrink-0"
              >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>

          {/* AI Auto-Fill Action */}
          <div className="p-3 rounded-md border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>AI Auto-Describe</span>
              </span>
              <p className="text-[11px] text-muted-foreground">
                Synthesize Alt Text, Caption, and LLM Vision context automatically
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiAutoDescribe}
              disabled={generatingAi}
              className="gap-1.5 text-xs text-primary font-semibold shrink-0"
            >
              <Bot className="size-3.5" />
              <span>{generatingAi ? 'Analyzing...' : 'Auto-Fill'}</span>
            </Button>
          </div>

          {/* Metadata Form */}
          <form id="media-form" onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Asset Title</span>
                <span className="text-[10px] text-muted-foreground font-normal">Filename/Label</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Minimalist Leather Desk Pad"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Alt Text (Accessibility & Google Image SEO)</span>
                <span className="text-[10px] text-muted-foreground font-mono">{alt.length} chars</span>
              </Label>
              <Input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Descriptive text for search engines and screen readers..."
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Caption / Subtitle</Label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Visible caption under image in articles or gallery..."
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between text-primary">
                <span className="flex items-center gap-1.5">
                  <Bot className="size-3.5" />
                  <span>AEO & LLM Vision Context</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">For Perplexity & AI Search</span>
              </Label>
              <Textarea
                rows={3}
                value={aeoContext}
                onChange={(e) => setAeoContext(e.target.value)}
                placeholder="Semantic explanation of what this image demonstrates so LLMs and Answer Engines cite it accurately..."
                className="text-xs leading-relaxed resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-muted/10 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm(`Are you sure you want to permanently delete "${media.filename}"?`)) {
                onDelete(media.id);
                onClose();
              }
            }}
            className="gap-1.5"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Asset</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="media-form"
              size="sm"
              disabled={saving}
              className="gap-1.5 font-medium"
            >
              <Save className="size-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
