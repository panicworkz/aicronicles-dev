'use client';

import React from 'react';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import Image, { type ImageOptions } from '@tiptap/extension-image';
import { Sparkles } from 'lucide-react';

interface ImageComponentProps {
  node: any;
  updateAttributes: (attrs: any) => void;
  deleteNode: () => void;
  extension: any;
}

function ImageComponent({ node, updateAttributes, deleteNode, extension }: ImageComponentProps) {
  const { src, alt, title, caption } = node.attrs;

  const handleOpenStudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (extension.options.onManageImage) {
      extension.options.onManageImage({
        src,
        alt,
        title,
        caption,
        onSave: (newData: { src: string; alt: string; title: string; caption?: string }) => {
          updateAttributes({
            src: newData.src,
            alt: newData.alt,
            title: newData.title,
            caption: newData.caption || '',
          });
        },
        onDelete: () => {
          deleteNode();
        },
      });
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

        {caption && (
          <div className="p-2.5 px-4 bg-muted/50 border-t border-border/60 text-xs text-muted-foreground text-center italic">
            {caption}
          </div>
        )}

        {/* Clean Center Hover Button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-2xs">
          <button
            type="button"
            onClick={handleOpenStudio}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-2xl hover:bg-primary/90 flex items-center gap-2 transition cursor-pointer active:scale-95 border border-primary-foreground/20"
            title="Manage Image, Replace & Generate AI Alt Text"
          >
            <Sparkles className="size-3.5" />
            <span>Manage Image & AI</span>
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export interface CustomImageOptions extends ImageOptions {
  onManageImage?: ((data: {
    src: string;
    alt?: string;
    title?: string;
    caption?: string;
    onSave: (newData: { src: string; alt: string; title: string; caption?: string }) => void;
    onDelete: () => void;
  }) => void) | null;
}

export const CustomImageExtension = Image.extend<CustomImageOptions>({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      caption: { default: null },
    };
  },

  addOptions() {
    return {
      ...this.parent?.(),
      onManageImage: null,
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
});
