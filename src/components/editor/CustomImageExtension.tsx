'use client';

import React from 'react';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import Image, { type ImageOptions } from '@tiptap/extension-image';
import { RefreshCw, Trash2, Edit3 } from 'lucide-react';

interface ImageComponentProps {
  node: any;
  updateAttributes: (attrs: any) => void;
  deleteNode: () => void;
  extension: any;
}

function ImageComponent({ node, updateAttributes, deleteNode, extension }: ImageComponentProps) {
  const { src, alt, title } = node.attrs;

  const handleReplace = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (extension.options.onReplaceImage) {
      extension.options.onReplaceImage(src, alt, (newSrc: string, newAlt?: string) => {
        updateAttributes({
          src: newSrc,
          alt: newAlt || alt,
        });
      });
    }
  };

  const handleEditAlt = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newAlt = window.prompt('Edit Image Alt Text (SEO & Accessibility):', alt || '');
    if (newAlt !== null) {
      updateAttributes({ alt: newAlt });
    }
  };

  return (
    <NodeViewWrapper className="relative my-6 block group select-none">
      <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-muted/20 shadow-md transition-all duration-200 inline-block w-full max-w-3xl">
        <img
          src={src}
          alt={alt || 'Content Image'}
          title={title || ''}
          className="w-full h-auto object-cover rounded-2xl block min-h-[140px] bg-muted/30"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/media/fabelo-card-25.webp';
          }}
        />

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5 backdrop-blur-2xs">
          {/* Button 1: Replace */}
          <button
            type="button"
            onClick={handleReplace}
            className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xl hover:bg-primary/90 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            title="Replace Image (Library, Upload, or URL)"
          >
            <RefreshCw className="size-3.5" />
            <span>Replace Image</span>
          </button>

          {/* Button 2: Alt Text - Solid High-Contrast White Background */}
          <button
            type="button"
            onClick={handleEditAlt}
            className="px-3.5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-neutral-100 text-xs font-bold shadow-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95 border border-white/40"
            title="Edit Alt Text (SEO & Accessibility)"
          >
            <Edit3 className="size-3.5 text-zinc-950" />
            <span>Alt Metin</span>
          </button>

          {/* Button 3: Delete */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteNode();
            }}
            className="p-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium shadow-xl flex items-center transition cursor-pointer active:scale-95"
            title="Delete Image"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export interface CustomImageOptions extends ImageOptions {
  onReplaceImage?: ((src: string, alt: string, callback: (newSrc: string, newAlt?: string) => void) => void) | null;
}

export const CustomImageExtension = Image.extend<CustomImageOptions>({
  name: 'image',

  addOptions() {
    return {
      ...this.parent?.(),
      onReplaceImage: null,
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
});
