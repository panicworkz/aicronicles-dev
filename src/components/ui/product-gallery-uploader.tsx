'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductGalleryUploaderProps {
  featuredImage: string;
  galleryImages: string[];
  onFeaturedImageChange: (url: string) => void;
  onGalleryImagesChange: (urls: string[]) => void;
}

export function ProductGalleryUploader({
  featuredImage,
  galleryImages = [],
  onFeaturedImageChange,
  onGalleryImagesChange,
}: ProductGalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast.error('Please upload image files (PNG, JPG, WebP)');
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.media?.url) {
          uploadedUrls.push(data.media.url);
        }
      }

      if (uploadedUrls.length > 0) {
        if (!featuredImage) {
          onFeaturedImageChange(uploadedUrls[0]);
          const remaining = uploadedUrls.slice(1);
          if (remaining.length > 0) {
            onGalleryImagesChange([...galleryImages, ...remaining]);
          }
        } else {
          onGalleryImagesChange([...galleryImages, ...uploadedUrls]);
        }
        toast.success(`Uploaded ${uploadedUrls.length} image(s)`);
      }
    } catch (err: any) {
      toast.error('Failed to upload some images');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    const updated = galleryImages.filter((_, i) => i !== index);
    onGalleryImagesChange(updated);
  };

  const handleMakeCover = (url: string, index: number) => {
    const oldCover = featuredImage;
    onFeaturedImageChange(url);
    const updated = [...galleryImages];
    if (oldCover) {
      updated[index] = oldCover;
    } else {
      updated.splice(index, 1);
    }
    onGalleryImagesChange(updated);
    toast.success('Set as primary cover image');
  };

  return (
    <div className="space-y-4">
      {/* Primary Cover Image Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Star className="size-3.5 text-amber-500 fill-amber-500" />
            <span>Primary Cover Image</span>
          </label>
          {featuredImage && (
            <span className="text-[11px] text-muted-foreground font-mono">Main Display Photo</span>
          )}
        </div>

        {featuredImage ? (
          <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-muted/30 group">
            <img src={featuredImage} alt="Cover preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onFeaturedImageChange('')}
                className="text-xs gap-1.5"
              >
                <X className="size-3.5" />
                <span>Remove Cover</span>
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video w-full rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer"
          >
            <UploadCloud className="size-6 text-muted-foreground mb-1" />
            <p className="text-xs font-semibold text-foreground">Click to upload cover image</p>
            <p className="text-[10px] text-muted-foreground">Or drag multiple photos below</p>
          </div>
        )}
      </div>

      {/* Additional Gallery Photos Grid */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">
            Product Image Gallery ({galleryImages.length} additional photos)
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 text-[11px] gap-1"
          >
            <Plus className="size-3" />
            <span>Add Photos</span>
          </Button>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {galleryImages.map((imgUrl, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted/20 shadow-2xs"
            >
              <img src={imgUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
              
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                <button
                  type="button"
                  onClick={() => handleMakeCover(imgUrl, idx)}
                  className="px-2 py-1 rounded bg-amber-500 text-black text-[10px] font-bold hover:bg-amber-400 transition"
                  title="Make this photo the main cover"
                >
                  Make Cover
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryImage(idx)}
                  className="size-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition"
                  title="Delete this photo"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more drop tile */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-square rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center p-2 text-center cursor-pointer ${
              dragOver
                ? 'border-primary bg-primary/10'
                : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50'
            }`}
          >
            {uploading ? (
              <Loader2 className="size-5 text-primary animate-spin" />
            ) : (
              <>
                <Plus className="size-4 text-muted-foreground mb-0.5" />
                <span className="text-[10px] text-muted-foreground font-medium">Upload More</span>
              </>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
