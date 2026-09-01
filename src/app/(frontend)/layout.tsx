import React from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import CustomCursor from "@/components/magazine/CustomCursor";
import BackToTop from "@/components/magazine/BackToTop";
import AnchorPin from "@/components/magazine/AnchorPin";
import "./globals.css";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="panic_theme">
      <div className="theme-fabelo min-h-screen">{children}</div>
      <CustomCursor />
      <BackToTop />
      {/* Kunyedeki cipa baglantilari her sayfada var; isleyici de burada durmali. */}
      <AnchorPin />
    </ThemeProvider>
  );
}
