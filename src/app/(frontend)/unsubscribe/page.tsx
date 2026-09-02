import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";

/**
 * Abonelikten cikma — tek tik.
 *
 * Sitede "Unsubscribe in one click" yaziyor ve Terms her e-postada bir
 * baglanti vaat ediyor; bu sayfa o sozu karsiliyor. Jeton adresin
 * kendisi degil: boylece kimse baskasinin adresini listeden cikaramaz.
 *
 * Onay ekrani yok, cunku "tek tik" sozu bunu gerektiriyor. Yanlislikla
 * tiklayan icin geri alma baglantisi ayni sayfada duruyor.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe | Fabelo",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ t?: string; undo?: string }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { t, undo } = await searchParams;
  const jeton = (t ?? "").trim();

  let sonuc: "cikildi" | "geri-alindi" | "zaten" | "gecersiz" = "gecersiz";
  let eposta: string | null = null;

  if (/^[a-f0-9]{48}$/.test(jeton)) {
    const bul = (await db.execute(
      sql`SELECT email, status FROM subscribers WHERE unsubscribe_token = ${jeton}`
    )) as unknown as { rows?: any[] };
    const satir = (Array.isArray(bul) ? bul[0] : bul.rows?.[0]) ?? null;

    if (satir) {
      eposta = satir.email;
      if (undo === "1") {
        await db.execute(sql`
          UPDATE subscribers SET status = 'active', unsubscribed_at = NULL, updated_at = now()
          WHERE unsubscribe_token = ${jeton}
        `);
        sonuc = "geri-alindi";
      } else if (satir.status === "unsubscribed") {
        sonuc = "zaten";
      } else {
        await db.execute(sql`
          UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = now(), updated_at = now()
          WHERE unsubscribe_token = ${jeton}
        `);
        sonuc = "cikildi";
      }
    }
  }

  const basliklar = {
    cikildi: "You’re unsubscribed",
    "geri-alindi": "You’re back on the list",
    zaten: "Already unsubscribed",
    gecersiz: "This link is no longer valid",
  } as const;

  const metinler = {
    cikildi: "You won’t receive The Dispatch again. No hard feelings — the archive stays open to you.",
    "geri-alindi": "The Dispatch will land in your inbox twice a week, as before.",
    zaten: "This address was already removed from the list. Nothing more to do.",
    gecersiz:
      "The link may have been mistyped or already used. If you’re still receiving The Dispatch, reply to any issue and we’ll remove you by hand.",
  } as const;

  return (
    <div className="mag min-h-screen">
      <MagazineHeader />

      <main className="mag-wrap flex items-center py-24 sm:py-32">
        <div className="max-w-[560px]">
          <div className="folio mb-4" style={{ color: "var(--accent)" }}>
            § THE DISPATCH
          </div>
          <h1 className="display mb-6 text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.02]">
            {basliklar[sonuc]}
          </h1>
          <div className="rule mb-7" />

          {eposta && sonuc !== "gecersiz" && (
            <p className="byline mb-5">{eposta.toUpperCase()}</p>
          )}

          <p className="text-[1.06rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            {metinler[sonuc]}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full px-6 text-[0.8rem] font-semibold tracking-wide"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              Back to Fabelo
            </Link>

            {/* Yanlislikla tiklayanlar icin — tek tik geri alma */}
            {sonuc === "cikildi" && (
              <a href={`/unsubscribe?t=${jeton}&undo=1`} className="byline hover:text-[var(--accent-ink)]">
                UNSUBSCRIBED BY MISTAKE? RESUBSCRIBE →
              </a>
            )}
          </div>
        </div>
      </main>

      <MagazineFooter />
    </div>
  );
}
