'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload,
  Copy,
  Check,
  Image as ImageIcon,
  Search,
  Trash2,
  SlidersHorizontal,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MediaDetailDrawer } from '@/components/studio/MediaDetailDrawer';
import { toast } from 'sonner';

export default function PanicMediaPage() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Drawer State
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      let url = '/api/media?limit=1000';
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.media) {
        setMediaList(data.media);
      }
    } catch (err) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedia();
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.media) {
        setMediaList([data.media, ...mediaList]);
        toast.success('Image optimized & uploaded as WebP');
        setSelectedMedia(data.media);
        setDrawerOpen(true);
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string, id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteMedia = async (id: number) => {
    try {
      const res = await fetch(`/api/media?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMediaList((prev) => prev.filter((m) => m.id !== id));
        toast.success('Media asset deleted');
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('Error deleting media');
    }
  };

  const handleUpdateMedia = (updated: any) => {
    setMediaList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const openDrawer = (m: any) => {
    setSelectedMedia(m);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Assets & SEO / AEO Studio</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage all article graphics, infographics, gallery files and AI Vision context</p>
        </div>

        <div>
          <label className="inline-flex h-8.5 gap-1.5 px-3.5 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-2xs cursor-pointer select-none">
            <Upload className="size-3.5" />
            <span>{uploading ? 'Optimizing WebP...' : 'Upload Image'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all 509 media assets by filename, alt text, or title..."
            className="pl-9 h-8.5 text-xs"
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {mediaList.length} assets
        </span>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="p-16 text-center text-muted-foreground text-xs font-medium animate-pulse">
          Loading media library...
        </div>
      ) : mediaList.length === 0 ? (
        <Card className="border-dashed p-16 text-center space-y-3">
          <ImageIcon className="size-10 text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold text-foreground">No media assets found</p>
          <p className="text-xs text-muted-foreground">Upload images to use in articles, guides, and store products.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mediaList.map((m) => (
            <Card
              key={m.id}
              onClick={() => openDrawer(m)}
              className="group overflow-hidden flex flex-col hover:border-primary/60 transition shadow-xs cursor-pointer relative"
            >
              <div className="aspect-video w-full bg-muted/40 overflow-hidden relative">
                <img
                  src={m.url}
                  alt={m.alt || m.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />

                {/* Overlay Action Buttons */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={(e) => copyToClipboard(m.url, m.id, e)}
                    className="p-1.5 rounded-md bg-background/90 text-foreground backdrop-blur hover:bg-background transition shadow-xs cursor-pointer"
                    title="Copy URL"
                  >
                    {copiedId === m.id ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${m.filename}"?`)) {
                        handleDeleteMedia(m.id);
                      }
                    }}
                    className="p-1.5 rounded-md bg-background/90 text-destructive backdrop-blur hover:bg-destructive hover:text-white transition shadow-xs cursor-pointer"
                    title="Delete Image"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>

                {/* AEO Tag Badge if configured */}
                {m.aeoContext && (
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="default" className="text-[9px] bg-primary/90 text-primary-foreground font-mono gap-0.5 px-1.5 py-0">
                      <Bot className="size-2.5" />
                      <span>AEO</span>
                    </Badge>
                  </div>
                )}
              </div>

              <div className="p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold text-foreground truncate" title={m.title || m.filename}>
                    {m.title || m.filename}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate" title={m.alt || ''}>
                    Alt: {m.alt || '—'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/50">
                  <span>{m.width ? `${m.width}x${m.height}` : 'WebP'}</span>
                  <span>{m.filesize ? `${Math.round(m.filesize / 1024)} KB` : ''}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Media Detail, SEO & AEO Settings Drawer */}
      <MediaDetailDrawer
        media={selectedMedia}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={handleUpdateMedia}
        onDelete={handleDeleteMedia}
      />
    </div>
  );
}
