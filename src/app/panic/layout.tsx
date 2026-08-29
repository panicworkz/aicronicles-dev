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
  ChevronRight,
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0b0f19] flex flex-col shrink-0">
        {/* Brand / Logo */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/panic" className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-md">
              P
            </div>
            <span className="font-semibold tracking-tight text-white text-base">
              Panic<span className="text-indigo-400">CMS</span>
            </span>
          </Link>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            v1.0
          </span>
        </div>

        {/* Project Selector Badge */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-900/30">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate font-medium">fabelo.testworkz.com</span>
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
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0b0f19]">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">Fabelo Editorial</p>
              <p className="text-[11px] text-slate-500 truncate">support@fabelo.io</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition"
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
        <header className="h-16 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-500">Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 font-medium capitalize">
              {pathname.replace('/panic', '').replace('/', '') || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>Live Site</span>
            </Link>
            <Link
              href="/panic/posts/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition shadow-sm"
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
