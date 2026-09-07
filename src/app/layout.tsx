import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import localFont from "next/font/local";
import { SITE } from "@/lib/seo";

/**
 * Yazi tipleri PROJENIN ICINDE, Google'dan degil.
 *
 * Once ucu de next/font/google ile geliyordu; bu, DERLEME sirasinda
 * fonts.googleapis.com'a cikmak demek. 7 Eylul'de tam olarak bu oldu:
 * istek zaman asimina ugradi, "Failed to fetch `Inter`" deyip derleme
 * dustu ve yayin durdu. Sunucunun bir dakikaligina disari cikamamasi
 * siteyi guncelleyememek anlamina geliyordu.
 *
 * Dosyalar src/fonts/ altinda ve Google'in kendi kaynagindan
 * (SIL Open Font License) alindi. Boyutu makul tutmak icin:
 *   - latin + latin-ext'e indirildi (Turkce harfler dahil: ğĞşŞıİ),
 *   - opsz ekseni sabitlendi — tasarimda kullanilmiyordu,
 *   - yalnizca gereken OpenType ozellikleri birakildi (kern, liga,
 *     locl — Turkce i/İ bicimleri bunda, tnum — panelin kur seridi).
 * Dordu birden 312 KB; ustelik bir kez indirilip onbellekte kaliyor.
 *
 * Agirliklar tek dosyada: bunlar degisken yazi tipleri, 100-900
 * araligini tek dosya karsiliyor.
 */
const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  variable: "--font-sans",
  display: "optional",
  weight: "100 900",
  style: "normal",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

const geistMono = localFont({
  src: "../fonts/geist-mono-latin.woff2",
  variable: "--font-mono",
  display: "optional",
  weight: "100 900",
  style: "normal",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

const newsreader = localFont({
  src: [
    { path: "../fonts/newsreader-latin.woff2", weight: "200 800", style: "normal" },
    { path: "../fonts/newsreader-italic-latin.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-display",
  display: "optional",
  fallback: ["Iowan Old Style", "Palatino", "Georgia", "Times New Roman", "serif"],
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
