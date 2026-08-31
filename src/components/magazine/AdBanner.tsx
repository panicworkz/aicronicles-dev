'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ExternalLink, X, ArrowUpRight, ShieldCheck } from 'lucide-react';

export type AdSlotType =
  | 'billboard'       // 970x90 or 970x250 desktop / 320x100 mobile
  | 'leaderboard'     // 728x90 desktop / 320x50 mobile
  | 'rectangle'       // 300x250 Medium Rectangle
  | 'halfpage'        // 300x600 Sticky Skyscraper
  | 'native-infeed'   // Blends with editorial article cards
  | 'in-article'      // Placed inside long-form articles
  | 'sticky-bottom';  // Floating adhesive bar

interface AdBannerProps {
  slot: AdSlotType;
  className?: string;
  sponsorName?: string;
  sponsorTagline?: string;
  sponsorUrl?: string;
  sponsorImageUrl?: string;
  ctaText?: string;
}

export function AdBanner({
  slot,
  className = '',
  sponsorName = 'Panic Studio Enterprise',
  sponsorTagline = 'Next-generation AI CMS & Headless publishing platform for modern media brands.',
  sponsorUrl = '/panic',
  sponsorImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  ctaText = 'Learn More',
}: AdBannerProps) {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  // 1. Billboard Ad (970x90 / 970x250 Header Leaderboard)
  if (slot === 'billboard') {
    return (
      <div className={`w-full py-4 ${className}`}>
        <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-gradient-to-r from-muted/60 via-card to-muted/60 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition hover:border-primary/40 group">
          {/* Ad Label */}
          <div className="absolute top-2 right-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
            <span>SPONSORED</span>
          </div>

          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="size-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="size-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-sm font-bold text-foreground font-serif">{sponsorName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-primary/10 text-primary">Partner</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl line-clamp-1">{sponsorTagline}</p>
            </div>
          </div>

          <Link
            href={sponsorUrl}
            target={sponsorUrl.startsWith('http') ? '_blank' : undefined}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition flex items-center gap-1.5 shrink-0 shadow-sm group-hover:scale-102"
          >
            <span>{ctaText}</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. Leaderboard Ad (728x90 Mid-page or footer banner)
  if (slot === 'leaderboard' || slot === 'in-article') {
    return (
      <div className={`w-full my-8 ${className}`}>
        <div className="relative rounded-2xl overflow-hidden border border-border bg-gradient-to-r from-card via-muted/40 to-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition hover:border-primary/40">
          <span className="absolute top-2 right-3 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">ADVERTISEMENT</span>
          
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-0.5 text-center sm:text-left">
              <h4 className="text-sm font-bold text-foreground font-serif">{sponsorName}</h4>
              <p className="text-xs text-muted-foreground max-w-xl line-clamp-2 leading-relaxed">{sponsorTagline}</p>
            </div>
          </div>

          <Link
            href={sponsorUrl}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition flex items-center gap-1 shrink-0"
          >
            <span>{ctaText}</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Medium Rectangle (300x250 Sidebar / In-Grid Ad)
  if (slot === 'rectangle') {
    return (
      <div className={`rounded-3xl overflow-hidden border border-border bg-card p-5 space-y-4 shadow-xs hover:border-primary/40 transition relative group ${className}`}>
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span className="font-bold uppercase tracking-wider text-primary">FEATURED SPONSOR</span>
          <span>AD</span>
        </div>

        <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-muted/40 relative">
          <img
            src={sponsorImageUrl}
            alt={sponsorName}
            className="w-full h-full object-cover transition duration-500 group-hover:scale-104"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 text-xs font-bold text-white font-serif">{sponsorName}</span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{sponsorTagline}</p>

        <Link
          href={sponsorUrl}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>{ctaText}</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    );
  }

  // 4. Halfpage Skyscraper (300x600 Sticky Sidebar Ad)
  if (slot === 'halfpage') {
    return (
      <div className={`sticky top-24 rounded-3xl overflow-hidden border border-border bg-card p-6 space-y-5 shadow-sm hover:border-primary/40 transition group ${className}`}>
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span className="font-bold uppercase tracking-wider text-primary">PREMIUM SPONSOR</span>
          <span>300x600</span>
        </div>

        <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-muted/40 relative">
          <img
            src={sponsorImageUrl}
            alt={sponsorName}
            className="w-full h-full object-cover transition duration-500 group-hover:scale-104"
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-lg font-bold font-serif text-foreground leading-snug">{sponsorName}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{sponsorTagline}</p>
        </div>

        <div className="pt-2 border-t border-border/60">
          <Link
            href={sponsorUrl}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition flex items-center justify-center gap-2 shadow-md"
          >
            <span>{ctaText}</span>
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 5. Native In-Feed Sponsored Card (Blends with article cards)
  if (slot === 'native-infeed') {
    return (
      <div className={`group flex flex-col rounded-3xl overflow-hidden border border-primary/30 bg-gradient-to-b from-primary/5 via-card to-card hover:border-primary/60 transition duration-300 shadow-xs relative ${className}`}>
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-md">
            Sponsored Partner
          </span>
        </div>

        <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/60 relative">
          <img
            src={sponsorImageUrl}
            alt={sponsorName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
          />
        </div>

        <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="text-xs font-mono text-primary font-bold">
              <span>SPECIAL PROMOTION</span>
            </div>
            <h3 className="text-xl font-bold font-serif text-foreground group-hover:text-primary transition line-clamp-2 leading-snug">
              {sponsorName}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
              {sponsorTagline}
            </p>
          </div>

          <Link
            href={sponsorUrl}
            className="w-full py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            <span>{ctaText}</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 6. Sticky Bottom Float Ad Bar
  if (slot === 'sticky-bottom') {
    return (
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl py-3 px-4 animate-in slide-in-from-bottom duration-300">
        <div className="max-w-[1536px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-primary/10 text-primary uppercase shrink-0">Ad</span>
            <p className="text-xs sm:text-sm font-medium text-foreground truncate">
              <strong className="font-serif">{sponsorName}:</strong> {sponsorTagline}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={sponsorUrl}
              className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition flex items-center gap-1 shadow-sm"
            >
              <span>{ctaText}</span>
              <ArrowUpRight className="size-3" />
            </Link>
            <button
              type="button"
              onClick={() => setClosed(true)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition cursor-pointer"
              title="Close Ad"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
