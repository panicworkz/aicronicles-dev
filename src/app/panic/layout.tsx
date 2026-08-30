'use client';

import React, { useState } from 'react';
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
  Sun,
  Moon,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/providers/theme-provider';

export default function PanicAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

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
      {/* Hubz Sidebar */}
      <aside
        className={`flex flex-col border-r border-border bg-sidebar transition-all duration-300 shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand Header with Collapse Toggle */}
        <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
          {!collapsed ? (
            <Link href="/panic" className="flex items-center gap-2 font-semibold text-base tracking-tight">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-xs">
                P
              </div>
              <span>Panic CMS</span>
            </Link>
          ) : (
            <div className="size-7 mx-auto rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-xs">
              P
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto size-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={`size-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Project Selector Badge */}
        {!collapsed && (
          <div className="p-3 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layers className="size-3.5 text-primary" />
              <span className="truncate font-medium">fabelo.testworkz.com</span>
            </div>
          </div>
        )}

        {/* Nav Links */}
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
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <Separator className="bg-border/60" />
        <div className="p-3 bg-sidebar flex items-center justify-between">
          {!collapsed ? (
            <div className="truncate">
              <p className="text-xs font-medium text-foreground truncate">Fabelo Editorial</p>
              <p className="text-[11px] text-muted-foreground truncate">support@fabelo.io</p>
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0 mx-auto"
            title="Sign Out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Hubz Header */}
        <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-6 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search anything..."
              className="pl-9 bg-muted/50 border-none h-8 text-xs placeholder:text-muted-foreground"
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

            {/* Hubz Light / Dark Theme Switcher */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-slate-700" />
              )}
            </Button>

            {/* User Avatar */}
            <div className="size-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center border border-primary/20">
              FE
            </div>
          </div>
        </header>

        {/* Scrollable Main Canvas */}
        <main className="flex-1 overflow-y-auto p-6 bg-background scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
