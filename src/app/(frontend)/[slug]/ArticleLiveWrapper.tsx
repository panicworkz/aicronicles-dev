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
        newImg.setAttribute('onerror', "this.src='https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp'");

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
        return;
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
    <div className="gh-viewport min-h-screen bg-background text-foreground transition-colors duration-200">
      {isLiveMode && (
        <div className="fixed top-20 right-6 z-50 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-mono shadow-xl select-none animate-in fade-in">
          <span className="size-2 rounded-full bg-white animate-ping" />
          <span>Live In-Context Studio (Highlight text to format)</span>
        </div>
      )}

      {/* Floating Selection Bubble Formatting Toolbar */}
      {renderBubblePortal()}

      {/* Main Ghost Article */}
      <main className="gh-main py-10">
        <article className={`gh-article post tag-${category?.slug || 'ai-tech'}`}>
          <header className="gh-article-header gh-canvas">
            {category && (
              <Link className="gh-article-tag" href={`/tag/${category.slug}`}>
                {category.name}
              </Link>
            )}

            <h1
              ref={titleRef}
              contentEditable={isLiveMode}
              suppressContentEditableWarning
              onFocus={() => { isTypingTitle.current = true; }}
              onBlur={() => { isTypingTitle.current = false; }}
              onInput={handleTitleInput}
              className={`gh-article-title is-title ${
                isLiveMode ? 'outline-none focus:ring-2 focus:ring-primary/40 rounded-lg p-1 hover:bg-muted/30 transition cursor-text' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: initialTitle }}
            />

            {excerpt && (
              <p className="gh-article-excerpt is-body">
                {excerpt}
              </p>
            )}

            <div className="gh-article-meta">
              <div className="gh-article-author-image instapaper_ignore">
                <Link href={`/author/${author?.slug || 'ufuk-yorulmaz'}`}>
                  <img
                    className="author-profile-image"
                    src={author?.avatarUrl || 'https://fabelo.io/content/images/size/w160/2026/04/ufuk_square.png'}
                    alt={author?.name || 'Ufuk Yorulmaz'}
                  />
                </Link>
              </div>
              <div className="gh-article-meta-wrapper">
                <h4 className="gh-article-author-name">
                  <Link href={`/author/${author?.slug || 'ufuk-yorulmaz'}`}>{author?.name || 'Ufuk Yorulmaz'}</Link>
                </h4>
                <div className="gh-article-meta-content">
                  <time className="gh-article-meta-date" dateTime={publishedAt || '2026-07-02'}>
                    {publishedAt ? new Date(publishedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '02 Jul 2026'}
                  </time>
                  <span className="gh-article-meta-length">
                    <span className="bull">—</span> {readingTime || '21 min read'}
                  </span>
                </div>
              </div>
            </div>

            {coverUrl && (
              <figure className="gh-article-image relative group">
                <img
                  src={coverUrl}
                  alt={initialTitle}
                  onError={(e) => {
                    e.currentTarget.src = 'https://fabelo.io/content/images/size/w1200/2026/07/pexels-photo-7283714.webp';
                  }}
                />
                <figcaption>
                  <a href="https://www.pexels.com/photo/a-person-typing-on-the-laptop-7283714/" target="_blank" rel="noopener noreferrer">
                    Photo by www.kaboompics.com on Pexels
                  </a>
                </figcaption>
                {isLiveMode && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center backdrop-blur-2xs rounded-lg">
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
              </figure>
            )}
          </header>

          {/* Body Content Section using Native Ghost Source Canvas System */}
          <section
            ref={contentRef}
            contentEditable={isLiveMode}
            suppressContentEditableWarning
            onFocus={() => { isTypingContent.current = true; }}
            onBlur={() => { isTypingContent.current = false; }}
            onInput={handleContentInput}
            onClick={handleContentClick}
            className={`gh-content gh-canvas is-body ${
              isLiveMode ? 'outline-none focus:ring-2 focus:ring-primary/20 rounded-xl p-2 hover:bg-muted/20 transition cursor-text' : ''
            }`}
            dangerouslySetInnerHTML={{ __html: initialContentHtml || '' }}
          />
        </article>
      </main>
    </div>
  );
}
