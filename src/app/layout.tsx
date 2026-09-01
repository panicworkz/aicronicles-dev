import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import { Inter, Geist_Mono, Newsreader } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "block" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "block" });
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "block",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Panic CMS",
  description: "High-Performance Publishing & Commerce Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} ${newsreader.variable} font-sans antialiased min-h-screen bg-background text-foreground transition-colors duration-200`}
      >
        <ThemeProvider defaultTheme="light">
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
