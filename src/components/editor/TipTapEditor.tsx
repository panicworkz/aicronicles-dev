'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import TableExtension from '@tiptap/extension-table';
import TableRowExtension from '@tiptap/extension-table-row';
import TableCellExtension from '@tiptap/extension-table-cell';
import TableHeaderExtension from '@tiptap/extension-table-header';
import { CustomImageExtension } from './CustomImageExtension';
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
  const [pickerMode, setPickerMode] = useState<'insert' | 'replace'>('insert');
  const [selectedImgSrc, setSelectedImgSrc] = useState<string | undefined>(undefined);
  const [replaceCallback, setReplaceCallback] = useState<((url: string, alt?: string) => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      CustomImageExtension.configure({
        inline: false,
        allowBase64: true,
        onReplaceImage: (src: string, alt: string, callback: (newSrc: string, newAlt?: string) => void) => {
          setSelectedImgSrc(src);
          setReplaceCallback(() => callback);
          setPickerMode('replace');
          setPickerOpen(true);
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
        
        if (pickerMode === 'replace' && replaceCallback) {
          replaceCallback(data.media.url, data.media.alt || defaultAlt);
          setReplaceCallback(null);
          toast.success('Image replaced successfully!');
        } else {
          editor.chain().focus().setImage({
            src: data.media.url,
            alt: data.media.alt || defaultAlt,
          }).run();
          toast.success('Image inserted with auto-generated Alt text');
        }
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error('Image upload failed');
    }
  };

  const handlePickerSelect = (url: string, alt?: string) => {
    if (!editor) return;

    if (pickerMode === 'replace' && replaceCallback) {
      replaceCallback(url, alt);
      setReplaceCallback(null);
      toast.success('Image replaced successfully!');
    } else {
      editor.chain().focus().setImage({
        src: url,
        alt: alt || 'Article illustration',
      }).run();
      toast.success('Image inserted into content');
    }
    setPickerOpen(false);
  };

  const handleDirectFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAndInsertImage(file);
      e.target.value = '';
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
    <div className="relative rounded-xl border bg-card shadow-xs overflow-hidden">
      {/* Hidden File Input for direct PC image picking */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleDirectFileInput}
      />

      {/* 3-in-1 Media Modal */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setReplaceCallback(null);
        }}
        onSelect={handlePickerSelect}
        title={pickerMode === 'replace' ? 'Replace Image (Library, Upload, or URL)' : 'Insert Image (Library, Upload, or URL)'}
        currentUrl={selectedImgSrc}
      />

      {/* Editor Main Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
        {/* Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted text-primary' : ''}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted text-primary' : ''}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted text-primary' : ''}
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted text-primary' : ''}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-muted text-primary' : ''}
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        {/* Lists & Blockquote */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted text-primary' : ''}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted text-primary' : ''}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-muted text-primary' : ''}
          title="Quote"
        >
          <Quote className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-muted text-primary' : ''}
          title="Code Block"
        >
          <Code className="w-3.5 h-3.5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        {/* Links, Media & Tables */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={setLink}
          className={editor.isActive('link') ? 'bg-muted text-primary' : ''}
          title="Insert Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </Button>

        {/* 3-in-1 Image Picker Button */}
        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={() => {
            setPickerMode('insert');
            setSelectedImgSrc(undefined);
            setPickerOpen(true);
          }}
          className="gap-1 text-xs font-semibold text-primary h-7 px-2"
          title="Insert Image (Upload PC, Media Library, or Link URL)"
        >
          <ImageIcon className="size-3.5" />
          <span>Image</span>
        </Button>

        {/* Direct PC Upload Quick Trigger */}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => fileInputRef.current?.click()}
          className="gap-1 text-xs text-muted-foreground hover:text-foreground h-7 px-1.5"
          title="Upload directly from Computer"
        >
          <Upload className="size-3" />
          <span className="hidden sm:inline">Upload PC</span>
        </Button>

        {/* Table Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={insertTable}
          title="Insert Table"
        >
          <TableIcon className="w-3.5 h-3.5" />
        </Button>

        <div className="flex-1" />

        {/* History Controls */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
