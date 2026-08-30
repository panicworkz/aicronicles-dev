'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Image as ImageIcon,
  Check,
  Upload,
  Link2,
  FolderOpen,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, alt?: string) => void;
  currentUrl?: string;
  title?: string;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentUrl,
  title = 'Insert & Select Image',
}: MediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'url'>('library');
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  // Direct URL Tab State
  const [customUrl, setCustomUrl] = useState('');
  const [customAlt, setCustomAlt] = useState('');

  // Drag & drop state for upload tab
  const [dragOver, setDragOver] = useState(false);

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
    if (isOpen) {
      fetchMedia();
      if (currentUrl) {
        setCustomUrl(currentUrl);
      }
    }
  }, [isOpen, search]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP, etc.)');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.media?.url) {
        onSelect(data.media.url, data.media.alt);
        toast.success('Image uploaded and selected');
        onClose();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    onSelect(customUrl.trim(), customAlt.trim());
    toast.success('Image inserted from URL');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-xl border bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex h-14 items-center justify-between gap-3 border-b px-5 shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          </div>

          {/* 3-Way Mode Switcher Tabs */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
            <Button
              type="button"
              variant={activeTab === 'library' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('library')}
              className="gap-1.5 h-7 text-xs"
            >
              <FolderOpen className="size-3.5" />
              <span>Media Library ({mediaList.length})</span>
            </Button>

            <Button
              type="button"
              variant={activeTab === 'upload' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('upload')}
              className="gap-1.5 h-7 text-xs"
            >
              <Upload className="size-3.5" />
              <span>Upload New</span>
            </Button>

            <Button
              type="button"
              variant={activeTab === 'url' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('url')}
              className="gap-1.5 h-7 text-xs"
            >
              <Link2 className="size-3.5" />
              <span>Insert by Link / URL</span>
            </Button>
          </div>

          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* TAB 1: MEDIA LIBRARY */}
        {activeTab === 'library' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search Bar */}
            <div className="p-3 border-b bg-muted/10 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search 509 assets by filename, alt text, or topic..."
                  className="pl-9 h-8 text-xs bg-background"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 p-5 overflow-y-auto">
              {loading ? (
                <div className="p-16 text-center text-xs text-muted-foreground animate-pulse">
                  Loading media library...
                </div>
              ) : mediaList.length === 0 ? (
                <div className="p-16 text-center space-y-2">
                  <ImageIcon className="size-10 text-muted-foreground mx-auto" />
                  <p className="text-xs font-medium text-muted-foreground">No media assets found matching query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {mediaList.map((m) => {
                    const isSelected = currentUrl === m.url;
                    return (
                      <Card
                        key={m.id}
                        onClick={() => {
                          onSelect(m.url, m.alt);
                          onClose();
                        }}
                        className={`group overflow-hidden flex flex-col transition cursor-pointer hover:border-primary ${
                          isSelected ? 'ring-2 ring-primary border-primary' : ''
                        }`}
                      >
                        <div className="aspect-video w-full bg-muted/40 overflow-hidden relative">
                          <img
                            src={m.url}
                            alt={m.alt || m.filename}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                              <Check className="size-3" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 space-y-0.5">
                          <p className="text-[11px] font-medium text-foreground truncate" title={m.title || m.filename}>
                            {m.title || m.filename}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {m.width ? `${m.width}x${m.height}` : 'WebP'}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD FROM COMPUTER */}
        {activeTab === 'upload' && (
          <div className="p-8 flex-1 flex flex-col items-center justify-center overflow-y-auto">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className={`w-full max-w-xl aspect-video rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 text-center cursor-pointer ${
                dragOver
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : 'border-border bg-muted/20 hover:bg-muted/30 hover:border-primary/60'
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="size-10 text-primary animate-spin" />
                  <p className="text-sm font-semibold text-foreground">Uploading & converting to WebP...</p>
                  <p className="text-xs text-muted-foreground">High-performance compression applied</p>
                </div>
              ) : (
                <label className="flex flex-col items-center space-y-3 cursor-pointer w-full h-full justify-center">
                  <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="size-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Click to select an image from your computer</p>
                    <p className="text-xs text-muted-foreground mt-1">or drag & drop your image file here</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    PNG, JPG, JPEG, WEBP, GIF, SVG
                  </Badge>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INSERT BY URL / LINK */}
        {activeTab === 'url' && (
          <form onSubmit={handleCustomUrlSubmit} className="p-8 flex-1 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="max-w-xl mx-auto w-full space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Image URL or Web Link</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg or /media/card-1.webp"
                    className="pl-9 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Alt Text (Accessibility & SEO)</Label>
                <Input
                  value={customAlt}
                  onChange={(e) => setCustomAlt(e.target.value)}
                  placeholder="Describe the image for search engines..."
                  className="text-xs"
                />
              </div>

              {/* Live Preview of URL */}
              {customUrl && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Live Image Preview</Label>
                  <div className="aspect-video w-full rounded-lg overflow-hidden border bg-muted/30">
                    <img
                      src={customUrl}
                      alt={customAlt || 'Preview'}
                      className="w-full h-full object-contain"
                      onError={() => toast.error('Invalid image URL or cannot load image')}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!customUrl.trim()} className="gap-1.5">
                <Check className="size-3.5" />
                <span>Insert Image</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
