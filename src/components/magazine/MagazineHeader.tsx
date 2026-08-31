'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/providers/theme-provider';
import {
  Sun,
  Moon,
  Search,
  Menu,
  X,
  Sparkles,
  Flame,
  Radio,
  SlidersHorizontal,
  Compass,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MagazineHeader() {
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'AI & Intelligence', href: '/tag/ai-tech', highlight: true },
    { label: 'Capital & Finance', href: '/tag/personal-finance' },
    { label: 'Career Mobility', href: '/tag/career' },
    { label: 'Digital Store', href: '/store' },
    { label: 'Manifesto', href: '/about' },
  ];

  return (
    <>
      {/* Editorial Broadcast Top Strip (1920px) */}
      <div className="border-b border-border/40 bg-card/40 backdrop-blur-md text-[11px] font-mono text-muted-foreground hidden md:block">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 h-9 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-amber-500 font-bold tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>LIVE DISPATCH:</span>
            </div>
            <Link
              href="/best-free-ai-tools-to-boost-productivity-a-complete-guide"
              className="hover:text-foreground transition flex items-center gap-2 truncate max-w-xl group text-foreground/80 font-medium"
            >
              <span>The Complete 2026 AI Productivity Playbook & Architecture Breakdown</span>
              <span className="text-amber-500 group-hover:translate-x-0.5 transition">→</span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-muted-foreground/80 font-semibold tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
            </span>
            <span className="text-border">•</span>
            <span className="text-primary font-bold">VOL. 47 // EDITION 2026</span>
            <span className="text-border">•</span>
            <Link href="/panic" className="hover:text-amber-500 transition font-bold flex items-center gap-1">
              <span>PANIC STUDIO</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Luxury Magazine Header (1920px) */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
          scrolled
            ? 'bg-background/90 backdrop-blur-xl border-border/80 shadow-lg py-3'
            : 'bg-background/80 backdrop-blur-md border-border/50 py-4.5'
        }`}
      >
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 flex items-center justify-between gap-8">
          {/* Brand Logo & Editorial Motto */}
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-3.5 shrink-0 group">
              <img
                src="/images/fabelo-logo.webp"
                alt="Fabelo Magazine"
                className="h-9 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
              />
              <span className="hidden xl:inline-block pl-4 border-l border-border/60 text-[11px] font-mono uppercase tracking-widest text-muted-foreground leading-tight">
                Autonomous<br />Editorial Desk
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    link.highlight
                      ? 'text-foreground bg-primary/10 hover:bg-primary hover:text-primary-foreground font-bold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              className="p-2.5 rounded-xl border border-border/60 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer shadow-2xs"
              title="Search Fabelo Editorial"
            >
              <Search className="size-4" />
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl border border-border/60 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer shadow-2xs"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-700" />}
            </button>

            {/* Panic CMS Studio Access */}
            <Link href="/panic" className="hidden sm:inline-flex">
              <Button
                size="sm"
                className="gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black border-none shadow-md"
              >
                <SlidersHorizontal className="size-3.5" />
                <span>Panic CMS</span>
              </Button>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Expandable Search Input */}
        {searchOpen && (
          <div className="max-w-[1920px] mx-auto px-6 lg:px-12 pt-4 pb-2 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="relative max-w-3xl mx-auto">
              <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 size-5 text-amber-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across 47+ deep dives, AI architectures, finance playbooks..."
                autoFocus
                className="w-full h-13 pl-13 pr-6 rounded-2xl border-2 border-primary/40 bg-card text-base text-foreground placeholder:text-muted-foreground outline-none focus:ring-4 focus:ring-primary/20 transition shadow-xl"
              />
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/98 backdrop-blur-2xl px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-base font-bold text-foreground hover:bg-muted transition flex items-center justify-between"
                >
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
              <Link href="/llms.txt" className="text-primary hover:underline">llms.txt (AEO)</Link>
              <Link href="/panic" className="px-4 py-2 rounded-xl bg-amber-500 text-black font-sans font-bold">Panic CMS Studio</Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
