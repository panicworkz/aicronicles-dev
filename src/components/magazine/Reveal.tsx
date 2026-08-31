"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "default" | "image" | "text";
}

export function Reveal({
  children,
  className,
  delay = 0,
  variant = "default",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const base =
    variant === "image"
      ? "f-img-reveal"
      : variant === "text"
        ? "f-text-mask"
        : "f-reveal";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(base, inView && "is-in", className)}
    >
      {children}
    </div>
  );
}

export default Reveal;
