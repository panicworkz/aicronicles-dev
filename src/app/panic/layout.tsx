'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  Image as ImageIcon,
  Tags,
  FolderTree,
  Settings,
  ExternalLink,
  LogOut,
  Search,
  Plus,
  Sun,
  Moon,
  ChevronLeft,
  TrendingUp,
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

  const navSections = [
    {
      title: 'CONTENT',
      items: [
        { href: '/panic', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/panic/posts', label: 'Articles & Guides', icon: FileText },
        { href: '/panic/media', label: 'Media Library', icon: ImageIcon },
        { href: '/panic/categories', label: 'Editorial Taxonomies', icon: Tags },
      ],
    },
    {
      title: 'COMMERCE',
      items: [
        { href: '/panic/products', label: 'Products & Store', icon: Package },
        { href: '/panic/product-categories', label: 'Product Categories', icon: FolderTree },
        { href: '/panic/orders', label: 'Orders & Sales', icon: ShoppingCart },
        { href: '/panic/customers', label: 'Customers', icon: Users },
        { href: '/panic/coupons', label: 'Coupons', icon: Ticket },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { href: '/panic/settings', label: 'Settings', icon: Settings },
      ],
    },
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
            size="icon-sm"
            className="ml-auto"
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

        <div className="flex-1 py-3 overflow-y-auto space-y-4">
          {navSections.map((section, idx) => (
            <div key={idx} className="px-2 space-y-1">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
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
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
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
            </div>
          ))}
        </div>

        <Separator />
        <div className="p-2 flex items-center justify-between">
          {!collapsed ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Panic CMS v2.0
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive shrink-0 mx-auto"
            title="Logout"
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Hubz Header with Grouped Actions & Right-Aligned Currencies */}
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-6 shrink-0">
          {/* Left: Global Search Input */}
          <div className="relative flex-1 max-w-xs xl:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search guides, products, orders..."
              className="pl-9 bg-muted/50 border-none h-8 text-xs"
            />
          </div>

          {/* Right: Grouped Badges, Quick Actions, and Profile */}
          <div className="flex items-center gap-3 ml-auto">
            {/* GROUP 1: Live Exchange Rates */}
            <div className="hidden xl:flex items-center gap-1.5 bg-muted/30 border border-border/80 rounded-lg p-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono">
                <span className="text-muted-foreground font-medium">USD/TRY:</span>
                <span className="font-bold text-foreground">₺38.50</span>
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="size-2.5" />0.15%
                </span>
              </div>

              <div className="h-3 w-px bg-border/80 shrink-0" />

              <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono">
                <span className="text-muted-foreground font-medium">EUR/TRY:</span>
                <span className="font-bold text-foreground">₺41.85</span>
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="size-2.5" />0.08%
                </span>
              </div>

              <div className="h-3 w-px bg-border/80 shrink-0" />

              <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono">
                <span className="text-muted-foreground font-medium">EUR/USD:</span>
                <span className="font-bold text-foreground">$1.09</span>
              </div>
            </div>

            {/* DIVIDER 1 */}
            <div className="hidden xl:block h-4 w-px bg-border shrink-0" />

            {/* GROUP 2: Navigation & Quick Creation Buttons */}
            <div className="flex items-center gap-1.5">
              <Link href="/" target="_blank">
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                  <span>Live Site</span>
                </Button>
              </Link>

              <Link href="/store" target="_blank">
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                  <Package className="size-3.5 text-muted-foreground" />
                  <span>Store</span>
                </Button>
              </Link>

              <Link href="/panic/posts/new">
                <Button size="sm" className="h-8 gap-1.5 text-xs font-medium">
                  <Plus className="size-3.5" />
                  <span>New Guide</span>
                </Button>
              </Link>
            </div>

            {/* DIVIDER 2 */}
            <div className="h-4 w-px bg-border shrink-0" />

            {/* GROUP 3: Theme Toggle & User Profile */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="size-8"
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>

              <div className="size-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center border border-primary/20">
                UY
              </div>
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
