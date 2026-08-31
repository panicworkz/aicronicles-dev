"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ArticleClientActions({ title }: { title: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 z-50 transition-all duration-150 pointer-events-none"
      style={{
        background: "var(--accent)",
        width: `${progress}%`,
      }}
    />
  );
}
