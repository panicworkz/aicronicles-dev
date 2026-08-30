'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageUploadDropzoneProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUploadDropzone({
  value,
  onChange,
  label = 'Product Image',
  className = '',
}: ImageUploadDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP, etc.)');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.media?.url) {
        onChange(data.media.url);
        toast.success('Image uploaded and converted to WebP');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-xs font-semibold text-foreground">{label}</label>}

      {value ? (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-muted/30 group">
          <img src={value} alt="Uploaded preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs font-medium"
            >
              <UploadCloud className="size-3.5" />
              <span>Replace Image</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              onClick={() => onChange('')}
              title="Remove image"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`aspect-video w-full rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer ${
            dragOver
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Uploading and optimizing image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UploadCloud className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Click to upload or drag & drop</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, WebP (auto-optimized to WebP)</p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
