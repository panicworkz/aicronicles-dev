import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Blocks,
  ShieldCheck,
  Sparkles,
  Store,
  Megaphone,
  Type,
  GitBranch,
  Gauge,
} from 'lucide-react';
import { EKLENEBILIR_TURLER } from '@/lib/blok-turleri';
import { FONT_IKILILERI } from '@/lib/fontlar';

export const metadata = { title: 'About PANIC' };

/**
 * PANIC'IN KENDINI ANLATTIGI SAYFA.
 *
 * Iki kural:
 *
 * 1. RAKAMLAR KODDAN OKUNUYOR, elle yazilmiyor. "19 blok" diye
 *    yazsaydik yarin bir tur eklendiginde bu sayfa yalan soylemeye
 *    baslar ve kimse fark etmezdi. Blok sayisi da yazi tipi ikilisi
 *    sayisi da kendi kaynagindan geliyor.
 *
 * 2. YALNIZCA VAR OLAN SEY ANLATILIYOR. Isbirlikci duzenleme, cok
 *    siteli yonetim ve sabit sayfalarda blok yuzeyi HENUZ YOK; bu
 *    sayfada da yokmus gibi durmuyorlar — asagida acikca yaziyorlar.
 *    Bir urunun kendi hakkinda soyledigi seyin dogru olmasi, en temel
 *    guven meselesi.
 */

const ACILIM = [
  {
    kelime: 'Post-CMS',
    ozet: 'The article is data, not a blob of markup.',
    metin:
      'A traditional CMS stores a page as one long string of HTML and hopes for the best. PANIC stores it as a list of typed blocks — a paragraph knows it is a paragraph, an image knows it has a caption and a credit. HTML is generated from those blocks on every save, never the other way round. That single decision is what makes everything below possible.',
  },
  {
    kelime: 'Architecture',
    ozet: 'One definition of what is valid, enforced where it counts.',
    metin:
      'Block types, their fields and the markup they may contain are described in one place. The editor, the paste filter and the save endpoint all read that same definition — so there is no version of the truth that drifts. The guarantee lives at the write point, not in the interface: content arriving from an import, an AI action or a direct API call passes through exactly the same gate.',
  },
  {
    kelime: 'Native',
    ozet: 'No page builder between you and the published page.',
    metin:
      'You edit on the real page, in the real design, with the real typography — not in an approximation of it. What you type is what a reader gets, because it is literally the reader’s page with an editing layer switched on. Nothing is re-implemented twice, so nothing can look right in the editor and wrong in public.',
  },
  {
    kelime: 'Intelligent',
    ozet: 'Content that answers, not just content that renders.',
    metin:
      'Structured data, FAQ extraction, a machine-readable summary for AI answer engines, and a scoring panel that tells you where an article is weak before you publish it. Blocks like the table of contents and product cards are filled at read time from live data, so a page cannot quietly start telling readers something that is no longer true.',
  },
  {
    kelime: 'Core',
    ozet: 'Publishing, commerce and revenue in one system.',
    metin:
      'Articles, static pages, a media library, a store with orders and customers, and an ad server with campaigns and placement rules — all sharing one database, one design system and one deployment. No plugin layer to keep compatible, and no third-party script deciding how fast your pages load.',
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
        'Anything the parser does not recognise is preserved rather than dropped, so no edit silently loses content.',
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
        'Fonts are served from this server, not a third party — no external request, no build-time dependency.',
        'Only the selected pairing is downloaded by readers.',
        'Writers choose a role (body, lead, small note), never an arbitrary font — so the design holds across every article.',
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
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      {/* --------------------------- Basli k --------------------------- */}
      <div className="rounded-xl border border-border bg-linear-to-b from-primary/5 to-transparent p-7">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <Gauge className="size-3.5 text-primary" />
          What is PANIC?
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Post-CMS Architecture for Native, Intelligent Core
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Most publishing tools ask you to write in one place and hope it looks
          right in another. PANIC removes the gap: the article is structured
          data, the editor is the published page, and everything that could go
          stale — a price, a table of contents, a stock level — is filled in at
          the moment a reader loads it.
        </p>
      </div>

      {/* --------------------------- Acilim --------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">The name, one word at a time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {ACILIM.map((k) => (
            <div key={k.kelime} className="grid gap-2 sm:grid-cols-[150px_1fr] sm:gap-5">
              <div>
                <div className="text-sm font-semibold text-foreground">{k.kelime}</div>
                <div className="mt-0.5 text-xs leading-snug text-primary">{k.ozet}</div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{k.metin}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ------------------------- Yetenekler ------------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {yetenekler.map((y) => {
          const Simge = y.simge;
          return (
            <Card key={y.baslik}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Simge className="size-4 text-primary" />
                  <span>{y.baslik}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {y.maddeler.map((m) => (
                    <li key={m} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                      <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-primary/70" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* --------------------------- Ilkeler -------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">How decisions get made here</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Measure, don’t assume.</strong> The
            move to blocks was not trusted until all 47 published articles had
            been converted and compared back — text, links, images, heading
            anchors and every attribute in the tree.
          </p>
          <p>
            <strong className="text-foreground">Guarantee at the write point.</strong>{' '}
            Interface checks are convenience. The only rule that counts is the
            one content cannot get past on its way into the database.
          </p>
          <p>
            <strong className="text-foreground">Nothing renders that can lie.</strong>{' '}
            A price typed into an article goes stale the day it changes. Blocks
            that depend on data hold a reference, never a copy.
          </p>
          <p>
            <strong className="text-foreground">Silence is the worst failure.</strong>{' '}
            A block that quietly disappears is worse than one that refuses to
            save. Unrecognised markup is kept, and anything skipped is reported.
          </p>
        </CardContent>
      </Card>

      {/* -------------------------- Eksikler -------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Not here yet</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {[
              'Collaborative editing — two people in the same article will still overwrite each other.',
              'Static pages are edited as HTML; the block canvas has not been extended to them.',
              'Managing several sites from one panel.',
            ].map((m) => (
              <li key={m} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            This list is here on purpose. A tool that only lists its strengths
            makes you find the gaps the hard way.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
