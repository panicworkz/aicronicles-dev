"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Globe,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  Image as ImageIcon,
  Tags,
  FolderTree,
  Settings,
  Megaphone,
  ExternalLink,
  LogOut,
  Search,
  Plus,
  Sun,
  Moon,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LiveRatesTicker } from "@/components/studio/LiveRatesTicker";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

export default function PanicAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === "/panic/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/panic/login");
    router.refresh();
  };

  const navSections = [
    {
      title: "CONTENT",
      items: [
        { href: "/panic", label: "Dashboard", icon: LayoutDashboard },
        { href: "/panic/posts", label: "Articles & Guides", icon: FileText },
        { href: "/panic/pages", label: "Static Pages", icon: Globe },
        { href: "/panic/authors", label: "Authors & Staff", icon: Users },
        { href: "/panic/media", label: "Media Library", icon: ImageIcon },
        { href: "/panic/categories", label: "Taxonomies", icon: Tags },
        { href: "/panic/ads", label: "Ad Campaigns", icon: Megaphone },
      ],
    },
    {
      title: "COMMERCE",
      items: [
        { href: "/panic/products", label: "Products & Store", icon: Package },
        {
          href: "/panic/product-categories",
          label: "Product Categories",
          icon: FolderTree,
        },
        { href: "/panic/orders", label: "Orders & Sales", icon: ShoppingCart },
        { href: "/panic/customers", label: "Customers", icon: Users },
        { href: "/panic/coupons", label: "Coupons", icon: Ticket },
      ],
    },
    {
      title: "SYSTEM",
      items: [{ href: "/panic/settings", label: "Settings", icon: Settings }],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Hubz-Standard Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-sidebar transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-14 items-center gap-3 px-4 border-b border-border">
          {!collapsed && (
            <Link
              href="/panic"
              className="flex items-center gap-2 font-semibold text-lg text-foreground"
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
            className="ml-auto size-8"
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

        <div className="flex-1 py-4 overflow-y-auto space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="px-3 space-y-1.5">
              {!collapsed && (
                <div className="px-3 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/panic"
                    ? pathname === "/panic"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="relative shrink-0">
                      <Icon className="size-4" />
                    </span>
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <Separator />
        <div className="p-3 flex items-center justify-between">
          {!collapsed ? (
            <div className="px-3 py-2 text-xs font-mono text-muted-foreground">
              Panic CMS v2.0
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive shrink-0 size-8 mx-auto"
            title="Logout"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Hubz Header with Grouped Actions & Right-Aligned Currencies */}
        <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-6 shrink-0">
          {/* Left: Global Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search guides, products, orders..."
              className="pl-9 bg-muted/50 border-none"
            />
          </div>

          {/* Right: Grouped Badges, Quick Actions, and Profile */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Live TCMB Exchange Rates */}
            <LiveRatesTicker />

            <div className="hidden xl:block h-5 w-px bg-border shrink-0" />

            {/* Quick Actions & Navigation */}
            <div className="flex items-center gap-2">
              <Link href="/" target="_blank">
                <Button
                  variant="outline"
                  size="xs"
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Live Site</span>
                </Button>
              </Link>

              <Link href="/store" target="_blank">
                <Button
                  variant="outline"
                  size="xs"
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  <Package className="size-3.5" />
                  <span>Store</span>
                </Button>
              </Link>

              <Link href="/panic/posts/new">
                <Button
                  size="xs"
                  className="h-8 gap-1.5 text-xs font-medium bg-primary text-primary-foreground"
                >
                  <Plus className="size-3.5" />
                  <span>New Guide</span>
                </Button>
              </Link>
            </div>

            <div className="h-5 w-px bg-border shrink-0" />

            {/* Grouped Profile & Theme Toggle */}
            <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-background shadow-xs">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={
                  theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
                }
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>

              <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono">
                UY
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
