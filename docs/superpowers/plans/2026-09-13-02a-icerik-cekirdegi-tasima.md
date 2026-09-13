# ②a İçerik/Dergi Çekirdeğini panic-cms'e Taşıma — Uygulama Planı

> **Agentic worker'lar için:** GEREKLİ ALT-SKILL: superpowers:subagent-driven-development
> (önerilen) veya superpowers:executing-plans. Adımlar checkbox (`- [ ]`).

**Goal:** fabelo'nun içerik/dergi çekirdeğini (10 tablo + magazine bileşenleri +
frontend sayfaları + zengin SEO) panic-cms'e tenant-agnostik olarak taşımak.

**Architecture:** Kaynak fabelo (`aicronicles-dev`), hedef panic-cms
(`~/Documents/dev-pw/panic-cms`). Her dosya taşınırken tek-kiracı bağımlılıkları
①'in tenant-context'ine bağlanır: `SITE`→`getSiteConfig()`, global `db`→
`getTenantDb()`, tek `siteSettings`→kiracı DB'si, her sayfa `withTenantRequest`
sarmalı. Reklam/form bağımlılıkları STUB (②c/②d'de gerçekleşir).

**Tech Stack:** Next.js 15.5.25, React 19, TypeScript, Tailwind, Drizzle+pg,
Vitest. (panic-cms'te ①'den kurulu.)

**Spec:** [docs/superpowers/specs/2026-09-13-02a-icerik-cekirdegi-tasima-design.md](../specs/2026-09-13-02a-icerik-cekirdegi-tasima-design.md)
**Kaynak referans:** fabelo `aicronicles-dev/src/` (okunur, DEĞİŞTİRİLMEZ).

## Global Constraints

- **Kaynak salt-okunur:** aicronicles-dev ve canlı fabelo DEĞİŞMEZ. Yalnızca
  panic-cms'e yazılır.
- **Yama yok (K8):** taşınan hiçbir dosya "şimdilik tek site" kısayolu içermez.
- **Tenant-agnostik:** her `SITE`→`getSiteConfig()`, her `db`→`getTenantDb()`/
  `db` proxy (context), her sayfa `withTenantRequest` içinde.
- **database-per-tenant (K1):** kiracı tablolarına `tenant_id` EKLENMEZ.
- **.bak dosyaları taşınmaz.**
- **Reklam/form STUB:** `AdSlot`, `ClientForm` gönderimi ②a'da no-op/görünmez;
  render bozulmaz, işlev ②c/②d'de.
- **TDD:** her task failing test → implement → pass → commit.
- **Repo:** panic-cms main dalı.

---

## Dosya Yapısı (panic-cms'te oluşacak)

| Dosya | Kaynak (fabelo) | Sorumluluk |
|---|---|---|
| `src/db/tenant/schema.ts` (genişletme) | `src/db/schema.ts` (10 tablo) | kiracı içerik şeması |
| `src/lib/icerik.ts` | sorgu mantığı (sayfalardan) | yazı/kategori/etiket/yazar erişimi |
| `src/lib/seo.ts` (genişletme) | `src/lib/seo.ts` | zengin JSON-LD/sitemap/robots |
| `src/lib/taxonomy.ts`, `faq.ts`, `icindekiler.ts`, `bloklar.ts` | aynı | render yardımcıları |
| `src/components/magazine/*` | `src/components/magazine/*` (.bak hariç) | ~20 bileşen |
| `src/components/ads/AdSlot.tsx` (stub) | — | ②c'ye kadar no-op |
| `src/app/(site)/[slug]/page.tsx` vb. | `src/app/(frontend)/*` | frontend sayfaları |
| `src/app/sitemap.ts`, `robots.ts` | aynı | tenant-aware |
| `scripts/seed-icerik.ts` | — | t1/t2 örnek içerik |

---

## Task 1: İçerik şeması taşıma (10 tablo)

**Files:**
- Modify: `panic-cms/src/db/tenant/schema.ts` (①'de pages,users var — genişlet)
- Test: `panic-cms/src/db/tenant/schema.test.ts`
- Reference: `aicronicles-dev/src/db/schema.ts`

**Interfaces:**
- Produces: `authors, categories, tags, media, posts, postRevisions, redirects,
  siteSettings` tabloları + `pages` (mevcut, fabelo alanlarıyla genişletilmiş) +
  `users` (mevcut, fabelo alanlarıyla). Tipler `$inferSelect`.

- [ ] **Step 1:** fabelo `src/db/schema.ts`'ten bu 10 tablonun tanımını oku.
  `tenant_id` içermediklerini doğrula (zaten yok — database-per-tenant).
- [ ] **Step 2: Test yaz** — her tablonun beklenen sütunlarını + ilişkilerini
  (posts.authorId, posts.categoryId, postRevisions.postId, media alanları)
  doğrulayan test. `schema.test.ts`'e ekle.
- [ ] **Step 3:** Testi çalıştır, fail gör (`npm test -- schema.test`).
- [ ] **Step 4:** 10 tabloyu `tenant/schema.ts`'e taşı. ①'deki `pages`/`users`'ı
  fabelo'nun tam alan setiyle genişlet (mevcut minimal sürümü değiştir).
  fabelo'daki alanlar/tipler/default'lar birebir; yalnızca import yolları
  panic-cms'e uyarlanır.
- [ ] **Step 5:** Drizzle Kit ile göç üret: `npx drizzle-kit generate --config
  drizzle.tenant.config.ts`. Üretilen SQL'i gözden geçir.
- [ ] **Step 6:** Testi çalıştır, pass gör. `npx tsc --noEmit` temiz.
- [ ] **Step 7: Commit** — `git commit -m "feat(icerik): 10 tablolu icerik semasi (tenant)"`

---

## Task 2: İçerik veri erişim katmanı

**Files:**
- Create: `panic-cms/src/lib/icerik.ts`, `src/lib/icerik.test.ts`
- Reference: fabelo `src/app/(frontend)/[slug]/page.tsx`, `category/[slug]/page.tsx` sorguları

**Interfaces:**
- Consumes: `getTenantDb` (①), Task 1 tabloları
- Produces: `yaziGetir(slug)`, `yayindakiYazilar(opts)`, `kategoriYazilari(slug)`,
  `etiketYazilari(slug)`, `yazarYazilari(slug)`, `sayfaGetir(slug)` — hepsi
  tenant-context'te çalışır (getTenantDb), context yoksa hata (fail-safe).

- [ ] **Step 1: Test yaz** — mock'lu getTenantDb ile `yaziGetir` doğru slug'ı
  sorguluyor + yalnızca yayındakileri döndürüyor mu.
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** `icerik.ts`'i yaz. Sorgu mantığı fabelo'daki sayfa
  server-component'lerinden alınır ama `getTenantDb()` üzerinden; yayında
  filtreleme (`status='published'`), ilişki doldurma (author, category) korunur.
- [ ] **Step 4:** Çalıştır, pass gör. tsc temiz.
- [ ] **Step 5: Commit** — `feat(icerik): tenant-context veri erisim katmani`

---

## Task 3: SEO/AEO katmanı (fabelo zengin hali)

**Files:**
- Modify: `panic-cms/src/lib/seo.ts` (①'de minimal getSiteConfig var)
- Create: `src/lib/faq.ts`, `src/lib/taxonomy.ts`
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Test: `src/lib/seo.test.ts`
- Reference: fabelo `src/lib/seo.ts`, `faq.ts`, `taxonomy.ts`, `sitemap.ts`, `robots.ts`

**Interfaces:**
- Consumes: `getSiteConfig()` (①), `getCurrentTenant()` (①), Task 2 sorguları
- Produces: `yaziSemasi`, `koleksiyonSemasi`, `profilSemasi`, `kirintiSemasi`,
  `gorselNesnesi` (①'de var, genişlet), `sssSemasi`; `markali`, `mutlak`;
  tenant-aware `sitemap()` ve `robots()`.

- [ ] **Step 1: Test yaz** — `yaziSemasi` verilen yazı+tenant için doğru
  Article JSON-LD (canonical, publisher @id, image) üretiyor mu; sitemap t1
  domaini basıyor mu (getSiteConfig'ten).
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** fabelo seo.ts'in JSON-LD üreticilerini taşı; hepsi
  `getSiteConfig()`'ten domain/url alır (build-time SITE YOK). sitemap.ts/
  robots.ts tenant-context'te (withTenantRequest ya da headers'tan host).
  ①'deki `gorselNesnesi`/`YAYINCI` üzerine kur.
- [ ] **Step 4:** Çalıştır, pass gör. tsc temiz.
- [ ] **Step 5: Commit** — `feat(seo): tenant-aware zengin JSON-LD/sitemap/robots`

---

## Task 4: Reklam/form STUB'ları (②c/②d sınırı)

**Files:**
- Create: `panic-cms/src/components/ads/AdSlot.tsx` (stub)
- Create: `panic-cms/src/components/magazine/ClientForm.tsx` (stub — render var, gönderim no-op)
- Test: `src/components/ads/AdSlot.test.tsx`

**Interfaces:**
- Produces: `AdSlot` (görünmez/boş render, konsolu kirletmez), `ClientForm`
  (alanları render eder ama submit no-op/uyarı). Sonraki bileşenler bunlara
  güvenerek import eder; ②c/②d gerçek işlevi koyar.

- [ ] **Step 1: Test yaz** — AdSlot render edilince hata vermez, boş/görünmez.
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** Stub'ları yaz. AdSlot: `return null` ya da yorumlu boş kutu.
  ClientForm: fabelo formunu render eder ama onSubmit → "②d'de bağlanacak"
  no-op. Her ikisine de `// STUB: ②c/②d'de gerçek işlev` yorumu.
- [ ] **Step 4:** Çalıştır, pass gör.
- [ ] **Step 5: Commit** — `feat(stub): AdSlot/ClientForm stub (②c/②d sinirina kadar)`

---

## Task 5: Blok render + içerik zenginleştirme

**Files:**
- Create: `panic-cms/src/lib/bloklar.ts`, `src/lib/icindekiler.ts`,
  `src/components/magazine/enrichArticleHtml.ts`, `blok-metin.ts`, `blok-yuzeyi.ts`
- Test: `src/lib/bloklar.test.ts`
- Reference: fabelo aynı dosyalar

**Interfaces:**
- Produces: `yazininBloklari`, `bloklarHtmle`, `enrichArticleHtml`,
  `icindekileriDoldur` — içerik gövdesini render eder (SADECE okuma/basma;
  düzenleme ②b).

- [ ] **Step 1: Test yaz** — örnek blok JSON'u → beklenen HTML.
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** fabelo blok render mantığını taşı (tenant-agnostik; SITE
  kullanan yer varsa getSiteConfig). Düzenleme/studio bağımlılığı GETİRME.
- [ ] **Step 4:** Çalıştır, pass gör. tsc temiz.
- [ ] **Step 5: Commit** — `feat(blok): icerik govde render (okuma)`

---

## Task 6: Magazine düzen bileşenleri (header/footer/nav/yardımcılar)

**Files:**
- Create: `panic-cms/src/components/magazine/`: MagazineHeader, MagazineFooter,
  PanicWorkzNetwork, NavProgress, BackToTop, Reveal, CustomCursor, AnchorPin,
  AuthorAvatar, VideoOynat
- Test: bir render smoke testi (MagazineHeader)
- Reference: fabelo aynı bileşenler (.bak HARİÇ)

**Interfaces:**
- Consumes: `getSiteConfig()`, Task 4 stub'ları
- Produces: düzen bileşenleri; hepsi tenant-agnostik (SITE→getSiteConfig).

- [ ] **Step 1:** fabelo bileşenlerini oku; SITE/db/reklam bağımlılıklarını
  listele.
- [ ] **Step 2: Test yaz** — MagazineHeader/Footer bir tenant context'inde
  (mock getSiteConfig) render edilir, doğru domain/marka basar.
- [ ] **Step 3:** Çalıştır, fail gör.
- [ ] **Step 4:** Bileşenleri taşı. `SITE`→`getSiteConfig()`; PanicWorkzNetwork
  ağ linkleri korunur (statik). .bak dosyaları alınmaz. Reklam kullanan yer
  Task 4 stub'ını import eder.
- [ ] **Step 5:** Çalıştır, pass gör. tsc temiz.
- [ ] **Step 6: Commit** — `feat(magazine): duzen bilesenleri (tenant-agnostik)`

---

## Task 7: Kart ve içerik bileşenleri (PostCard, CmsPage, ClientForm-render)

**Files:**
- Create: `panic-cms/src/components/magazine/`: PostCard, CmsPage, CanliOnizleme
- Test: PostCard render testi
- Reference: fabelo aynı (.bak hariç)

**Interfaces:**
- Consumes: Task 2 (veri), Task 5 (blok render), getSiteConfig
- Produces: PostCard (yazı kartı), CmsPage (sabit sayfa render), CanliOnizleme.

- [ ] **Step 1: Test yaz** — PostCard örnek yazı ile doğru başlık/tarih/link basar.
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** Taşı. SITE→getSiteConfig; kanonik link üretimi tenant'tan.
- [ ] **Step 4:** Çalıştır, pass gör. tsc temiz.
- [ ] **Step 5: Commit** — `feat(magazine): kart ve icerik bilesenleri`

---

## Task 8: Frontend layout + ana sayfa + error/not-found

**Files:**
- Create: `panic-cms/src/app/(site)/layout.tsx`, `page.tsx`, `error.tsx`, `not-found.tsx`
- Reference: fabelo `src/app/(frontend)/layout.tsx`, `page.tsx`, `error.tsx`, `not-found.tsx`

**Not:** ①'de düz `src/app/page.tsx` var; ②a içerik yüzü için `(site)` route
group'a geçilir (fabelo yapısı). ①'in minimal page.tsx'i (site)/page.tsx ile
değiştirilir.

**Interfaces:**
- Consumes: `withTenantRequest`, Task 2/6/7
- Produces: içerik ana sayfası (öne çıkan/son yazılar), layout (header+footer),
  hata/404 sayfaları.

- [ ] **Step 1: Test/kanıt** — ana sayfa withTenantRequest içinde son yazıları
  listeler (mock veya seed sonrası Task 10'da E2E).
- [ ] **Step 2:** layout.tsx: MagazineHeader/Footer sarmalı; metadata
  getSiteConfig'ten. Global context sarma YOK (T0) — her sayfa kendi
  withTenantRequest'ini çağırır.
- [ ] **Step 3:** page.tsx: `withTenantRequest(async () => yayindakiYazilar())`
  → PostCard listesi. error/not-found taşınır.
- [ ] **Step 4:** tsc + build (`npm run build`) temiz.
- [ ] **Step 5: Commit** — `feat(site): layout, ana sayfa, hata/404`

---

## Task 9: Yazı/sayfa + kategori/etiket/yazar + arama sayfaları

**Files:**
- Create: `panic-cms/src/app/(site)/[slug]/page.tsx` (+ ArticleClientActions),
  `category/[slug]/page.tsx`, `tag/[slug]/page.tsx`, `author/[slug]/page.tsx`,
  `search/page.tsx` (+ SearchClient)
- Reference: fabelo `src/app/(frontend)/` karşılıkları

**Interfaces:**
- Consumes: withTenantRequest, Task 2/3/5/7, SEO (Task 3)
- Produces: tüm içerik sayfaları; her biri withTenantRequest sarmalı, JSON-LD
  basar, redirects tablosuna bakar (permanentRedirect).

- [ ] **Step 1:** fabelo `[slug]/page.tsx`'i oku (bu oturumda çok çalışıldı):
  yönlendirme→yazı→sayfa sırası, JSON-LD, SSS, ilişkili yazılar.
- [ ] **Step 2: Test/kanıt** — [slug] withTenantRequest içinde yazıyı getirir,
  yayında değilse 404, redirects varsa 308.
- [ ] **Step 3:** Sayfaları taşı. `SITE`→getSiteConfig; `db`→getTenantDb;
  her sayfa withTenantRequest. AdSlot→Task 4 stub. JSON-LD Task 3'ten.
- [ ] **Step 4:** tsc + build temiz.
- [ ] **Step 5: Commit** — `feat(site): yazi/kategori/etiket/yazar/arama sayfalari`

---

## Task 10: İçerik seed + uçtan uca kanıt

**Files:**
- Create: `panic-cms/scripts/seed-icerik.ts`, `docs/KANIT-icerik.md`
- Reference: fabelo örnek içerik yapısı

**Interfaces:**
- Consumes: Task 1 şema, getTenantPool
- Produces: t1/t2 kiracılarında örnek yazar/kategori/etiket/yazı/sayfa.

- [ ] **Step 1:** t1 ve t2 kiracı DB'lerine (①'in seed'i üstüne) içerik seed'i:
  her kiracıda 2-3 yazar, 2-3 kategori, birkaç etiket, 3-5 yazı (biri SSS'li),
  1-2 sabit sayfa. t2 farklı içerik.
- [ ] **Step 2:** Drizzle Kit ile içerik göçünü t1/t2 DB'lerine uygula.
- [ ] **Step 3: Uçtan uca kanıt** (Host header ile, sudo yok):
  - `Host: t1.localhost /` → t1 yazı listesi; `/[bir-yazi]` → tam render
    (başlık, gövde, yazar, kategori, JSON-LD)
  - `/category/[x]`, `/tag/[y]`, `/author/[z]`, `/search?q=` → çalışır
  - `/sitemap.xml`, `/robots.txt` → t1 domaini
  - `Host: t2.localhost /` → t2 farklı içerik (izolasyon)
  - Bilinmeyen yazı → 404
  Sonuçları `docs/KANIT-icerik.md`'ye yaz.
- [ ] **Step 4:** `npm test` (tüm suite) + `npm run build` temiz.
- [ ] **Step 5: Commit** — `feat(icerik): t1/t2 seed + uctan uca kanit`

---

## Self-Review Notları

- **Spec kapsamı:** §3.1→T1, §3.2→T2, §3.3→T3, stub sınırı→T4, blok render→T5,
  bileşenler→T6/T7, sayfalar→T8/T9, kanıt→T10. Tümü karşılandı.
- **Stub sınırı net:** AdSlot/ClientForm T4'te stub; ②c/②d'ye devredilir —
  her import eden task bunu bilir.
- **③ ilişkisi:** ②a şema+kod+geçici seed; canlı fabelo verisi ③'te.
- **Tip tutarlılığı:** yaziGetir/yayindakiYazilar/kategoriYazilari (T2),
  yaziSemasi/sssSemasi (T3), getSiteConfig/getTenantDb/withTenantRequest (①)
  task'lar arası tutarlı.
- **Açık borç:** `(site)` route group'a geçiş ①'in düz page.tsx'ini değiştirir
  (T8); ledger'a not, kanıt T10'da.
