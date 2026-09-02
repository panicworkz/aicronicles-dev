import React from "react";
import { bolumlereAyir, type Bolum } from "./cmsSections";
import AuthorAvatar from "./AuthorAvatar";

/** About sayfasindaki isimleri veritabanindaki yazarlarla eslestirmek icin */
export type YazarKaydi = { name: string; avatarUrl: string | null };

/**
 * CMS sayfalarinin dergi duzeni.
 *
 * Onceki halinde bes sayfa da ayni sablonu kullaniyordu: 1536'lik alanin tam
 * ortasinda 760'lik bir metin seridi, iki yaninda 400'er piksel bosluk. Metin
 * olcusu dogruydu (satir basina ~70 karakter, yazi sayfalariyla ayni), sorun
 * kalan alanin hic kullanilmamasiydi.
 *
 * Simdi: baslik bandi tam genislikte, metin sutunu sola yasli, solda yapiskan
 * icindekiler, belirli bolumler ise metinden cikip kart/serit olarak tam
 * genislige yayiliyor. Hangi bolumun nasil basilacagi DUZEN'de tanimli;
 * tanimsiz her sey duz metin olarak kaliyor, yani yeni bir sayfa eklendiginde
 * kirilmiyor.
 */

type Bicim = "kartlar" | "serit" | "yazarlar" | "kapanis";

const DUZEN: Record<string, Record<string, Bicim>> = {
  about: {
    "who-writes-for-fabelo": "yazarlar",
    contact: "kapanis",
  },
  advertise: {
    "audience-snapshot": "serit",
    "advertising-formats": "kartlar",
    "get-in-touch": "kapanis",
  },
  sponsor: {
    "sponsorship-options": "kartlar",
    "why-fabelo": "serit",
    "start-a-conversation": "kapanis",
  },
};

/** Hukuki sayfalar — sadelik ve taranabilirlik yeter, kart/serit yok */
const HUKUKI = new Set(["terms-and-conditions", "data-and-privacy"]);

/** Okuma olcusu — yazi sayfasindaki govde metniyle ayni (satir basina ~70 karakter) */
const SUTUN = 760;

/* --- Parcalar ------------------------------------------------------------ */

function BolumBasligi({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="display mb-6 text-[clamp(1.6rem,2.4vw,2.15rem)]">
      {children}
    </h2>
  );
}

function Numara({ n }: { n: number }) {
  return (
    <span className="folio" style={{ color: "var(--accent)" }}>
      {String(n).padStart(2, "0")}
    </span>
  );
}

/** Kart izgarasi — "Advertising Formats", "Sponsorship Options" */
function Kartlar({ bolum }: { bolum: Bolum }) {
  return (
    <>
      <BolumBasligi id={bolum.id}>{bolum.baslik}</BolumBasligi>
      {bolum.paragrafHtml && (
        <div
          className="article-body mb-8 max-w-[62ch] text-[1.04rem] leading-[1.78]"
          dangerouslySetInnerHTML={{ __html: bolum.paragrafHtml }}
        />
      )}
      <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4" style={{ background: "var(--rule)" }}>
        {bolum.maddeler.map((m, i) => (
          <div key={i} className="flex flex-col gap-3 p-7" style={{ background: "var(--paper)" }}>
            <Numara n={i + 1} />
            {m.etiket && (
              <h3 className="display text-[1.22rem] leading-snug">{m.etiket}</h3>
            )}
            <p className="text-[0.95rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
              {m.metin}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

/** Yatay serit — "Audience Snapshot", "Why Fabelo?" */
function Serit({ bolum }: { bolum: Bolum }) {
  return (
    <>
      <BolumBasligi id={bolum.id}>{bolum.baslik}</BolumBasligi>
      {bolum.paragrafHtml && (
        <div
          className="article-body mb-8 max-w-[62ch] text-[1.04rem] leading-[1.78]"
          dangerouslySetInnerHTML={{ __html: bolum.paragrafHtml }}
        />
      )}
      <div
        className="grid gap-x-10 gap-y-8 py-8 sm:grid-cols-2 lg:grid-cols-3"
        style={{ borderTop: "2px solid var(--ink)", borderBottom: "1px solid var(--rule)" }}
      >
        {bolum.maddeler.map((m, i) => (
          <div key={i}>
            {m.etiket ? (
              <>
                <div className="kicker mb-2.5" style={{ color: "var(--accent-ink)" }}>
                  {m.etiket}
                </div>
                <p className="text-[1.02rem] leading-relaxed">{m.metin}</p>
              </>
            ) : (
              <div className="flex gap-4">
                <Numara n={i + 1} />
                <p className="text-[1.02rem] leading-relaxed">{m.metin}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/** Yazar kartlari — About'taki "Who Writes for Fabelo" */
function Yazarlar({ bolum, yazarlar }: { bolum: Bolum; yazarlar: YazarKaydi[] }) {
  /* Basliktaki ad ile veritabanindaki yazar adini esitliyoruz.
     "Fabelo Editorial Team" gibi uzun adlar veritabaninda "Fabelo" olarak
     duruyor, o yuzden tam esitlik yerine icerme de kabul ediliyor. */
  const gorsel = (ad: string) => {
    const a = ad.toLowerCase();
    const bul = yazarlar.find(
      (y) => a === y.name.toLowerCase() || a.startsWith(y.name.toLowerCase())
    );
    return bul?.avatarUrl ?? null;
  };
  return (
    <>
      <BolumBasligi id={bolum.id}>{bolum.baslik}</BolumBasligi>
      <div className="grid gap-px lg:grid-cols-3" style={{ background: "var(--rule)" }}>
        {bolum.altBolumler.map((y) => (
          <article key={y.id} id={y.id} className="flex flex-col gap-3 p-8" style={{ background: "var(--paper)" }}>
            <AuthorAvatar name={y.baslik} src={gorsel(y.baslik)} size={56} />
            <h3 className="display mt-1 text-[1.3rem]">{y.baslik}</h3>
            <div className="rule" style={{ maxWidth: 48 }} />
            <p className="text-[0.95rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
              {y.metin}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}

/** Kapanis bandi — iletisim cagrisi */
function Kapanis({ bolum }: { bolum: Bolum }) {
  return (
    <div
      id={bolum.id}
      className="flex flex-col gap-5 p-9 sm:p-12"
      style={{ background: "var(--ink)", color: "var(--paper)" }}
    >
      <div className="folio" style={{ color: "var(--accent)" }}>
        § {bolum.baslik.toUpperCase()}
      </div>
      <div
        className="article-body article-body--koyu max-w-[64ch] text-[1.1rem] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: bolum.icerikHtml }}
      />
    </div>
  );
}

/** Duz metin bolumu */
function DuzBolum({ bolum }: { bolum: Bolum }) {
  return (
    <>
      <BolumBasligi id={bolum.id}>{bolum.baslik}</BolumBasligi>
      <div
        className="article-body text-[1.06rem] leading-[1.78]"
        dangerouslySetInnerHTML={{ __html: bolum.icerikHtml }}
      />
    </>
  );
}

/* --- Sayfa --------------------------------------------------------------- */

export default function CmsPage({
  slug,
  baslik,
  contentHtml,
  guncellendi,
  yazarlar = [],
}: {
  slug: string;
  baslik: string;
  contentHtml: string | null;
  guncellendi?: Date | null;
  /** About sayfasindaki kunye kartlari icin */
  yazarlar?: YazarKaydi[];
}) {
  const { girisHtml, bolumler } = bolumlereAyir(contentHtml);
  const duzen = DUZEN[slug] ?? {};
  const hukuki = HUKUKI.has(slug);

  /** Bolum kendi genisligini asiyor mu — kart, serit, yazar, kapanis */
  const genis = (b: Bolum) => Boolean(duzen[b.id]);

  return (
    <main>
      {/* --- Baslik bandi: tam 1536 -------------------------------------- */}
      <div className="mag-wrap pt-14 sm:pt-20">
        <div className="folio mb-4" style={{ color: "var(--accent)" }}>
          § FABELO
        </div>
        <h1 className="display max-w-[20ch] text-[clamp(2.6rem,6vw,4.75rem)] leading-[0.98]">
          {baslik}
        </h1>
        <div
          className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-5"
          style={{ borderTop: "2px solid var(--ink)" }}
        >
          <span className="byline">
            {hukuki ? "LEGAL" : slug === "about" ? "MASTHEAD" : "PARTNERSHIPS"}
          </span>
          {guncellendi && (
            <span className="byline">
              LAST UPDATED{" "}
              {guncellendi.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* --- Kapak gorseli: ilk h2'den once ne varsa, tam genislikte ------ */}
      {girisHtml.trim() && (
        <div className="mag-wrap pt-10">
          <div
            className="article-body article-body--kapak"
            dangerouslySetInnerHTML={{ __html: girisHtml }}
          />
        </div>
      )}

      {/* --- Ray + govde --------------------------------------------------
          Iki kolon: ray | govde. Bolumler ayri ayri izgara ogesi DEGIL,
          govde kolonunun normal akisinda duruyor.

          Onceki halinde her bolum kendi izgara satirindaydi ve ray
          "grid-row: 1 / -1" ile hepsine yayiliyordu. CSS Grid, satirlara
          yayilan bir oge satirlarin toplamindan uzun oldugunda kisa
          satirlari gererek onu sigdirir; ray ~450px oldugu icin ilk kisa
          bolumun altinda ~350px'lik bir bosluk aciliyordu. Akisa cevirince
          gerdirecek satir kalmiyor, genislikler ise ayni: duz metin 760,
          kart/serit kolonun tamami. */}
      <div className="mag-wrap pb-20 pt-14 sm:pb-28">
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-12">
          {/* Icindekiler — 3'ten az baslikta gostermeye degmez */}
          {bolumler.length > 2 && (
            <aside className="hidden lg:block">
              {/* Yapiskanlik ic sarmalayicida: aside izgara ogesi olarak
                  kolonun tamamini kaplasin ki ray kaydirma boyunca gezsin. */}
              <div
                style={{ position: "sticky", top: "calc(var(--mag-header-h, 145px) + 2rem)" }}
              >
                <div className="folio mb-4" style={{ color: "var(--accent)" }}>
                  § CONTENTS
                </div>
                <nav>
                  <ol className="flex flex-col">
                    {bolumler.map((b, i) => (
                      <li key={b.id} style={{ borderTop: "1px solid var(--rule)" }}>
                        <a
                          href={`#${b.id}`}
                          className="flex gap-3 py-2.5 text-[0.88rem] leading-snug transition-colors hover:text-[var(--accent-ink)]"
                        >
                          <span className="folio shrink-0" style={{ color: "var(--ink-3)" }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{b.baslik}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            </aside>
          )}

          {/* Govde — duz bolumler 760'ta, kart/serit kolonun tamaminda */}
          <div>
            {bolumler.map((b) => {
              const bicim = duzen[b.id];
              return (
                <section
                  key={b.id}
                  className="mb-14 last:mb-0 sm:mb-16"
                  style={{ maxWidth: genis(b) ? undefined : SUTUN }}
                >
                  {bicim === "kartlar" ? (
                    <Kartlar bolum={b} />
                  ) : bicim === "serit" ? (
                    <Serit bolum={b} />
                  ) : bicim === "yazarlar" ? (
                    <Yazarlar bolum={b} yazarlar={yazarlar} />
                  ) : bicim === "kapanis" ? (
                    <Kapanis bolum={b} />
                  ) : (
                    <DuzBolum bolum={b} />
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
