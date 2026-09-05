import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import { Inter, Geist_Mono, Newsreader } from "next/font/google";
import { SITE } from "@/lib/seo";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "optional" });
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-mono", display: "optional" });
const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "optional",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  /* Goreli adreslerin cozulecegi kok. Bu olmadan Next goreli og:image
     yollarini mutlak adrese cevirmiyor ve derlemede uyari veriyor;
     paylasim kartlarinda gorsel bos kalir. */
  metadataBase: new URL(SITE),
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
