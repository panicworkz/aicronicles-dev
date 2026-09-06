"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Derginin vurgu rengi — .mag'deki --accent ile ayni deger (#0fb5ce).
 *
 * Neden degisken degil de duz deger: bu bilesen .mag kapsayicisinin
 * DISINDA, (frontend) katmaninda duruyor. Orada `var(--accent)`
 * derginin cyan'ina degil panelin mavisine (#3b4bc8) dusuyor ve imlec
 * sayfanin geri kalanindan baska bir mavide kaliyordu: kunyedeki
 * "Subscribe free" dugmesi cyan, imlec indigo.
 *
 * Koyu temada da ayni: .dark .mag yalnizca --accent-ink'i degistiriyor,
 * --accent iki temada da bu deger.
 */
const MAG_ACCENT = "#0fb5ce";

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
      {/* Renk .mag'in vurgusu — elektrik cyan.
          `var(--accent)` YAZILAMAZ: bu iki oge .mag kapsayicisinin
          DISINDA duruyor, o yuzden degisken sitenin cyan'ina degil
          panelin mavisine (#3b4bc8) dusuyordu. Imlec sayfanin geri
          kalanindan baska bir mavideydi. */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 size-9 rounded-full border transition-opacity duration-200"
        style={{ borderColor: MAG_ACCENT, opacity: 0 }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full transition-opacity duration-200"
        style={{ background: MAG_ACCENT, opacity: 0 }}
      />
    </>
  );
}
