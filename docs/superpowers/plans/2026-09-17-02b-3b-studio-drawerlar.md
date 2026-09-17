# ②b-3b Studio Drawer'ları — Uygulama Planı

> **Agentic worker'lar için:** GEREKLİ ALT-SKILL: superpowers:subagent-driven-development
> (önerilen) veya superpowers:executing-plans. Adımlar checkbox (`- [ ]`).

**Goal:** ②b-3a'da stub bırakılan editör drawer'larını gerçeğe çevirmek: SEO/AEO ölçer,
SERP önizleme, revizyon geçmişi (+API), medya seçici/detay + gerçek görsel yükleme.

**Architecture:** Stub dosyaları fabelo'daki gerçek bileşenlerle değişir (imzalar
②b-3a kullanımıyla uyumlu). Adaptasyon: SerpSocialPreview build-time SITE_DOMAIN →
runtime domain prop; revizyon listeleme için ②b-1 desenli yeni GET API.

**Tech Stack:** Next 15.5.25, React 19, TS, ui kit (②b-3-UI), sonner, lib/faq (②a),
②b-1 API (/api/media, /api/posts).

**Spec:** [docs/superpowers/specs/2026-09-17-02b-3b-studio-drawerlar-design.md](../specs/2026-09-17-02b-3b-studio-drawerlar-design.md)
**Kaynak referans (SALT-OKUNUR):** fabelo `src/components/studio/{AeoScoreMeter,SerpSocialPreview,RevisionHistoryDrawer,MediaPickerModal,MediaDetailDrawer}.tsx`,
`src/components/ui/image-upload-dropzone.tsx`, `src/app/api/posts/[id]/revisions/route.ts`.

## Global Constraints

- **Kaynak salt-okunur:** aicronicles-dev DEĞİŞMEZ; yalnızca panic-cms'e yazılır.
- **Birebir port + adaptasyon:** SerpSocialPreview SITE_DOMAIN→domain prop; diğerleri sadık.
- **ImageStudioDrawer + UrunSecici STUB KALIR** (AI/ürün ayrı iş). authorId eşleme kapsam dışı.
- **Revizyon API ②b-1 deseni** (withApiTenant + getTenantDb). **Repo panic-cms main; commit+push her task.**

---

## Task 1: Revizyon listeleme API

**Files:** Create `src/app/api/posts/[id]/revisions/route.ts`, `.../revisions/route.test.ts`.
Reference: fabelo `src/app/api/posts/[id]/revisions/route.ts`; desen: panic-cms `src/app/api/posts/[id]/route.ts` (②b-1).

**Interfaces:**
- Consumes: `withApiTenant` (②b-1-T1), `getTenantDb`, `postRevisions` şeması (②a).
- Produces: `GET /api/posts/[id]/revisions` → `{ revisions: [...] }` (postId'ye ait, tarih azalan).

- [ ] **Step 1: Test yaz** — `revisions/route.test.ts` (posts/route.test.ts mock altyapısını
  uyarlayarak; postRevisions deposu): oturumsuz 401; oturumlu, o kiracının postId'sine ait
  revizyonlar döner; başka kiracının Host'uyla (cross-tenant) boş/404. Örnek çekirdek:

```ts
it("kiracinin postId revizyonlarini doner", async () => {
  await oturumAc("t1.localhost");
  // t1 deposuna postId=1 icin 2 revizyon ekle (storeFor)
  const { GET } = await import("./route");
  const res = await GET(reqWithHost("t1.localhost"), { params: Promise.resolve({ id: "1" }) });
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.revisions.length).toBe(2);
});
```
- [ ] **Step 2:** Çalıştır, fail gör.
- [ ] **Step 3:** Implement — withApiTenant sarmalı; getTenantDb().query.postRevisions.findMany
  ({ where: eq(postRevisions.postId, id), orderBy: [desc(postRevisions.createdAt)] }); `{ revisions }`.
  fabelo route mantığını referans al.
- [ ] **Step 4:** Çalıştır, pass gör. tsc temiz.
- [ ] **Step 5: Commit + push** — `feat(api): revizyon listeleme (/api/posts/[id]/revisions)`

---

## Task 2: AeoScoreMeter gerçek

**Files:** Overwrite `src/components/studio/AeoScoreMeter.tsx` (stub→gerçek). Reference: fabelo (114).

- [ ] **Step 1:** fabelo `AeoScoreMeter.tsx`'i stub'ın ÜZERİNE KOPYALA. Import'lar: ui (✓),
  lucide (✓), `@/lib/faq` (sssCikar, ✓ ②a) — hepsi mevcut.
- [ ] **Step 2:** `npx tsc --noEmit` — imza AyarKenari kullanımıyla (title/contentHtml/excerpt/
  metaTitle/metaDescription) uyumlu olmalı; değilse hizala.
- [ ] **Step 3:** `npx next build` temiz.
- [ ] **Step 4: Commit + push** — `feat(studio): AeoScoreMeter gercek (AEO puan olcer)`

---

## Task 3: SerpSocialPreview gerçek + domain prop

**Files:** Overwrite `src/components/studio/SerpSocialPreview.tsx`; Modify
`src/components/studio/AyarKenari.tsx` + `src/app/panic/posts/[id]/editor.tsx` +
`src/app/panic/pages/[id]/editor.tsx` (domain iletimi). Reference: fabelo (117).

- [ ] **Step 1:** fabelo `SerpSocialPreview.tsx`'i kopyala. `import { SITE, SITE_DOMAIN } from
  '@/lib/seo'` KALDIR; bileşene `domain: string` prop ekle; `{SITE_DOMAIN}` → `{domain}`.
  `SITE` (site adı) kullanılıyorsa: domain'den türet ya da ikinci prop `siteAdi` (basit tut).
- [ ] **Step 2:** AyarKenari'ye `domain` prop ekle (alanlar'ın yanında) ve SerpSocialPreview'e
  ilet. Editör (posts/[id] + pages/[id] editor.tsx) `<AyarKenari domain={domain} ...>` geçir
  (editör zaten `domain` prop'una sahip — ②b-3a).
- [ ] **Step 3:** `npx tsc --noEmit` temiz.
- [ ] **Step 4:** `npx next build` temiz.
- [ ] **Step 5: Commit + push** — `feat(studio): SerpSocialPreview gercek + runtime domain prop`

---

## Task 4: RevisionHistoryDrawer gerçek

**Files:** Overwrite `src/components/studio/RevisionHistoryDrawer.tsx` (stub→gerçek).
Reference: fabelo (158). Consumes: T1 revizyon API, ui, sonner.

- [ ] **Step 1:** fabelo `RevisionHistoryDrawer.tsx`'i kopyala. `/api/posts/[id]/revisions`
  (T1) çağrısı geçerli. Import'lar ui/sonner (✓).
- [ ] **Step 2:** `npx tsc --noEmit` — imza editör kullanımıyla (postId/isOpen/onClose/onRestore)
  uyumlu olmalı; değilse hizala.
- [ ] **Step 3:** `npx next build` temiz.
- [ ] **Step 4: Commit + push** — `feat(studio): RevisionHistoryDrawer gercek (revizyon gecmisi)`

---

## Task 5: Medya seçici + detay + gerçek yükleme

**Files:** Overwrite `src/components/studio/MediaPickerModal.tsx`,
`src/components/ui/image-upload-dropzone.tsx`; Create `src/components/studio/MediaDetailDrawer.tsx`.
Reference: fabelo karşılıkları (368/405/348). Consumes: `/api/media` (②b-1), ui, onayla/modal, sonner.

- [ ] **Step 1:** fabelo `MediaDetailDrawer.tsx`'i KOPYALA (yeni). Import'lar ui + onayla/modal
  (✓ ②b-3-UI) + sonner. `/api/media` PUT/DELETE (②b-1: PUT `{success,media}`, DELETE `{success}`).
- [ ] **Step 2:** fabelo `MediaPickerModal.tsx`'i stub ÜZERİNE kopyala. `/api/media` GET
  (②b-1: `{media, total}`) — fabelo `data.media` bekliyorsa uyumlu; `data.success` kontrolü
  varsa `res.ok`'a uyarla (②b-3a dersı). MediaDetailDrawer bağı (T5-Step1) mevcut.
- [ ] **Step 3:** fabelo `image-upload-dropzone.tsx`'i stub ÜZERİNE kopyala. Yükleme `/api/media`
  POST (②b-1: `{media}`, 201 — `data.success` yerine `res.ok && data.media`). MediaPicker/Detail bağları mevcut.
- [ ] **Step 4:** `npx tsc --noEmit` temiz (imza: value/onChange/altValue/onAltChange/label —
  AyarKenari + editör kullanımıyla uyumlu).
- [ ] **Step 5:** `npx next build` + `npx vitest run` temiz.
- [ ] **Step 6: Commit + push** — `feat(studio): medya secici + detay + gercek gorsel yukleme`

---

## Task 6: Tarayıcı uçtan uca kanıtı

**Files:** Create `docs/KANIT-studio-drawerlar.md`. (Gerçek editör sayfaları; t1 oturumu.)

- [ ] **Step 1:** `PORT=3987 npm run dev`. Built-in browser `http://t1.localhost:3987/panic/login`
  → `admin@t1.localhost / parola123`.
- [ ] **Step 2: Kanıt** (t1 editör):
  - Bir yazıyı aç (`/panic/posts/1`) → düzenle + Kaydet (revizyon üretir) → **Revisions**
    çekmecesini aç → geçmiş listelenir (revizyon API 200, en az 1 kayıt).
  - AyarKenari'de **SERP önizleme** domain'le (t1.localhost) render eder; **AEO puanı** hesaplanır.
  - **Görsel yükleme** alanından medya seçiciyi aç → `/api/media` listesi görünür (t1 medyası).
  - Stub kalanlar (ImageStudio/Urun) açılınca hata vermez.
  - Sonuçları `docs/KANIT-studio-drawerlar.md`'ye yaz. Kanıt artıklarını (fazladan revizyon)
    kabul et (revizyon birikimi normaldir); yeni medya yüklendiyse sil.
- [ ] **Step 3:** Dev server durdur; `.next` temizle.
- [ ] **Step 4:** `npx vitest run` + `npx tsc --noEmit` + `npx next build` temiz.
- [ ] **Step 5: Commit + push** — `docs(studio): studio drawer'lar uctan uca kanit`

---

## Self-Review Notları

- **Spec kapsamı:** T1 revizyon API, T2 AEO, T3 SERP+domain, T4 revizyon drawer, T5 medya,
  T6 kanıt — spec §5 ile birebir. ImageStudio/Urun stub, authorId/kategori/taksonomi kapsam dışı.
- **Tip tutarlılığı:** T1 API → T4 tüketir; T3 domain prop editör(②b-3a)→AyarKenari→SerpSocialPreview;
  T5 MediaDetailDrawer → MediaPicker + dropzone. İmzalar ②b-3a stub kullanımıyla uyumlu.
- **API sözleşmesi:** /api/media GET `{media}` / POST `{media}` (②b-1) — `data.success` yerine
  `res.ok` (②b-3a dersı). Revizyon API yeni (T1).
- **Açık borç:** ImageStudioDrawer (AI), UrunSecici (②e), authorId eşleme, kategori/taksonomi API.
