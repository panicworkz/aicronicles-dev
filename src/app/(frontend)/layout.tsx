import React from "react";
import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import CustomCursor from "@/components/magazine/CustomCursor";
import BackToTop from "@/components/magazine/BackToTop";
import AnchorPin from "@/components/magazine/AnchorPin";
import "./globals.css";
import { SITE, SITE_ADI } from "@/lib/seo";

/**
 * Sekme simgesi. Ghost /favicon.png yayinliyordu; bu CMS'te hicbir
 * favicon yoktu ve fabelo.io'ya gectikten sonra /favicon.ico 404
 * donuyordu — sekmede bos bir kagit. Marka simgesi zaten depoda:
 * public/images/fabelo-icon.png (256x256). Yeni bir sey cizilmedi.
 *
 * Sayfalar kendi alternates'ini tanimliyor ama icons ayri bir anahtar,
 * o yuzden katmandan gelen deger eziliyor degil.
 */
export const metadata: Metadata = {
  icons: {
    icon: "/images/fabelo-icon.png",
    shortcut: "/images/fabelo-icon.png",
    apple: "/images/fabelo-icon.png",
  },
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="panic_theme">
      {/* Besleme kesfi. metadata.alternates ile yazilmiyor cunku sayfalar
          kendi alternates'ini (canonical) tanimliyor ve o, katmandan
          gelen alternates'in tamamini eziyor — besleme baglantisi
          sessizce kaybolurdu. React bu etiketi head'e tasiyor. */}
      <link
        rel="alternate"
        type="application/rss+xml"
        title={SITE_ADI}
        href={`${SITE}/rss`}
      />
      <div className="theme-fabelo min-h-screen">{children}</div>
      <CustomCursor />
      <BackToTop />
      {/* Kunyedeki cipa baglantilari her sayfada var; isleyici de burada durmali. */}
      <AnchorPin />
    </ThemeProvider>
  );
}
