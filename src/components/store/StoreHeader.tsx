'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { CurrencySwitcher } from '@/components/store/CurrencySwitcher';
import { Button } from '@/components/ui/button';

export function StoreHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-foreground font-serif tracking-tight">
            FABELO<span className="text-primary">.</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition">Articles</Link>
            <Link href="/store" className="text-primary font-semibold transition">Store & Products</Link>
            <Link href="/llms.txt" className="hover:text-foreground transition font-mono">AEO / llms.txt</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Currency Switcher */}
          <CurrencySwitcher />

          <Link href="/panic/products" target="_blank">
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
              CMS Admin
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
