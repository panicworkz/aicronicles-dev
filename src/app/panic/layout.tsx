'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Tags,
  Settings,
  ExternalLink,
  LogOut,
  Sparkles,
  Layers,
  Search,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function PanicAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/panic/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/panic/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Dashboard', href: '/panic', icon: LayoutDashboard, exact: true },
    { label: 'Articles & Posts', href: '/panic/posts', icon: FileText, exact: false },
    { label: 'Media Library', href: '/panic/media', icon: ImageIcon, exact: false },
    { label: 'Categories & Tags', href: '/panic/categories', icon: Tags, exact: false },
    { label: 'Project Settings', href: '/panic/settings', icon: Settings, exact: false },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Hubz Style Sidebar */}
      <aside className="w-60 border-r border-sidebar-border bg-sidebar flex flex-col shrink-0 transition-all">
        {/* Brand */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border/60">
          <Link href="/panic" className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-xs">
              P
            </div>
            <span className="font-semibold tracking-tight text-foreground text-sm">
              Panic CMS
            </span>
          </Link>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-foreground/70">
            v1.0
          </span>
        </div>

        {/* Project Selector Badge */}
        <div className="p-3 border-b border-sidebar-border/40 bg-sidebar-accent/30">
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
            <Layers className="size-3.5 text-primary" />
            <span className="truncate font-medium">fabelo.testworkz.com</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon className={`size-4 ${isActive ? 'text-primary' : 'text-sidebar-foreground/60'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Area */}
        <Separator className="bg-sidebar-border/60" />
        <div className="p-3 bg-sidebar flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-medium text-foreground truncate">Fabelo Editorial</p>
            <p className="text-[11px] text-muted-foreground truncate">support@fabelo.io</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            title="Sign Out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Hubz Style Top Header */}
        <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-6 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search anything..."
              className="pl-9 bg-muted/40 border-none h-8 text-xs placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <ExternalLink className="size-3.5 text-primary" />
                <span>Live Site</span>
              </Button>
            </Link>

            <Link href="/panic/posts/new">
              <Button size="sm" className="h-8 text-xs gap-1.5 font-medium">
                <Plus className="size-3.5" />
                <span>New Guide</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Body Canvas */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
