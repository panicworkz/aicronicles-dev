import React from "react";
import type { Metadata } from "next";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import { SITE, kirintiSemasi } from "@/lib/seo";
import SupportForm from "./SupportForm";

export const dynamic = "force-dynamic";

const ACIKLAMA =
  "Open a PanicWorkz support request for project delivery, maintenance, billing or technical help.";

export const metadata: Metadata = {
  title: "Support | PanicWorkz",
  description: ACIKLAMA,
  alternates: { canonical: `${SITE}/support` },
  openGraph: {
    type: "website",
    url: `${SITE}/support`,
    title: "PanicWorkz Support",
    description: ACIKLAMA,
    images: [{ url: `${SITE}/images/fabelo-logo.png` }],
  },
  twitter: {
    card: "summary",
    title: "PanicWorkz Support",
    description: ACIKLAMA,
    images: [`${SITE}/images/fabelo-logo.png`],
  },
};

export default function SupportPage() {
  return (
    <div className="mag min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(kirintiSemasi([{ ad: "Support", yol: "/support" }])),
        }}
      />
      <MagazineHeader />

      <main>
        <header className="mag-wrap pt-12 sm:pt-16">
          <div className="rule-heavy pt-5">
            <div className="folio mb-3">§ PANICWORKZ SUPPORT</div>
            <h1 className="display mb-3 text-[clamp(2.6rem,6.5vw,5rem)]">Keep the work moving</h1>
            <p
              className="max-w-[60ch] text-[1.08rem] leading-relaxed"
              style={{ color: "var(--ink-2)" }}
            >
              Use this desk for active projects, maintenance, billing questions and
              technical issues. The request is written into Hubz CRM so the team can
              track the case and reply from the same customer timeline.
            </p>
          </div>
        </header>

        <section className="mag-wrap py-12">
          <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-12">
            <aside className="mb-10 lg:mb-0">
              <div style={{ position: "sticky", top: "calc(var(--mag-header-h, 145px) + 2rem)" }}>
                <div className="folio mb-4" style={{ color: "var(--accent)" }}>
                  § HOW IT WORKS
                </div>
                <ol className="flex flex-col">
                  {[
                    ["01", "Open one clear request"],
                    ["02", "Hubz creates the ticket"],
                    ["03", "The team replies by email"],
                  ].map(([no, label]) => (
                    <li key={no} style={{ borderTop: "1px solid var(--rule)" }}>
                      <div className="flex gap-3 py-2.5 text-[0.88rem] leading-snug">
                        <span className="folio shrink-0" style={{ color: "var(--accent)" }}>
                          {no}
                        </span>
                        <span>{label}</span>
                      </div>
                    </li>
                  ))}
                </ol>
                <p
                  className="mt-6 pt-4 text-[0.82rem] leading-relaxed"
                  style={{ borderTop: "1px solid var(--rule)", color: "var(--ink-3)" }}
                >
                  For urgent production issues, choose High or Urgent so the SLA queue
                  stays visible inside Hubz.
                </p>
              </div>
            </aside>

            <SupportForm />
          </div>
        </section>

        <div className="h-20 sm:h-28" />
      </main>

      <MagazineFooter />
    </div>
  );
}
