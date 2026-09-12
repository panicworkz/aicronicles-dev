import React from "react";
import { db, schema } from "@/db";
import { sql, eq, and } from "drizzle-orm";
import { parse } from "node-html-parser";
import { Kutu, Sayi, Alan, Halka, Siralama, Saglik, Bos } from "@/components/rapor/parcalar";
import {
  umamiKurulu,
  umamiEksikleri,
  umamiOzet,
  umamiSeri,
  umamiSayfalar,
  umamiKaynaklar,
} from "@/lib/umami";
import { kovalar, type Donem } from "@/lib/donem";

/**
 * ICERIK RAPORU.
 *
 * BURADA OLMAYAN SEY: ziyaret sayisi. Sitede sayfa goruntuleme
 * olcumu YOK — ne kendi sayacimiz ne ucuncu taraf bir arac var.
 * "Bu yaziyi kac kisi okudu" sorusunun elimizde cevabi yok ve
 * uydurma bir sayi koymak bu ekrandaki her rakami supheli hale
 * getirirdi.
 *
 * ELIMIZDE OLAN TEK ERISIM OLCUSU reklam gosterimleri: bir yazi
 * acildiginda o sayfadaki reklam bir gosterim kaydediyor (ad_events).
 * Bu bir VEKIL olcu — yalnizca reklam tasiyan sayfalari sayar ve
 * reklam engelleyenleri gormez. Oyle etiketlendi; "goruntuleme" diye
 * sunulsaydi olmayan bir kesinlik vaat ederdi.
 *
 * Geri kalani KORPUS SAGLIGI: elimizdeki yazilarin kendisi hakkinda,
 * olculebilir ve duzeltilebilir eksikler. Her satir etkilenen
 * kayitlara baglaniyor — sayi degil is emri.
 */

const ay = (t: Date) =>
  new Date(t).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });

export async function IcerikRaporu({ donem }: { donem: Donem }) {
  const yazilar = await db.select().from(schema.posts);
  const sayfalar = await db.select().from(schema.pages);
  const yazarlar = await db.select().from(schema.authors);
  const kategoriler = await db.select().from(schema.categories);
  const [{ medya }] = await db
    .select({ medya: sql<number>`count(*)` })
    .from(schema.media);
  const [{ abone }] = await db
    .select({ abone: sql<number>`count(*)` })
    .from(schema.subscribers);

  const yayinda = yazilar.filter((y) => y.status === "published");
  const taslak = yazilar.filter((y) => y.status !== "published");

  /* --- yayin temposu ---
     Kovalar DONEMDEN geliyor (lib/donem.ts), burada sabit 12 ay
     yoktu artik: secilen aralik bir haftaysa gun gun, bes yilsa ay ay
     bolunuyor ve ayni kural okuma serisinde de gecerli. */
  const tempoKovalari = kovalar(donem).map((k) => {
    const adet = yayinda.filter((y) => {
      const t = new Date(y.publishedAt ?? y.createdAt).getTime();
      return t >= k.bas && t < k.son;
    }).length;
    return {
      etiket: k.etiket,
      deger: adet,
      ipucu: `${adet} article${adet === 1 ? "" : "s"}`,
    };
  });

  /* --- yazar ve kategori dagilimi --- */
  const dagilim = (alan: "authorId" | "categoryId", kaynak: { id: number; name: string }[]) => {
    const t = new Map<number, number>();
    for (const y of yayinda) {
      const k = y[alan];
      if (typeof k === "number") t.set(k, (t.get(k) ?? 0) + 1);
    }
    return kaynak
      .map((k) => ({ etiket: k.name, deger: t.get(k.id) ?? 0 }))
      .filter((k) => k.deger > 0)
      .sort((a, b) => b.deger - a.deger);
  };

  /* --- korpus sagligi ---
     Her kontrol AYNI SEKILDE calisiyor: eksik olani bul, adini ve
     duzenleme adresini ver. */
  const adres = (y: { id: number }) => `/panic/posts/${y.id}`;
  const eksik = (kosul: (y: (typeof yazilar)[number]) => boolean) =>
    yayinda.filter(kosul).map((y) => ({ ad: y.title, adres: adres(y) }));

  const bos = (x: unknown) => !String(x ?? "").trim();

  /* Gorsellerde alt metin: govdeyi ayristirip bakiyoruz. Metin icinde
     "alt=" aramak, alt="" yazan bos bir ozniteligi de dolu sayardi. */
  const altEksik = yayinda
    .filter((y) => {
      const kok = parse(y.contentHtml ?? "");
      return kok.querySelectorAll("img").some((i) => bos(i.getAttribute("alt")));
    })
    .map((y) => ({ ad: y.title, adres: adres(y) }));

  /* IC BAGLANTI.
     IKI KAYNAK birden sayiliyor ve bu onemli: olcum once yalnizca
     GOVDE baglantilarina bakiyordu ve "24 yazi oksuz" diyordu. Oysa
     sayfa sablonu da ilgili yazilar halkasini basiyor. Tek kaynaga
     bakmak, ekranda cozulmus bir sorunu cozulmemis gostermekti.

     1. Govde: bir yazinin METNINDE gecen /slug baglantilari
     2. Halka: sablonun bastigi ilgili yazilar — kural
        frontend/[slug]/page.tsx ile birebir ayni tutulmali. */
  const govdeBaglantisi = new Set<string>();
  for (const y of yayinda) {
    for (const a of parse(y.contentHtml ?? "").querySelectorAll("a")) {
      const h = a.getAttribute("href") ?? "";
      if (h.startsWith("/")) govdeBaglantisi.add(h.split(/[?#]/)[0].replace(/\/$/, ""));
    }
  }

  const halkaBaglantisi = new Set<string>();
  const kimlikSirali = [...yayinda].sort((a, b) => a.id - b.id);
  for (const y of kimlikSirali) {
    const kardesler = kimlikSirali.filter((p) => p.categoryId === y.categoryId);
    const sira = kardesler.findIndex((p) => p.id === y.id);
    for (let k = 1; k <= 4 && k < kardesler.length; k++) {
      halkaBaglantisi.add(`/${kardesler[(sira + k) % kardesler.length].slug}`);
    }
    const digerleri = kimlikSirali.filter((p) => p.categoryId !== y.categoryId);
    if (digerleri.length) {
      const kayma = y.id % digerleri.length;
      for (let k = 0; k < Math.min(5, digerleri.length); k++) {
        halkaBaglantisi.add(`/${digerleri[(kayma + k) % digerleri.length].slug}`);
      }
    }
  }

  /* Hicbir yerden baglanti almayan — gercek kusur. */
  const oksuz = yayinda
    .filter((y) => !govdeBaglantisi.has(`/${y.slug}`) && !halkaBaglantisi.has(`/${y.slug}`))
    .map((y) => ({ ad: y.title, adres: adres(y) }));

  /* Yalnizca sablondan baglanti alan — kusur degil, FIRSAT. Bir
     yazinin metni icinden verilen baglanti, listeden verilenden daha
     degerli: cumlenin icinde gecen bir baglantinin konusu belli. */
  const yalnizHalka = yayinda
    .filter((y) => !govdeBaglantisi.has(`/${y.slug}`) && halkaBaglantisi.has(`/${y.slug}`))
    .map((y) => ({ ad: y.title, adres: adres(y) }));

  /* --- vekil erisim olcusu: reklam gosterimleri --- */
  /* YOL'A gore gruplaniyor, context_slug'a gore DEGIL.
     Ilk yazdigimda context_slug kullanmistim; olctugumde o alanin
     yazinin degil KATEGORININ slug'ini tuttugu ortaya cikti
     ("ai-tech", "personal-finance"). Rapor, kategori adlarini yazi
     adi diye siralayacakti — hicbir hata vermeden, tamamen yanlis
     bir liste. Yazinin kendisi page_path'te duruyor. */
  const gosterimler = await db
    .select({
      yol: schema.adEvents.pagePath,
      adet: sql<number>`count(*)`,
    })
    .from(schema.adEvents)
    .where(and(eq(schema.adEvents.kind, "impression"), eq(schema.adEvents.contextType, "article")))
    .groupBy(schema.adEvents.pagePath)
    .orderBy(sql`count(*) desc`)
    .limit(8);

  const slugAdi = new Map(yayinda.map((y) => [y.slug, { ad: y.title, id: y.id }]));

  /* GERCEK OKUMA OLCUMU — Umami.
     Hepsi paralel isteniyor: dordunu sirayla beklemek rapor
     ekranini bos yere gecikirdi. Herhangi biri basarisiz olursa
     null geliyor ve o kutu kendi basina "olcum yok" diyor; bir
     istegin dusmesi digerlerini goturmuyor. */
  const olcumVar = umamiKurulu();
  const [ozet, seri, enCok, kaynaklar] = olcumVar
    ? await Promise.all([
        umamiOzet(donem),
        umamiSeri(donem),
        umamiSayfalar(donem, 8),
        umamiKaynaklar(donem, 6),
      ])
    : [null, null, null, null];

  /* Adresten yaziyi bulma: /slug -> baslik. Umami sorgu
     parametreli adresleri ayri satir olarak veriyor, onlari
     birlestiriyoruz. */
  const yolAdi = (yol: string) => {
    const slug = yol.split(/[?#]/)[0].replace(/^\//, "").replace(/\/$/, "");
    if (!slug) return { etiket: "Home page", adres: undefined as string | undefined };
    const bul = slugAdi.get(slug);
    return bul
      ? { etiket: bul.ad, adres: `/panic/posts/${bul.id}` as string | undefined }
      : { etiket: `/${slug}`, adres: undefined as string | undefined };
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Sayi
          kivilcim={tempoKovalari}
          kivilcimBicim={(n) => `${n} article${n === 1 ? "" : "s"}`}
          etiket="Published articles"
          deger={String(yayinda.length)}
          alt={taslak.length ? `${taslak.length} in draft` : "Nothing in draft"}
          vurgu
        />
        <Sayi
          etiket="Static pages"
          deger={String(sayfalar.filter((s) => s.status === "published").length)}
          alt={`${sayfalar.filter((s) => s.status !== "published").length} hidden`}
        />
        <Sayi etiket="Media files" deger={String(Number(medya ?? 0))} />
        <Sayi
          etiket="Subscribers"
          deger={String(Number(abone ?? 0))}
          alt={`${yazarlar.length} authors · ${kategoriler.length} categories`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Kutu
          baslik="Publishing pace"
        aciklama={`Articles published in the selected period (${donem.ad.toLowerCase()}), by publication date.`}
      >
          <Alan veri={tempoKovalari} bicim={(n) => `${n} article${n === 1 ? "" : "s"}`} />
        </Kutu>

        <Kutu baslik="What we hold" aciklama="Articles and static pages, published or not.">
          <Halka
            veri={[
              { etiket: "published articles", deger: yayinda.length },
              { etiket: "draft articles", deger: taslak.length },
              { etiket: "published pages", deger: sayfalar.filter((s) => s.status === "published").length },
              { etiket: "hidden pages", deger: sayfalar.filter((s) => s.status !== "published").length },
            ].filter((v) => v.deger > 0)}
            toplamEtiketi="documents"
          />
        </Kutu>
      </div>

      {/* --- OKUMA OLCUMU --- */}
      {olcumVar ? (
        <>
          {/* KAYNAK GORUNUR YAZIYOR.
              Rakamlar ekranda duruyordu ama nereden geldikleri
              yazmiyordu; "olcum entegre mi degil mi" sorusu ekrana
              bakarak cevaplanamiyordu. Bagli degilse zaten bu satirin
              yerinde kurulum kutusu cikiyor. */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {ozet ? "Live from Umami" : "Umami is configured but did not answer"}
            </span>
            <span>
              umami.panic.pw · fabelo.io · read-only · {donem.ad.toLowerCase()}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Sayi
              etiket={`Page views · ${donem.ad.toLowerCase()}`}
              deger={ozet ? ozet.gosterim.toLocaleString("en-US") : "—"}
              alt={
                ozet?.oncekiGosterim
                  ? `${
                      ozet.gosterim >= ozet.oncekiGosterim ? "up" : "down"
                    } from ${ozet.oncekiGosterim.toLocaleString("en-US")} the period before`
                  : "Measured by Umami"
              }
              kivilcim={seri ?? undefined}
              kivilcimBicim={(n) => `${n} views`}
              vurgu
            />
            <Sayi
              etiket="Readers"
              deger={ozet ? ozet.ziyaretci.toLocaleString("en-US") : "—"}
              alt="Distinct visitors, counted without cookies"
            />
            <Sayi
              etiket="Visits"
              deger={ozet ? ozet.ziyaret.toLocaleString("en-US") : "—"}
              alt="A visit can cover several pages"
            />
          </div>

          <Kutu
            baslik="Page views, day by day"
            aciklama={`${donem.ad}, measured by Umami on your own server. The editor\u2019s live preview is excluded, so writing does not count as reading.`}
          >
            {seri ? <Alan veri={seri} /> : <Bos neden="The analytics server did not answer." />}
          </Kutu>

          <div className="grid gap-5 lg:grid-cols-2">
            <Kutu baslik="Most read" aciklama={`Real page views, ${donem.ad.toLowerCase()}.`}>
              {enCok ? (
                <Siralama
                  veri={enCok.map((e) => ({ ...yolAdi(e.yol), deger: e.deger }))}
                  bicim={(n) => `${n.toLocaleString("en-US")} views`}
                />
              ) : (
                <Bos neden="The analytics server did not answer." />
              )}
            </Kutu>

            <Kutu baslik="Where readers come from" aciklama={`Referring site, ${donem.ad.toLowerCase()}.`}>
              {kaynaklar ? (
                <Halka
                  veri={kaynaklar.map((k) => ({ etiket: k.ad, deger: k.deger }))}
                  toplamEtiketi="visits"
                />
              ) : (
                <Bos neden="The analytics server did not answer." />
              )}
            </Kutu>
          </div>
        </>
      ) : (
        <Kutu
          baslik="Reader numbers cannot be read yet"
          aciklama="Umami is running on our own server and the site may well be sending measurements to it — but this screen needs its own credentials to read them back. Until it has them, the ranking further down uses ad impressions as a stand-in: it only counts pages that carry an ad."
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            Set these on the server and restart:{" "}
            {umamiEksikleri().map((e, i) => (
              <span key={e}>
                {i > 0 && ", "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{e}</code>
              </span>
            ))}
            . Nothing is loaded in the reader's browser until they are set.
          </p>
        </Kutu>
      )}

      <Kutu
        baslik="Things worth fixing"
        aciklama="Checked against every published article. Each item links straight to the editor."
      >
        <div className="-my-1">
          <Saglik
            baslik="No meta description"
            neden="Search engines write their own snippet when this is empty, and it is usually the first sentence rather than the best one."
            ogeler={eksik((y) => bos(y.metaDescription))}
            toplam={yayinda.length}
          />
          <Saglik
            baslik="No summary under the title"
            neden="The excerpt is what appears on the home page, in the RSS feed and when the link is shared."
            ogeler={eksik((y) => bos(y.excerpt))}
            toplam={yayinda.length}
          />
          <Saglik
            baslik="No cover image"
            neden="Shared links fall back to the site logo, and the article card in listings looks unfinished."
            ogeler={eksik((y) => bos(y.featuredImageUrl))}
            toplam={yayinda.length}
          />
          <Saglik
            baslik="No category"
            neden="An uncategorised article never appears in a section listing — only on the home page and in search."
            ogeler={eksik((y) => typeof y.categoryId !== "number")}
            toplam={yayinda.length}
          />
          <Saglik
            baslik="No author"
            neden="Articles without a named author carry less weight with readers and with search engines."
            ogeler={eksik((y) => typeof y.authorId !== "number")}
            toplam={yayinda.length}
          />
          <Saglik
            baslik="Images with no alt text"
            neden="A screen reader reads nothing, and search engines learn nothing from the picture."
            ogeler={altEksik}
            toplam={yayinda.length}
          />
          <Saglik
            baslik="Nothing links to them"
            neden="No other article points here and the related list does not reach them either, so a reader can only arrive by search or luck."
            ogeler={oksuz}
            toplam={yayinda.length}
          />
          <Saglik
            tur="firsat"
            baslik="Reached only through the related list"
            neden="They do get inbound links, but none from inside another article's text. A link written into a sentence carries more weight with search engines than one in a list — worth adding where it reads naturally."
            ogeler={yalnizHalka}
            toplam={yayinda.length}
          />
        </div>
      </Kutu>

      <div className="grid gap-5 lg:grid-cols-2">
        <Kutu baslik="By author" aciklama="Published articles only.">
          <Siralama veri={dagilim("authorId", yazarlar as any)} />
        </Kutu>
        <Kutu
          baslik="By category"
          aciklama="Published articles only. A category with nothing in it is not shown."
        >
          <Halka veri={dagilim("categoryId", kategoriler as any)} toplamEtiketi="articles" />
        </Kutu>
      </div>

      {!olcumVar && (
      <Kutu
        baslik="Most seen articles"
        aciklama="A PROXY, not a view count: the site records no page views. This counts ad impressions on article pages, so it misses pages carrying no ad and readers who block them. Read it as a ranking, not a number of people."
      >
        {gosterimler.length ? (
          <Siralama
            veri={gosterimler.map((g) => {
              const slug = (g.yol ?? "").replace(/^\//, "").split(/[?#]/)[0];
              const bul = slugAdi.get(slug);
              return {
                etiket: bul?.ad ?? slug ?? "unknown",
                deger: Number(g.adet ?? 0),
                adres: bul ? `/panic/posts/${bul.id}` : undefined,
              };
            })}
            bicim={(n) => `${n} impressions`}
          />
        ) : (
          <Bos neden="No ad impressions recorded yet, so there is nothing to rank." />
        )}
      </Kutu>
      )}
    </div>
  );
}
