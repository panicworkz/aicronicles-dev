import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import localFont from "next/font/local";
import { SITE } from "@/lib/seo";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { ikiliyiBul, ikiliCss, ikiliDosyalari } from "@/lib/fontlar";

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
/* Inter ve Newsreader ARTIK BURADA TANIMLI DEGIL: hangi ikilinin
   yuklenecegi site ayarindan geliyor ve @font-face calisma aninda
   basiliyor (lib/fontlar.ts). next/font ile tanimlasaydik on ikilinin
   yirmi ailesi de derlemeye girer ve her biri icin onyukleme etiketi
   basilirdi — okur secmedigi dokuz ikiliyi de indirirdi. */

const geistMono = localFont({
  src: "../fonts/geist-mono-latin.woff2",
  variable: "--font-mono",
  display: "optional",
  weight: "100 900",
  style: "normal",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  /* Goreli adreslerin cozulecegi kok. Bu olmadan Next goreli og:image
     yollarini mutlak adrese cevirmiyor ve derlemede uyari veriyor;
     paylasim kartlarinda gorsel bos kalir. */
  metadataBase: new URL(SITE),
  title: "Panic CMS",
  description: "High-Performance Publishing & Commerce Engine",
};

/**
 * Secili font ikilisi. Ayardan okunuyor, yoksa varsayilan.
 *
 * Okuma hatasi SESSIZCE varsayilana dusuyor: veritabani bir an
 * cevap vermedigi icin sitenin fontsuz acilmasi, ayarin
 * uygulanmamasindan cok daha kotu olurdu.
 */
async function seciliIkili() {
  try {
    const kayit = await db.query.siteSettings.findFirst({
      where: eq(schema.siteSettings.key, "font_ikilisi"),
    });
    return ikiliyiBul(typeof kayit?.value === "string" ? kayit.value : null);
  } catch {
    return ikiliyiBul(null);
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ikili = await seciliIkili();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Onyukleme: font ancak CSS onu isteyince inmeye baslar,
            yani sayfanin ilk boyanmasindan sonra. Onyukleme etiketi
            olmadan basliklar bir an yedek fontla cizilip sonra
            degisiyor. Yalnizca SECILI ikili onyukleniyor. */}
        {ikiliDosyalari(ikili).map((yol) => (
          <link
            key={yol}
            rel="preload"
            as="font"
            type="font/woff2"
            href={yol}
            crossOrigin="anonymous"
          />
        ))}
        {/* @font-face ve rol jetonlari. Satir ici basiliyor: ayri bir
            dosya olsaydi tipografi bir istek daha gecikirdi. */}
        <style dangerouslySetInnerHTML={{ __html: ikiliCss(ikili) }} />
      </head>
      <body
        className={`${geistMono.variable} font-sans antialiased min-h-screen bg-background text-foreground transition-colors duration-200`}
      >
        <ThemeProvider defaultTheme="light">
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
