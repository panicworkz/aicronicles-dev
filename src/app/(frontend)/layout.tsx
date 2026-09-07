import React from "react";
import type { Metadata } from "next";
import Script from "next/script";
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
  /* Yayin katmaninin VARSAYILAN basligi.
     Kok duzen "Panic CMS" diyor — panelin adi. Kendi basligini
     tanimlamayan bir yayin sayfasi (404 gibi) onu miras aliyordu ve
     sunucudan gelen HTML'de sekme "Panic CMS" yaziyordu. Kendi
     basligi olan sayfalar bunu yine eziyor. */
  title: {
    default: "Fabelo | Personal Finance, Career & AI Tools for Professionals",
    template: "%s",
  },
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
      {/* Umami olcumu — umami.panic.pw'de kayitli "Fabelo.io" sitesi.
          O kayit 2025 subatindan beri veri tasiyor (Ghost donemi dahil);
          yeni kayit acmak gecmisi ikiye bolerdi, o yuzden AYNI kimlik
          kullaniliyor.

          Yalnizca YAYIN katmaninda: /panic bu katmanin disinda kaldigi
          icin yonetim ekranindaki gezinme olcume karismiyor. */}
      <Script
        src="https://umami.panic.pw/script.js"
        data-website-id="f4fc9e52-de17-44ac-92b1-6b23ff6fec91"
        strategy="afterInteractive"
        defer
      />
      <div className="theme-fabelo min-h-screen">{children}</div>
      <CustomCursor />
      <BackToTop />
      {/* Kunyedeki cipa baglantilari her sayfada var; isleyici de burada durmali. */}
      <AnchorPin />
    </ThemeProvider>
  );
}
