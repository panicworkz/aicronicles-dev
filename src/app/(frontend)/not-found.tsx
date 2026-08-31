import React from "react";
import Link from "next/link";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";

export default function NotFound() {
  return (
    <>
      <MagazineHeader />
      <main className="f-content py-24">
        <div className="max-w-2xl mx-auto text-center">
          <p
            className="text-[12px] font-bold uppercase tracking-[0.18em] mb-6"
            style={{ color: "var(--accent)" }}
          >
            Error
          </p>
          <p
            className="f-display text-[clamp(4rem,10vw,8rem)] leading-none"
            style={{ color: "var(--accent)" }}
          >
            404.
          </p>
          <h1 className="f-headline mt-4">This page wandered off.</h1>
          <p
            className="mt-5 text-[16.5px] leading-[1.7]"
            style={{ color: "var(--muted)" }}
          >
            The story you&apos;re looking for doesn&apos;t exist — or it has
            been moved.
          </p>
          <Link
            href="/"
            className="mt-9 inline-flex items-center justify-center rounded-full px-7 h-12 text-sm font-bold text-white transition-colors"
            style={{ background: "var(--accent)" }}
          >
            Back to Fabelo
          </Link>
        </div>
      </main>
      <MagazineFooter />
    </>
  );
}
