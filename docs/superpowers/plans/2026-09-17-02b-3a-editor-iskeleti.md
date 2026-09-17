# ②b-3a Editör İskeleti — Uygulama Planı

> **Agentic worker'lar için:** GEREKLİ ALT-SKILL: superpowers:subagent-driven-development
> (önerilen) veya superpowers:executing-plans. Adımlar checkbox (`- [ ]`).

**Goal:** Yazı/sayfa editör iskeletini (editör sayfaları + CanlıTuval + AyarKenari,
②b-1 API ile yükle/kaydet) panic-cms'e taşımak; studio drawer'larını ②b-3b'ye stub'layarak.

**Architecture:** Editör client-heavy. `page.tsx` SERVER wrapper (auth + kiracı domain'i
`getSiteConfig`'ten prop) → client `editor.tsx` (yükle/kaydet, CanlıTuval + CanlıÖnizleme
+ AyarKenari). Drawer'lar imza-uyumlu STUB (②a deseni).

**Tech Stack:** Next 15.5.25, React 19, TS, ui kit (②b-3-UI), sonner, ②b-1 API, ②b-2 blok editör.

**Spec:** [docs/superpowers/specs/2026-09-17-02b-3a-editor-iskeleti-design.md](../specs/2026-09-17-02b-3a-editor-iskeleti-design.md)
**Kaynak referans (SALT-OKUNUR):** fabelo `src/app/panic/{posts,pages}/{[id],new}/page.tsx`,
`src/components/studio/{CanliTuval,AyarKenari}.tsx`.

## Global Constraints

- **Kaynak salt-okunur:** aicronicles-dev DEĞİŞMEZ; yalnızca panic-cms'e yazılır.
- **Birebir port + stub:** editör/tuval/kenar sadık; ②b-3b/②e bileşenleri imza-uyumlu no-op stub.
- **Editör client; getSiteConfig SERVER wrapper'da** (②a dersi), domain client'a prop.
- **Yükle/kaydet ②b-1 API** (/api/posts[/id], /api/pages[/id]). authorId GÖNDERİLMEZ (nullable).
- **Kategori seçici pasif** (/api/categories yok). **Repo panic-cms main; commit+push her task.**

---

## Task 1: Studio + dropzone STUB'ları

**Files:** Create `src/components/studio/{AeoScoreMeter,SerpSocialPreview,RevisionHistoryDrawer,MediaPickerModal,KaynakDuzenleyici,UrunSecici}.tsx`,
`src/components/ui/image-upload-dropzone.tsx`.

**Interfaces:**
- Produces: her biri fabelo'daki kullanımın (editör sayfası + AyarKenari JSX'i) beklediği
  prop imzasıyla; çoğu `null` döner. `KaynakDuzenleyici` `{value, onChange}` alır ve basit
  bir `<textarea>` sunar (kaçış kapısı — kaynak HTML düzenleme çalışsın). `MediaPickerModal`
  bir `open`/`onClose`/`onSelect` alır, açıkken küçük bir "②b-3b'de" bilgisi gösterir.

- [ ] **Step 1:** Her stub için fabelo kaynağındaki JSX kullanımına bak (props):
  - `AeoScoreMeter`, `SerpSocialPreview` → `AyarKenari.tsx` içinde; prop adlarını oradan al.
  - `RevisionHistoryDrawer`, `MediaPickerModal`, `UrunSecici`, `KaynakDuzenleyici` →
    `posts/[id]/page.tsx` JSX'inden (satır ~424,621,642,658) prop adlarını al.
  - `image-upload-dropzone` → `AyarKenari.tsx`/editör kullanımından.
- [ ] **Step 2:** Stub'ları yaz. Desen (örnek):

```tsx
"use client";
// STUB (②b-3a) — gerçek içerik ②b-3b'de. İmza editör/AyarKenari kullanımıyla uyumlu.
export function AeoScoreMeter(_props: { score?: number; [k: string]: unknown }) {
  return null;
}
```
  `KaynakDuzenleyici` işlevsel kalsın (kaçış kapısı):
```tsx
"use client";
export function KaynakDuzenleyici({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-40 font-mono text-xs border rounded p-2"
      aria-label="Kaynak HTML"
    />
  );
}
```
- [ ] **Step 3:** `npx tsc --noEmit` — stub imzaları port edilecek dosyalarla T4/T5'te
  eşleşecek; bu adımda stub'lar tek başına derlenmeli.
- [ ] **Step 4: Commit + push** — `feat(studio): editor drawer stub'lari (②b-3b'ye)`

---

## Task 2: CanlıTuval port

**Files:** Create `src/components/studio/CanliTuval.tsx`. Reference: fabelo (381 satır, import: react + lucide-react).

- [ ] **Step 1:** fabelo `CanliTuval.tsx`'i KOPYALA. Import'lar (react, lucide-react) panic-cms'te
  geçerli. `@/components/*` bağımlılığı yok; varsa (beklenmez) T1 stub'ına yönlendir.
- [ ] **Step 2:** `npx tsc --noEmit` temiz.
- [ ] **Step 3:** `npx next build` temiz.
- [ ] **Step 4: Commit + push** — `feat(studio): CanliTuval (yerinde duzenleme tuvali) port`

---

## Task 3: AyarKenari port

**Files:** Create `src/components/studio/AyarKenari.tsx`. Reference: fabelo (262 satır).

**Interfaces:** Consumes: ui kit (②b-3-UI), lucide, `AeoScoreMeter`/`SerpSocialPreview`/
`image-upload-dropzone` (T1 stub'ları), sonner.

- [ ] **Step 1:** fabelo `AyarKenari.tsx`'i KOPYALA. Import'lar: `@/components/ui/*` (✓),
  `lucide-react` (✓), `@/components/studio/{AeoScoreMeter,SerpSocialPreview}` (T1 stub ✓),
  `@/components/ui/image-upload-dropzone` (T1 stub ✓), sonner (✓) — hepsi mevcut.
- [ ] **Step 2:** `npx tsc --noEmit` temiz (stub imzaları AyarKenari kullanımını karşılamalı;
  karşılamıyorsa T1 stub prop'unu kullanımla hizala).
- [ ] **Step 3:** `npx next build` temiz.
- [ ] **Step 4: Commit + push** — `feat(studio): AyarKenari (ayar kenari) port + stub SEO/AEO`

---

## Task 4: Yazı editörü (posts/[id] + posts/new)

**Files:** Create `src/app/panic/posts/[id]/editor.tsx` (client), Modify/Create
`src/app/panic/posts/[id]/page.tsx` (server wrapper), Create `src/app/panic/posts/new/page.tsx`.
Reference: fabelo `posts/[id]/page.tsx` (686), `posts/new/page.tsx`.

**Interfaces:**
- Consumes: CanlıTuval (T2), AyarKenari (T3), stub drawer'lar (T1), CanlıÖnizleme (②a),
  ②b-1 `/api/posts[/id]`, `oturumZorunlu`/`getSiteConfig` (①/②a).
- Produces: çalışan yazı editörü (yükle/kaydet/otomatik-kaydet).

- [ ] **Step 1:** fabelo `posts/[id]/page.tsx` gövdesini `posts/[id]/editor.tsx`'e taşı,
  `"use client"`. Uyarlamalar: `SITE_DOMAIN` → prop `domain`; `useParams`/`use(params)` yerine
  prop `postId`; kategori fetch'i (`/api/categories`) KALDIR/pasifle (categories=[]); stub
  drawer import'ları T1'den; toast=sonner.
- [ ] **Step 2:** `posts/[id]/page.tsx` = SERVER wrapper:

```tsx
import { oturumZorunlu } from "@/core/panel/kabuk";
import { withTenantRequest } from "@/core/tenant/withRequest";
import { getSiteConfig } from "@/core/config/site";
import { PostEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await oturumZorunlu();
  const domain = await withTenantRequest(async () => getSiteConfig().domain);
  return <PostEditor postId={id} domain={domain} />;
}
```
- [ ] **Step 2b:** `posts/new/page.tsx`: fabelo new mantığını taşı (POST `/api/posts` → 201 →
  `router.push('/panic/posts/'+id)`). Server wrapper deseni gerekiyorsa (domain) T4-Step2 gibi.
- [ ] **Step 3:** `npx tsc --noEmit` — çözülemeyen import çıkarsa (beklenmeyen studio/ui
  bağımlılığı) T1 stub listesine ekle. Kategori/authorId spec §4'e göre pasif/gönderilmez.
- [ ] **Step 4:** `npx next build` temiz.
- [ ] **Step 5: Commit + push** — `feat(panel): yazi editoru (posts/[id]+new, ②b-1 API ile yukle/kaydet)`

---

## Task 5: Sayfa editörü (pages/[id] + pages/new)

**Files:** Create `src/app/panic/pages/[id]/{editor.tsx,page.tsx}`, `src/app/panic/pages/new/page.tsx`.
Reference: fabelo `pages/[id]/page.tsx` (441), `pages/new/page.tsx`.

**Interfaces:** Consumes: T1–T3, ②b-1 `/api/pages[/id]`. Yazı editörü (T4) deseninin sadeleşmişi
(kategori/yazar/ürün yok).

- [ ] **Step 1:** T4 desenini uygula: `editor.tsx` (client, fabelo pages/[id] gövdesi,
  SITE_DOMAIN→prop, /api/pages[/id]), `page.tsx` server wrapper, `new/page.tsx` (POST /api/pages).
- [ ] **Step 2:** `npx tsc --noEmit` temiz.
- [ ] **Step 3:** `npx next build` temiz.
- [ ] **Step 4: Commit + push** — `feat(panel): sayfa editoru (pages/[id]+new)`

---

## Task 6: Tarayıcı uçtan uca kanıtı

**Files:** Create `docs/KANIT-editor-iskelet.md`. (Gerekirse geçici oturum çerezi ile;
harness gerekmez — gerçek editör sayfaları kullanılır.)

**Interfaces:** Consumes: tüm ②b-3a + ②b-1 API + t1/t2 seed (yerel Postgres).

- [ ] **Step 1:** `PORT=3987 npm run dev`. t1 oturum çerezi üret (②b-1 T8 betiğindeki jose
  deseni: `{userId,email,tenant:"t1"}`) — built-in browser'a çerez olarak ekle ya da login üzerinden.
- [ ] **Step 2: Kanıt** (built-in browser, `Host: t1.localhost` — /panic tenant ister):
  - Var olan bir t1 yazısının `/panic/posts/[id]`'sini aç → CanlıTuval + blok editör görünür,
    hydration hatası yok.
  - Başlığı/bir bloğu düzenle → **Kaydet** → toast + ②b-1 PUT 200.
  - Sayfayı yeniden yükle → değişiklik KALICI (②b-1 GET'ten geldi).
  - `/panic/posts/new` → başlık gir → kaydet/oluştur → `/[id]`'ye yönlenir, kayıt oluşur.
  - Sayfa editörü (`/panic/pages/[id]`) aynı akışla bir kez doğrula.
  - Stub drawer'lar (Revisions/Media/SEO ölçer) açılınca hata vermez.
  - Sonuçları `docs/KANIT-editor-iskelet.md`'ye yaz.
- [ ] **Step 3:** Dev server durdur; `.next` temizle.
- [ ] **Step 4:** `npx vitest run` + `npx tsc --noEmit` + `npx next build` temiz.
- [ ] **Step 5: Commit + push** — `docs(panel): editor iskeleti uctan uca kanit`

---

## Self-Review Notları

- **Spec kapsamı:** T1 stub, T2 CanlıTuval, T3 AyarKenari, T4 yazı editörü, T5 sayfa editörü,
  T6 kanıt — spec §5 ile birebir. Drawer içerikleri ②b-3b, ürün ②e (kapsam dışı, stub).
- **Tip tutarlılığı:** T1 stub'ları → T3/T4/T5 tüketir; CanlıTuval(T2)/AyarKenari(T3) → T4/T5;
  ②b-1 API + CanlıÖnizleme/blok editör (②a/②b-2) mevcut. SITE_DOMAIN→prop tutarlı (server wrapper).
- **Adaptasyonlar:** SITE_DOMAIN→prop, /api/categories pasif, authorId gönderilmez — spec §4.
- **Açık borç:** drawer gerçek içerikleri + kategori/revizyon API + authorId eşleme + featured
  image gerçek yükleme (image-upload-dropzone) → ②b-3b/②e.
