'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Sparkles,
  Clock,
  Calendar,
  Share2,
  Bookmark,
  Check,
  X,
  ArrowUpRight,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';

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

export function cleanHeadingIds(rawHtml: string): string {
  if (!rawHtml) return '';
  return rawHtml.replace(/<h([1-6])([^>]*)id=["']([^"']+)["']([^>]*)>/gi, (match, level, before, id, after) => {
    let cleanId = decodeURIComponent(id);
    cleanId = cleanId
      .toLowerCase()
      .replace(/[—–]/g, '-')
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `<h${level}${before}id="${cleanId}"${after}>`;
  });
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
  const [mounted, setMounted] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Lightbox Modal State
  const [lightboxData, setLightboxData] = useState<{
    open: boolean;
    src: string;
    alt: string;
    caption?: string;
  }>({
    open: false,
    src: '',
    alt: '',
    caption: '',
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const formattedHtml = cleanHeadingIds(initialContentHtml);

  // Reading progress scroll tracker
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      if (scrollHeight > 0) {
        setReadingProgress(Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intercept click on images inside content for Lightbox
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 1. Image Click -> Lightbox
    const imgEl = target.closest('img');
    if (imgEl) {
      const figure = imgEl.closest('figure');
      const caption = figure?.querySelector('figcaption')?.innerHTML || imgEl.alt || '';
      setLightboxData({
        open: true,
        src: imgEl.src,
        alt: imgEl.alt || initialTitle,
        caption,
      });
      return;
    }

    // 2. TOC Anchor Links -> Smooth Scroll
    const anchor = target.closest('a');
    if (anchor && anchor.getAttribute('href')?.startsWith('#')) {
      const rawTargetId = anchor.getAttribute('href')?.substring(1);
      if (rawTargetId) {
        e.preventDefault();
        const targetElement =
          document.getElementById(rawTargetId) ||
          document.getElementById(decodeURIComponent(rawTargetId)) ||
          document.querySelector(`[id*="${rawTargetId}"]`);

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (history.pushState) {
            history.pushState(null, '', `#${rawTargetId}`);
          }
        }
      }
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Article link copied to clipboard!');
    }
  };

  // Render Full-Screen Lightbox Portal
  const renderLightboxPortal = () => {
    if (!mounted || !lightboxData.open) return null;
    return createPortal(
      <div
        onClick={() => setLightboxData((prev) => ({ ...prev, open: false }))}
        className="fixed inset-0 z-[100000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200 cursor-zoom-out select-none"
      >
        <button
          type="button"
          onClick={() => setLightboxData((prev) => ({ ...prev, open: false }))}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          title="Close Lightbox (Esc)"
        >
          <X className="size-6" />
        </button>

        <div className="relative max-w-6xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <img
            src={lightboxData.src}
            alt={lightboxData.alt}
            className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
          />
          {lightboxData.caption && (
            <div
              className="mt-4 text-xs sm:text-sm text-neutral-300 text-center max-w-3xl leading-relaxed italic"
              dangerouslySetInnerHTML={{ __html: lightboxData.caption }}
            />
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 inset-x-0 z-[100] h-1 bg-muted/40">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 transition-all duration-100 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Full-Screen Image / Chart Lightbox */}
      {renderLightboxPortal()}

      {/* Main Luxury Magazine Article Container */}
      <article className="space-y-8">
        {/* Article Header */}
        <header className="space-y-6 border-b border-border pb-8">
          {category && (
            <Link
              href={`/tag/${category.slug}`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition"
            >
              <Sparkles className="size-3.5" />
              <span>{category.name}</span>
            </Link>
          )}

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-serif tracking-tight text-foreground leading-[1.15]">
            {initialTitle}
          </h1>

          {excerpt && (
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-sans font-normal max-w-4xl">
              {excerpt}
            </p>
          )}

          {/* Author & Publishing Meta Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/60">
            <div className="flex items-center gap-4">
              <Link href={`/author/${author?.slug || 'ufuk-yorulmaz'}`} className="shrink-0">
                <img
                  src={author?.avatarUrl || 'https://fabelo.io/content/images/size/w160/2026/04/ufuk_square.png'}
                  alt={author?.name || 'Author'}
                  className="size-11 rounded-full object-cover border border-border shadow-xs"
                />
              </Link>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold font-serif text-foreground hover:text-primary transition">
                  <Link href={`/author/${author?.slug || 'ufuk-yorulmaz'}`}>{author?.name || 'Ufuk Yorulmaz'}</Link>
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    <span>{publishedAt ? new Date(publishedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '02 Jul 2026'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>{readingTime || '21 min read'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Social Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Share2 className="size-3.5 text-primary" />
              <span>Share Article</span>
            </button>
          </div>

          {/* Hero Feature Cover Photo */}
          {initialCoverUrl && (
            <figure className="relative rounded-3xl overflow-hidden border border-border bg-muted/40 shadow-lg group cursor-zoom-in my-8">
              <img
                src={initialCoverUrl}
                alt={initialTitle}
                onClick={() => {
                  setLightboxData({
                    open: true,
                    src: initialCoverUrl,
                    alt: initialTitle,
                    caption: 'Photo by www.kaboompics.com on Pexels',
                  });
                }}
                className="w-full h-auto max-h-[600px] object-cover transition-transform duration-700 group-hover:scale-102"
              />
              <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-mono flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ZoomIn className="size-3.5 text-amber-400" />
                <span>Click to Expand</span>
              </div>
            </figure>
          )}
        </header>

        {/* Bespoke Editorial Body Section */}
        <section
          ref={contentRef}
          onClick={handleContentClick}
          className="fabelo-magazine-article"
          dangerouslySetInnerHTML={{ __html: formattedHtml || '' }}
        />
      </article>
    </>
  );
}
