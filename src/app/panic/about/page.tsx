import React from 'react';
import {
  Blocks,
  ShieldCheck,
  Sparkles,
  Store,
  Megaphone,
  Type,
  GitBranch,
} from 'lucide-react';
import { EKLENEBILIR_TURLER } from '@/lib/blok-turleri';
import { FONT_IKILILERI } from '@/lib/fontlar';

export const metadata = { title: 'About PANIC' };

/**
 * PANIC'IN KENDINI ANLATTIGI SAYFA.
 *
 * TASARIM KARARI: burasi bir ayar ekrani degil, bir ANLATIM. Ilk hali
 * panelin her yerinde kullanilan Card'lari alt alta dizmekti ve yama
 * gibi duruyordu — cunku hicbir hiyerarsi yoktu: baslik da madde de
 * aciklama da ayni agirlikta griydi, yedi kutu yan yana gelince sayfa
 * bir tabloya donusuyordu.
 *
 * Simdi sayfanin kendi tipografik olcegi var: koyu bir acilis, harf
 * harf gorunen bir isim, kutu yerine ince cizgilerle ayrilmis
 * bolumler. Cerceve ne kadar azsa goz o kadar metne bakiyor.
 *
 * IKI KURAL DEGISMEDI:
 * 1. Rakamlar KODDAN okunuyor — elle yazsaydik bir tur eklendiginde
 *    bu sayfa yalan soylerdi ve kimse fark etmezdi.
 * 2. Yalnizca VAR OLAN sey anlatiliyor; olmayanlar en altta acikca
 *    yaziyor.
 */

const HARFLER = [
  {
    harf: 'P',
    kelime: 'Post-CMS',
    ozet: 'The article is data, not a blob of markup.',
    metin:
      'A traditional CMS stores a page as one long string of HTML and hopes for the best. PANIC stores it as a list of typed blocks — a paragraph knows it is a paragraph, an image knows it has a caption and a credit. HTML is generated from those blocks on every save, never the other way round. That single decision is what makes everything else possible.',
  },
  {
    harf: 'A',
    kelime: 'Architecture',
    ozet: 'One definition of what is valid, enforced where it counts.',
    metin:
      'Block types, their fields and the markup they may contain are described in one place. The editor, the paste filter and the save endpoint all read that same definition, so no version of the truth can drift. The guarantee lives at the write point rather than in the interface: content arriving from an import, an AI action or a direct API call passes through exactly the same gate.',
  },
  {
    harf: 'N',
    kelime: 'Native',
    ozet: 'No page builder between you and the published page.',
    metin:
      'You edit on the real page, in the real design, with the real typography — not in an approximation of it. What you type is what a reader gets, because it is literally the reader’s page with an editing layer switched on. Nothing is re-implemented twice, so nothing can look right in the editor and wrong in public.',
  },
  {
    harf: 'I',
    kelime: 'Intelligent',
    ozet: 'Content that answers, not just content that renders.',
    metin:
      'Structured data, FAQ extraction, a machine-readable summary for AI answer engines, and a scoring panel that tells you where an article is weak before you publish it. Blocks such as the table of contents and product cards are filled at read time from live data, so a page cannot quietly start telling readers something that is no longer true.',
  },
  {
    harf: 'C',
    kelime: 'Core',
    ozet: 'Publishing, commerce and revenue in one system.',
    metin:
      'Articles, static pages, a media library, a store with orders and customers, and an ad server with campaigns and placement rules — all sharing one database, one design system and one deployment. No plugin layer to keep compatible, and no third-party script deciding how fast your pages load.',
  },
];

const ILKELER = [
  {
    baslik: 'Measure, don’t assume',
    metin:
      'The move to blocks was not trusted until all 47 published articles had been converted and compared back — text, links, images, heading anchors and every attribute in the tree.',
  },
  {
    baslik: 'Guarantee at the write point',
    metin:
      'Interface checks are convenience. The only rule that counts is the one content cannot get past on its way into the database.',
  },
  {
    baslik: 'Nothing renders that can lie',
    metin:
      'A price typed into an article goes stale the day it changes. Blocks that depend on data hold a reference, never a copy.',
  },
  {
    baslik: 'Silence is the worst failure',
    metin:
      'A block that quietly disappears is worse than one that refuses to save. Unrecognised markup is kept, and anything skipped is reported.',
  },
];

export default function AboutSayfasi() {
  const blokSayisi = EKLENEBILIR_TURLER.length;
  const ikiliSayisi = FONT_IKILILERI.length;

  const yetenekler = [
    {
      simge: Blocks,
      baslik: 'Writing',
      maddeler: [
        `${blokSayisi} block types — text, media, tables, charts, callouts, steps, product cards and more.`,
        'Edit directly on the page: click a block to select it, drag to reorder, type to change it.',
        'Inline formatting, paste cleanup, undo across block operations, markdown shortcuts and a “/” command.',
        'Every article keeps a revision history you can restore from.',
      ],
    },
    {
      simge: ShieldCheck,
      baslik: 'Safety of the content',
      maddeler: [
        'Invalid markup cannot be saved: scripts, event handlers, iframes and inline text styling are stripped at the write point.',
        'Pasting from Word or Google Docs keeps the words and drops the mess.',
        'Internal links never get “open in a new tab” or nofollow forced on them.',
        'Anything the parser does not recognise is preserved rather than dropped.',
      ],
    },
    {
      simge: Sparkles,
      baslik: 'Found and understood',
      maddeler: [
        'Structured data for articles, products and FAQs, plus canonical URLs and sitemaps.',
        'A machine-readable digest for AI answer engines alongside the normal RSS feed.',
        'FAQ blocks are extracted from the article itself, so the schema and the page can never disagree.',
        'An AEO panel scores the draft and names what is missing.',
      ],
    },
    {
      simge: Store,
      baslik: 'Commerce',
      maddeler: [
        'Products, categories, coupons, orders and customers.',
        'Prices are recalculated on the server at checkout — the basket is never trusted.',
        'Product cards inside articles read name, price and stock from the database on every view.',
        'The storefront can be closed to the public while staff keep working on it.',
      ],
    },
    {
      simge: Megaphone,
      baslik: 'Revenue',
      maddeler: [
        'Ad campaigns with placement rules per section and page type.',
        'Impressions and clicks recorded with their context, so you can see which page earns.',
        'Editing an article does not inflate your own numbers — the preview is excluded from counting.',
      ],
    },
    {
      simge: Type,
      baslik: 'Design',
      maddeler: [
        `${ikiliSayisi} curated typography pairings, previewed on real components before you commit.`,
        'Fonts are served from this server — no external request, no build-time dependency.',
        'Only the selected pairing is downloaded by readers.',
        'Writers choose a role, never an arbitrary font, so the design holds across every article.',
      ],
    },
    {
      simge: GitBranch,
      baslik: 'Operations',
      maddeler: [
        'A staging site that mirrors production and is closed to search engines.',
        'Only code is promoted to production — content stays where it was written.',
        'Promotion re-tags the image that was tested, rather than rebuilding a lookalike.',
      ],
    },
  ];

  return (
    /* Negatif kenar bosluklari: panelin sayfa dolgusundan tasip
       bolumlerin tam genislikte bant olmasini sagliyor. Koyu acilis
       ancak boyle kenardan kenara uzaniyor. */
    <div className="-mx-6 -mt-7 pb-16">
      {/* ============================ ACILIS ============================
          Tek koyu bant. Daha fazlasi panel gibi degil, baska bir
          uygulama gibi gorunurdu; bir tane olunca "burasi anlatim"
          demis oluyor. */}
      <section className="bg-[#0b1220] px-6 py-14 text-white sm:px-10 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
            What is PANIC?
          </div>

          {/* Isim harf harf: acilim once GORULUYOR, sonra okunuyor.
              HARF KELIMESININ ORTASINDA duruyor. Once her harf kendi
              sutununun SOLUNA yaslıydı ve sutun genisligini alttaki
              kelime belirliyordu (POST-CMS genis, CORE dar); harfler
              duzensiz araliklarla dagiliyordu. En cok "I"da
              gorunuyordu — dar bir glif, genis bir kelimenin
              solunda asili kaliyordu. */}
          <div className="mt-8 flex flex-wrap items-end gap-x-7 gap-y-6 sm:gap-x-10">
            {HARFLER.map((h) => (
              <div key={h.harf} className="flex flex-col items-center">
                {/* Sabit genislik: harflerin kendi genisligi cok farkli
                    (I ile C arasinda uc kat fark var) ve bu, kelimeler
                    ayni genislikte olsa bile ritmi bozuyordu. */}
                <span className="flex h-[1em] w-9 items-center justify-center text-5xl font-semibold leading-none tracking-tight sm:w-11 sm:text-6xl">
                  {h.harf}
                </span>
                <span className="mt-3.5 text-[10.5px] uppercase tracking-[0.14em] text-white/40">
                  {h.kelime}
                </span>
              </div>
            ))}
          </div>

          <h1 className="mt-10 max-w-3xl text-2xl font-normal leading-snug tracking-tight text-white/90 sm:text-[28px]">
            Post-CMS Architecture for Native, Intelligent Core
          </h1>

          <p className="mt-5 max-w-[62ch] text-sm leading-relaxed text-white/55">
            Most publishing tools ask you to write in one place and hope it looks
            right in another. PANIC removes the gap: the article is structured
            data, the editor is the published page, and everything that could go
            stale — a price, a table of contents, a stock level — is filled in at
            the moment a reader loads it.
          </p>
        </div>
      </section>

      {/* ============================ ACILIM =========================== */}
      <section className="px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            The name, one word at a time
          </h2>

          <div className="mt-8 divide-y divide-border border-t border-border">
            {HARFLER.map((h) => (
              <div
                key={h.harf}
                className="grid gap-3 py-7 sm:grid-cols-[56px_230px_1fr] sm:gap-8"
              >
                {/* Harf bir numara gibi calisiyor: goz sirayi
                    takip edebiliyor. */}
                <div className="text-3xl font-semibold leading-none text-primary/25">
                  {h.harf}
                </div>
                <div>
                  <div className="text-base font-semibold tracking-tight">{h.kelime}</div>
                  <div className="mt-1 text-[13px] leading-snug text-primary">{h.ozet}</div>
                </div>
                {/* Olcu korunuyor: tam genislikte bir satir 160
                    karaktere ulasip goz satir basini kaybediyor. */}
                <p className="max-w-[72ch] text-sm leading-[1.75] text-muted-foreground">
                  {h.metin}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================== YETENEKLER ========================= */}
      <section className="border-t border-border bg-muted/20 px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            What is inside
          </h2>

          {/* Cerceve degil ince cizgi: yedi kutu yan yana gelince
              sayfa bir tabloya donusuyordu. */}
          <div className="mt-8 grid gap-x-10 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
            {yetenekler.map((y) => {
              const Simge = y.simge;
              return (
                <div key={y.baslik} className="border-t border-border pt-5">
                  <div className="flex items-center gap-2">
                    <Simge className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold tracking-tight">{y.baslik}</h3>
                  </div>
                  <ul className="mt-3 space-y-2.5">
                    {y.maddeler.map((m) => (
                      <li key={m} className="text-[13px] leading-[1.65] text-muted-foreground">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================ ILKELER =========================== */}
      <section className="border-t border-border px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            How decisions get made here
          </h2>

          <div className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {ILKELER.map((i) => (
              <div key={i.baslik} className="border-l-2 border-primary/30 pl-5">
                <div className="text-[15px] font-semibold tracking-tight">{i.baslik}</div>
                <p className="mt-1.5 max-w-[62ch] text-sm leading-[1.7] text-muted-foreground">
                  {i.metin}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ EKSIKLER ========================== */}
      <section className="border-t border-border px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Not here yet
          </h2>

          <ul className="mt-5 space-y-2">
            {[
              'Collaborative editing — two people in the same article will still overwrite each other.',
              'Static pages are edited as HTML; the block canvas has not been extended to them.',
              'Managing several sites from one panel.',
            ].map((m) => (
              <li key={m} className="text-[13px] leading-[1.65] text-muted-foreground">
                {m}
              </li>
            ))}
          </ul>

          <p className="mt-5 max-w-[62ch] text-xs leading-relaxed text-muted-foreground/70">
            This list is here on purpose. A tool that only lists its strengths
            makes you find the gaps the hard way.
          </p>
        </div>
      </section>
    </div>
  );
}
