import React from "react";
import type { Metadata } from "next";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { SepetEkrani } from "./SepetEkrani";
import { SITE, markali } from "@/lib/seo";
import { kargoTarifesi } from "@/lib/kargo-ayar";

export const dynamic = "force-dynamic";

/**
 * Sepet ve odeme.
 *
 * Sepet TARAYICIDA duruyor; sunucunun okudugu tek sey KARGO
 * TARIFESI. Tarifeyi istemciye ayri bir istekle cektirmedik: sepet
 * acilir acilmaz teslimat satirini gosterebilmeli, bir istek daha
 * beklemesi o satirin bir an bos gorunmesi demekti.
 */
export const metadata: Metadata = {
  title: markali("Your basket"),
  description: "The items you are ordering from the Fabelo store.",
  alternates: { canonical: `${SITE}/store/cart` },
  /* Sepet kisiye ozel bir ekran; dizine girmesi anlamsiz. Magaza
     acildiktan sonra da noindex kalacak. */
  robots: { index: false, follow: false },
};

export default async function SepetSayfasi() {
  const tarife = await kargoTarifesi();
  return (
    <div className="mag min-h-screen">
      <MagazineHeader />
      <main>
        <header className="mag-wrap pt-12 sm:pt-16">
          <div className="rule-heavy pt-5">
            <div className="folio mb-3">§ CHECKOUT</div>
            <h1 className="display mb-2 text-[clamp(2.4rem,6vw,4.2rem)]">Your basket</h1>
          </div>
        </header>
        <section className="mag-wrap pt-10">
          <SepetEkrani tarife={tarife} />
        </section>
        <div className="h-24 sm:h-32" />
      </main>
      <MagazineFooter />
    </div>
  );
}
