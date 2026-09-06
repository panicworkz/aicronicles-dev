"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Ozel imlec — nokta ve gecikmeli halka, YERLI IMLECIN YANINDA.
 *
 * Once `cursor: none` ile yerli imlec gizleniyordu ve tiklanabilir
 * yerlerde hicbir isaret kalmiyordu. Simdi yerli imlec acik: el yine
 * tarayicinin kendi eli, nokta ve halka onun yanina esas ediyor.
 * (Bir ara buraya SVG bir el cizmistim; yanlis yaklasimdi —
 * meet.istanbul'da da begenilen sey tarayicinin kendi eli.)
 *
 * Tiklanabilir bir seyin uzerindeyken halka bir tik buyuyor; bu
 * imlecin kendi geri bildirimi, elin yerine gecen bir sey degil.
 */

/** Tiklanabilir sayilanlar. Devre disi birakilmis oge tiklanamaz. */
const TIKLANABILIR = [
  "a[href]",
  "button",
  "summary",
  "label",
  "select",
  "input:not([type=hidden])",
  "textarea",
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  "[onclick]",
].join(",");

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

    /** Uzerinde durdugumuz sey gercekten tiklanabilir mi? */
    const tiklanirMi = (hedef: EventTarget | null) => {
      const el = (hedef as HTMLElement)?.closest?.(TIKLANABILIR) as HTMLElement | null;
      if (!el) return false;
      if (el.hasAttribute("disabled")) return false;
      if (el.getAttribute("aria-disabled") === "true") return false;
      // Ekran disina saklanmis tuzak alani el gostermesin.
      if (el.closest('[aria-hidden="true"]')) return false;
      return true;
    };

    const vurgula = (acik: boolean) => {
      const r = ringRef.current;
      /* Halka `scale` ile buyuyor, `transform` ile degil: konumu her
         karede transform'a yaziliyor, oraya olcegi de koysak dongu onu
         her karede eziyordu. `scale` ayri bir ozellik, cakismiyor. */
      if (r) r.style.scale = acik ? "1.35" : "1";
    };

    const onOver = (e: MouseEvent) => vurgula(tiklanirMi(e.target));

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(loop);

    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
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
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 size-9 rounded-full border transition-[opacity,scale] duration-200"
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
