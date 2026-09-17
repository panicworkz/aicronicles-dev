# ②b-3a Editör İskeleti — Tasarım (Spec)

**Tarih:** 2026-09-17
**Alt-proje:** ②b-3a (②b-3'ün ilk uygulama turu; ②b-3-UI temeli üstüne)
**Üst spec:** [2026-09-17-02b-editor-studio-tasima-design.md](./2026-09-17-02b-editor-studio-tasima-design.md)
**Önceki:** ①, ②a, ②b-1 (API+panel), ②b-2 (blok editör), ②b-3-UI (ui kit) — GitHub'da, CI yeşil
**Durum:** Tasarım — kullanıcı incelemesi bekliyor

---

## 1. Amaç ve Kapsam

**Amaç:** fabelo'nun yazı/sayfa **editör iskeletini** panic-cms'e taşımak: editör
sayfaları (`/panic/{posts,pages}/[id]` + `/new`), yerinde düzenleme tuvali (CanlıTuval)
+ blok editör (②b-2) + ayar kenarı (AyarKenari), ②b-1 API üzerinden yükle/kaydet.
Studio drawer'larının GERÇEK içeriği ②b-3b'de; bu turda **imza-uyumlu STUB**'lanır
(②a'nın blok-yuzeyi'ni stub'laması deseni).

**Kapsam içi:**
- `CanlıTuval` (çerçeve/denetim şeridi/mesajlaşma; yalnız lucide'a bağlı) — birebir port.
- `AyarKenari` (başlık/slug/özet/durum/meta alanları kenar çubuğu) — birebir port;
  SEO/AEO alt-parçaları (AeoScoreMeter/SerpSocialPreview/image-upload-dropzone) STUB.
- Editör sayfaları: `posts/[id]`, `posts/new`, `pages/[id]`, `pages/new` — birebir port,
  ②b-1 API ile yükle (GET) / kaydet+otomatik-kaydet (PUT/POST).
- STUB'lar (②b-3b/②e): `AeoScoreMeter`, `SerpSocialPreview`, `RevisionHistoryDrawer`,
  `MediaPickerModal`, `KaynakDuzenleyici`, `UrunSecici` (→②e), `image-upload-dropzone`.

**Kapsam dışı:** drawer'ların gerçek içeriği (②b-3b), ürün (②e), `/api/categories` ve
revizyon-listeleme API'leri (②b-3b'de; bu turda kategori seçici stub/pasif).

---

## 2. Yaklaşım

**Birebir port + STUB** (②a/②b-2 ile tutarlı): editör sayfaları, CanlıTuval, AyarKenari
sadık taşınır; ②b-3b/②e bileşenleri no-op ama imza-uyumlu stub'larla değiştirilir.
Editör derlenir, mount olur, YÜKLE/DÜZENLE/KAYDET çalışır; drawer'lar (revizyon, medya
seçici, kaynak, ürün, SEO/AEO ölçer) stub süresince "sessiz" durur. Kaynak aicronicles-dev
SALT-OKUNUR.

---

## 3. Bağımlılık Haritası

| Dosya | Kaynak | Durum |
|---|---|---|
| `src/components/studio/CanliTuval.tsx` | fabelo (381) | port (lucide ✓) |
| `src/components/studio/AyarKenari.tsx` | fabelo (262) | port; stub'lı SEO/AEO/dropzone |
| `src/components/studio/{AeoScoreMeter,SerpSocialPreview,RevisionHistoryDrawer,MediaPickerModal,KaynakDuzenleyici,UrunSecici}.tsx` | (stub) | imza-uyumlu no-op |
| `src/components/ui/image-upload-dropzone.tsx` | (stub) | imza-uyumlu (gerçek ②b-3b) |
| `src/app/panic/posts/[id]/editor.tsx` + `page.tsx` | fabelo `posts/[id]/page.tsx` (686) | port; page.tsx server wrapper |
| `src/app/panic/posts/new/page.tsx` | fabelo | port |
| `src/app/panic/pages/[id]/editor.tsx` + `page.tsx`, `pages/new/page.tsx` | fabelo (441) | port |

**Zaten var:** ui kit (②b-3-UI), CanlıÖnizleme + blok editör (②a/②b-2), ②b-1 API, sonner.

---

## 4. Adaptasyonlar (panic-cms farkları)

- **SITE_DOMAIN → runtime prop:** fabelo build-time `SITE_DOMAIN` (slug önizlemesi) kullanıyor;
  panic-cms runtime kiracı. Editör client component olduğundan `page.tsx` bir SERVER wrapper
  olur (auth `oturumZorunlu` + `withTenantRequest`'te `getSiteConfig().domain`), domain'i
  client `editor.tsx`'e PROP geçer (②a dersi: getSiteConfig context içinde, client prop alır).
- **Yükle/kaydet:** ②b-1 `/api/posts[/id]`, `/api/pages[/id]` (GET/PUT/POST). handleSave gövdesi
  ②b-1 PUT ile uyumlu (`{success:true}`). `new` sayfası POST (201) → `/[id]`'ye yönlendirir.
- **`/api/categories` yok:** kategori seçici bu turda pasif/stub (kategori API ②b-3b/ayrı).
  `categoryId` alanı kalır ama seçenek listesi boş/gizli.
- **authorId (açık borç):** session.userId (string) vs authors.id (serial). Bu turda kaydda
  authorId GÖNDERİLMEZ (②b-1 PUT nullable); gerçek yazar eşleme ②b-3b veya ayrı işte.
- **toast=sonner, ui kit ✓.**

---

## 5. Görev Ayrımı

- **T1 — STUB'lar:** 6 studio stub + image-upload-dropzone stub (editör sayfası/AyarKenari'nin
  kullandığı prop imzalarıyla; kaynak referans). Doğrulama: tsc.
- **T2 — CanlıTuval port:** çerçeve/denetim/mesajlaşma. tsc + build.
- **T3 — AyarKenari port:** alanlar + stub'lı SEO/AEO. tsc + build.
- **T4 — Yazı editörü:** `posts/[id]` (server wrapper + client editor) + `posts/new`;
  yükle/kaydet/otomatik-kaydet, SITE_DOMAIN→prop, kategori pasif. tsc + build.
- **T5 — Sayfa editörü:** `pages/[id]` + `pages/new` (yazı deseni, sadeleşmiş). tsc + build.
- **T6 — Tarayıcı uçtan uca kanıtı:** t1 oturumuyla editörü aç → blok düzenle → kaydet →
  yeniden yükle (kalıcı). `docs/KANIT-editor-iskelet.md`.

---

## 6. Kanıt Ölçütü

Tarayıcıda (t1 kiracısı, oturumlu): `/panic/posts/[id]` açılır → CanlıTuval + blok editör
görünür → başlık/blok düzenlenir → Kaydet → ②b-1 API'ye PUT → yeniden yüklemede kalıcı.
`/panic/posts/new` → POST → `/[id]`'ye gider. Sayfa editörü aynı. Stub drawer'lar hata
vermez. tsc + build + tüm vitest yeşil.

---

## 7. Riskler

- **Editör client + tenant:** slug önizleme domain'i server wrapper'dan prop (②a dersi) —
  editör içinde getSiteConfig ÇAĞRILMAZ.
- **Büyük sayfa portu:** posts/[id] 686 satır; stub'lar ile derlenir. Eksik bir import
  çıkarsa (beklenmeyen studio/ui bağımlılığı) stub listesine eklenir ya da ertelenir.
- **Kategori/revizyon API yok:** kategori pasif; RevisionHistoryDrawer stub (revizyon
  listeleme API ②b-3b). Kayıttaki revizyon YAZMA zaten ②b-1 PUT'ta var.
- **authorId:** bu turda gönderilmez (nullable); gerçek eşleme ertelendi.
