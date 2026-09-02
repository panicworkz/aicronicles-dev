import React from "react";

/**
 * PanicWorkz ekosistem agi — themez.panic.pw'deki yapinin dergi diline
 * uyarlanmis hali. Bolum numaralari (01, 02...) ve mono etiketler, sitenin
 * geri kalanindaki "§" isaretleriyle ayni dili konusuyor.
 */

type Kolon = { no: string; baslik: string; baglantilar: { ad: string; url: string }[] };

const AG: Kolon[] = [
  {
    no: "01",
    baslik: "AGENCY & STUDIO",
    baglantilar: [
      { ad: "Panic", url: "https://panic.com.tr/" },
      { ad: "PanicWorkz", url: "https://panicworkz.com/" },
      { ad: "TestWorkz", url: "https://testworkz.com/" },
    ],
  },
  {
    no: "02",
    baslik: "AI & TECHNOLOGY",
    baglantilar: [
      { ad: "AICall", url: "https://aicall.pw/" },
      { ad: "AI Chronicles", url: "https://aicronicles.com/" },
      { ad: "Panic Networkz", url: "https://panicnetworkz.com/" },
      { ad: "Panic.pw", url: "https://panic.pw/" },
      { ad: "Workz.pw", url: "https://workz.pw/" },
    ],
  },
  {
    no: "03",
    baslik: "E-COMMERCE & MARKET",
    baglantilar: [
      { ad: "Araç Kirala", url: "https://arackirala.pw/" },
      { ad: "Araç Kiralama", url: "https://arackiralama.pw/" },
      { ad: "Cebinden", url: "https://cebinden.com/" },
      { ad: "Sepetimbenim", url: "https://sepetimbenim.com/" },
      { ad: "SosyoMarket", url: "https://sosyomarket.com/" },
      { ad: "Superdamping", url: "https://superdamping.com/" },
      { ad: "Turco Partners", url: "https://turcopartners.com/" },
      { ad: "Yerine", url: "https://yerine.com.tr/" },
    ],
  },
  {
    no: "04",
    baslik: "WORDPRESS & SEO",
    baglantilar: [
      { ad: "WP Agency", url: "https://wpagency.pw/" },
      { ad: "WP Care", url: "https://wpcare.pw/" },
      { ad: "WP SEO", url: "https://wpseo.pw/" },
    ],
  },
  {
    no: "05",
    baslik: "CRM & TOOLS",
    baglantilar: [
      { ad: "Hubz", url: "https://hubz.panic.pw/" },
      { ad: "Themez", url: "https://themez.panic.pw/" },
      { ad: "Investigationz", url: "https://investigationz.panic.pw/" },
      { ad: "Repoz", url: "https://repoz.panic.pw/" },
      { ad: "Outsourcez", url: "https://outsourcez.panic.pw/" },
    ],
  },
  {
    no: "06",
    baslik: "CONTENT & COMMUNITY",
    baglantilar: [
      { ad: "Fabelo", url: "https://fabelo.io/" },
      { ad: "Meet.istanbul", url: "https://meet.istanbul/" },
      { ad: "Panic.istanbul", url: "https://panic.istanbul/" },
      { ad: "PanicJobz", url: "https://panicjobz.com/" },
      { ad: "Şile", url: "https://sile.pw/" },
      { ad: "UfukYorulmaz", url: "https://ufukyorulmaz.com/" },
      { ad: "Ülkü Blog", url: "https://ulku.blog/" },
      { ad: "Ülkü Vakfı", url: "https://ulkuvakfi.com/" },
    ],
  },
  {
    no: "07",
    baslik: "İŞ ORTAKLIKLARI",
    baglantilar: [
      { ad: "Emka Emlak", url: "https://emkaemlak.com.tr/" },
      { ad: "Glowi", url: "https://glowi.today/" },
      { ad: "Oryvane", url: "https://oryvane.com/" },
    ],
  },
];

const TOPLAM = AG.reduce((n, k) => n + k.baglantilar.length, 0);

export default function PanicWorkzNetwork() {
  return (
    <section
      aria-label="PanicWorkz Network"
      className="mag-shell pb-14"
      style={{ borderTop: "1px solid #262c33", paddingTop: "3rem" }}
    >
      {/* Kunye satiri */}
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="folio mb-2.5" style={{ color: "var(--accent)" }}>
            § NETWORK
          </div>
          <h2 className="display text-[1.75rem] sm:text-[2.1rem]" style={{ color: "var(--paper)" }}>
            PanicWorkz Network
          </h2>
          <p className="mt-2 max-w-[54ch] text-[0.93rem] leading-relaxed" style={{ color: "#9aa1aa" }}>
            Independent venture architecture, production-grade assets &amp; digital engineering.
          </p>
        </div>

        {/* Durum rozeti */}
        <div
          className="flex shrink-0 items-center gap-2.5 px-3.5 py-2"
          style={{ border: "1px solid #2f363e" }}
        >
          {/* themez.panic.pw'deki durum noktasiyla ayni nabiz */}
          <span
            className="mag-pulse inline-block size-[7px] rounded-full"
            style={{ background: "#37f15b" }}
            aria-hidden="true"
          />
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.62rem",
              letterSpacing: "0.16em",
              color: "#9aa1aa",
            }}
          >
            {TOPLAM} VENTURES &amp; PARTNERS · ECOSYSTEM ONLINE
          </span>
        </div>
      </div>

      {/* 7 kolon */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:grid-cols-7">
        {AG.map((k) => (
          <div key={k.no}>
            <div className="mb-4 flex items-baseline gap-2" style={{ borderTop: "1px solid #262c33", paddingTop: "0.75rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "0.6rem",
                  color: "var(--accent)",
                  letterSpacing: "0.1em",
                }}
              >
                {k.no}
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.13em",
                  color: "#6b7178",
                  lineHeight: 1.4,
                }}
              >
                {k.baslik}
              </h3>
            </div>
            <ul className="flex flex-col gap-2.5">
              {k.baglantilar.map((b) => (
                <li key={b.url}>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.87rem] transition-colors hover:text-[var(--accent)]"
                    style={{ color: "#9aa1aa" }}
                  >
                    {b.ad}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
