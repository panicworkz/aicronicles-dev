import React from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import CustomCursor from "@/components/magazine/CustomCursor";
import BackToTop from "@/components/magazine/BackToTop";
import AnchorPin from "@/components/magazine/AnchorPin";
import "./globals.css";
import { SITE, SITE_ADI } from "@/lib/seo";

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
