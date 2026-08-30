'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  ExternalLink,
  Edit3,
  Monitor,
  Tablet,
  Smartphone,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LivePreviewDrawerProps {
  post: {
    id: number;
    title: string;
    slug: string;
    status: string;
  } | null;
  onClose: () => void;
}

export function LivePreviewDrawer({ post, onClose }: LivePreviewDrawerProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    if (post) {
      setMounted(true);
      setAnimatingOut(false);
      setLoading(true);
      document.body.style.overflow = 'hidden';
    } else if (mounted) {
      setAnimatingOut(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setAnimatingOut(false);
        document.body.style.overflow = 'unset';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [post]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSmoothClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!post && !mounted) return null;

  const handleSmoothClose = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  const handleRefresh = () => {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const getFrameWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'w-[375px] h-[85vh] my-auto rounded-2xl border border-neutral-800 shadow-2xl';
      case 'tablet':
        return 'w-[768px] h-[90vh] my-auto rounded-2xl border border-neutral-800 shadow-2xl';
      case 'desktop':
      default:
        return 'w-full h-full border-0';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Darkened & Blurred Backdrop (arka fon çok az görünür) */}
      <div
        className={`fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300 ease-out cursor-pointer ${
          animatingOut ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleSmoothClose}
      />

      {/* Smooth Slide-over Drawer (Üstte boşluk yok, kenara tam oturan) */}
      <aside
        className={`relative z-50 flex h-full w-full sm:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-[1600px] flex-col border-l border-neutral-800 bg-neutral-950 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          animatingOut ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Drawer Header (Üstte tam hizada) */}
        <div className="flex h-12 items-center justify-between gap-3 border-b border-neutral-800/80 bg-neutral-950 px-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Badge variant={post?.status === 'published' ? 'default' : 'secondary'} className="capitalize text-xs font-normal shrink-0">
              {post?.status}
            </Badge>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-semibold text-white truncate">{post?.title}</h2>
              <p className="text-[11px] text-neutral-400 font-mono truncate">/{post?.slug}</p>
            </div>
          </div>

          {/* Device Switcher & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Device Mode Toggle */}
            <div className="hidden sm:flex items-center rounded-lg border border-neutral-800 bg-neutral-900/60 p-0.5">
              <Button
                variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={() => setDeviceMode('desktop')}
                title="Desktop (100%)"
                className={deviceMode === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}
              >
                <Monitor className="size-3.5" />
              </Button>
              <Button
                variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={() => setDeviceMode('tablet')}
                title="Tablet (768px)"
                className={deviceMode === 'tablet' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}
              >
                <Tablet className="size-3.5" />
              </Button>
              <Button
                variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={() => setDeviceMode('mobile')}
                title="Mobile (375px)"
                className={deviceMode === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}
              >
                <Smartphone className="size-3.5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleRefresh}
              className="text-neutral-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="size-3.5" />
            </Button>

            {post && (
              <Link href={`/panic/posts/${post.id}`}>
                <Button size="sm" className="gap-1.5 h-8 text-xs font-medium">
                  <Edit3 className="size-3.5" />
                  <span>Edit in Studio</span>
                </Button>
              </Link>
            )}

            {post && (
              <Link href={`/${post.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs text-neutral-300 border-neutral-800 hover:bg-neutral-900">
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">Open New Tab</span>
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleSmoothClose}
              className="text-neutral-400 hover:text-white ml-1"
              title="Close (Esc)"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Drawer Body (Sıfır üst/yan boşluk) */}
        <div className={`relative flex-1 bg-neutral-950 overflow-hidden flex items-center justify-center ${deviceMode !== 'desktop' ? 'p-4 bg-neutral-900/30' : 'p-0'}`}>
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-xs z-10 space-y-2">
              <Loader2 className="size-6 text-amber-500 animate-spin" />
              <p className="text-xs text-neutral-400 font-medium">Loading live preview...</p>
            </div>
          )}

          {post && (
            <div className={`transition-all duration-300 overflow-hidden bg-neutral-950 ${getFrameWidth()}`}>
              <iframe
                key={iframeKey}
                src={`/${post.slug}`}
                className="w-full h-full border-0 bg-neutral-950"
                onLoad={() => setLoading(false)}
                title={post.title}
              />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
