'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Loader2,
  FolderOpen,
  Trash2,
  RefreshCw,
  Link2,
  Upload,
} from 'lucide-react';
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

  const hasImage = Boolean(value && value.trim() && value !== '/media/default.webp');

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
    if (file) {
      handleUpload(file);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    toast.info('Cover image removed');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Header with 3 Quick Source Triggers */}
      <div className="flex items-center justify-between">
        {label && <label className="text-xs font-semibold text-foreground">{label}</label>}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => fileInputRef.current?.click()}
            className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground px-1.5"
            title="Upload from Computer"
          >
            <Upload className="size-3" />
            <span className="hidden sm:inline">Upload</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setPickerOpen(true)}
            className="h-6 gap-1 text-[11px] text-primary hover:text-primary font-medium px-1.5"
            title="Browse Media Library"
          >
            <FolderOpen className="size-3" />
            <span>Library</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground px-1.5"
            title="Toggle URL Input"
          >
            <Link2 className="size-3" />
            <span className="hidden sm:inline">URL</span>
          </Button>
        </div>
      </div>

      {/* Main Image Box */}
      {hasImage ? (
        <div className="space-y-2">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-muted/40 group shadow-xs">
            <img
              src={value}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />

            {/* Top-Right Instant Remove Button */}
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-background/90 text-destructive hover:bg-destructive hover:text-white backdrop-blur shadow-sm transition cursor-pointer"
              title="Remove Cover Image"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>

          {/* 3 Replacement Action Buttons + Remove */}
          <div className="grid grid-cols-3 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-8 gap-1 text-[11px] font-medium"
              title="Upload new file from computer"
            >
              <UploadCloud className="size-3.5 text-muted-foreground" />
              <span>{uploading ? 'Uploading...' : 'Upload PC'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              className="h-8 gap-1 text-[11px] font-medium"
              title="Pick from 509 library images or paste link"
            >
              <FolderOpen className="size-3.5 text-primary" />
              <span>Library/URL</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearImage}
              className="h-8 gap-1 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              title="Clear cover image"
            >
              <Trash2 className="size-3.5" />
              <span>Remove</span>
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
              <p className="text-xs text-muted-foreground font-medium">Uploading & optimizing WebP...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UploadCloud className="size-4.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Click to upload or drag & drop</p>
                <p className="text-[10px] text-muted-foreground">Auto-converted to high-speed WebP</p>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerOpen(true);
                  }}
                  className="h-6 gap-1 text-[10px] font-medium"
                >
                  <FolderOpen className="size-3" />
                  <span>Choose from Library / URL</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual URL Input Bar */}
      {showManualUrl && (
        <div className="space-y-1 pt-1 animate-in fade-in duration-200">
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste image link: https://... or /media/..."
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

      {/* 3-in-1 Media Picker Modal */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          onChange(url);
          toast.success('Cover image set successfully');
        }}
        currentUrl={value}
        title="Set Featured Cover Image"
      />
    </div>
  );
}
