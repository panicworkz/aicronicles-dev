'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, FolderOpen, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaPickerModal } from '@/components/studio/MediaPickerModal';
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
  label = 'Featured Cover Image',
  className = '',
}: ImageUploadDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
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
        toast.success('Cover image uploaded and converted to WebP');
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
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        {label && <label className="text-xs font-semibold text-foreground">{label}</label>}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setPickerOpen(true)}
            className="h-6 gap-1 text-[11px] text-primary hover:text-primary font-medium px-2"
          >
            <FolderOpen className="size-3" />
            <span>Browse Library</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground font-normal px-1.5"
            title="Toggle URL Input"
          >
            <Link2 className="size-3" />
          </Button>
        </div>
      </div>

      {value && value !== '/media/default.webp' ? (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-muted/30 group">
          <img src={value} alt="Cover preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs font-medium h-8"
            >
              <UploadCloud className="size-3.5" />
              <span>Upload New</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPickerOpen(true)}
              className="gap-1.5 text-xs font-medium h-8"
            >
              <FolderOpen className="size-3.5" />
              <span>Pick Library</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              onClick={() => onChange('/media/default.webp')}
              title="Reset image"
              className="size-8"
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
          className={`aspect-video w-full rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer ${
            dragOver
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="size-7 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Uploading and optimizing WebP...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UploadCloud className="size-4.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Click to upload cover or drag & drop</p>
                <p className="text-[10px] text-muted-foreground">Auto-compressed to WebP for Google CWV</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optional Manual URL Input */}
      {showManualUrl && (
        <div className="space-y-1 pt-1 animate-in fade-in duration-200">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/media/cover-name.webp or https://..."
            className="text-xs font-mono h-8"
          />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => onChange(url)}
        currentUrl={value}
      />
    </div>
  );
}
