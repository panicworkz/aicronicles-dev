'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PanicMediaPage() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      if (data.media) {
        setMediaList(data.media);
      }
    } catch (err) {
      console.error('Fetch media error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

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
        toast.success('Image optimized & uploaded');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Assets & Gallery</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Automatic WebP optimization and instant CDN delivery</p>
        </div>

        <div>
          <label className="inline-flex h-8 gap-1.5 px-3 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition shadow-2xs cursor-pointer select-none">
            <Upload className="size-3.5" />
            <span>{uploading ? 'Optimizing...' : 'Upload Image'}</span>
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

      {/* Media Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground text-xs font-medium animate-pulse">Loading media assets...</div>
      ) : mediaList.length === 0 ? (
        <Card className="border-dashed p-12 text-center space-y-3">
          <ImageIcon className="size-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No media uploaded yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mediaList.map((m) => (
            <Card
              key={m.id}
              className="group overflow-hidden flex flex-col hover:border-primary transition shadow-xs"
            >
              <div className="aspect-video w-full bg-muted overflow-hidden relative">
                <img
                  src={m.url}
                  alt={m.alt || m.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <button
                  onClick={() => copyToClipboard(m.url, m.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 text-foreground backdrop-blur opacity-0 group-hover:opacity-100 transition shadow"
                  title="Copy URL"
                >
                  {copiedId === m.id ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              <div className="p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                <p className="text-[11px] font-mono text-foreground truncate" title={m.filename}>
                  {m.filename}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{m.width ? `${m.width}x${m.height}` : 'Image'}</span>
                  <span>{m.filesize ? `${Math.round(m.filesize / 1024)} KB` : ''}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
