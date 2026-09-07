"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSepet } from "@/components/store/SepetSaglayici";
import { fiyat as bicimliFiyat, TUR_VAADI, turu } from "@/lib/magaza";

/**
 * Sepet ve odeme — tek ekran.
 *
 * Ayri bir "sepet" ve ayri bir "odeme" sayfasi yapmadim: sepette
 * genelde bir ya da iki kalem olacak ve araya bir sayfa daha koymak
 * vazgecme noktasi uretir. Sol tarafta ne aldigi, sag tarafta kim
 * oldugu ve nasil odeyecegi.
 */

type Alan = {
  ad: string;
  soyad?: never;
};

export function SepetEkrani() {
  const { kalemler, hazir, adetYaz, cikar, araToplam, paraBirimi, bosalt } = useSepet();
  const router = useRouter();

  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [not, setNot] = useState("");
  const [tuzak, setTuzak] = useState("");
  const [adres, setAdres] = useState({ line1: "", line2: "", city: "", postcode: "", country: "" });
  const [yontem, setYontem] = useState<"bank_transfer" | "cash_on_delivery">("bank_transfer");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  /* Kargo yalnizca ELDEN teslim edilen bir sey varsa gerekiyor.
     Dijital bir rehber icin adres istemek gereksiz veri toplamak
     olurdu — sunucu da ayni kurali uyguluyor. */
  const kargoGerekli = kalemler.some((k) => turu(k.tur) === "physical");
  const kapidaOdenebilir = kalemler.length > 0 && kalemler.every((k) => turu(k.tur) === "physical");

  // Kapida odeme secilmisken sepete dijital bir sey eklenirse secim gecersiz kalir.
  const gecerliYontem = yontem === "cash_on_delivery" && !kapidaOdenebilir ? "bank_transfer" : yontem;

  if (!hazir) {
    return <p className="byline py-20">LOADING YOUR BASKET…</p>;
  }

  if (kalemler.length === 0) {
    return (
      <div className="py-20">
        <p className="display mb-4 text-3xl">Your basket is empty.</p>
        <Link href="/store" className="byline hover:text-[var(--accent-ink)]">
          ← BACK TO THE STORE
        </Link>
      </div>
    );
  }

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);
    try {
      const y = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: kalemler.map((k) => ({
            urunId: k.urunId,
            varyantId: k.varyantId ?? null,
            adet: k.adet,
          })),
          name: ad,
          email,
          phone: telefon,
          notes: not,
          website_url: tuzak,
          paymentMethod: gecerliYontem,
          address: kargoGerekli ? adres : null,
        }),
      });
      const d = await y.json();
      if (d?.success && d?.orderNumber) {
        bosalt();
        router.push(`/store/order/${d.orderNumber}`);
        return;
      }
      setHata(d?.message || d?.error || "The order could not be placed.");
    } catch {
      setHata("The order could not be placed. Please try again.");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <form onSubmit={gonder} className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      {/* --- Sepet --- */}
      <div className="lg:col-span-7">
        <div className="folio mb-5" style={{ color: "var(--accent)" }}>
          § YOUR BASKET
        </div>

        <ul>
          {kalemler.map((k) => (
            <li
              key={`${k.urunId}-${k.varyantId ?? "x"}`}
              className="flex gap-4 py-5"
              style={{ borderTop: "1px solid var(--rule)" }}
            >
              <Link
                href={`/store/${k.slug}`}
                className="h-20 w-24 shrink-0 overflow-hidden"
                style={{ background: "var(--paper-2)" }}
              >
                {k.gorsel ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={k.gorsel} alt="" className="h-full w-full object-cover" />
                ) : null}
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={`/store/${k.slug}`} className="display block text-[1.05rem] leading-snug">
                  {k.baslik}
                </Link>
                <div className="byline mt-1" style={{ color: "var(--ink-3)" }}>
                  {TUR_VAADI[turu(k.tur)].toUpperCase()}
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center" style={{ border: "1px solid var(--rule)" }}>
                    <button
                      type="button"
                      aria-label="One fewer"
                      onClick={() => adetYaz(k.urunId, k.varyantId, k.adet - 1)}
                      className="px-3 py-1.5 leading-none"
                    >
                      −
                    </button>
                    <span className="min-w-7 text-center text-[0.9rem]">{k.adet}</span>
                    <button
                      type="button"
                      aria-label="One more"
                      onClick={() => adetYaz(k.urunId, k.varyantId, k.adet + 1)}
                      className="px-3 py-1.5 leading-none"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => cikar(k.urunId, k.varyantId)}
                    className="byline"
                    style={{ color: "var(--ink-3)" }}
                  >
                    REMOVE
                  </button>
                </div>
              </div>

              <div className="display shrink-0 text-[1.05rem]">
                {bicimliFiyat(k.fiyat * k.adet, k.paraBirimi)}
              </div>
            </li>
          ))}
        </ul>

        <div
          className="flex items-baseline justify-between pt-5"
          style={{ borderTop: "2px solid var(--ink)" }}
        >
          <span className="byline">TOTAL</span>
          <span className="display text-[1.6rem]">{bicimliFiyat(araToplam, paraBirimi)}</span>
        </div>
        <p className="mt-2 text-[0.85rem]" style={{ color: "var(--ink-3)" }}>
          {kargoGerekli
            ? "Delivery is quoted once we have your address; we confirm before anything is charged."
            : "No delivery charge — everything here is sent to you online."}
        </p>
      </div>

      {/* --- Kim ve nasil --- */}
      <div className="lg:col-span-5 lg:rule-v lg:pl-14">
        <div className="folio mb-5" style={{ color: "var(--accent)" }}>
          § YOUR DETAILS
        </div>

        <div className="grid gap-4">
          <Girdi etiket="NAME" deger={ad} yaz={setAd} gerekli autoComplete="name" />
          <Girdi
            etiket="E-MAIL"
            deger={email}
            yaz={setEmail}
            gerekli
            type="email"
            autoComplete="email"
            ipucu="Where the order confirmation goes."
          />
          <Girdi
            etiket={kargoGerekli ? "PHONE" : "PHONE — OPTIONAL"}
            deger={telefon}
            yaz={setTelefon}
            gerekli={kargoGerekli}
            type="tel"
            autoComplete="tel"
          />

          {kargoGerekli && (
            <>
              <Girdi etiket="ADDRESS" deger={adres.line1} yaz={(v) => setAdres({ ...adres, line1: v })} gerekli autoComplete="address-line1" />
              <Girdi etiket="ADDRESS LINE 2 — OPTIONAL" deger={adres.line2} yaz={(v) => setAdres({ ...adres, line2: v })} autoComplete="address-line2" />
              <div className="grid grid-cols-2 gap-4">
                <Girdi etiket="CITY" deger={adres.city} yaz={(v) => setAdres({ ...adres, city: v })} gerekli autoComplete="address-level2" />
                <Girdi etiket="POSTCODE" deger={adres.postcode} yaz={(v) => setAdres({ ...adres, postcode: v })} gerekli autoComplete="postal-code" />
              </div>
              <Girdi etiket="COUNTRY" deger={adres.country} yaz={(v) => setAdres({ ...adres, country: v })} gerekli autoComplete="country-name" />
            </>
          )}
        </div>

        <div className="folio mb-4 mt-9" style={{ color: "var(--accent)" }}>
          § HOW YOU PAY
        </div>

        <div className="grid gap-3">
          <Yontem
            secili={gecerliYontem === "bank_transfer"}
            sec={() => setYontem("bank_transfer")}
            baslik="Bank transfer"
            aciklama="We send the account details with your confirmation. Your order is held until the transfer arrives."
          />
          <Yontem
            secili={gecerliYontem === "cash_on_delivery"}
            sec={() => setYontem("cash_on_delivery")}
            baslik="Cash on delivery"
            aciklama={
              kapidaOdenebilir
                ? "Pay the courier when the parcel arrives."
                : "Only for orders that are shipped — your basket has something delivered online."
            }
            kapali={!kapidaOdenebilir}
          />
        </div>

        <div className="mt-6">
          <label className="folio mb-1.5 block" style={{ color: "var(--ink-3)" }}>
            ANYTHING WE SHOULD KNOW — OPTIONAL
          </label>
          <textarea
            value={not}
            onChange={(e) => setNot(e.target.value)}
            rows={3}
            className="w-full bg-transparent p-2.5 text-[0.95rem]"
            style={{ border: "1px solid var(--rule)" }}
          />
        </div>

        {/* Tuzak alan — iletisim formundakiyle ayni gerekce. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={tuzak}
              onChange={(e) => setTuzak(e.target.value)}
            />
          </label>
        </div>

        {hata && (
          <p className="mt-5 p-3 text-[0.9rem]" style={{ background: "#fee2e2", color: "#991b1b" }}>
            {hata}
          </p>
        )}

        <button
          type="submit"
          disabled={gonderiliyor}
          className="byline mt-6 w-full px-6 py-3.5 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          {gonderiliyor ? "PLACING YOUR ORDER…" : `PLACE ORDER — ${bicimliFiyat(araToplam, paraBirimi)}`}
        </button>

        <p className="mt-3 text-[0.82rem] leading-relaxed" style={{ color: "var(--ink-3)" }}>
          No card details are taken here. By ordering you accept our{" "}
          <Link href="/terms-and-conditions" className="underline">terms</Link> and{" "}
          <Link href="/data-and-privacy" className="underline">privacy notice</Link>.
        </p>
      </div>
    </form>
  );
}

function Girdi({
  etiket,
  deger,
  yaz,
  gerekli,
  type = "text",
  autoComplete,
  ipucu,
}: {
  etiket: string;
  deger: string;
  yaz: (v: string) => void;
  gerekli?: boolean;
  type?: string;
  autoComplete?: string;
  ipucu?: string;
}) {
  return (
    <div>
      <label className="folio mb-1.5 block" style={{ color: "var(--ink-3)" }}>
        {etiket}
      </label>
      <input
        type={type}
        value={deger}
        required={gerekli}
        autoComplete={autoComplete}
        onChange={(e) => yaz(e.target.value)}
        className="w-full bg-transparent px-2.5 py-2 text-[0.95rem]"
        style={{ border: "1px solid var(--rule)" }}
      />
      {ipucu && (
        <p className="mt-1 text-[0.8rem]" style={{ color: "var(--ink-3)" }}>
          {ipucu}
        </p>
      )}
    </div>
  );
}

function Yontem({
  secili,
  sec,
  baslik,
  aciklama,
  kapali,
}: {
  secili: boolean;
  sec: () => void;
  baslik: string;
  aciklama: string;
  kapali?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={kapali ? undefined : sec}
      disabled={kapali}
      aria-pressed={secili}
      className="p-4 text-left transition-colors disabled:opacity-45"
      style={{
        border: `1px solid ${secili ? "var(--ink)" : "var(--rule)"}`,
        background: secili ? "var(--paper-2)" : "transparent",
      }}
    >
      <div className="display text-[1.02rem]">{baslik}</div>
      <p className="mt-1 text-[0.86rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
        {aciklama}
      </p>
    </button>
  );
}
