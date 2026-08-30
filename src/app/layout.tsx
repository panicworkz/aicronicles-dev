import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Panic CMS',
  description: 'High-Performance Publishing & Commerce Engine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground transition-colors duration-200">
        <ThemeProvider defaultTheme="light">
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
