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
  Bot,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MediaPickerModal } from '@/components/studio/MediaPickerModal';
import { MediaDetailDrawer } from '@/components/studio/MediaDetailDrawer';
import { toast } from 'sonner';

interface ImageUploadDropzoneProps {
  value?: string;
  onChange: (url: string) => void;
  altValue?: string;
  onAltChange?: (alt: string) => void;
  label?: string;
  className?: string;
}

export function ImageUploadDropzone({
  value,
  onChange,
  altValue,
  onAltChange,
  label = 'Featured Cover Image',
  className = '',
}: ImageUploadDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [seoDrawerOpen, setSeoDrawerOpen] = useState(false);
  const [currentMediaObj, setCurrentMediaObj] = useState<any | null>(null);
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
        if (onAltChange && data.media.alt) {
          onAltChange(data.media.alt);
        }
        setCurrentMediaObj(data.media);
        toast.success('Cover image uploaded! You can edit its SEO/Alt text below.');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const openSeoDrawer = async () => {
    if (!value) return;
    try {
      const filename = value.split('/').pop()?.split('?')[0];
      const res = await fetch(`/api/media?search=${encodeURIComponent(filename || '')}`);
      const data = await res.json();
      if (data.media && data.media.length > 0) {
        setCurrentMediaObj(data.media[0]);
      } else {
        setCurrentMediaObj({
          id: 0,
          url: value,
          filename: filename || 'cover.webp',
          title: 'Cover Image',
          alt: altValue || 'Article Cover Image',
        });
      }
      setSeoDrawerOpen(true);
    } catch (err) {
      setSeoDrawerOpen(true);
    }
  };

  const handleAutoAlt = () => {
    if (!value) return;
    const cleanName = (value.split('/').pop() || '')
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_0-9]+/g, ' ')
      .trim();
    const formatted = cleanName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    const autoText = `${formatted} - High quality visual guide`;
    if (onAltChange) onAltChange(autoText);
    toast.success('Alt text generated!');
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
    if (onAltChange) onAltChange('');
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
        <div className="space-y-2.5">
          <div
            onClick={() => setPickerOpen(true)}
            className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-muted/40 group shadow-xs cursor-pointer"
            title="Click to replace this cover image"
          >
            <img
              src={value}
              alt={altValue || 'Cover preview'}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />

            {/* Hover Replace Overlay Hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-2xs">
              <RefreshCw className="size-4 animate-spin-once" />
              <span>Click to Replace Image</span>
            </div>

            {/* Top-Right Instant Actions */}
            <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openSeoDrawer();
                }}
                className="p-1.5 rounded-md bg-background/90 text-primary hover:bg-background backdrop-blur shadow-sm transition cursor-pointer"
                title="Advanced SEO & AEO Settings"
              >
                <Bot className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClearImage}
                className="p-1.5 rounded-md bg-background/90 text-destructive hover:bg-destructive hover:text-white backdrop-blur shadow-sm transition cursor-pointer"
                title="Remove Cover Image"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
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
              <span>{uploading ? 'Uploading...' : 'Replace'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              className="h-8 gap-1 text-[11px] font-medium"
              title="Pick from 509 library images"
            >
              <FolderOpen className="size-3.5 text-primary" />
              <span>Library</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openSeoDrawer}
              className="h-8 gap-1 text-[11px] font-medium text-primary border-primary/30 hover:bg-primary/5"
              title="Configure SEO Alt Text & AEO LLM Vision"
            >
              <SlidersHorizontal className="size-3.5" />
              <span>SEO/AEO</span>
            </Button>
          </div>

          {/* Direct Alt Text Input for Cover (Always Available) */}
          {onAltChange && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Cover Alt Text (Google SEO)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={handleAutoAlt}
                  className="h-5 gap-1 text-[10px] text-primary hover:text-primary px-1 font-medium"
                >
                  <Sparkles className="size-2.5" />
                  <span>AI Alt</span>
                </Button>
              </div>
              <Input
                value={altValue || ''}
                onChange={(e) => onAltChange(e.target.value)}
                placeholder="Descriptive text for Google Image search..."
                className="text-xs h-7.5"
              />
            </div>
          )}
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
        onSelect={(url, alt) => {
          onChange(url);
          if (onAltChange && alt) {
            onAltChange(alt);
          }
          toast.success('Cover image set successfully');
        }}
        currentUrl={value}
        title="Set Featured Cover Image"
      />

      {/* Instant SEO & AEO Settings Drawer for Cover */}
      <MediaDetailDrawer
        media={currentMediaObj}
        isOpen={seoDrawerOpen}
        onClose={() => setSeoDrawerOpen(false)}
        onUpdate={(updated) => {
          onChange(updated.url);
          if (onAltChange && updated.alt) {
            onAltChange(updated.alt);
          }
          toast.success('Cover SEO & AEO settings saved');
        }}
        onDelete={() => {
          onChange('');
          if (onAltChange) onAltChange('');
          setSeoDrawerOpen(false);
        }}
      />
    </div>
  );
}
