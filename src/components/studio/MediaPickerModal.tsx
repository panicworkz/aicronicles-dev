'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Image as ImageIcon,
  Check,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  currentUrl?: string;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentUrl,
}: MediaPickerModalProps) {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

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
    }
  }, [isOpen, search]);

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
      if (data.success && data.media?.url) {
        onSelect(data.media.url);
        toast.success('Image uploaded & selected');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl border bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex h-14 items-center justify-between gap-3 border-b px-5 shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Select Media Asset</h2>
            <span className="text-xs text-muted-foreground font-mono">({mediaList.length} available)</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex h-8 gap-1.5 px-3 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-2xs cursor-pointer select-none">
              <Upload className="size-3.5" />
              <span>{uploading ? 'Optimizing...' : 'Upload New'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b bg-muted/10 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename, alt text, or topic..."
              className="pl-9 h-8 text-xs bg-background"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 p-5 overflow-y-auto">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground animate-pulse">
              Loading media gallery...
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
                      onSelect(m.url);
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
    </div>
  );
}
