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
import { cn } from '@/lib/utils';

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
    { href: '/panic', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/panic/posts', label: 'Articles & Posts', icon: FileText },
    { href: '/panic/media', label: 'Media Library', icon: ImageIcon },
    { href: '/panic/categories', label: 'Categories & Tags', icon: Tags },
    { href: '/panic/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Hubz Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-sidebar transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-14 items-center gap-2 px-4 border-b">
          {!collapsed && (
            <Link
              href="/panic"
              className="flex items-center gap-2 font-semibold text-lg"
            >
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-xs">
                P
              </div>
              <span>Panic CMS</span>
            </Link>
          )}
          {collapsed && (
            <div className="size-7 mx-auto rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-xs">
              P
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-6"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn(
                "size-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </Button>
        </div>

        <div className="flex-1 py-2 overflow-y-auto">
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/panic'
                  ? pathname === '/panic'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="relative shrink-0">
                    <Icon className="size-4" />
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <Separator />
        <div className="p-2 flex items-center justify-between">
          {!collapsed ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Panic CMS v1.0
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="size-7 text-muted-foreground hover:text-destructive shrink-0 mx-auto"
            title="Logout"
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Hubz Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search anything..."
              className="pl-9 bg-muted/50 border-none h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="size-3.5 text-muted-foreground" />
                <span>Live Site</span>
              </Button>
            </Link>

            <Link href="/panic/posts/new">
              <Button size="sm" className="gap-1.5 text-xs font-medium">
                <Plus className="size-3.5" />
                <span>New Guide</span>
              </Button>
            </Link>

            {/* Hubz Sun / Moon Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>

            {/* User Avatar */}
            <div className="size-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
              UY
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main
          data-hubz-scroll-main
          className="flex-1 overflow-y-auto scroll-smooth p-6 bg-background"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
