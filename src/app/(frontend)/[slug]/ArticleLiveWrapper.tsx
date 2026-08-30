'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface ArticleLiveWrapperProps {
  initialTitle: string;
  initialContentHtml: string;
  initialCoverUrl?: string | null;
  readingTime?: string | null;
  publishedAt?: string | null;
}

export function ArticleLiveWrapper({
  initialTitle,
  initialContentHtml,
  initialCoverUrl,
  readingTime,
  publishedAt,
}: ArticleLiveWrapperProps) {
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [hoveredImgRect, setHoveredImgRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    src: string;
    alt: string;
    title: string;
    caption: string;
  } | null>(null);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const isTypingTitle = useRef(false);
  const isTypingContent = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentHoverSrc = useRef<string | null>(null);

  useEffect(() => {
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
          contentRef.current.innerHTML = newHtml;
        }

        if (newCover !== undefined) {
          setCoverUrl(newCover);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Flicker-free hover tracking: only update when entering a new image
  const handleContentMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLiveMode) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

      const targetSrc = img.getAttribute('src') || img.src;
      if (currentHoverSrc.current === targetSrc) return;

      currentHoverSrc.current = targetSrc;
      const imgRect = img.getBoundingClientRect();
      const contRect = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };

      setHoveredImgRect({
        top: imgRect.top - contRect.top,
        left: imgRect.left - contRect.left,
        width: imgRect.width,
        height: imgRect.height,
        src: targetSrc,
        alt: img.getAttribute('alt') || '',
        title: img.getAttribute('title') || '',
        caption: img.getAttribute('data-caption') || '',
      });
    }
  };

  const handleContentMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      currentHoverSrc.current = null;
      setHoveredImgRect(null);
    }, 150);
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

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newHtml = e.currentTarget.innerHTML;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'PANIC_LIVE_TO_STUDIO_SYNC',
            source: 'live_iframe',
            payload: { contentHtml: newHtml },
          },
          '*'
        );
      }
    }, 150);
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

  return (
    <main ref={containerRef} className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative">
      {isLiveMode && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono select-none">
          <span className="size-2 rounded-full bg-primary animate-ping" />
          <span>Live In-Context Studio (Hover any image to manage with AI)</span>
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
        className={`text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight mb-6 font-serif ${
          isLiveMode ? 'outline-none focus:ring-2 focus:ring-primary/40 rounded-lg p-1 hover:bg-muted/50 transition cursor-text' : ''
        }`}
      >
        {initialTitle}
      </h1>

      <div className="flex items-center space-x-4 border-y border-border py-4 mb-8 text-xs text-muted-foreground font-mono">
        <span className="text-foreground font-sans font-medium">Fabelo Editorial</span>
        <span>•</span>
        <span>{publishedAt ? new Date(publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Editorial'}</span>
        <span>•</span>
        <span>{readingTime || '5 min read'}</span>
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
        onMouseOver={handleContentMouseOver}
        onMouseLeave={handleContentMouseLeave}
        className={`prose dark:prose-invert prose-neutral prose-lg max-w-none font-sans leading-relaxed
          prose-headings:font-serif prose-headings:text-foreground prose-headings:tracking-tight
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-2xl prose-img:border prose-img:border-border/80 prose-img:shadow-md
          prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground ${
            isLiveMode ? 'outline-none focus:ring-2 focus:ring-primary/30 rounded-xl p-2 hover:bg-muted/30 transition cursor-text' : ''
          }`}
        dangerouslySetInnerHTML={{ __html: initialContentHtml || '' }}
      />

      {/* Solid Flicker-Free Floating React Hover Overlay for Inline Images */}
      {isLiveMode && hoveredImgRect && (
        <div
          style={{
            position: 'absolute',
            top: hoveredImgRect.top,
            left: hoveredImgRect.left,
            width: hoveredImgRect.width,
            height: hoveredImgRect.height,
            pointerEvents: 'auto',
          }}
          className="rounded-2xl flex items-center justify-center bg-black/40 backdrop-blur-2xs transition-opacity duration-150 z-20"
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = setTimeout(() => {
              currentHoverSrc.current = null;
              setHoveredImgRect(null);
            }, 100);
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              triggerOpenImageStudio(
                hoveredImgRect.src,
                hoveredImgRect.alt,
                hoveredImgRect.title,
                hoveredImgRect.caption,
                false
              );
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-2xl hover:bg-primary/90 flex items-center gap-2 transition cursor-pointer active:scale-95 border border-primary-foreground/20"
            title="Manage Image, Replace & Generate AI Alt Text"
          >
            <Sparkles className="size-3.5" />
            <span>Manage Image & AI</span>
          </button>
        </div>
      )}
    </main>
  );
}
