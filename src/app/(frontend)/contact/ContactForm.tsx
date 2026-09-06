"use client";

import React, { useId, useRef, useState } from "react";
import { SEKMELER, sekmeBul, type Alan } from "./sekmeler";

type Durum = "bos" | "gonderiliyor" | "tamam" | "hata";

/**
 * Sekmeli iletisim formu.
 *
 * Her sekme sitedeki bir sabit sayfanin karsiligi (bkz. sekmeler.ts) ve
 * o sayfadan gelen okur dogru sekme acilmis buluyor: /advertise
 * sayfasindaki baglanti /contact?type=advertising diyor. Adresteki
 * deger taninmazsa ilk sekmeye dusuyor — bozuk bir baglanti bos bir
 * form gostermemeli.
 *
 * Sekme degisince ortak alanlar (ad, kurum, e-posta, telefon) KORUNUYOR;
 * yalnizca konuya ozel alanlar degisiyor. Yanlis sekmeyi acan biri
 * yazdiklarini kaybetmesin diye.
 */
export default function ContactForm({ acilis }: { acilis: string }) {
  const [aktif, setAktif] = useState(acilis);
  const [durum, setDurum] = useState<Durum>("bos");
  const [hata, setHata] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const tuzakId = useId();

  const sekme = sekmeBul(aktif);

  async function gonder(olay: React.FormEvent<HTMLFormElement>) {
    olay.preventDefault();
    if (durum === "gonderiliyor") return;
    const form = formRef.current;
    if (!form) return;

    const veri = new FormData(form);
    const ekAlanlar: Record<string, string> = {};
    for (const a of sekme.alanlar) {
      const d = String(veri.get(a.ad) ?? "").trim();
      if (d) ekAlanlar[a.etiket] = d;
    }

    setDurum("gonderiliyor");
    setHata("");
    try {
      const cevap = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: sekme.anahtar,
          topic_label: sekme.baslik,
          name: veri.get("name"),
          organization: veri.get("organization"),
          email: veri.get("email"),
          phone: veri.get("phone"),
          message: veri.get("message"),
          fields: ekAlanlar,
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

  const alanStil = { background: "var(--paper)", borderColor: "var(--rule)", color: "var(--ink)" };
  const alanSinif =
    "w-full rounded-[2px] border px-3 py-2.5 text-[0.95rem] outline-none transition " +
    "focus:border-[var(--accent-ink)]";

  if (durum === "tamam") {
    return (
      <div className="rule-heavy pt-6">
        <p className="display mb-2 text-2xl">Thank you — your message is on its way.</p>
        <p style={{ color: "var(--ink-2)" }}>
          It reached the desk under “{sekme.baslik}”. We read everything and reply
          to what needs a reply, usually within two business days.
        </p>
      </div>
    );
  }

  const alanCiz = (a: Alan) => (
    <div key={a.ad}>
      <label htmlFor={a.ad} className="byline mb-1.5 block">
        {a.etiket.toUpperCase()}
        {a.zorunlu && <span style={{ color: "var(--accent-ink)" }}> *</span>}
      </label>
      {a.tur === "secim" ? (
        <select
          id={a.ad}
          name={a.ad}
          required={a.zorunlu}
          defaultValue=""
          className={alanSinif}
          style={alanStil}
        >
          <option value="" disabled>
            Choose one…
          </option>
          {a.secenekler.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={a.ad}
          name={a.ad}
          required={a.zorunlu}
          maxLength={300}
          placeholder={a.ipucu}
          className={alanSinif}
          style={alanStil}
        />
      )}
    </div>
  );

  return (
    <div>
      {/* --- Sekmeler --- */}
      <div className="rule-heavy mb-8 flex flex-wrap gap-x-6 gap-y-2 pb-3">
        {SEKMELER.map((s) => {
          const acik = s.anahtar === aktif;
          return (
            <button
              key={s.anahtar}
              type="button"
              onClick={() => setAktif(s.anahtar)}
              aria-current={acik ? "true" : undefined}
              className="byline pb-1 text-left transition"
              style={{
                color: acik ? "var(--ink)" : "var(--ink-3)",
                borderBottom: acik ? "2px solid var(--accent-ink)" : "2px solid transparent",
              }}
            >
              <span style={{ color: "var(--ink-3)" }}>{s.no}</span> {s.baslik.toUpperCase()}
            </button>
          );
        })}
      </div>

      <p className="mb-8 max-w-[56ch] text-[1.02rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
        {sekme.ozet}
      </p>

      <form ref={formRef} onSubmit={gonder} className="max-w-[62ch] space-y-8">
        {/* --- 01: kim --- */}
        <fieldset className="space-y-4">
          <legend className="folio mb-3">§ WHO YOU ARE</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="byline mb-1.5 block">
                NAME<span style={{ color: "var(--accent-ink)" }}> *</span>
              </label>
              <input id="name" name="name" required maxLength={120} className={alanSinif} style={alanStil} />
            </div>
            <div>
              <label htmlFor="organization" className="byline mb-1.5 block">
                COMPANY / ORGANISATION
              </label>
              <input id="organization" name="organization" maxLength={160} className={alanSinif} style={alanStil} />
            </div>
            <div>
              <label htmlFor="email" className="byline mb-1.5 block">
                EMAIL<span style={{ color: "var(--accent-ink)" }}> *</span>
              </label>
              <input id="email" name="email" type="email" required maxLength={200} className={alanSinif} style={alanStil} />
            </div>
            <div>
              <label htmlFor="phone" className="byline mb-1.5 block">
                PHONE
              </label>
              <input id="phone" name="phone" maxLength={40} className={alanSinif} style={alanStil} />
            </div>
          </div>
        </fieldset>

        {/* --- 02: konuya ozel --- */}
        <fieldset className="space-y-4">
          <legend className="folio mb-3">§ {sekme.baslik.toUpperCase()}</legend>
          <div className="grid gap-4 sm:grid-cols-2">{sekme.alanlar.map(alanCiz)}</div>
        </fieldset>

        {/* --- 03: mesaj --- */}
        <fieldset>
          <legend className="folio mb-3">§ YOUR MESSAGE</legend>
          <label htmlFor="message" className="byline mb-1.5 block">
            {sekme.mesajEtiketi.toUpperCase()}
            <span style={{ color: "var(--accent-ink)" }}> *</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={7}
            maxLength={5000}
            className={alanSinif}
            style={alanStil}
          />
        </fieldset>

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

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={durum === "gonderiliyor"}
            className="byline px-5 py-2.5 transition disabled:opacity-60"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            {durum === "gonderiliyor" ? "SENDING…" : "SEND MESSAGE →"}
          </button>
          <span className="byline" style={{ color: "var(--ink-3)" }}>
            WE REPLY WITHIN TWO BUSINESS DAYS
          </span>
        </div>
      </form>
    </div>
  );
}
