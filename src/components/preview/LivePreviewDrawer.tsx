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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (post) {
      setLoading(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [post]);

  if (!post) return null;

  const getFrameWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'w-[375px]';
      case 'tablet':
        return 'w-[768px]';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <aside
        className="relative z-50 flex h-full w-full sm:w-[650px] lg:w-[850px] xl:w-[1000px] flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="flex h-14 items-center justify-between gap-3 border-b border-border bg-background px-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="capitalize text-xs font-normal shrink-0">
              {post.status}
            </Badge>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-semibold text-foreground truncate">{post.title}</h2>
              <p className="text-[11px] text-muted-foreground font-mono truncate">/{post.slug}</p>
            </div>
          </div>

          {/* Device Switcher & Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Device Toggle */}
            <div className="hidden sm:flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
              <Button
                variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setDeviceMode('desktop')}
                title="Desktop View (100%)"
              >
                <Monitor className="size-3.5" />
              </Button>
              <Button
                variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setDeviceMode('tablet')}
                title="Tablet View (768px)"
              >
                <Tablet className="size-3.5" />
              </Button>
              <Button
                variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setDeviceMode('mobile')}
                title="Mobile View (375px)"
              >
                <Smartphone className="size-3.5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              title="Refresh Live Preview"
            >
              <RefreshCw className="size-3.5" />
            </Button>

            <Link href={`/panic/posts/${post.id}`}>
              <Button size="default" className="gap-1.5 hidden md:inline-flex">
                <Edit3 className="size-3.5" />
                <span>Edit</span>
              </Button>
            </Link>

            <Link href={`/${post.slug}`} target="_blank">
              <Button variant="outline" size="default" className="gap-1.5">
                <ExternalLink className="size-3.5" />
                <span className="hidden sm:inline">Open New Tab</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close Preview (Esc)"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Drawer Body with Responsive Frame */}
        <div className="relative flex-1 bg-muted/40 p-2 sm:p-4 overflow-y-auto flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-xs z-10 space-y-2">
              <Loader2 className="size-6 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Loading live article preview...</p>
            </div>
          )}

          <div
            className={`h-full transition-all duration-300 rounded-xl overflow-hidden border border-border bg-background shadow-lg mx-auto ${getFrameWidth()}`}
          >
            <iframe
              key={iframeKey}
              src={`/${post.slug}`}
              className="w-full h-full border-0 bg-background"
              onLoad={() => setLoading(false)}
              title={post.title}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
