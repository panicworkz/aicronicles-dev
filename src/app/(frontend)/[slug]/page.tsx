import React from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { db, schema } from "@/db";
import { eq, desc, ne, and } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import MagazineHeader from "@/components/magazine/MagazineHeader";
import MagazineFooter from "@/components/magazine/MagazineFooter";
import ClientForm from "@/components/magazine/ClientForm";
import ArticleClientActions from "./ArticleClientActions";
import {
  HorizontalStoryCard,
  NumberedTrendingCard,
  fmtDate,
  type CardPost,
} from "@/components/magazine/PostCard";
import { AdSlot } from "@/components/magazine/AdSlot";
import { decodeEntities, tagLabel } from "@/lib/taxonomy";
import { enrichArticleHtml, type MediaBoyut } from "@/components/magazine/enrichArticleHtml";
import { urunBloklariniDoldur } from "@/lib/urun-blogu";
import { icindekileriDoldur } from "@/lib/icindekiler";
import { videoBloklariniDoldur } from "@/lib/video";
import { yazininBloklari, bloklarHtmle } from "@/lib/bloklar";
import { yazarBloklariniDoldur } from "@/lib/yazar-blogu";
import CmsPage from "@/components/magazine/CmsPage";
import AuthorAvatar from "@/components/magazine/AuthorAvatar";
import { SITE, YAYINCI, markali, kirintiSemasi } from "@/lib/seo";
import { sssCikar, sssSemasi } from "@/lib/faq";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/* Kanonik adres tek yerden — artik @/lib/seo. Bu dosya kendi sabitini
   tasiyordu; ayni deger sitemap.xml ve llms.txt'te de ayri ayri
   yaziliydi ve ikisi ayrisirsa arama motoruna celisen iki adres
   verilir. */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({ where: eq(schema.posts.slug, slug) });

  if (!post) {
    const page = await db.query.pages.findFirst({ where: eq(schema.pages.slug, slug) });
    if (!page) return { title: "Not Found | Fabelo" };
    /* Sabit sayfalarin da kanonik adresi olmali. Yazilar ve liste
       sayfalari alirken /about, /advertise ve otekiler bossa kaliyordu;
       izleme parametreli her adres ayri bir sayfa sayilirdi. */
    const sayfaAciklamasi =
      page.metaDescription || page.excerpt || "Fabelo publication page.";
    const sayfaAdresi = `${SITE}/${page.slug}`;
    /* Sayfanin kendi kapagi varsa paylasim gorseli o. Once kosulsuz
       marka isareti kullaniliyordu; sabit sayfalarin kapagi yoktu.
       Artik var. */
    const sayfaGorseli = page.featuredImageUrl
      ? page.featuredImageUrl.startsWith("http")
        ? page.featuredImageUrl
        : `${SITE}${page.featuredImageUrl}`
      : `${SITE}/images/fabelo-logo.png`;
    return {
      title: markali(page.metaTitle || page.title),
      description: sayfaAciklamasi,
      alternates: { canonical: sayfaAdresi },
      openGraph: {
        type: "website",
        url: sayfaAdresi,
        title: page.title,
        description: sayfaAciklamasi,
        images: [{ url: sayfaGorseli }],
      },
      twitter: {
        card: page.featuredImageUrl ? "summary_large_image" : "summary",
        title: page.title,
        description: sayfaAciklamasi,
        images: [sayfaGorseli],
      },
    };
  }

  return {
    title: markali(post.metaTitle || post.title),
    description: post.metaDescription || post.excerpt || undefined,
    /* canonical: ayni yaziya farkli adreslerden gelinebiliyor (izleme
       parametreleri, eski yollar). Kanonik adres olmadan arama motoru
       hangisinin asil oldugunu kendi tahmin ediyor. */
    alternates: { canonical: `${SITE}/${post.slug}` },
    openGraph: {
      type: "article",
      url: `${SITE}/${post.slug}`,
      title: post.title,
      description: post.metaDescription || post.excerpt || undefined,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.featuredImageUrl ? [post.featuredImageUrl] : [],
    },
  };
}


/**
 * Yazinin yapilandirilmis verisi (schema.org / JSON-LD).
 *
 * Arama motorlari ve yanit motorlari bir sayfayi alintilarken basligi,
 * yazari ve tarihi metinden tahmin etmek zorunda kalmasin diye. Panic
 * CMS'in editorunde AEO hazirlik puani ve SERP onizlemesi zaten vardi;
 * eksik olan YAYIN tarafiydi — sayfa hicbir yapilandirilmis veri
 * basmiyordu.
 *
 * Yalnizca elimizde GERCEKTEN olan alanlar yaziliyor: uydurma yazar,
 * uydurma tarih ya da bos alan konmuyor.
 */
function yaziSemasi(post: any, yazar: any, kategori: any) {
  const veri: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.metaTitle || post.title,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/${post.slug}` },
    /* Yayinci tanimi BURADA YAZILMIYOR, seo.ts'ten geliyor. Daha once
       burada kendi kopyasi vardi: ne @id tasiyordu ne logo, yani ana
       sayfanin Organization'iyla ayni kurum oldugu anlasilmiyordu ve
       Article'in bekledigi yayinci isareti hic basilmiyordu. */
    publisher: YAYINCI,
  };
  const aciklama = post.metaDescription || post.excerpt;
  if (aciklama) veri.description = aciklama;
  // schema.org MUTLAK adres ister; medya yollari sitede goreli tutuluyor.
  if (post.featuredImageUrl)
    veri.image = [
      post.featuredImageUrl.startsWith("http")
        ? post.featuredImageUrl
        : `${SITE}${post.featuredImageUrl}`,
    ];
  if (post.publishedAt) veri.datePublished = post.publishedAt.toISOString();
  if (post.updatedAt) veri.dateModified = post.updatedAt.toISOString();
  if (yazar?.name) veri.author = { "@type": "Person", name: yazar.name };
  if (kategori?.name) veri.articleSection = kategori.name;
  return veri;
}


/* Sabit sayfanin ust bandindaki kunye etiketi. Sayfanin turunu
   anlatan tek satir; icerigin bir parcasi degil, o yuzden govdeye
   degil buraya ait. */
const HUKUKI = new Set([
  "terms-and-conditions",
  "data-and-privacy",
  "terms-of-sale",
  "delivery-and-returns",
  "on-bilgilendirme-formu",
  "mesafeli-satis-sozlesmesi",
]);

function sayfaBolumu(slug: string): string {
  if (HUKUKI.has(slug)) return "LEGAL";
  if (slug === "about") return "MASTHEAD";
  return "PARTNERSHIPS";
}

/** Dosya adi -> {width,height} haritasi; gorsellere yer ayirmak icin */
async function medyaBoyutlari(): Promise<Map<string, MediaBoyut>> {
  const satirlar = await db.query.media.findMany();
  const harita = new Map<string, MediaBoyut>();
  for (const m of satirlar as any[]) {
    if (m?.filename)
      harita.set(m.filename, { width: m.width ?? null, height: m.height ?? null, url: m.url ?? null });
  }
  return harita;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  /* YONLENDIRME EN BASTA.
     Yazi aramasindan ONCE bakiliyor, cunku yonlendirme acik bir
     talimat: "bu adres artik suraya gidiyor". Sonra bakilsaydi,
     taslaga alinmis eski yazi once bulunur ve 404 donerdi —
     yonlendirme hic calismazdi.

     permanentRedirect 308 donuyor; Google bunu 301 ile ayni
     sayiyor, yani birikmis deger yeni adrese geciyor. */
  const yonlendirme = await db.query.redirects.findFirst({
    where: eq(schema.redirects.fromSlug, slug),
  });
  if (yonlendirme) permanentRedirect(`/${yonlendirme.toSlug}`);

  const post = await db.query.posts.findFirst({ where: eq(schema.posts.slug, slug) });

  /* ---------------------------------------------------------------
     CMS sayfasi (About, Advertise, Sponsor, Terms, Privacy...)
     --------------------------------------------------------------- */
  if (!post) {
    const page = await db.query.pages.findFirst({ where: eq(schema.pages.slug, slug) });
    if (!page) notFound();
    /* TASLAK GERCEKTEN GIZLI.
       Editorde secenegin adi "Draft (Hidden)" ama sayfa herkese
       aciktı: adresi bilen — ya da site haritasindan bulan — okur
       yayindan kaldirilmis bir sayfayi okuyabiliyordu. Taslagi
       yalnizca panele girmis biri goruyor; tuvaldeki onizleme de
       oturum cerezini tasidigi icin calismaya devam ediyor. */
    if (page.status !== "published" && !(await getSession())) notFound();

    /* Sayfa govdesi de YAZIYLA AYNI YOLDAN geciyor: bloklardan
       isaretli HTML, sonra okuma aninda dolan bloklar. Ayri bir yol
       olsaydi sabit sayfada urun karti ya da video calismazdi ve
       bunun sebebi hicbir yerde yazmazdi. */
    const sayfaGovdesi = await yazarBloklariniDoldur(
      await urunBloklariniDoldur(
        videoBloklariniDoldur(
          icindekileriDoldur(
            enrichArticleHtml(
              bloklarHtmle(yazininBloklari(page), { isaretle: true }),
              await medyaBoyutlari()
            )
          )
        )
      )
    );

    return (
      <div className="mag min-h-screen">
        <MagazineHeader />
        <CmsPage
          baslik={decodeEntities(page.title)}
          ozet={page.excerpt ? decodeEntities(page.excerpt) : null}
          govdeHtml={sayfaGovdesi}
          kapakUrl={page.featuredImageUrl}
          bolum={sayfaBolumu(page.slug)}
          guncellendi={page.updatedAt}
        />
        <MagazineFooter />
      </div>
    );
  }

  /* ---------------------------------------------------------------
     Yazi
     --------------------------------------------------------------- */
  const author = post.authorId
    ? await db.query.authors.findFirst({ where: eq(schema.authors.id, post.authorId) })
    : null;

  const category = post.categoryId
    ? await db.query.categories.findFirst({ where: eq(schema.categories.id, post.categoryId) })
    : null;

  /* ILGILI YAZILAR — HALKA YONTEMI.
     Once burada "en yeni 9 yazi" duruyordu ve bu her sayfada AYNI 9
     yaziydi. Sonucu olculdu: 47 yazinin 38'ine site icinden hicbir
     baglanti gitmiyordu. Okur oraya ancak aramadan ulasabiliyor,
     arama motoru da sayfayi sitenin kenarinda sayiyor.

     Cozum bir halka: her yazi, KENDI KATEGORISINDEKI siradan sonraki
     dort yaziya baglaniyor. Kategori bitince basa donuyor. Boylece
     her yazinin tam olarak dort gelen baglantisi oluyor ve
     kategoride disarida kalan yazi kalmiyor — "en populer dordu"
     gibi bir secim yapmadigimiz icin kimse disarida kalmiyor.

     Sira KIMLIGE gore: yayin tarihine gore olsaydi bir yazinin
     tarihi degistiginde butun halka kayardi. */
  const tumYazilar = await db.query.posts.findMany({
    where: eq(schema.posts.status, "published"),
    orderBy: [schema.posts.id],
  });

  const kardesler = tumYazilar.filter((p: any) => p.categoryId === post.categoryId);
  const sira = kardesler.findIndex((p: any) => p.id === post.id);

  const halka: any[] = [];
  for (let k = 1; k <= 4 && k < kardesler.length; k++) {
    halka.push(kardesler[(sira + k) % kardesler.length]);
  }

  /* Kenar cubugundaki liste BASKA kategorilerden: okur kendi
     konusunun disina da cikabilsin, kategoriler birbirine baglansin.
     Burada da halka mantigi var — kimlige gore kayan bir pencere. */
  const digerKategoriler = tumYazilar.filter(
    (p: any) => p.categoryId !== post.categoryId
  );
  const kayma = digerKategoriler.length ? post.id % digerKategoriler.length : 0;
  const capraz = Array.from(
    { length: Math.min(5, digerKategoriler.length) },
    (_, k) => digerKategoriler[(kayma + k) % digerKategoriler.length]
  );

  const others = [...halka, ...capraz];

  const authors = await db.query.authors.findMany();
  const categories = await db.query.categories.findMany();
  const authorById = new Map(authors.map((a: any) => [a.id, a]));
  const catById = new Map(categories.map((c: any) => [c.id, c]));

  const toCard = (p: any): CardPost => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    featuredImageUrl: p.featuredImageUrl,
    readingTime: p.readingTime,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    authorName: authorById.get(p.authorId)?.name ?? null,
    categoryName: catById.get(p.categoryId)?.name ?? null,
    categorySlug: catById.get(p.categoryId)?.slug ?? null,
  });

  const boyutlar = await medyaBoyutlari();

  /* GOVDE ARTIK BLOKLARDAN BASILIYOR.
     Isaretli uretim her blogun kok etiketine turunu yaziyor
     (data-blok-t); duzenleme katmani turu oradan okuyor. Boylece
     "bu gorsel mi paragraf mi" sorusu DOM koklayarak degil, tek bir
     yerden cevaplaniyor ve yeni tur eklemek ozel durum gerektirmiyor.

     Blogu olmayan yazi HTML'inden cevriliyor (yazininBloklari), yani
     gocun ulasmadigi bir kayit da dogru basiliyor. */
  /* Icindekiler URUN KARTINDAN ONCE dolduruluyor: urun karti da
     baslik icerebilir ve icindekilere girmemeli. */
  const govdeHtml = await urunBloklariniDoldur(
    videoBloklariniDoldur(
    icindekileriDoldur(
      enrichArticleHtml(bloklarHtmle(yazininBloklari(post), { isaretle: true }), boyutlar)
    )
    )
  );

  const related = halka.map(toCard);
  const trending = capraz.map(toCard);

  /* Yazinin tag'leri — tagsJson (fabelo.io tag'leri buraya yaziliyor) */
  /* Yazinin govdesindeki SSS. Ayri bir alan yok — yazarin zaten
     yazdigi bolum okunuyor, yeni bir sey doldurtulmuyor. */
  const sorular = sssCikar(post.contentHtml);

  const rawTags: string[] = Array.isArray(post.tagsJson) ? (post.tagsJson as string[]) : [];
  const tagSlugs = rawTags
    .map((t) => String(t).toLowerCase().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-"))
    .filter(Boolean);

  return (
    <div className="mag min-h-screen">
      {/* Yapilandirilmis veri. dangerouslySetInnerHTML burada dogru arac:
          icerik JSON.stringify ile bizim urettigimiz nesneden geliyor,
          disaridan gelen bir dize degil. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(yaziSemasi(post, author, category)),
        }}
      />
      {/* Kirinti yolu ayri bir blok. Iki sema tek nesnede birlestirilebilirdi
          ama ayri durunca biri bozulsa oteki okunur kalir. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            kirintiSemasi([
              // Kategorisi olmayan yazi dogrudan kokun altinda durur.
              ...(category
                ? [{ ad: category.name, yol: `/category/${category.slug}` }]
                : []),
              { ad: post.title, yol: `/${post.slug}` },
            ])
          ),
        }}
      />
      {/* SSS — yalnizca gercekten varsa. Bos bir FAQPage, olmayan bir
          sey hakkinda iddiada bulunmak olurdu. */}
      {sorular.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sssSemasi(sorular)) }}
        />
      )}
      <ArticleClientActions title={post.title} />
      <MagazineHeader />

      <main>
        {/* data-odak: ODAK kipinde gorunur kalacak bolgeler.
            Once <main>, sonra <article> isaretliydi; ikisi de fazla
            kabaydi — reklam, yazar kutusu, bulten seridi ve "Keep
            reading" onlarin icinde kaliyordu. Isaret artik tam olarak
            DUZENLENEBILIR alanlarda: baslik blogu ve metin govdesi.
            Odak, yazarin bu ekranda degistirebildigi sey. */}
        <header data-odak="1" className="mag-wrap pt-10 sm:pt-14">
          <nav className="byline mb-7 flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--accent-ink)]">
              HOME
            </Link>
            <span style={{ color: "var(--rule)" }}>/</span>
            {category && (
              <>
                <Link href={`/category/${category.slug}`} className="hover:text-[var(--accent-ink)]">
                  {category.name.toUpperCase()}
                </Link>
                <span style={{ color: "var(--rule)" }}>/</span>
              </>
            )}
            <span className="truncate" style={{ color: "var(--ink-3)" }}>
              {decodeEntities(post.title).slice(0, 48)}…
            </span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-9">
              {category && (
                <Link href={`/category/${category.slug}`} className="folio mb-4 inline-block">
                  § {category.name.toUpperCase()}
                </Link>
              )}
              {/* data-canli: panelin onizleme cercevesi bu isaretle
                  bulup gunceliyor. Sinif adina bagli olsaydi bir
                  tasarim degisikligi onizlemeyi sessizce kirardi. */}
              <h1
                data-canli="baslik"
                className="display mb-6 text-[clamp(2.4rem,5.6vw,4.6rem)]"
              >
                {decodeEntities(post.title)}
              </h1>
              {post.excerpt && (
                /* data-canli="ozet": bu isaret YOKTU, o yuzden basligin
                   altindaki aciklama onizlemede hic duzenlenemiyordu.
                   Panel de bu alani hicbir yonde eslestirmiyordu. */
                <p
                  data-canli="ozet"
                  className="mb-7 max-w-[62ch] text-[1.15rem] leading-relaxed sm:text-[1.28rem]"
                  style={{ color: "var(--ink-2)" }}
                >
                  {decodeEntities(post.excerpt)}
                </p>
              )}
              <div className="rule flex flex-wrap items-center gap-x-3 gap-y-2 pt-5">
                {author && (
                  <Link href={`/author/${author.slug}`} className="byline hover:text-[var(--accent-ink)]">
                    BY {author.name.toUpperCase()}
                  </Link>
                )}
                <span className="byline" style={{ color: "var(--rule)" }}>
                  ·
                </span>
                <span className="byline">{fmtDate(post.publishedAt || post.createdAt)}</span>
                {post.readingTime && (
                  <>
                    <span className="byline" style={{ color: "var(--rule)" }}>
                      ·
                    </span>
                    <span className="byline">{post.readingTime.replace(" read", "").toUpperCase()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {post.featuredImageUrl && (
            <figure className="mt-10">
              <div className="plate w-full" style={{ aspectRatio: "21 / 9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  data-canli="kapak"
                  src={post.featuredImageUrl}
                  alt={decodeEntities(post.title)}
                  className="size-full object-cover"
                />
              </div>
            </figure>
          )}
        </header>

        {/* ============== GOVDE + KENAR ============== */}
        <div className="mag-wrap pt-14">
          <div className="grid gap-14 lg:grid-cols-12">
            {/* Metin — 8 kolon, olcu 68ch */}
            <article className="lg:col-span-8">
              <div
                data-canli="govde"
                /* ODAK kipinde gorunur kalacak ikinci bolge. Ayri bir
                   oznitelik cunku bu oge data-canli="govde" olmak
                   zorunda: blok yuzeyi onu oradan buluyor. */
                data-odak="1"
                className="article-body dropcap text-[1.06rem] leading-[1.82]"
                dangerouslySetInnerHTML={{
                  __html: govdeHtml,
                }}
              />

              {/* Tag'ler */}
              {tagSlugs.length > 0 && (
                <div className="rule mt-14 pt-7">
                  <div className="folio mb-4">§ FILED UNDER</div>
                  <div className="flex flex-wrap gap-2.5">
                    {tagSlugs.map((t) => (
                      <Link
                        key={t}
                        href={`/tag/${t}`}
                        className="kicker px-4 py-2 transition-colors hover:text-[var(--accent-ink)]"
                        style={{ border: "1px solid var(--rule)" }}
                      >
                        {tagLabel(t)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Yazi ici reklam */}
              <div className="mt-12">
                <AdSlot format="feature" label="Advertisement" baglam={{ tur: "article", slug: category?.slug ?? null }} />
              </div>

              {/* Yazar kunyesi */}
              {author && (
                <section
                  className="mt-14 flex flex-col gap-5 p-8 sm:flex-row"
                  style={{ background: "var(--paper-2)", border: "1px solid var(--rule)" }}
                >
                  <AuthorAvatar name={author.name} src={author.avatarUrl} size={64} />
                  <div>
                    <div className="folio mb-1.5">§ WRITTEN BY</div>
                    <Link href={`/author/${author.slug}`}>
                      <h3 className="display headline-link mb-2 text-[1.5rem]">{author.name}</h3>
                    </Link>
                    {author.bio && (
                      <p className="text-[0.96rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
                        {decodeEntities(author.bio)}
                      </p>
                    )}
                  </div>
                </section>
              )}
            </article>

            {/* Kenar — 4 kolon */}
            <aside className="lg:col-span-4 lg:rule-v lg:pl-14">
              <div className="sticky top-44 flex flex-col gap-10">
                <div>
                  <div className="rule-heavy pt-3">
                    <div className="folio mb-1.5">§ MOST READ</div>
                    <h2 className="display mb-4 text-[1.6rem]">On the desk</h2>
                  </div>
                  {trending.map((p, i) => (
                    <NumberedTrendingCard key={p.slug} post={p} index={i + 1} />
                  ))}
                </div>

                <AdSlot format="rail" label="Sponsor" baglam={{ tur: "article", slug: category?.slug ?? null }} />
              </div>
            </aside>
          </div>
        </div>

        {/* ============== DISPATCH ============== */}
        <section className="mt-20 sm:mt-28" style={{ background: "var(--ink)" }}>
          <div className="mag-wrap py-14 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-7">
                <div className="folio mb-3" style={{ color: "var(--accent)" }}>
                  § THE FABELO DISPATCH
                </div>
                <h2 className="display text-[clamp(1.9rem,4vw,3rem)]" style={{ color: "var(--paper)" }}>
                  Liked this? Get the next one <em>in your inbox</em>.
                </h2>
              </div>
              <div className="lg:col-span-5">
                <ClientForm className="flex flex-col gap-3" source="article">
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    className="h-12 w-full bg-transparent px-0 text-[1.05rem] outline-none"
                    style={{ borderBottom: "1px solid #3a4048", color: "var(--paper)" }}
                  />
                  <button
                    type="submit"
                    className="h-12 w-full text-[0.82rem] font-bold tracking-[0.14em]"
                    style={{ background: "var(--accent)", color: "#08181c" }}
                  >
                    SUBSCRIBE FREE
                  </button>
                </ClientForm>
              </div>
            </div>
          </div>
        </section>

        {/* ============== ILGILI YAZILAR ============== */}
        <section className="mag-wrap pt-16 sm:pt-24">
          <div className="mb-8 rule-heavy pt-4">
            <div className="folio mb-2">§ NEXT</div>
            <h2 className="display text-[2rem] sm:text-[2.6rem]">Keep reading</h2>
          </div>
          <div className="grid gap-x-14 gap-y-0 lg:grid-cols-2">
            {related.map((p) => (
              <HorizontalStoryCard key={p.slug} post={p} />
            ))}
          </div>
        </section>

        <div className="h-20 sm:h-28" />
      </main>

      <MagazineFooter />
    </div>
  );
}
