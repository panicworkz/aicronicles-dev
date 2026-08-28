import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://fabelo.testworkz.com'),
  title: {
    default: 'Fabelo | Personal Finance, Career & AI Tools for Professionals',
    template: '%s | Fabelo',
  },
  description: 'Personal finance tips, career strategies, and AI tool reviews for ambitious professionals.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fabelo.testworkz.com',
    siteName: 'Fabelo',
    title: 'Fabelo | Personal Finance, Career & AI Tools for Professionals',
    description: 'Personal finance tips, career strategies, and AI tool reviews for ambitious professionals.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fabelo | Personal Finance, Career & AI Tools for Professionals',
    description: 'Personal finance tips, career strategies, and AI tool reviews for ambitious professionals.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
