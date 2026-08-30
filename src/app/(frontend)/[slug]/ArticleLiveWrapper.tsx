'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Link2,
  RemoveFormatting,
  Type,
  Check,
  X,
} from 'lucide-react';

interface ArticleLiveWrapperProps {
  initialTitle: string;
  initialContentHtml: string;
  initialCoverUrl?: string | null;
  excerpt?: string | null;
  readingTime?: string | null;
  publishedAt?: string | null;
  author?: {
    name: string;
    slug: string;
    avatarUrl?: string | null;
    role?: string | null;
  } | null;
  category?: {
    name: string;
    slug: string;
  } | null;
}

export function ArticleLiveWrapper({
  initialTitle,
  initialContentHtml,
  initialCoverUrl,
  excerpt,
  readingTime,
  publishedAt,
  author,
  category,
}: ArticleLiveWrapperProps) {
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Floating selection bubble menu state
  const [bubbleMenu, setBubbleMenu] = useState<{
    visible: boolean;
    top: number;
    left: number;
  }>({
    visible: false,
    top: 0,
    left: 0,
  });

  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isTypingTitle = useRef(false);
  const isTypingContent = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // Helper to format raw HTML with GPU-accelerated CSS hover overlays for all images
  const formatContentWithLiveImages = (rawHtml: string) => {
    if (!rawHtml || typeof window === 'undefined') return rawHtml;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');
      const imgs = doc.querySelectorAll('img');

      imgs.forEach((img) => {
        if (img.parentElement?.classList.contains('panic-live-image-box')) return;

        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        const title = img.getAttribute('title') || '';
        const caption = img.getAttribute('data-caption') || '';

        const figure = doc.createElement('figure');
        figure.className = 'panic-live-image-wrapper relative my-6 block group select-none max-w-3xl';
        figure.setAttribute('contenteditable', 'false');

        const box = doc.createElement('div');
        box.className = 'panic-live-image-box relative rounded-2xl overflow-hidden border border-border/80 bg-muted/20 shadow-md transition-all duration-200 inline-block w-full';

        const newImg = doc.createElement('img');
        newImg.src = src;
        newImg.alt = alt;
        if (title) newImg.title = title;
        newImg.className = 'w-full h-auto object-cover rounded-2xl block min-h-[140px] bg-muted/30';
        newImg.setAttribute('onerror', "this.src='/media/fabelo-card-25.webp'");

        const overlay = doc.createElement('div');
        overlay.className = 'absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center backdrop-blur-2xs pointer-events-none';

        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-panic-manage', 'true');
        btn.setAttribute('data-src', src);
        btn.setAttribute('data-alt', alt);
        btn.setAttribute('data-title', title);
        btn.setAttribute('data-caption', caption);
        btn.className = 'px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-2xl hover:bg-primary/90 flex items-center gap-2 transition cursor-pointer active:scale-95 border border-primary-foreground/20 pointer-events-auto';
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          <span>Manage Image & AI</span>
        `;

        overlay.appendChild(btn);
        box.appendChild(newImg);
        box.appendChild(overlay);

        if (caption) {
          const capDiv = doc.createElement('div');
          capDiv.className = 'p-2.5 px-4 bg-muted/50 border-t border-border/60 text-xs text-muted-foreground text-center italic';
          capDiv.textContent = caption;
          box.appendChild(capDiv);
        }

        figure.appendChild(box);
        img.parentNode?.replaceChild(figure, img);
      });

      return doc.body.innerHTML;
    } catch (e) {
      return rawHtml;
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('live') === '1' || window !== window.parent) {
        setIsLiveMode(true);
      }
      const themeParam = urlParams.get('theme');
      if (themeParam === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (themeParam === 'light') {
        document.documentElement.classList.remove('dark');
      }
    }

    if (contentRef.current && isLiveMode) {
      contentRef.current.innerHTML = formatContentWithLiveImages(initialContentHtml);
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PANIC_THEME_CHANGE') {
        const theme = event.data.theme;
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        }
      }

      if (event.data?.type === 'PANIC_STUDIO_LIVE_UPDATE') {
        if (event.data?.source === 'live_iframe') return;

        const { title: newTitle, contentHtml: newHtml, featuredImageUrl: newCover } = event.data.payload || {};

        if (newTitle !== undefined && titleRef.current && !isTypingTitle.current) {
          if (titleRef.current.innerText !== newTitle) {
            titleRef.current.innerText = newTitle;
          }
        }

        if (newHtml !== undefined && contentRef.current && !isTypingContent.current) {
          contentRef.current.innerHTML = formatContentWithLiveImages(newHtml);
        }

        if (newCover !== undefined) {
          setCoverUrl(newCover);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [initialTitle, initialContentHtml, isLiveMode]);

  // Selection tracking on mouseup & keyup
  useEffect(() => {
    if (!isLiveMode) return;

    const checkSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        if (!linkInputOpen) {
          setBubbleMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        }
        return;
      }

      const anchor = sel.anchorNode;
      if (!anchor || (!contentRef.current?.contains(anchor) && !titleRef.current?.contains(anchor))) {
        if (!linkInputOpen) {
          setBubbleMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        }
        return;
      }

      try {
        const range = sel.getRangeAt(0);
        savedRangeRef.current = range.cloneRange();
        const rect = range.getBoundingClientRect();
        if (rect.width > 0) {
          setBubbleMenu({
            visible: true,
            top: Math.max(12, rect.top - 54),
            left: Math.max(16, rect.left + rect.width / 2),
          });
        }
      } catch (e) {
        // silent
      }
    };

    const handleMouseUp = () => {
      setTimeout(checkSelection, 30);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        setTimeout(checkSelection, 30);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.panic-live-bubble-toolbar')) {
        return; // Don't close when clicking inside toolbar
      }
      setBubbleMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      setLinkInputOpen(false);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isLiveMode, linkInputOpen]);

  // Execute rich text formatting commands and preserve selection
  const execFormat = (command: string, value: string | undefined = undefined) => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }

    try {
      if (command === 'formatBlock' && value) {
        document.execCommand('formatBlock', false, `<${value.toUpperCase().replace(/[<>]/g, '')}>`);
      } else {
        document.execCommand(command, false, value);
      }
    } catch (e) {
      try {
        if (value) document.execCommand(command, false, value);
        else document.execCommand(command);
      } catch (err) {}
    }

    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }

    if (contentRef.current) {
      handleContentSync(contentRef.current.innerHTML);
    }
  };

  const handleApplyLink = () => {
    if (linkUrl.trim() && savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
      document.execCommand('createLink', false, linkUrl.trim());
      if (contentRef.current) {
        handleContentSync(contentRef.current.innerHTML);
      }
    }
    setLinkInputOpen(false);
    setLinkUrl('');
  };

  const handleTitleInput = (e: React.FormEvent<HTMLHeadingElement>) => {
    const newText = e.currentTarget.innerText;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'PANIC_LIVE_TO_STUDIO_SYNC',
            source: 'live_iframe',
            payload: { title: newText },
          },
          '*'
        );
      }
    }, 150);
  };

  const handleContentSync = (rawHtml: string) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (window.parent && window.parent !== window) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');
        const liveFigures = doc.querySelectorAll('.panic-live-image-wrapper');
        liveFigures.forEach((fig) => {
          const img = fig.querySelector('img');
          if (img) {
            const cleanImg = doc.createElement('img');
            cleanImg.src = img.getAttribute('src') || img.src;
            if (img.alt) cleanImg.alt = img.alt;
            if (img.title) cleanImg.title = img.title;
            const btn = fig.querySelector('button[data-panic-manage="true"]');
            const cap = btn?.getAttribute('data-caption');
            if (cap) cleanImg.setAttribute('data-caption', cap);
            fig.parentNode?.replaceChild(cleanImg, fig);
          }
        });
        const cleanHtml = doc.body.innerHTML;
        window.parent.postMessage(
          {
            type: 'PANIC_LIVE_TO_STUDIO_SYNC',
            source: 'live_iframe',
            payload: { contentHtml: cleanHtml },
          },
          '*'
        );
      }
    }, 200);
  };

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    handleContentSync(e.currentTarget.innerHTML);
  };

  const triggerOpenImageStudio = (src: string, alt = '', title = '', caption = '', isCover = false) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'PANIC_OPEN_IMAGE_STUDIO',
          payload: { src, alt, title, caption, isCover },
        },
        '*'
      );
    }
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('button[data-panic-manage="true"]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const src = btn.getAttribute('data-src') || '';
      const alt = btn.getAttribute('data-alt') || '';
      const title = btn.getAttribute('data-title') || '';
      const caption = btn.getAttribute('data-caption') || '';
      triggerOpenImageStudio(src, alt, title, caption, false);
    }
  };

  const renderBubblePortal = () => {
    if (!isLiveMode || !bubbleMenu.visible || !mounted) return null;

    return createPortal(
      <div
        style={{
          position: 'fixed',
          top: `${bubbleMenu.top}px`,
          left: `${bubbleMenu.left}px`,
          transform: 'translateX(-50%)',
          zIndex: 99999,
        }}
        className="panic-live-bubble-toolbar flex items-center gap-0.5 rounded-xl border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-150 select-none text-xs"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {linkInputOpen ? (
          <div className="flex items-center gap-1.5 px-1 py-0.5" onMouseDown={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyLink();
                if (e.key === 'Escape') setLinkInputOpen(false);
              }}
              className="h-7 w-48 rounded-md border bg-background px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleApplyLink}
              className="p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              title="Apply Link"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLinkInputOpen(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Cancel"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => execFormat('bold')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition font-bold cursor-pointer"
              title="Bold"
            >
              <Bold className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('italic')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Italic"
            >
              <Italic className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('underline')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Underline"
            >
              <Underline className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('strikeThrough')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Strikethrough"
            >
              <Strikethrough className="size-3.5" />
            </button>

            <span className="w-px h-4 bg-border mx-0.5" />

            {/* Headings & Text */}
            <button
              type="button"
              onClick={() => execFormat('formatBlock', 'h2')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition font-semibold cursor-pointer"
              title="Heading 2"
            >
              <Heading2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('formatBlock', 'h3')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition font-semibold cursor-pointer"
              title="Heading 3"
            >
              <Heading3 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('formatBlock', 'p')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Paragraph"
            >
              <Type className="size-3.5" />
            </button>

            <span className="w-px h-4 bg-border mx-0.5" />

            {/* Blockquote, Lists, Indent */}
            <button
              type="button"
              onClick={() => execFormat('formatBlock', 'blockquote')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Quote Block"
            >
              <Quote className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('insertUnorderedList')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Bullet List"
            >
              <List className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('insertOrderedList')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Numbered List"
            >
              <ListOrdered className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('indent')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Increase Indent"
            >
              <Indent className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('outdent')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Decrease Indent"
            >
              <Outdent className="size-3.5" />
            </button>

            <span className="w-px h-4 bg-border mx-0.5" />

            {/* Link & Clear Format */}
            <button
              type="button"
              onClick={() => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                }
                setLinkInputOpen(true);
              }}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Insert Link"
            >
              <Link2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execFormat('removeFormat')}
              className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Clear Formatting"
            >
              <RemoveFormatting className="size-3.5" />
            </button>
          </>
        )}
      </div>,
      document.body
    );
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative">
      {isLiveMode && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono select-none">
          <span className="size-2 rounded-full bg-primary animate-ping" />
          <span>Live In-Context Studio (Highlight text to format, hover images to manage)</span>
        </div>
      )}

      {/* Floating Selection Bubble Formatting Toolbar */}
      {renderBubblePortal()}

      {/* Category Badge */}
      {category && (
        <div className="mb-3">
          <span className="inline-block px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider font-mono">
            {category.name}
          </span>
        </div>
      )}

      {/* Direct In-Context Editable Title */}
      <h1
        ref={titleRef}
        contentEditable={isLiveMode}
        suppressContentEditableWarning
        onFocus={() => { isTypingTitle.current = true; }}
        onBlur={() => { isTypingTitle.current = false; }}
        onInput={handleTitleInput}
        className={`text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight mb-4 font-serif ${
          isLiveMode ? 'outline-none focus:ring-2 focus:ring-primary/40 rounded-lg p-1 hover:bg-muted/30 transition cursor-text' : ''
        }`}
        dangerouslySetInnerHTML={{ __html: initialTitle }}
      />

      {/* Article Excerpt / Lead */}
      {excerpt && (
        <p className="text-lg text-muted-foreground leading-relaxed mb-6 font-serif">
          {excerpt}
        </p>
      )}

      {/* Author & Meta Row */}
      <div className="flex items-center space-x-4 border-y border-border py-4 mb-8 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          {author?.avatarUrl ? (
            <img src={author.avatarUrl} alt={author.name} className="size-6 rounded-full object-cover border" />
          ) : (
            <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
              {(author?.name || 'U')[0]}
            </div>
          )}
          <span className="text-foreground font-sans font-semibold">
            {author?.name || 'Ufuk Yorulmaz'}
          </span>
        </div>
        <span>•</span>
        <span>{publishedAt ? new Date(publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Editorial'}</span>
        <span>•</span>
        <span className="font-semibold text-primary">{readingTime || '5 min read'}</span>
      </div>

      {/* Featured Cover Image with [Manage Cover & AI] Center Button */}
      {coverUrl && (
        <div className="relative group mb-10 rounded-2xl overflow-hidden border border-border/80 bg-muted/20 shadow-md max-w-4xl select-none">
          <img
            src={coverUrl}
            alt="Cover"
            className="w-full aspect-video object-cover block rounded-2xl"
            onError={(e) => {
              e.currentTarget.src = '/media/fabelo-card-25.webp';
            }}
          />
          {isLiveMode && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center backdrop-blur-2xs">
              <button
                type="button"
                onClick={() => triggerOpenImageStudio(coverUrl, 'Cover Image', 'Article Cover', '', true)}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-2xl hover:bg-primary/90 flex items-center gap-2 transition cursor-pointer active:scale-95 border border-primary-foreground/20"
                title="Manage Cover Image, Replace & Generate AI Alt Text"
              >
                <Sparkles className="size-3.5" />
                <span>Manage Cover & AI</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Direct In-Context Editable Content Body */}
      <div
        ref={contentRef}
        contentEditable={isLiveMode}
        suppressContentEditableWarning
        onFocus={() => { isTypingContent.current = true; }}
        onBlur={() => { isTypingContent.current = false; }}
        onInput={handleContentInput}
        onClick={handleContentClick}
        className={`prose dark:prose-invert prose-neutral prose-lg max-w-none font-sans leading-relaxed
          prose-headings:font-serif prose-headings:text-foreground prose-headings:tracking-tight prose-headings:scroll-mt-24
          prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4 prose-h2:pt-4
          prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-5
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-4 prose-blockquote:border-l-primary prose-blockquote:bg-muted/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:text-muted-foreground
          prose-table:w-full prose-table:my-8 prose-table:border-collapse
          prose-th:border prose-th:border-border prose-th:bg-muted/40 prose-th:p-3 prose-th:text-left
          prose-td:border prose-td:border-border prose-td:p-3
          ${
            isLiveMode ? "outline-none focus:ring-2 focus:ring-primary/20 rounded-xl p-2 hover:bg-muted/20 transition cursor-text" : ""
          }`}
        dangerouslySetInnerHTML={{ __html: initialContentHtml || '' }}
      />
    </main>
  );
}
