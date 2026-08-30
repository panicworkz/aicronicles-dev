'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import TableExtension from '@tiptap/extension-table';
import TableRowExtension from '@tiptap/extension-table-row';
import TableCellExtension from '@tiptap/extension-table-cell';
import TableHeaderExtension from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Upload,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MediaPickerModal } from '@/components/studio/MediaPickerModal';
import { toast } from 'sonner';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string, json: any) => void;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-6 border border-border/80 shadow-sm mx-auto object-cover',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:opacity-80 transition',
        },
      }),
      TableExtension.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border w-full my-4 rounded-lg overflow-hidden',
        },
      }),
      TableRowExtension,
      TableHeaderExtension.configure({
        HTMLAttributes: {
          class: 'border border-border bg-muted/60 p-2.5 text-left font-semibold text-foreground text-xs',
        },
      }),
      TableCellExtension.configure({
        HTMLAttributes: {
          class: 'border border-border p-2.5 text-muted-foreground text-xs',
        },
      }),
    ],
    content: content || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-6 text-foreground text-sm sm:text-base leading-relaxed',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            uploadAndInsertImage(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              uploadAndInsertImage(file);
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getJSON());
    },
  });

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content && !editor.isFocused) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const uploadAndInsertImage = async (file: File) => {
    if (!editor) return;
    toast.loading('Uploading and optimizing image to WebP...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      toast.dismiss();

      if (data.success && data.media?.url) {
        const defaultAlt = (file.name || '')
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_0-9]+/g, ' ')
          .trim();
        editor.chain().focus().setImage({
          src: data.media.url,
          alt: data.media.alt || defaultAlt,
        }).run();
        toast.success('Image inserted with auto-generated Alt text');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error('Image upload failed');
    }
  };

  const handleDirectFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAndInsertImage(file);
      e.target.value = '';
    }
  };

  const editImageAlt = () => {
    if (!editor) return;
    if (!editor.isActive('image')) {
      toast.info('Click on an image inside the text editor first to edit its SEO / Alt text');
      return;
    }
    const currentAlt = editor.getAttributes('image').alt || '';
    const newAlt = window.prompt('Edit Image Alt Text (for Google SEO & Accessibility):', currentAlt);
    if (newAlt !== null) {
      editor.chain().focus().updateAttributes('image', { alt: newAlt }).run();
      toast.success('Image Alt text updated');
    }
  };

  if (!editor) {
    return <div className="h-96 rounded-xl border bg-card/50 animate-pulse" />;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter destination URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      {/* Clean Solid Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/40 shrink-0">
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('code') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Button
          type="button"
          variant={editor.isActive('link') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={setLink}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>

        {/* Rich Image Insertion with Modal Picker + Direct Upload */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
          onClick={() => setPickerOpen(true)}
          title="Insert Image (Upload, Pick Library, or Link)"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Image</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => fileInputRef.current?.click()}
          title="Quick Upload Image from Computer"
        >
          <Upload className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </Button>

        {/* Edit Selected Image Alt / SEO */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={editImageAlt}
          title="Edit Clicked Image Alt Text / SEO"
        >
          <Tag className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] hidden md:inline">Alt/SEO</span>
        </Button>

        <Button
          type="button"
          variant={editor.isActive('table') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={insertTable}
          title="Table"
        >
          <TableIcon className="w-4 h-4" />
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 bg-card">
        <EditorContent editor={editor} />
      </div>

      {/* Hidden File Input for Quick Direct Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleDirectFileInput}
        className="hidden"
      />

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url, alt) => {
          if (editor) {
            editor.chain().focus().setImage({
              src: url,
              alt: alt || '',
            }).run();
          }
        }}
      />
    </div>
  );
}
