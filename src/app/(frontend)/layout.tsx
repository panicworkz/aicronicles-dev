'use client';

import React from 'react';
import { ThemeProvider } from '@/providers/theme-provider';

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="panic_theme">
      {children}
    </ThemeProvider>
  );
}
