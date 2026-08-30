'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

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
  const [activeImageTarget, setActiveImageTarget] = useState<{ src: string; alt?: string; rect: { top: number; left: number; width: number; height: number }; isCover?: boolean } | null>(null);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const isTypingTitle = useRef(false);
  const isTypingContent = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check URL parameters for live mode and theme
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('live') === '1') {
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
      // Live Theme Synchronization
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
          if (contentRef.current.innerHTML !== newHtml) {
            contentRef.current.innerHTML = newHtml;
          }
        }

        if (newCover !== undefined) {
          setCoverUrl(newCover);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Track hover over images with zero layout jitter
  useEffect(() => {
    if (!isLiveMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        const mainRect = containerRef.current?.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();

        if (mainRect) {
          setActiveImageTarget({
            src: img.src,
            alt: img.alt,
            rect: {
              top: imgRect.top - mainRect.top + window.scrollY,
              left: imgRect.left - mainRect.left + window.scrollX,
              width: imgRect.width,
              height: imgRect.height,
            },
            isCover: img.getAttribute('data-cover') === 'true',
          });
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isLiveMode]);

  // Set initial content on mount
  useEffect(() => {
    if (titleRef.current && !titleRef.current.innerText) {
      titleRef.current.innerText = initialTitle;
    }
    if (contentRef.current && !contentRef.current.innerHTML) {
      contentRef.current.innerHTML = initialContentHtml;
    }
  }, [initialTitle, initialContentHtml]);

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

  const triggerReplaceImage = (src: string, alt?: string, isCover = false) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'PANIC_REPLACE_IMAGE_REQUEST',
          payload: { src, alt, isCover },
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
          <span>Live In-Context Studio (Hover & click any image to replace)</span>
        </div>
      )}

      {/* Floating Replace Button positioned over the active hovered image */}
      {isLiveMode && activeImageTarget && (
        <div
          style={{
            position: 'absolute',
            top: `${activeImageTarget.rect.top + 16}px`,
            left: `${activeImageTarget.rect.left + activeImageTarget.rect.width - 150}px`,
            zIndex: 50,
          }}
          className="animate-in fade-in duration-150"
        >
          <button
            type="button"
            onClick={() => triggerReplaceImage(activeImageTarget.src, activeImageTarget.alt, activeImageTarget.isCover)}
            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-2xl hover:bg-primary/90 flex items-center gap-1.5 transition cursor-pointer active:scale-95 border border-primary-foreground/20 backdrop-blur"
          >
            <RefreshCw className="size-3.5" />
            <span>Replace Image</span>
          </button>
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

      {/* Featured Cover Image */}
      {coverUrl && (
        <div className="relative group mb-10 rounded-xl overflow-hidden border border-border aspect-video bg-muted/40 shadow-sm">
          <img
            src={coverUrl}
            alt="Cover"
            data-cover="true"
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => {
              if (isLiveMode) triggerReplaceImage(coverUrl, 'Cover', true);
            }}
          />
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
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (isLiveMode && target.tagName === 'IMG') {
            const img = target as HTMLImageElement;
            triggerReplaceImage(img.src, img.alt, false);
          }
        }}
        className={`prose dark:prose-invert prose-neutral prose-lg max-w-none font-sans leading-relaxed
          prose-headings:font-serif prose-headings:text-foreground prose-headings:tracking-tight
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:cursor-pointer
          prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground ${
            isLiveMode ? 'outline-none focus:ring-2 focus:ring-primary/30 rounded-xl p-2 hover:bg-muted/30 transition cursor-text' : ''
          }`}
        dangerouslySetInnerHTML={{ __html: initialContentHtml || '' }}
      />
    </main>
  );
}
