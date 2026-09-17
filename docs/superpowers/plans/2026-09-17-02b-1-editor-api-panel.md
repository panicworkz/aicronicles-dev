# ②b-1 Editör API + Panel Çerçevesi — Uygulama Planı

> **Agentic worker'lar için:** GEREKLİ ALT-SKILL: superpowers:subagent-driven-development
> (önerilen) veya superpowers:executing-plans. Adımlar checkbox (`- [ ]`).

**Goal:** panic-cms'te yazı/sayfa/medya için tenant-scoped CRUD API'leri +
panel çerçevesini (layout, liste sayfaları, auth koruması) kurmak — editör UI'nin
(②b-2/②b-3) üzerine oturacağı temel.

**Architecture:** API route'ları Node runtime'da withTenantRequest ile Host'tan
kiracıyı çözer → getTenantDb → kiracı DB'sine yazar/okur. Oturum kontrolü
getSession (①, tenant claim'li). Client (panel) kiracıyı bilmez; API Host'tan
çözer. İzolasyon API katmanında zorlanır.

**Tech Stack:** Next.js 15.5.25, React 19, TS, Drizzle+pg, Vitest.

**Spec:** [docs/superpowers/specs/2026-09-17-02b-editor-studio-tasima-design.md](../specs/2026-09-17-02b-editor-studio-tasima-design.md)
**Kaynak referans:** fabelo `aicronicles-dev/src/app/api/{posts,pages,media}`,
`src/app/panic/{layout,posts,pages}` (salt-okunur).

## Global Constraints

- **Kaynak salt-okunur:** aicronicles-dev/fabelo DEĞİŞMEZ; yalnızca panic-cms'e yazılır.
- **Tenant-scoped (kritik):** her API route withTenantRequest ile Host'tan kiracıyı
  çözer, getTenantDb kullanır. Global db YOK.
- **Cross-tenant yazma yasak (en kritik):** bir kiracının oturumuyla başka kiracıya
  yazma/okuma İMKANSIZ olmalı. Her route: withTenantRequest (Host→tenant) +
  getSession (oturum, tenant claim ①). Oturum yoksa 401, tenant uyuşmazsa reddedilir.
- **database-per-tenant:** kiracı tablolarına tenant_id eklenmez.
- **Medya kiracı-başına:** yükleme o kiracının dizinine (K4 taşınabilirlik).
- **Fail-safe:** context yoksa getTenantDb throw (①).
- **TDD:** her task failing test → implement → pass → commit.
- **.superpowers/ .gitignore'da. Repo panic-cms main.**

---

## Dosya Yapısı (panic-cms'te oluşacak)

| Dosya | Kaynak (fabelo) | Sorumluluk |
|---|---|---|
| `src/core/api/koru.ts` | (yeni) | API auth+tenant guard: withApiTenant helper |
| `src/app/api/posts/route.ts` + `[id]/route.ts` | api/posts/* | yazı CRUD |
| `src/app/api/pages/route.ts` + `[id]/route.ts` | api/pages/* | sayfa CRUD |
| `src/app/api/media/route.ts` | api/media/route.ts | medya CRUD + yükleme |
| `src/core/medya/depo.ts` | (yeni) | kiracı-başına medya depolama |
| `src/app/panic/layout.tsx` | panic/layout.tsx | panel çerçevesi (nav, auth) |
| `src/app/panic/posts/page.tsx` | panic/posts/page.tsx | yazı listesi |
| `src/app/panic/pages/page.tsx` | panic/pages/page.tsx | sayfa listesi |
| `scripts/kanit-editor-api.ts` | (yeni) | uçtan uca API kanıtı |

---

## Task 1: API tenant+auth guard (withApiTenant)

**Files:** Create `src/core/api/koru.ts`, `src/core/api/koru.test.ts`

**Interfaces:**
- Consumes: withTenantRequest (①), getSession (①), getCurrentTenant (①)
- Produces: `withApiTenant(req, fn)` — Host'tan tenant çözer (withTenantRequest),
  oturumu doğrular (getSession, yoksa 401 Response), tenant context'inde fn'i
  çalıştırır. `withApiTenantPublic(req, fn)` — oturum gerektirmeyen okuma (public
  API için, gerekirse). Dönüş: fn'in Response'u ya da 401/404.

- [ ] **Step 1: Test yaz** — oturum yokken withApiTenant 401 döner; oturum+tenant
  varken fn tenant context'inde çalışır; bilinmeyen Host 404.
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** Implement. withTenantRequest içinde getSession çağır; session
  null → `new Response(null,{status:401})`; değilse fn(). (getSession zaten tenant
  claim'i context ile eşliyor — ①, cross-tenant oturum reddi buradan gelir.)
- [ ] **Step 4:** Çalıştır, pass gör. tsc temiz.
- [ ] **Step 5: Commit** — `feat(api): tenant+auth guard (withApiTenant)`

---

## Task 2: Yazı CRUD API

**Files:** Create `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/route.ts`,
`src/app/api/posts/route.test.ts`. Reference: fabelo `api/posts/*`.

**Interfaces:**
- Consumes: withApiTenant (T1), getTenantDb, posts/postRevisions şeması (②a-T1)
- Produces: `GET /api/posts` (liste), `POST /api/posts` (oluştur), `GET/PUT/DELETE
  /api/posts/[id]`. Hepsi withApiTenant sarmalı. PUT revizyon oluşturur (postRevisions).

- [ ] **Step 1: Test yaz** — POST yeni yazı oluşturur (kiracı DB'sine); GET liste
  yalnızca o kiracının yazıları; başka kiracının id'sine erişim (farklı Host) 404.
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** fabelo posts route mantığını taşı, withApiTenant + getTenantDb ile.
  slug üretimi, status (draft/published), publishedAt korunur. PUT'ta önceki hali
  postRevisions'a yaz (fabelo mantığı).
- [ ] **Step 4:** Çalıştır, pass gör. tsc temiz.
- [ ] **Step 5: Commit** — `feat(api): yazi CRUD (tenant-scoped)`

---

## Task 3: Sayfa CRUD API

**Files:** Create `src/app/api/pages/route.ts`, `[id]/route.ts`, test. Reference: fabelo `api/pages/*`.

**Interfaces:**
- Consumes: withApiTenant, getTenantDb, pages şeması
- Produces: `GET/POST /api/pages`, `GET/PUT/DELETE /api/pages/[id]`, withApiTenant sarmalı.

- [ ] **Step 1: Test yaz** — POST sayfa oluşturur; GET liste kiracıya özel; cross-tenant 404.
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** fabelo pages route mantığını taşı (withApiTenant+getTenantDb).
- [ ] **Step 4:** Çalıştır, pass gör. tsc temiz.
- [ ] **Step 5: Commit** — `feat(api): sayfa CRUD (tenant-scoped)`

---

## Task 4: Kiracı-başına medya depolama

**Files:** Create `src/core/medya/depo.ts`, `depo.test.ts`. Reference: fabelo media yazma mantığı.

**Interfaces:**
- Consumes: getCurrentTenant (①)
- Produces: `medyaYolu(tenant, dosyaAdi)` → kiracı-başına yol (ör.
  `media/<tenant-slug>/<dosya>`); `medyaKaydet(dosya)` → context'teki kiracının
  dizinine yazar, döner {url, filename}; `medyaSil(filename)`.

- [ ] **Step 1: Test yaz** — medyaYolu kiracı slug'ını içerir; iki kiracı farklı yol
  (izolasyon); context yoksa hata.
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** Implement. Kiracı-başına dizin; ENV MEDIA_DIR tabanı + tenant slug.
  fabelo tek dizine yazıyordu; panic-cms kiracı-başına (K4).
- [ ] **Step 4:** Çalıştır, pass gör. tsc temiz.
- [ ] **Step 5: Commit** — `feat(medya): kiraci-basina depolama`

---

## Task 5: Medya CRUD API

**Files:** Create `src/app/api/media/route.ts`, test. Reference: fabelo `api/media/route.ts`.

**Interfaces:**
- Consumes: withApiTenant, getTenantDb, media şeması (②a-T1), depo (T4)
- Produces: `GET /api/media` (liste), `POST` (yükleme→depo+DB kaydı), `PUT` (alt/
  aeo güncelle), `DELETE`. withApiTenant sarmalı.

- [ ] **Step 1: Test yaz** — POST medya kiracı dizinine yazar + DB kaydı; GET liste
  kiracıya özel; cross-tenant erişim reddedilir.
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** fabelo media route mantığını taşı (withApiTenant + depo T4 + getTenantDb).
- [ ] **Step 4:** Çalıştır, pass gör. tsc temiz.
- [ ] **Step 5: Commit** — `feat(api): medya CRUD (tenant-scoped + kiraci depo)`

---

## Task 6: Panel layout + auth koruması

**Files:** Modify `src/app/panic/layout.tsx` (①'de yok — oluştur), `src/app/panic/page.tsx`
(①'de var — panele dönüştür). Reference: fabelo `panic/layout.tsx`.

**Interfaces:**
- Consumes: withTenantRequest, getSession (①), getSiteConfig
- Produces: panel layout (nav: yazılar/sayfalar/medya; oturum kontrolü — oturumsuz
  /panic/login'e); tenant-scoped.

- [ ] **Step 1:** fabelo panic/layout.tsx'i oku; nav + auth deseni.
- [ ] **Step 2: Test/smoke** — layout withTenantRequest içinde; oturumsuz erişim
  login'e redirect.
- [ ] **Step 3:** layout.tsx: getSession (withTenantRequest içinde), oturumsuz
  redirect; nav (getSiteConfig'ten site adı — ②a T-fix dersı: server'da hesapla,
  client'a prop). ①'in panic/page.tsx'i panel ana ekranına.
- [ ] **Step 4:** tsc + build temiz.
- [ ] **Step 5: Commit** — `feat(panel): layout + auth korumasi`

---

## Task 7: Yazı + sayfa liste sayfaları

**Files:** Create `src/app/panic/posts/page.tsx`, `src/app/panic/pages/page.tsx`, test.
Reference: fabelo karşılıkları.

**Interfaces:**
- Consumes: withTenantRequest, getTenantDb, posts/pages şeması; T2/T3 API (client fetch)
- Produces: yazı listesi (başlık/durum/tarih, düzenle/sil linki), sayfa listesi.
  Server component (liste getTenantDb ile) + client aksiyonlar (sil → API).

- [ ] **Step 1: Test yaz** — liste withTenantRequest içinde kiracının yazılarını
  gösterir; t2 farklı.
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** fabelo liste sayfalarını taşı (withTenantRequest + getTenantDb);
  "yeni yazı" → /panic/posts/[id] (editör ②b-3'te). SITE→getSiteConfig (server).
- [ ] **Step 4:** tsc + build temiz.
- [ ] **Step 5: Commit** — `feat(panel): yazi/sayfa liste sayfalari`

---

## Task 8: Uçtan uca API + panel kanıtı

**Files:** Create `scripts/kanit-editor-api.ts`, `docs/KANIT-editor-api.md`.

**Interfaces:** Consumes: tüm ②b-1 API + panel.

- [ ] **Step 1:** t1/t2 kiracılarında (②a seed ortamı + local Postgres) `npm run dev`.
- [ ] **Step 2: Uçtan uca kanıt** (Host header + oturum cookie ile):
  - t1 oturumu al (login), `POST /api/posts` → yazı oluştur (201); `GET /api/posts`
    → listede; `PUT /api/posts/[id]` → güncelle + revizyon; `DELETE` → sil.
  - **Cross-tenant güvenlik:** t1 oturum cookie'siyle `Host: t2.localhost` `POST
    /api/posts` → REDDEDİLMELİ (401/404, t2'ye yazma YOK). t1'in yazısına t2 Host'la
    erişim → reddedilmeli.
  - Oturumsuz `POST /api/posts` → 401.
  - `POST /api/media` → t1 dizinine yazar; t2 göremez.
  - Panel: `Host: t1.localhost /panic` oturumsuz → login redirect; oturumlu → panel.
  - Sonuçları docs/KANIT-editor-api.md'ye yaz.
- [ ] **Step 3:** `npm test` + `npx tsc --noEmit` + `npx next build` temiz.
- [ ] **Step 4: Commit** — `feat(api): editor API + panel uctan uca kanit`

---

## Self-Review Notları

- **Spec kapsamı:** ②b-1 (API + panel çerçevesi) — T1 guard, T2-T5 API, T6-T7 panel,
  T8 kanıt. Editör UI (blok düzenleme) ②b-2/②b-3'te, bu planda YOK.
- **Cross-tenant güvenlik:** T1 guard + T8 kanıt senaryosu bunu garanti eder — en
  kritik invariant.
- **Tip tutarlılığı:** withApiTenant (T1) → T2-T5, T6-T7 tüketir; getTenantDb/
  getSession/getSiteConfig (①), posts/pages/media şeması (②a-T1).
- **Client/server dersı (②a):** panel server component'leri getSiteConfig'i callback
  içinde/server'da hesaplar, client'a prop geçer (②a fix round 2 dersı).
- **Açık borç:** editör sayfaları (posts/[id], pages/[id]) ②b-3; bu planda liste +
  "yeni" linki var ama editör ekranı yok.
