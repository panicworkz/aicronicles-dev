# ②a İçerik/Dergi Çekirdeğini panic-cms'e Taşıma — Tasarım (Spec)

**Tarih:** 2026-09-13
**Alt-proje:** ②a (② "fabelo varlıklarını taşıma"nın ilk parçası)
**Üst kararlar:** [2026-09-12-panic-cms-cok-kiracilik-mimari-kararlar.md](./2026-09-12-panic-cms-cok-kiracilik-mimari-kararlar.md)
**Önceki:** ① çekirdek iskelet (panic-cms, GitHub'da, CI yeşil)
**Durum:** Tasarım — kullanıcı incelemesi bekliyor

---

## 1. Amaç ve Kapsam

**Amaç:** fabelo'nun (aicronicles-dev) kanıtlanmış **içerik/dergi çekirdeğini**
— yayın motoru — panic-cms'e **tenant-agnostik** olarak taşımak. fabelo'nun
tek-kiracı bağımlılıkları (build-time `SITE` sabiti, tek `siteSettings`)
sökülür; her şey ①'de kurulan tenant-context üzerinden çalışır.

**Kapsam içi (10 tablo + render + SEO):**
- **Şema (K9, neredeyse aynen):** users, authors, categories, tags, media,
  posts, postRevisions, pages, redirects, siteSettings → panic-cms kiracı
  şeması. `tenant_id` EKLENMEZ (database-per-tenant).
- **Magazine bileşenleri:** MagazineHeader/Footer, PostCard, CmsPage,
  AuthorAvatar, enrichArticleHtml, blok-metin/yuzeyi, Reveal, BackToTop,
  NavProgress, CustomCursor, VideoOynat, AnchorPin, ClientForm,
  PanicWorkzNetwork, CanliOnizleme. (.bak dosyaları TAŞINMAZ.)
- **Frontend sayfaları:** `[slug]` (yazı+sayfa), `category/[slug]`,
  `tag/[slug]`, `author/[slug]`, `search`, `layout`, `page` (ana sayfa),
  `error`, `not-found`. (contact/support/unsubscribe → ②d; store → ②e.)
- **SEO/AEO katmanı:** seo.ts'in fabelo'daki zengin hali (Article/Collection/
  Profile/Breadcrumb/FAQ JSON-LD, sitemap, robots, ImageObject, canonical) —
  ①'deki minimal getSiteConfig üzerine kurulur.
- **lib:** taxonomy, faq, icindekiler, bloklar (içerik render'a bağlı olanlar).

**Kapsam dışı (sonraki parçalar):**
- Blok editör/studio (panel düzenleme) → ②b
- Reklam (ads, AdSlot, AdBanner/Board/Tracker) → ②c
- Form + abonelik (contact*, subscribers, ClientForm'un form gönderimi) → ②d
- Mağaza (products…, store/) → ②e
- fabelo canlı verisinin migrate'i → ③

**Kanıt kriteri (②a "bitti"):** t1 geçici kiracısında birkaç örnek yazı/kategori/
etiket/yazar seed'lenir; `Host: t1.localhost` ile: yazı sayfası tam render
(başlık, gövde, yazar, kategori), kategori/etiket/yazar liste sayfaları,
arama, ana sayfa çalışır; SEO işaretleri (canonical, Article JSON-LD,
sitemap, robots) t1'in domaini ile basılır; ikinci kiracı t2 farklı içerik
gösterir (izolasyon). Hiçbir yerde build-time SITE sabiti kalmaz.

---

## 2. Tenant-Agnostik Dönüşümler (fabelo → panic-cms)

fabelo kodu tek-kiracı varsayımları taşıyor; taşınırken sökülecek:

| fabelo (tek-kiracı) | panic-cms (tenant-aware, ①'den) |
|---|---|
| `import { SITE } from "@/lib/seo"` (build-time) | `getSiteConfig()` (runtime, context'ten) — 14 dosya |
| global `db` (tek DATABASE_URL) | `getTenantDb()` / `db` proxy (context) |
| tek `siteSettings` satırı | kiracı DB'sindeki `site_settings` (5 yer) |
| sayfa server component'i doğrudan render | `withTenantRequest(async () => …)` sarmalı (T0: her giriş noktası) |
| `.bak` yedek dosyaları | taşınmaz (temiz kopya) |

**Kural:** Taşınan hiçbir dosya "şimdilik tek site" kısayolu içermez (K8).
Her veri erişimi tenant-context'ten; her SITE kullanımı getSiteConfig'ten.

---

## 3. Bileşenler (alt-parçalar)

②a büyük; plan bunu şu mantıksal task kümelerine bölecek:

### 3.1 Şema taşıma
10 tablo, fabelo `schema.ts`'ten panic-cms kiracı şemasına. Drizzle Kit ile.
`tenant_id` yok. İlişkiler (post→author/category, media, revisions) korunur.
Drizzle Kit göçü t1/t2 kiracı DB'lerine uygulanır.

### 3.2 Veri erişim katmanı
Yazı/kategori/etiket/yazar/sayfa sorguları — tenant-context `getTenantDb()`
üzerinden. fabelo'nun sorgu mantığı (yayında filtreleme, ilişki doldurma)
tenant-agnostik hale getirilerek.

### 3.3 SEO/AEO katmanı
fabelo seo.ts'in zengin hali → ①'in getSiteConfig'i üzerine. Article/
Collection/Profile/Breadcrumb/FAQ JSON-LD, ImageObject, canonical, sitemap,
robots — hepsi runtime kiracı kimliğinden. (①'de temel iskelet var; bu onu
fabelo seviyesine çıkarır.)

### 3.4 Magazine bileşenleri
~20 bileşen, tenant-agnostik. SITE→getSiteConfig; reklam/form bağımlılıkları
(AdSlot, ClientForm gönderimi) şimdilik STUB/gizli (②c/②d'de bağlanacak) —
render'ı bozmadan, ama işlevi sonraya.

### 3.5 Frontend sayfaları
`[slug]`, kategori/etiket/yazar, arama, ana sayfa, layout, error, not-found.
Her biri withTenantRequest sarmalı. fabelo'nun sayfa mantığı korunur.

---

## 4. Riskler ve Açık Noktalar

- **Reklam/form bağımlılığı:** magazine bileşenleri AdSlot, ClientForm içeriyor;
  ②a'da bunlar STUB (görünmez/no-op) olmalı ki render bozulmasın. ②c/②d
  bunları gerçek hale getirir. Plan bu stub sınırını net çizmeli.
- **Blok sistemi:** içerik gövdesi blok tabanlı (bloklar.ts, enrichArticleHtml).
  Render ②a'da; DÜZENLEME ②b'de. Sınır: ②a sadece okur/basar.
- **siteSettings kapsamı:** tema/font/mağaza-açık gibi ayarlar; ②a yalnızca
  içerik render'ının ihtiyaç duyduğu alanları taşır, gerisi ilgili parçada.
- **.bak dosyaları:** fabelo'da duruyor; taşınmaz. (fabelo'da temizlik ayrı iş.)
- **③ ile ilişki:** ②a şema + kod; gerçek fabelo VERİSİ ③'te migrate edilir.
  ②a kanıtı geçici t1/t2 seed'iyle yapılır, canlı fabelo verisiyle değil.

---

## 5. Plan Notu

②a'nın planı (writing-plans) muhtemelen 12–16 task olacak (şema, veri erişimi,
SEO, ~20 bileşen gruplu, ~10 sayfa, kanıt). ①'deki gibi TDD + subagent-driven.
Uygulama ①-boyutunda bir tur; spec+plan bu turda hazırlanır, uygulama
kullanıcı tetikleyince.
