'use client';

import React, { useState } from 'react';
import { Globe, Share2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SerpSocialPreviewProps {
  title: string;
  slug: string;
  excerpt: string;
  featuredImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export function SerpSocialPreview({
  title,
  slug,
  excerpt,
  featuredImageUrl,
  metaTitle,
  metaDescription,
}: SerpSocialPreviewProps) {
  const [activeTab, setActiveTab] = useState<'google' | 'twitter' | 'linkedin'>('google');

  const displayTitle = metaTitle || title || 'Article Title';
  const displayDesc = metaDescription || excerpt || 'Article description teaser for search engines and social feeds...';
  const url = `https://fabelo.testworkz.com/${slug || 'guide-slug'}`;

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Globe className="size-4 text-primary" />
          <span>SERP & Social Card Simulator</span>
        </CardTitle>
        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
          <Button
            variant={activeTab === 'google' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={() => setActiveTab('google')}
            className="w-16 text-[10px]"
          >
            Google
          </Button>
          <Button
            variant={activeTab === 'twitter' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={() => setActiveTab('twitter')}
            className="w-16 text-[10px]"
          >
            X / Twitter
          </Button>
          <Button
            variant={activeTab === 'linkedin' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={() => setActiveTab('linkedin')}
            className="w-16 text-[10px]"
          >
            LinkedIn
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'google' && (
          <div className="p-4 rounded-xl border bg-background space-y-1.5 font-sans">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">F</div>
              <span className="truncate">fabelo.testworkz.com › {slug}</span>
            </div>
            <h4 className="text-base text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer line-clamp-1">
              {displayTitle}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {displayDesc}
            </p>
          </div>
        )}

        {activeTab === 'twitter' && (
          <div className="rounded-xl border bg-background overflow-hidden space-y-2">
            {featuredImageUrl ? (
              <div className="aspect-video w-full bg-muted">
                <img src={featuredImageUrl} alt={title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
            <div className="p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-mono">fabelo.testworkz.com</p>
              <h4 className="text-xs font-bold text-foreground line-clamp-1">{displayTitle}</h4>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{displayDesc}</p>
            </div>
          </div>
        )}

        {activeTab === 'linkedin' && (
          <div className="rounded-xl border bg-background overflow-hidden">
            {featuredImageUrl && (
              <div className="aspect-video w-full bg-muted">
                <img src={featuredImageUrl} alt={title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-3 bg-muted/20 border-t space-y-0.5">
              <h4 className="text-xs font-bold text-foreground line-clamp-1">{displayTitle}</h4>
              <p className="text-[10px] text-muted-foreground font-mono">fabelo.testworkz.com</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
