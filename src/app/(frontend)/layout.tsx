import React from "react";
import { ThemeProvider } from "@/providers/theme-provider";
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
      <div className="theme-fabelo min-h-screen">{children}</div>
      <CustomCursor />
      <BackToTop />
    </ThemeProvider>
  );
}
