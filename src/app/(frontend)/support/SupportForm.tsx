"use client";

import React, { useId, useRef, useState } from "react";

type Durum = "bos" | "gonderiliyor" | "tamam" | "hata";

const KATEGORILER = [
  ["general", "General support"],
  ["project", "Project / delivery"],
  ["technical", "Technical issue"],
  ["maintenance", "Maintenance / operations"],
  ["billing", "Billing / payment"],
] as const;

const ONCELIKLER = [
  ["low", "Normal"],
  ["medium", "Important"],
  ["high", "High"],
  ["urgent", "Urgent"],
] as const;

export default function SupportForm() {
  const [durum, setDurum] = useState<Durum>("bos");
  const [hata, setHata] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const tuzakId = useId();

  const girdi =
    "w-full bg-transparent px-3 py-2.5 text-[0.98rem] leading-normal outline-none " +
    "border border-[var(--rule)] transition-colors " +
    "focus:border-[var(--ink)] placeholder:text-[var(--ink-3)]";

  const Hucre = ({
    etiket,
    zorunlu,
    children,
    genis,
  }: {
    etiket: string;
    zorunlu?: boolean;
    children: React.ReactNode;
    genis?: boolean;
  }) => (
    <div className={`flex flex-col gap-1.5 ${genis ? "sm:col-span-2" : ""}`}>
      <label className="text-[0.86rem]" style={{ color: "var(--ink-2)" }}>
        {etiket}
        {zorunlu && <span style={{ color: "var(--accent-ink)" }}> *</span>}
      </label>
      {children}
    </div>
  );

  async function gonder(olay: React.FormEvent<HTMLFormElement>) {
    olay.preventDefault();
    if (durum === "gonderiliyor") return;
    const form = formRef.current;
    if (!form) return;
    const veri = new FormData(form);

    setDurum("gonderiliyor");
    setHata("");
    try {
      const cevap = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: veri.get("name"),
          organization: veri.get("organization"),
          email: veri.get("email"),
          phone: veri.get("phone"),
          category: veri.get("category"),
          priority: veri.get("priority"),
          subject: veri.get("subject"),
          message: veri.get("message"),
          website_url: veri.get("website_url"),
          source_url: location.href,
        }),
      });
      const d = await cevap.json().catch(() => ({}));
      if (!cevap.ok || !d?.success) throw new Error(d?.error || "Could not open support request.");
      form.reset();
      setDurum("tamam");
    } catch (e: any) {
      setHata(e?.message || "Could not open support request.");
      setDurum("hata");
    }
  }

  if (durum === "tamam") {
    return (
      <div style={{ borderTop: "2px solid var(--ink)" }} className="pt-6">
        <div className="folio mb-3" style={{ color: "var(--accent)" }}>
          § SUPPORT REQUEST OPENED
        </div>
        <h2 className="display mb-4 text-[clamp(1.8rem,3vw,2.6rem)]">
          Thank you — the case is in the queue.
        </h2>
        <p className="max-w-[62ch] text-[1.04rem] leading-[1.78]" style={{ color: "var(--ink-2)" }}>
          PanicWorkz support will review it in Hubz and reply to your email.
        </p>
        <button
          type="button"
          onClick={() => setDurum("bos")}
          className="byline mt-8 px-6 py-3 transition"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          OPEN ANOTHER REQUEST →
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={gonder}>
      <div className="folio mb-4" style={{ color: "var(--accent)" }}>
        WHO NEEDS HELP
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Hucre etiket="Name" zorunlu>
          <input id="name" name="name" required maxLength={120} className={girdi} />
        </Hucre>
        <Hucre etiket="Company / organisation">
          <input id="organization" name="organization" maxLength={160} className={girdi} />
        </Hucre>
        <Hucre etiket="Email" zorunlu>
          <input id="email" name="email" type="email" required maxLength={200} className={girdi} />
        </Hucre>
        <Hucre etiket="Phone">
          <input id="phone" name="phone" maxLength={40} className={girdi} />
        </Hucre>
      </div>

      <div className="folio mb-4 mt-10" style={{ color: "var(--accent)" }}>
        REQUEST
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Hucre etiket="Topic">
          <select name="category" defaultValue="general" className={girdi}>
            {KATEGORILER.map(([deger, etiket]) => (
              <option key={deger} value={deger}>
                {etiket}
              </option>
            ))}
          </select>
        </Hucre>
        <Hucre etiket="Priority">
          <select name="priority" defaultValue="medium" className={girdi}>
            {ONCELIKLER.map(([deger, etiket]) => (
              <option key={deger} value={deger}>
                {etiket}
              </option>
            ))}
          </select>
        </Hucre>
        <Hucre etiket="Subject" zorunlu genis>
          <input id="subject" name="subject" required maxLength={200} className={girdi} />
        </Hucre>
        <Hucre etiket="What happened / what do you need?" zorunlu genis>
          <textarea id="message" name="message" required rows={6} maxLength={5000} className={`${girdi} resize-y`} />
        </Hucre>
      </div>

      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor={tuzakId}>Website</label>
        <input id={tuzakId} name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      {durum === "hata" && (
        <p className="mt-6 text-[0.95rem]" style={{ color: "var(--accent-ink)" }}>
          {hata}
        </p>
      )}

      <div
        className="mt-10 flex flex-wrap items-center justify-between gap-4 pt-5"
        style={{ borderTop: "2px solid var(--ink)" }}
      >
        <button
          type="submit"
          disabled={durum === "gonderiliyor"}
          className="byline px-6 py-3 transition disabled:opacity-60"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          {durum === "gonderiliyor" ? "OPENING…" : "OPEN SUPPORT REQUEST →"}
        </button>
        <span className="byline">SECURELY ROUTED TO HUBZ SUPPORT</span>
      </div>
    </form>
  );
}
