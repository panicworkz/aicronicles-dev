import React from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import SmoothScroll from "@/components/magazine/SmoothScroll";
import CustomCursor from "@/components/magazine/CustomCursor";
import BackToTop from "@/components/magazine/BackToTop";
import "./globals.css";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="panic_theme">
      <SmoothScroll>
        <div className="theme-fabelo min-h-screen">{children}</div>
      </SmoothScroll>
      <CustomCursor />
      <BackToTop />
    </ThemeProvider>
  );
}
