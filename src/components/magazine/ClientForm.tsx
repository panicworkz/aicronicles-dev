"use client";

import React, { useId, useRef, useState } from "react";

/**
 * Bulten abonelik formu.
 *
 * Once yalnizca preventDefault yapiyordu: ziyaretci adresini yazip butona
 * basiyor, hicbir sey olmuyordu. Artik /api/subscribe'a gonderiyor.
 *
 * Alan yapisini cagiran taraf veriyor (children) — footer, ana sayfadaki
 * Dispatch blogu ve yazi sayfasi ayni bileseni farkli gorunumlerle
 * kullaniyor. Bu yuzden e-posta alanini icerikten kendimiz buluyoruz;
 * boylece uc yerdeki bicimlendirme oldugu gibi kaliyor.
 */

type Durum = "bos" | "gonderiliyor" | "tamam" | "hata";

export default function ClientForm({
  className,
  children,
  source = "unknown",
}: {
  className?: string;
  children: React.ReactNode;
  /** Formun sayfadaki yeri — kaydin nereden geldigini bilmek icin */
  source?: "footer" | "dispatch" | "article" | "unknown";
}) {
  const [durum, setDurum] = useState<Durum>("bos");
  const [hata, setHata] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const tuzakId = useId();

  async function gonder(olay: React.FormEvent<HTMLFormElement>) {
    olay.preventDefault();
    if (durum === "gonderiliyor") return;

    const form = formRef.current;
    if (!form) return;

    const alan = form.querySelector<HTMLInputElement>('input[type="email"]');
    const eposta = alan?.value.trim() ?? "";
    const tuzak = form.querySelector<HTMLInputElement>('input[name="website_url"]')?.value ?? "";

    if (!eposta) {
      setDurum("hata");
      setHata("Please enter your email address.");
      alan?.focus();
      return;
    }

    setDurum("gonderiliyor");
    setHata("");

    try {
      const cevap = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: eposta, source, website_url: tuzak }),
      });
      const veri = (await cevap.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (cevap.ok && veri?.ok) {
        setDurum("tamam");
        form.reset();
      } else {
        setDurum("hata");
        setHata(veri?.error || "Something went wrong. Please try again.");
      }
    } catch {
      setDurum("hata");
      setHata("Network error. Please try again.");
    }
  }

  /* Basarili abonelikte formun yerini onay aliyor — koyu zeminlerde
     durdugu icin renkler oraya gore. */
  if (durum === "tamam") {
    return (
      <div className={className} role="status" aria-live="polite">
        <div className="folio mb-2" style={{ color: "var(--accent)" }}>
          ✓ YOU’RE ON THE LIST
        </div>
        <p className="text-[0.95rem] leading-relaxed" style={{ color: "#9aa1aa" }}>
          The Dispatch lands twice a week. Check your inbox for a note from us.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} className={className} onSubmit={gonder} noValidate>
      {children}

      {/* Tuzak alan — insanlar gormez, botlar doldurur */}
      <input
        type="text"
        name="website_url"
        id={tuzakId}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />

      {durum === "gonderiliyor" && (
        <p className="byline" style={{ color: "#9aa1aa" }} role="status" aria-live="polite">
          SENDING…
        </p>
      )}
      {durum === "hata" && hata && (
        <p className="text-[0.85rem]" style={{ color: "#ff8f7a" }} role="alert">
          {hata}
        </p>
      )}
    </form>
  );
}
