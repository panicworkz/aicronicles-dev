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

  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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
            enhanceContentImages();
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

  // Enhance all images inside contentRef in live mode with a single centered [Manage Image & AI] button
  const enhanceContentImages = () => {
    if (!contentRef.current || typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const inLive = urlParams.get('live') === '1';
    if (!inLive) return;

    const imgs = contentRef.current.querySelectorAll('img');
    imgs.forEach((img) => {
      const parent = img.parentElement;
      if (parent && parent.getAttribute('data-image-wrapper') === 'true') {
        return;
      }

      // Create container identical to TipTap editor
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-image-wrapper', 'true');
      wrapper.className = 'relative my-6 block group select-none max-w-3xl';

      const innerBox = document.createElement('div');
      innerBox.className = 'relative rounded-2xl overflow-hidden border border-border/80 bg-muted/20 shadow-md transition-all duration-200 inline-block w-full';

      img.parentNode?.insertBefore(wrapper, img);
      innerBox.appendChild(img);
      wrapper.appendChild(innerBox);

      img.className = 'w-full h-auto object-cover rounded-2xl block min-h-[140px] bg-muted/30';
      img.onerror = () => {
        img.src = '/media/fabelo-card-25.webp';
      };

      // Clean single centered [Manage Image & AI] button
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-2xs';

      const manageBtn = document.createElement('button');
      manageBtn.type = 'button';
      manageBtn.className = 'px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-2xl hover:bg-primary/90 flex items-center gap-2 transition cursor-pointer active:scale-95 border border-primary-foreground/20';
      manageBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles size-3.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        <span>Manage Image & AI</span>
      `;
      manageBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerOpenImageStudio(img.src, img.alt, img.title, false);
      };

      overlay.appendChild(manageBtn);
      innerBox.appendChild(overlay);
    });
  };

  // Enhance images on initial load
  useEffect(() => {
    if (titleRef.current && !titleRef.current.innerText) {
      titleRef.current.innerText = initialTitle;
    }
    if (contentRef.current && !contentRef.current.innerHTML) {
      contentRef.current.innerHTML = initialContentHtml;
    }
    enhanceContentImages();
  }, [initialTitle, initialContentHtml, isLiveMode]);

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

  const triggerOpenImageStudio = (src: string, alt?: string, title?: string, isCover = false) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'PANIC_OPEN_IMAGE_STUDIO',
          payload: { src, alt, title, isCover },
        },
        '*'
      );
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative">
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
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-2xs">
              <button
                type="button"
                onClick={() => triggerOpenImageStudio(coverUrl, 'Cover Image', 'Article Cover', true)}
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
        className={`prose dark:prose-invert prose-neutral prose-lg max-w-none font-sans leading-relaxed
          prose-headings:font-serif prose-headings:text-foreground prose-headings:tracking-tight
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground ${
            isLiveMode ? 'outline-none focus:ring-2 focus:ring-primary/30 rounded-xl p-2 hover:bg-muted/30 transition cursor-text' : ''
          }`}
        dangerouslySetInnerHTML={{ __html: initialContentHtml || '' }}
      />
    </main>
  );
}
