import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { fiyat, TUR_VAADI, turu } from "@/lib/magaza";
import { SITE, markali } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Siparis onayi.
 *
 * Odeme HENUZ ALINMADI — havale de kapida odeme de parayi sonra
 * aliyor. Bu sayfa "tesekkurler, odendi" demiyor; ne aldigini, ne kadar
 * borclu oldugunu ve SIRADA NE OLDUGUNU soyluyor. Havale secildiyse
 * hesap bilgileri burada; okurun ayrica bir yere bakmasi gerekmiyor.
 *
 * Adres siparis NUMARASI ile aciliyor. Numara tarih + rastgele bir
 * parca; sirali olsaydi kac satis yaptigimiz disaridan sayilabilirdi.
 * Yine de sayfa siparisin TAMAMINI gostermiyor: adres ve telefon
 * yazilmiyor, cunku baglanti paylasilabiliyor.
 */

interface PageProps {
  params: Promise<{ number: string }>;
}

export const metadata: Metadata = {
  title: markali("Your order"),
  /* Kisiye ozel; dizine girmemeli. */
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE}/store` },
};

/**
 * Havale bilgileri. Sabit degil ORTAM DEGISKENINDEN geliyor: banka
 * hesabi kodda durmamali — depo paylasildiginda ya da acildiginda
 * hesap numarasi da paylasilmis olurdu.
 */
const HAVALE = {
  unvan: process.env.BANKA_UNVAN || "",
  iban: process.env.BANKA_IBAN || "",
  banka: process.env.BANKA_ADI || "",
};

export default async function SiparisSayfasi({ params }: PageProps) {
  const { number } = await params;

  const siparis = await db.query.orders.findFirst({
    where: eq(schema.orders.orderNumber, number),
  });
  if (!siparis) notFound();

  const kalemler = await db.query.orderItems.findMany({
    where: eq(schema.orderItems.orderId, siparis.id),
  });

  const birim = siparis.currency || "USD";
  const havale = siparis.paymentMethod === "bank_transfer";
  const kargoVar = (kalemler as any[]).some((k) => turu(k.productType) === "physical");

  return (
    <div className="mag min-h-screen">
      <MagazineHeader />

      <main>
        <header className="mag-wrap pt-12 sm:pt-16">
          <div className="rule-heavy pt-5">
            <div className="folio mb-3">§ ORDER {siparis.orderNumber}</div>
            <h1 className="display mb-3 text-[clamp(2.4rem,6vw,4.2rem)]">
              We have your order.
            </h1>
            <p
              className="max-w-[56ch] text-[1.05rem] leading-relaxed"
              style={{ color: "var(--ink-2)" }}
            >
              {havale
                ? "Nothing has been charged. Send the transfer using the details below and we will start as soon as it lands."
                : "Nothing has been charged. You pay the courier when the parcel arrives."}
            </p>
          </div>
        </header>

        <section className="mag-wrap pt-10">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Ne aldi */}
            <div className="lg:col-span-7">
              <div className="folio mb-5" style={{ color: "var(--accent)" }}>
                § WHAT YOU ORDERED
              </div>
              <ul>
                {(kalemler as any[]).map((k) => (
                  <li
                    key={k.id}
                    className="flex items-baseline gap-4 py-4"
                    style={{ borderTop: "1px solid var(--rule)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="display text-[1.05rem] leading-snug">{k.title}</div>
                      <div className="byline mt-1" style={{ color: "var(--ink-3)" }}>
                        {TUR_VAADI[turu(k.productType)].toUpperCase()} · ×{k.quantity}
                      </div>
                    </div>
                    <div className="display shrink-0 text-[1.02rem]">
                      {fiyat(k.totalPrice, birim)}
                    </div>
                  </li>
                ))}
              </ul>

              <div
                className="flex items-baseline justify-between pt-5"
                style={{ borderTop: "2px solid var(--ink)" }}
              >
                <span className="byline">TOTAL DUE</span>
                <span className="display text-[1.6rem]">{fiyat(siparis.total, birim)}</span>
              </div>

              {kargoVar && (
                <p className="mt-3 text-[0.88rem]" style={{ color: "var(--ink-3)" }}>
                  Delivery is quoted separately and confirmed with you before dispatch.
                </p>
              )}
            </div>

            {/* Sirada ne var */}
            <div className="lg:col-span-5 lg:rule-v lg:pl-14">
              <div className="folio mb-5" style={{ color: "var(--accent)" }}>
                § WHAT HAPPENS NEXT
              </div>

              {havale ? (
                <div className="p-5" style={{ background: "var(--paper-2)" }}>
                  {HAVALE.iban ? (
                    <>
                      <p className="mb-4 text-[0.95rem] leading-relaxed">
                        Send {fiyat(siparis.total, birim)} to the account below, quoting{" "}
                        <strong>{siparis.orderNumber}</strong> as the reference.
                      </p>
                      <dl className="text-[0.92rem]">
                        {HAVALE.unvan && (
                          <Satir etiket="ACCOUNT NAME" deger={HAVALE.unvan} />
                        )}
                        {HAVALE.banka && <Satir etiket="BANK" deger={HAVALE.banka} />}
                        <Satir etiket="IBAN" deger={HAVALE.iban} tekAralik />
                        <Satir etiket="REFERENCE" deger={siparis.orderNumber} tekAralik />
                      </dl>
                    </>
                  ) : (
                    /* Hesap bilgisi tanimli degilse UYDURMA bir sey
                       yazmiyoruz; okura nereden ogrenecegini soyluyoruz. */
                    <p className="text-[0.95rem] leading-relaxed">
                      We will e-mail you the account details for the transfer, quoting{" "}
                      <strong>{siparis.orderNumber}</strong> as the reference.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-5" style={{ background: "var(--paper-2)" }}>
                  <p className="text-[0.95rem] leading-relaxed">
                    Have {fiyat(siparis.total, birim)} ready for the courier. We will confirm
                    the delivery date by e-mail first.
                  </p>
                </div>
              )}

              <p className="mt-6 text-[0.92rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
                A confirmation is on its way to <strong>{siparis.customerEmail}</strong>. Keep
                the order number — it is how we find you.
              </p>

              <p className="mt-6">
                <Link href="/contact?type=general" className="byline">
                  SOMETHING WRONG? TELL US →
                </Link>
              </p>
            </div>
          </div>
        </section>

        <div className="mag-wrap pt-14">
          <div style={{ borderTop: "2px solid var(--ink)" }} className="pt-5">
            <Link href="/store" className="byline">
              ← BACK TO THE STORE
            </Link>
          </div>
        </div>

        <div className="h-24 sm:h-32" />
      </main>

      <MagazineFooter />
    </div>
  );
}

function Satir({
  etiket,
  deger,
  tekAralik,
}: {
  etiket: string;
  deger: string;
  tekAralik?: boolean;
}) {
  return (
    <div className="flex gap-4 py-2" style={{ borderTop: "1px solid var(--rule)" }}>
      <dt className="w-28 shrink-0 folio" style={{ color: "var(--ink-3)" }}>
        {etiket}
      </dt>
      {/* IBAN ve siparis numarasi tek aralikli: elle kopyalanan
          seylerde rakamlarin hizali durmasi yanlis okumayi azaltiyor. */}
      <dd className={tekAralik ? "font-mono text-[0.88rem] break-all" : ""}>{deger}</dd>
    </div>
  );
}
