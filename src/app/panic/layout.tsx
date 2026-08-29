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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PanicAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // If on login page, don't show admin sidebar/topbar
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex font-sans selection:bg-amber-500 selection:text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800/80 bg-neutral-950/90 flex flex-col shrink-0">
        {/* Brand / Logo */}
        <div className="h-16 px-6 border-b border-neutral-800/80 flex items-center justify-between">
          <Link href="/panic" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-black font-black text-xs">
              P
            </div>
            <span className="font-bold tracking-tight text-white font-sans text-base">
              PANIC<span className="text-amber-500">CMS</span>
            </span>
          </Link>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-semibold">
            v1.0
          </span>
        </div>

        {/* Project Selector Badge */}
        <div className="p-4 border-b border-neutral-800/60 bg-neutral-900/30">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate">fabelo.testworkz.com</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-neutral-800/90 text-white shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-neutral-800/80 bg-neutral-950">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">Fabelo Admin</p>
              <p className="text-[11px] text-neutral-500 font-mono truncate">support@fabelo.io</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800/80 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <span className="text-neutral-500">Workspace /</span>
            <span className="text-white font-semibold capitalize">{pathname.replace('/panic', '').replace('/', '') || 'Overview'}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
              <span>Live Site</span>
            </Link>
            <Link
              href="/panic/posts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Guide</span>
            </Link>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
