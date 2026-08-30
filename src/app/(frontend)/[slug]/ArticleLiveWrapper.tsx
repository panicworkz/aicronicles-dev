'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Edit3, Trash2 } from 'lucide-react';

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

  // Enhance all images inside contentRef in live mode with exact center overlay buttons
  const enhanceContentImages = () => {
    if (!contentRef.current || typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const inLive = urlParams.get('live') === '1';
    if (!inLive) return;

    const imgs = contentRef.current.querySelectorAll('img');
    imgs.forEach((img) => {
      // Check if already enhanced
      const parent = img.parentElement;
      if (parent && parent.getAttribute('data-image-wrapper') === 'true') {
        return;
      }

      // Create exact matching container like left TipTap editor
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-image-wrapper', 'true');
      wrapper.className = 'relative my-6 block group select-none max-w-3xl';

      const innerBox = document.createElement('div');
      innerBox.className = 'relative rounded-2xl overflow-hidden border border-border/80 bg-muted/20 shadow-md transition-all duration-200 inline-block w-full';

      img.parentNode?.insertBefore(wrapper, img);
      innerBox.appendChild(img);
      wrapper.appendChild(innerBox);

      img.className = 'w-full h-auto object-cover rounded-2xl block';

      // Centered 3-button Overlay
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-2xs';

      // 1. Replace Button
      const replaceBtn = document.createElement('button');
      replaceBtn.type = 'button';
      replaceBtn.className = 'px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xl hover:bg-primary/90 flex items-center gap-1.5 transition cursor-pointer active:scale-95';
      replaceBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw size-3.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
        <span>Replace Image</span>
      `;
      replaceBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerReplaceImage(img.src, img.alt, false);
      };

      // 2. Alt Button
      const altBtn = document.createElement('button');
      altBtn.type = 'button';
      altBtn.className = 'px-3 py-2 rounded-xl bg-background/90 text-foreground hover:bg-background text-xs font-medium shadow-xl flex items-center gap-1.5 transition cursor-pointer backdrop-blur';
      altBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit-3 size-3.5 text-primary"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        <span>Alt</span>
      `;
      altBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const newAlt = window.prompt('Edit Image Alt Text (SEO & Accessibility):', img.alt || '');
        if (newAlt !== null) {
          img.alt = newAlt;
          syncContentToParent();
        }
      };

      // 3. Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'p-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium shadow-xl flex items-center transition cursor-pointer';
      deleteBtn.title = 'Delete Image';
      deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2 size-3.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
      `;
      deleteBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        wrapper.remove();
        syncContentToParent();
      };

      overlay.appendChild(replaceBtn);
      overlay.appendChild(altBtn);
      overlay.appendChild(deleteBtn);
      innerBox.appendChild(overlay);
    });
  };

  const syncContentToParent = () => {
    if (!contentRef.current) return;
    // Clone to strip wrapper data before sending
    const clone = contentRef.current.cloneNode(true) as HTMLElement;
    const wrappers = clone.querySelectorAll('[data-image-wrapper="true"]');
    wrappers.forEach((w) => {
      const img = w.querySelector('img');
      if (img) {
        img.className = 'rounded-xl max-w-full my-6 border border-border/80 shadow-md mx-auto object-cover';
        w.parentNode?.insertBefore(img, w);
        w.remove();
      }
    });

    const cleanHtml = clone.innerHTML;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'PANIC_LIVE_TO_STUDIO_SYNC',
          source: 'live_iframe',
          payload: { contentHtml: cleanHtml },
        },
        '*'
      );
    }
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

  const handleDeleteCover = () => {
    setCoverUrl('');
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'PANIC_DELETE_COVER_REQUEST',
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
          <span>Live In-Context Studio (Hover any image to replace, edit alt, or delete)</span>
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

      {/* Featured Cover Image with Exact Centered 3-Button Hover Overlay */}
      {coverUrl && (
        <div className="relative group mb-10 rounded-2xl overflow-hidden border border-border/80 bg-muted/20 shadow-md max-w-4xl select-none">
          <img
            src={coverUrl}
            alt="Cover"
            className="w-full aspect-video object-cover block rounded-2xl"
          />
          {isLiveMode && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-2xs">
              <button
                type="button"
                onClick={() => triggerReplaceImage(coverUrl, 'Cover', true)}
                className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xl hover:bg-primary/90 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                title="Replace Cover Image"
              >
                <RefreshCw className="size-3.5" />
                <span>Replace Image</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const newAlt = window.prompt('Edit Cover Alt Text:', 'Article Cover');
                  if (newAlt !== null && window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'PANIC_UPDATE_COVER_ALT', payload: { alt: newAlt } }, '*');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-background/90 text-foreground hover:bg-background text-xs font-medium shadow-xl flex items-center gap-1.5 transition cursor-pointer backdrop-blur"
                title="Edit Alt Text"
              >
                <Edit3 className="size-3.5 text-primary" />
                <span>Alt</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteCover}
                className="p-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium shadow-xl flex items-center transition cursor-pointer"
                title="Delete Cover Image"
              >
                <Trash2 className="size-3.5" />
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
