"use client";

import React, { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let x = 0,
      y = 0,
      rx = 0,
      ry = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      setMoved(true);
      const dot = dotRef.current;
      if (dot) dot.style.transform = `translate(${x}px, ${y}px)`;
    };

    const loop = () => {
      rx += (x - rx) * 0.15;
      ry += (y - ry) * 0.15;
      const ring = ringRef.current;
      if (ring) ring.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };

    const onLeave = () => {
      const d = dotRef.current;
      const r = ringRef.current;
      if (d) d.style.opacity = "0";
      if (r) r.style.opacity = "0";
    };
    const onEnter = () => {
      const d = dotRef.current;
      const r = ringRef.current;
      if (d) d.style.opacity = "1";
      if (r) r.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(loop);

    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  if (!moved) return null;

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 size-9 rounded-full border transition-opacity duration-200"
        style={{ borderColor: "var(--accent)", opacity: 0 }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full transition-opacity duration-200"
        style={{ background: "var(--accent)", opacity: 0 }}
      />
    </>
  );
}
