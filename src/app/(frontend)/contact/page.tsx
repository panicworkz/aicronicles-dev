import React from "react";
import type { Metadata } from "next";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { SITE, kirintiSemasi } from "@/lib/seo";
import ContactForm from "./ContactForm";
import { sekmeBul } from "./sekmeler";

export const dynamic = "force-dynamic";

const ACIKLAMA =
  "Reach the Fabelo desk — questions, corrections, advertising and partnership enquiries, all through one form.";

export const metadata: Metadata = {
  title: "Contact | Fabelo",
  description: ACIKLAMA,
  alternates: { canonical: `${SITE}/contact` },
  openGraph: {
    type: "website",
    url: `${SITE}/contact`,
    title: "Contact Fabelo",
    description: ACIKLAMA,
    images: [{ url: `${SITE}/images/fabelo-logo.png` }],
  },
  twitter: {
    card: "summary",
    title: "Contact Fabelo",
    description: ACIKLAMA,
    images: [`${SITE}/images/fabelo-logo.png`],
  },
};

/**
 * Iletisim sayfasi.
 *
 * Site hicbir yerde e-posta adresi yazmiyor. Once bes CMS sayfasi
 * "support@..." diye mailto baglantisi tasiyordu; adres duz metin
 * durunca toplayici botlarin isine yariyor ve okuru posta programini
 * acmaya zorluyordu. Hepsi buraya yonlendirildi.
 */
interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ContactPage({ searchParams }: PageProps) {
  /* Sekme SUNUCUDA seciliyor. Once istemcide useEffect ile okunuyordu:
     sunucudan gelen HTML her zaman ilk sekmeyi tasiyor, dogru sekme
     ancak hidrasyondan sonra aciliyordu — bir anlik yanlis sekme ve
     JS calismayan istemcide hep "general". Adres zaten sayfanin bir
     parcasi, sunucunun bilmemesi icin bir sebep yok. */
  const { type } = await searchParams;
  const acilis = sekmeBul(type).anahtar;
  return (
    <div className="mag min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(kirintiSemasi([{ ad: "Contact", yol: "/contact" }])),
        }}
      />
      <MagazineHeader />

      <main>
        <header className="mag-wrap pt-12 sm:pt-16">
          <div className="rule-heavy pt-5">
            <div className="folio mb-3">§ CONTACT</div>
            <h1 className="display mb-3 text-[clamp(2.6rem,6.5vw,5rem)]">Write to the desk</h1>
            <p
              className="max-w-[56ch] text-[1.08rem] leading-relaxed"
              style={{ color: "var(--ink-2)" }}
            >
              Questions, corrections, advertising and partnership enquiries all
              arrive in the same place. We read everything and reply to what
              needs a reply, usually within two business days.
            </p>
          </div>
        </header>

        <section className="mag-wrap py-12">
          <ContactForm acilis={acilis} />
        </section>

        <div className="h-20 sm:h-28" />
      </main>

      <MagazineFooter />
    </div>
  );
}
