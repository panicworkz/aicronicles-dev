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
  const [formattedHtml, setFormattedHtml] = useState(initialContentHtml);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isTypingTitle = useRef(false);
  const isTypingContent = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to format raw HTML with GPU-accelerated CSS hover overlays for all images
  const formatContentWithLiveImages = (rawHtml: string) => {
    if (!rawHtml || typeof window === 'undefined') return rawHtml;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');
      const imgs = doc.querySelectorAll('img');

      imgs.forEach((img) => {
        // If already inside a panic image box, skip
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

    setFormattedHtml(formatContentWithLiveImages(initialContentHtml));

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

        if (newHtml !== undefined && !isTypingContent.current) {
          setFormattedHtml(formatContentWithLiveImages(newHtml));
        }

        if (newCover !== undefined) {
          setCoverUrl(newCover);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [initialContentHtml]);

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
    const rawHtml = e.currentTarget.innerHTML;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (window.parent && window.parent !== window) {
        // Strip live wrapper elements before sending back to studio
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

  // Pure click handler on container using event delegation
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

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative">
      {isLiveMode && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono select-none">
          <span className="size-2 rounded-full bg-primary animate-ping" />
          <span>Live In-Context Studio (Click to edit text, hover images to manage)</span>
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
          isLiveMode ? 'outline-none focus:ring-2 focus:ring-primary/40 rounded-lg p-1 hover:bg-muted/30 transition cursor-text' : ''
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
        onClick={handleContentClick}
        className={`prose dark:prose-invert prose-neutral prose-lg max-w-none font-sans leading-relaxed
          prose-headings:font-serif prose-headings:text-foreground prose-headings:tracking-tight
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground ${
            isLiveMode ? 'outline-none focus:ring-2 focus:ring-primary/20 rounded-xl p-2 hover:bg-muted/20 transition cursor-text' : ''
          }`}
        dangerouslySetInnerHTML={{ __html: formattedHtml || '' }}
      />
    </main>
  );
}
