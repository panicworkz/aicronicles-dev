"use client";

import React, { useId, useRef, useState } from "react";
import { type Alan, type Sekme } from "./sekmeler";

type Durum = "bos" | "gonderiliyor" | "tamam" | "hata";

/**
 * Sekmeli iletisim formu — derginin kendi dilinde.
 *
 * ILK HALI YANLISTI: sekmeler yatay bir serit, alanlar sayfanin sol
 * yarisinda yuzen kutulardi; sagda genis bir bosluk kaliyordu ve hicbir
 * yeri sitenin geri kalanina benzemiyordu.
 *
 * Simdi sayfanin kendi kalibi kullaniliyor — CmsPage'deki (/about,
 * /advertise) duzen: solda 240px'lik yapiskan ray, sagda govde. Ray
 * "§ CONTENTS" navigasyonunun aynisi, cunku sekmeler zaten bir
 * icindekiler listesi. Alanlar da kart izgarasindaki saç teli
 * tekniginde: kapsayici --rule renginde, hucreler --paper, aradaki
 * 1px cizgi izgaranin kendisi.
 *
 * Her sekme sitedeki bir sabit sayfanin karsiligi (bkz. sekmeler.ts);
 * o sayfadan gelen okur dogru sekmeyi acilmis buluyor.
 *
 * Sekme degisince ortak alanlar (ad, kurum, e-posta, telefon)
 * KORUNUYOR; yalnizca konuya ozel alanlar degisiyor.
 */
export default function ContactForm({
  acilis,
  sekmeler,
}: {
  acilis: string;
  /* Sekmeler sunucudan geliyor — panelde duzenlenen liste. Bileşen
     kendi kaynagini okumuyor ki istemci paketine veritabani kodu
     girmesin. */
  sekmeler: Sekme[];
}) {
  const [aktif, setAktif] = useState(acilis);
  const [durum, setDurum] = useState<Durum>("bos");
  const [hata, setHata] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const tuzakId = useId();

  const sekme = sekmeler.find((s) => s.anahtar === aktif) ?? sekmeler[0];

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

  /* Alanin kendisi cercevesiz: cerceveyi izgaranin 1px'lik araligi
     zaten ciziyor. Ust uste iki cizgi kalin ve amator duruyordu. */
  /* GIRDININ CERCEVESI VAR.
     Once yalnizca seffaf bir metin alaniydi; kutulari birbirinden
     izgara boslugu ayiriyordu. Sonuc: nereye yazilacagi belli
     degildi — form bir tabloya benziyordu, doldurulacak bir seye
     degil. Odeme ekraninda ayni kalibi zaten cerceveli kullandik. */
  const girdi =
    "w-full bg-transparent px-3 py-2.5 text-[0.98rem] leading-normal outline-none " +
    "border border-[var(--rule)] transition-colors " +
    "focus:border-[var(--ink)] placeholder:text-[var(--ink-3)]";

  /** Bir form hucresi — kart izgarasindaki hucrenin aynisi. */
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
    /* Etiket BUYUK HARF DEGIL ve daha koyu. Once "byline" idi:
       tek aralikli, 11px, acik gri, hepsi buyuk harf — bir formda
       okunmasi en zor bicim. */
    <div className={`flex flex-col gap-1.5 ${genis ? "sm:col-span-2" : ""}`}>
      <label className="text-[0.86rem]" style={{ color: "var(--ink-2)" }}>
        {etiket}
        {zorunlu && <span style={{ color: "var(--accent-ink)" }}> *</span>}
      </label>
      {children}
    </div>
  );

  const alanCiz = (a: Alan) => (
    <Hucre key={a.ad} etiket={a.etiket} zorunlu={a.zorunlu} genis={a.tur === "secim" && a.secenekler.some((s) => s.length > 34)}>
      {a.tur === "secim" ? (
        <select id={a.ad} name={a.ad} required={a.zorunlu} defaultValue="" className={girdi}>
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
          className={girdi}
        />
      )}
    </Hucre>
  );

  const RayOgesi = ({ s }: { s: Sekme }) => {
    const acik = s.anahtar === aktif;
    return (
      <li style={{ borderTop: "1px solid var(--rule)" }}>
        <button
          type="button"
          onClick={() => setAktif(s.anahtar)}
          aria-current={acik ? "true" : undefined}
          className="flex w-full gap-3 py-2.5 text-left text-[0.88rem] leading-snug transition-colors hover:text-[var(--accent-ink)]"
          style={{ color: acik ? "var(--ink)" : undefined }}
        >
          <span className="folio shrink-0" style={{ color: acik ? "var(--accent)" : "var(--ink-3)" }}>
            {s.no}
          </span>
          <span style={{ fontWeight: acik ? 600 : 400 }}>{s.baslik}</span>
        </button>
      </li>
    );
  };

  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-12">
      {/* --- Ray: sekmeler --- */}
      <aside className="mb-10 lg:mb-0">
        <div style={{ position: "sticky", top: "calc(var(--mag-header-h, 145px) + 2rem)" }}>
          <div className="folio mb-4" style={{ color: "var(--accent)" }}>
            § WHAT IS IT ABOUT
          </div>
          <nav>
            <ol className="flex flex-col">
              {sekmeler.map((s) => (
                <RayOgesi key={s.anahtar} s={s} />
              ))}
            </ol>
          </nav>
          <p
            className="mt-6 pt-4 text-[0.82rem] leading-relaxed"
            style={{ borderTop: "1px solid var(--rule)", color: "var(--ink-3)" }}
          >
            We read everything and reply to what needs a reply, usually within two
            business days.
          </p>
        </div>
      </aside>

      {/* --- Govde --- */}
      <div>
        {durum === "tamam" ? (
          <div style={{ borderTop: "2px solid var(--ink)" }} className="pt-6">
            <div className="folio mb-3" style={{ color: "var(--accent)" }}>
              § SENT
            </div>
            <h2 className="display mb-4 text-[clamp(1.8rem,3vw,2.6rem)]">
              Thank you — your message is on its way.
            </h2>
            <p className="max-w-[62ch] text-[1.04rem] leading-[1.78]" style={{ color: "var(--ink-2)" }}>
              It reached the desk under <em>{sekme.baslik}</em>. We read everything and
              reply to what needs a reply, usually within two business days.
            </p>
          </div>
        ) : (
          <form ref={formRef} onSubmit={gonder}>
            <h2 className="display mb-4 text-[clamp(1.6rem,2.4vw,2.15rem)]">{sekme.baslik}</h2>
            <p
              className="mb-10 max-w-[62ch] text-[1.04rem] leading-[1.78]"
              style={{ color: "var(--ink-2)" }}
            >
              {sekme.ozet}
            </p>

            {/* Bolum basliklari sadelesti: "§ 01 · WHO YOU ARE" gibi
                numarali isaretler dergi dilinden geliyordu ama formda
                gurultu yapiyor — okur zaten sirayla dolduruyor. */}
            <div className="folio mb-4" style={{ color: "var(--accent)" }}>
              ABOUT YOU
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

            {/* Konuya ozel */}
            {sekme.alanlar.length > 0 && (
              <>
                <div className="folio mb-4 mt-10" style={{ color: "var(--accent)" }}>
                  {sekme.baslik.toUpperCase()}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {sekme.alanlar.map(alanCiz)}
                </div>
              </>
            )}

            {/* Mesaj */}
            <div className="folio mb-4 mt-10" style={{ color: "var(--accent)" }}>
              YOUR MESSAGE
            </div>
            <div className="grid gap-5">
              <Hucre etiket={sekme.mesajEtiketi} zorunlu>
                {/* Sekiz satir kocaman bir bosluk biraktiriyordu ve
                    form bitmemis gibi duruyordu. Bes satir yeterli;
                    yazan buyutebiliyor. */}
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  maxLength={5000}
                  className={`${girdi} resize-y`}
                />
              </Hucre>
            </div>

            {/* Tuzak — insan gormez, ekran okuyucu da okumaz. */}
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
                {durum === "gonderiliyor" ? "SENDING…" : "SEND MESSAGE →"}
              </button>
              <span className="byline">NO ADDRESS TO COPY · EVERY MESSAGE ARRIVES HERE</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
