'use client';

import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Check if in studio iframe live mode
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('live') === '1') {
        setIsLiveMode(true);
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PANIC_STUDIO_LIVE_UPDATE') {
        const { title: newTitle, contentHtml: newHtml, featuredImageUrl: newCover } = event.data.payload || {};
        if (newTitle !== undefined) setTitle(newTitle);
        if (newHtml !== undefined) setContentHtml(newHtml);
        if (newCover !== undefined) setCoverUrl(newCover);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {isLiveMode && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
          <span className="size-2 rounded-full bg-amber-400 animate-ping" />
          <span>Panic Live Interactive Studio</span>
        </div>
      )}

      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-6 font-serif">
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

      {/* Content Body with Realtime Live Sync */}
      <div
        className="prose prose-invert prose-lg max-w-none font-sans leading-relaxed
          prose-headings:font-serif prose-headings:text-white prose-headings:tracking-tight
          prose-a:text-amber-500 prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-xl prose-img:border prose-img:border-neutral-800
          prose-blockquote:border-l-amber-500 prose-blockquote:text-neutral-300"
        dangerouslySetInnerHTML={{ __html: contentHtml || '' }}
      />
    </main>
  );
}
