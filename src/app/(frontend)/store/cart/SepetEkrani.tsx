"use client";

import React, { useEffect, useState } from "react";
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

export function SepetEkrani() {
  const { kalemler, hazir, adetYaz, cikar, fiyatYaz, araToplam, paraBirimi, bosalt } = useSepet();
  const router = useRouter();

  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [not, setNot] = useState("");
  const [tuzak, setTuzak] = useState("");
  const [adres, setAdres] = useState({ line1: "", line2: "", city: "", postcode: "", country: "" });
  const [yontem, setYontem] = useState<"bank_transfer" | "cash_on_delivery">("bank_transfer");
  /* Iki AYRI onay. Hukuken ayri seyler: birincisi "okudum", ikincisi
     "bu hakkimdan vazgectigimi biliyorum". Tek kutuya sikistirmak
     onayin acikligini tartismali hale getirirdi. */
  const [sozlesmeOnay, setSozlesmeOnay] = useState(false);
  const [dijitalOnay, setDijitalOnay] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  /* Sepet tarayicida SURESIZ duruyor: silinmis ya da taslaga cekilmis
     bir urun orada oyle kaliyordu — listede gorunuyor, toplama
     ekleniyor, ama siparis verilince her sey topluca reddediliyordu ve
     okur hangi kalemin sorunlu oldugunu goremiyordu. Fiyati degismis
     bir urun de eski tutarla duruyordu. Sayfa acilinca sunucuyla
     karsilastiriliyor. */
  const [duseneler, setDuseneler] = useState<string[]>([]);

  /* Kargo yalnizca ELDEN teslim edilen bir sey varsa gerekiyor.
     Dijital bir rehber icin adres istemek gereksiz veri toplamak
     olurdu — sunucu da ayni kurali uyguluyor. */
  const kargoGerekli = kalemler.some((k) => turu(k.tur) === "physical");
  /* Sepette aninda teslim edilen bir sey varsa cayma hakki istisnasi
     devreye giriyor ve AYRICA onaylanmasi gerekiyor. */
  const dijitalVar = kalemler.some((k) => turu(k.tur) !== "physical");
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

  useEffect(() => {
    if (!hazir || kalemler.length === 0) return;
    let iptal = false;
    (async () => {
      try {
        const y = await fetch("/api/cart/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: kalemler.map((k) => ({ urunId: k.urunId })) }),
        });
        const d = await y.json();
        if (iptal || !d?.success) return;

        const gecerli = new Map<number, any>((d.items ?? []).map((u: any) => [u.urunId, u]));
        const gidenler: string[] = [];
        for (const k of kalemler) {
          const u = gecerli.get(k.urunId);
          if (!u || !u.stokta) {
            gidenler.push(k.baslik);
            cikar(k.urunId, k.varyantId);
            continue;
          }
          /* Fiyat degistiyse sepet GUNCEL tutari gostersin. Odemede
             zaten sunucunun fiyati gecerli; ikisi ayrisirsa okur
             beklemedigi bir tutarla karsilasirdi. */
          const varyant = u.varyantlar?.find((v: any) => v.id === k.varyantId);
          const guncel = varyant?.price != null ? Number(varyant.price) : u.fiyat;
          if (guncel !== k.fiyat) fiyatYaz(k.urunId, k.varyantId, guncel);
        }
        if (gidenler.length) setDuseneler(gidenler);
      } catch {
        /* Sunucuya ulasilamadiysa sepete DOKUNMUYORUZ: gecici bir ag
           sorunu yuzunden okurun sepetini bosaltmak yanlis olurdu. */
      }
    })();
    return () => {
      iptal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hazir]);

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
          termsAccepted: sozlesmeOnay,
          digitalWaiver: dijitalVar ? dijitalOnay : undefined,
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
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <div className="folio" style={{ color: "var(--accent)" }}>
            § YOUR BASKET
          </div>
          {/* Magazaya donus yolu. Bu ekranda hicbir cikis yoktu:
              alisverise devam etmek isteyen okurun geri tusundan
              baska secenegi kalmiyordu. */}
          <Link href="/store" className="byline hover:text-[var(--accent-ink)]">
            ← KEEP SHOPPING
          </Link>
        </div>

        {duseneler.length > 0 && (
          <p
            className="mb-5 p-3.5 text-[0.9rem] leading-relaxed"
            style={{ background: "var(--paper-2)" }}
          >
            {duseneler.length === 1
              ? `“${duseneler[0]}” is no longer available, so we took it out of your basket.`
              : `${duseneler.length} items are no longer available and were taken out of your basket.`}
          </p>
        )}

        <ul>
          {kalemler.map((k) => (
            <li
              key={`${k.urunId}-${k.varyantId ?? "x"}`}
              className="flex gap-4 py-5"
              style={{ borderTop: "1px solid var(--rule)" }}
            >
              <Link
                href={`/store/${k.slug}`}
                className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden p-1.5"
                style={{ background: "var(--paper-2)" }}
              >
                {k.gorsel ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={k.gorsel} alt="" className="h-full w-full object-contain" />
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

        {/* ONAYLAR.
            Once burada yalnizca dugmenin altinda "siparis vererek
            kabul etmis olursunuz" yazan bir cumle vardi. Mesafeli
            Sozlesmeler Yonetmeligi bunu yeterli saymiyor: on
            bilgilendirmenin yapildigi ve tuketicinin onayladigi
            ISPAT edilebilir olmali. Onay zamani siparise yaziliyor. */}
        <div className="mt-7 space-y-3">
          <Onay
            secili={sozlesmeOnay}
            degistir={setSozlesmeOnay}
            id="onay-sozlesme"
          >
            I have read and accept the{" "}
            <Link href="/on-bilgilendirme-formu" target="_blank" className="underline">
              Ön Bilgilendirme Formu
            </Link>{" "}
            and the{" "}
            <Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="underline">
              Mesafeli Satış Sözleşmesi
            </Link>
            . Buying from outside Turkey? See the{" "}
            <Link href="/terms-of-sale" target="_blank" className="underline">
              Terms of Sale
            </Link>
            .
          </Onay>

          {dijitalVar && (
            <Onay secili={dijitalOnay} degistir={setDijitalOnay} id="onay-dijital">
              This order contains something delivered to me immediately. I understand
              that once it is delivered I cannot cancel it, and I ask for it to be
              delivered straight away.
            </Onay>
          )}
        </div>

        <button
          type="submit"
          disabled={gonderiliyor || !sozlesmeOnay || (dijitalVar && !dijitalOnay)}
          className="byline mt-5 w-full px-6 py-3.5 transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          {gonderiliyor ? "PLACING YOUR ORDER…" : `PLACE ORDER — ${bicimliFiyat(araToplam, paraBirimi)}`}
        </button>

        <p className="mt-3 text-[0.82rem] leading-relaxed" style={{ color: "var(--ink-3)" }}>
          No card details are taken here. Nothing is charged until you have confirmed
          the delivery cost. See{" "}
          <Link href="/delivery-and-returns" className="underline">delivery and returns</Link>{" "}
          and our{" "}
          <Link href="/data-and-privacy" className="underline">privacy notice</Link>.
        </p>
      </div>
    </form>
  );
}

/** Onay kutusu — metni tiklanabilir, kutu yeterince buyuk. */
function Onay({
  secili,
  degistir,
  id,
  children,
}: {
  secili: boolean;
  degistir: (v: boolean) => void;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer gap-3 p-3.5 text-[0.88rem] leading-relaxed"
      style={{ border: `1px solid ${secili ? "var(--ink)" : "var(--rule)"}` }}
    >
      <input
        id={id}
        type="checkbox"
        checked={secili}
        onChange={(e) => degistir(e.target.checked)}
        className="mt-0.5 size-4 shrink-0"
      />
      <span>{children}</span>
    </label>
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
