'use client';

import React, { useState, useEffect, useRef } from 'react';

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
  const [title, setTitle] = useState(initialTitle);
  const [contentHtml, setContentHtml] = useState(initialContentHtml);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [isLiveMode, setIsLiveMode] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if inside studio iframe
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('live') === '1') {
        setIsLiveMode(true);
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PANIC_STUDIO_LIVE_UPDATE') {
        const { title: newTitle, contentHtml: newHtml, featuredImageUrl: newCover } = event.data.payload || {};
        if (newTitle !== undefined && titleRef.current && document.activeElement !== titleRef.current) {
          setTitle(newTitle);
          titleRef.current.innerText = newTitle;
        }
        if (newHtml !== undefined && contentRef.current && document.activeElement !== contentRef.current) {
          setContentHtml(newHtml);
          contentRef.current.innerHTML = newHtml;
        }
        if (newCover !== undefined) setCoverUrl(newCover);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleTitleInput = (e: React.FormEvent<HTMLHeadingElement>) => {
    const newText = e.currentTarget.innerText;
    setTitle(newText);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'PANIC_LIVE_TO_STUDIO_SYNC',
          payload: { title: newText },
        },
        '*'
      );
    }
  };

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newHtml = e.currentTarget.innerHTML;
    setContentHtml(newHtml);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'PANIC_LIVE_TO_STUDIO_SYNC',
          payload: { contentHtml: newHtml },
        },
        '*'
      );
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {isLiveMode && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
          <span className="size-2 rounded-full bg-amber-400 animate-ping" />
          <span>Live In-Context Direct Editing Active (Click any text below to edit directly)</span>
        </div>
      )}

      {/* Editable Title in Live Mode */}
      <h1
        ref={titleRef}
        contentEditable={isLiveMode}
        suppressContentEditableWarning
        onInput={handleTitleInput}
        className={`text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-6 font-serif ${
          isLiveMode ? 'outline-none focus:ring-2 focus:ring-amber-500/50 rounded-lg p-1 hover:bg-neutral-900/40 transition cursor-text' : ''
        }`}
      >
        {title}
      </h1>

      <div className="flex items-center space-x-4 border-y border-neutral-800 py-4 mb-8 text-xs text-neutral-400 font-mono">
        <span className="text-neutral-200 font-sans font-medium">Fabelo Editorial</span>
        <span>•</span>
        <span>{publishedAt ? new Date(publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Editorial'}</span>
        <span>•</span>
        <span>{readingTime || '5 min read'}</span>
      </div>

      {coverUrl && (
        <div className="mb-10 rounded-xl overflow-hidden border border-neutral-800 aspect-video bg-neutral-900">
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Editable Content Body in Live Mode */}
      <div
        ref={contentRef}
        contentEditable={isLiveMode}
        suppressContentEditableWarning
        onInput={handleContentInput}
        className={`prose prose-invert prose-lg max-w-none font-sans leading-relaxed
          prose-headings:font-serif prose-headings:text-white prose-headings:tracking-tight
          prose-a:text-amber-500 prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-xl prose-img:border prose-img:border-neutral-800
          prose-blockquote:border-l-amber-500 prose-blockquote:text-neutral-300 ${
            isLiveMode ? 'outline-none focus:ring-2 focus:ring-amber-500/30 rounded-xl p-2 hover:bg-neutral-900/30 transition cursor-text' : ''
          }`}
        dangerouslySetInnerHTML={{ __html: initialContentHtml || '' }}
      />
    </main>
  );
}
