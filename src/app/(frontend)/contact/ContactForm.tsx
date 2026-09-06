"use client";

import React, { useId, useRef, useState } from "react";

type Durum = "bos" | "gonderiliyor" | "tamam" | "hata";

/**
 * Iletisim formu.
 *
 * Sitede hicbir e-posta adresi yazmiyor; butun iletisim buradan
 * geciyor. Adres sayfada duz metin olarak durunca toplayici botlarin
 * isine yariyor ve okuru posta programini acmaya zorluyor.
 *
 * Tuzak alan gorunmez degil, EKRAN OKUYUCUYA DA gizli: aria-hidden ve
 * tabIndex -1. Yalnizca CSS ile saklanan bir alani ekran okuyucu
 * okuyup dolduruyor ve gercek kullanicinin mesaji sessizce
 * atiliyordu.
 */
export default function ContactForm() {
  const [durum, setDurum] = useState<Durum>("bos");
  const [hata, setHata] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const tuzakId = useId();

  async function gonder(olay: React.FormEvent<HTMLFormElement>) {
    olay.preventDefault();
    if (durum === "gonderiliyor") return;
    const form = formRef.current;
    if (!form) return;

    const veri = new FormData(form);
    setDurum("gonderiliyor");
    setHata("");

    try {
      const cevap = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: veri.get("name"),
          email: veri.get("email"),
          subject: veri.get("subject"),
          message: veri.get("message"),
          website_url: veri.get("website_url"),
          source_url: location.href,
        }),
      });
      const d = await cevap.json().catch(() => ({}));
      if (!cevap.ok || !d?.success) throw new Error(d?.error || "Could not send.");
      setDurum("tamam");
      form.reset();
    } catch (e: any) {
      setHata(e?.message || "Could not send.");
      setDurum("hata");
    }
  }

  const alan =
    "w-full rounded-[2px] border px-3 py-2.5 text-[0.95rem] outline-none transition " +
    "focus:border-[var(--accent-ink)]";
  const alanStil = { background: "var(--paper)", borderColor: "var(--rule)", color: "var(--ink)" };

  if (durum === "tamam") {
    return (
      <div className="rule-heavy pt-6">
        <p className="display mb-2 text-2xl">Thank you — your message is on its way.</p>
        <p style={{ color: "var(--ink-2)" }}>
          We read everything and reply to what needs a reply, usually within two
          business days.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={gonder} className="max-w-[52ch] space-y-4">
      <div>
        <label htmlFor="ad" className="byline mb-1.5 block">
          NAME
        </label>
        <input id="ad" name="name" required maxLength={120} className={alan} style={alanStil} />
      </div>

      <div>
        <label htmlFor="eposta" className="byline mb-1.5 block">
          EMAIL
        </label>
        <input
          id="eposta"
          name="email"
          type="email"
          required
          maxLength={200}
          className={alan}
          style={alanStil}
        />
      </div>

      <div>
        <label htmlFor="konu" className="byline mb-1.5 block">
          SUBJECT
        </label>
        <input id="konu" name="subject" maxLength={200} className={alan} style={alanStil} />
      </div>

      <div>
        <label htmlFor="mesaj" className="byline mb-1.5 block">
          MESSAGE
        </label>
        <textarea
          id="mesaj"
          name="message"
          required
          rows={7}
          maxLength={5000}
          className={alan}
          style={alanStil}
        />
      </div>

      {/* Tuzak — insan gormez, ekran okuyucu da okumaz. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor={tuzakId}>Website</label>
        <input id={tuzakId} name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      {durum === "hata" && (
        <p className="text-[0.9rem]" style={{ color: "var(--accent-ink)" }}>
          {hata}
        </p>
      )}

      <button
        type="submit"
        disabled={durum === "gonderiliyor"}
        className="byline px-5 py-2.5 transition disabled:opacity-60"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        {durum === "gonderiliyor" ? "SENDING…" : "SEND MESSAGE"}
      </button>
    </form>
  );
}
