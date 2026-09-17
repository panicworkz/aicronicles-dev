# ②b-3b Studio Drawer'ları — Tasarım (Spec)

**Tarih:** 2026-09-17
**Alt-proje:** ②b-3b (②b-3'ün ikinci uygulama turu; ②b-3a iskeleti üstüne)
**Üst spec:** [2026-09-17-02b-editor-studio-tasima-design.md](./2026-09-17-02b-editor-studio-tasima-design.md)
**Önceki:** ①, ②a, ②b-1, ②b-2, ②b-3-UI, ②b-3a — GitHub'da, CI yeşil
**Durum:** Tasarım — kullanıcı incelemesi bekliyor

---

## 1. Amaç ve Kapsam

**Amaç:** ②b-3a'da imza-uyumlu STUB bırakılan editör studio drawer'larını **gerçeğe**
çevirmek: SEO/AEO ölçer, SERP/sosyal önizleme, revizyon geçmişi (+revizyon API),
medya seçici + medya detay + gerçek görsel yükleme.

**Kapsam içi (stub → gerçek):**
- `AeoScoreMeter` (AEO/SEO puan ölçer) — `@/lib/faq` (sssCikar, ✓ ②a); API'siz.
- `SerpSocialPreview` (Google/sosyal önizleme) — `@/lib/seo` SITE/SITE_DOMAIN yerine
  **domain prop** (editör→AyarKenari→bileşen).
- `RevisionHistoryDrawer` (revizyon geçmişi) + **YENİ** `/api/posts/[id]/revisions` (GET).
- `MediaPickerModal` + `MediaDetailDrawer` (medya kütüphanesi/detay) — `/api/media` (✓ ②b-1).
- `image-upload-dropzone` (gerçek yükleme) — `/api/media` (✓) + MediaPicker/Detail.

**Kapsam dışı:**
- `ImageStudioDrawer` — `/api/ai/copilot`'a (YOK, AI ayrı iş) bağlı; STUB kalır.
- `UrunSecici` — ürün (→②e); STUB kalır.
- `TaxonomyArticleDrawer` — editörde kullanılmıyor (ayrı panel özelliği).
- **authorId eşleme** (session.userId string vs authors.id serial) — drawer değil;
  revizyon authorName'i ②b-1 PUT'ta zaten yazılıyor. Ayrı küçük iş (açık borç).
- Kategori/taksonomi API (kategori seçici pasif kalır; ayrı iş).

---

## 2. Yaklaşım

**Birebir port + adaptasyon:** stub dosyalarının yerine fabelo'daki gerçek bileşenler
taşınır (imzalar ②b-3a kullanımıyla uyumlu). İki adaptasyon: (1) SerpSocialPreview'in
build-time `@/lib/seo` bağımlılığı → runtime domain prop; (2) revizyon LİSTELEME için
②b-1 desenli yeni bir tenant-scoped GET API. Kaynak aicronicles-dev SALT-OKUNUR.

---

## 3. Bağımlılık Haritası

| Dosya | Kaynak | Bağımlılık | Durum |
|---|---|---|---|
| `src/app/api/posts/[id]/revisions/route.ts` | (yeni, ②b-1 deseni) | withApiTenant + getTenantDb + postRevisions | YENİ |
| `src/components/studio/AeoScoreMeter.tsx` | fabelo (114) | ui + lucide + `@/lib/faq` (✓) | stub→gerçek |
| `src/components/studio/SerpSocialPreview.tsx` | fabelo (117) | ui + lucide; **SITE_DOMAIN→domain prop** | stub→gerçek |
| `src/components/studio/RevisionHistoryDrawer.tsx` | fabelo (158) | ui + sonner + revizyon API (yeni) | stub→gerçek |
| `src/components/studio/MediaPickerModal.tsx` | fabelo (368) | ui + sonner + `/api/media` (✓) | stub→gerçek |
| `src/components/studio/MediaDetailDrawer.tsx` | fabelo (348) | ui + onayla/modal + sonner + `/api/media` | YENİ (dropzone'un dep'i) |
| `src/components/ui/image-upload-dropzone.tsx` | fabelo (405) | ui + MediaPicker/Detail + `/api/media` | stub→gerçek |

**Zaten var:** ui kit (②b-3-UI), lib/faq (②a), /api/media + /api/posts (②b-1), AyarKenari/editör (②b-3a).

---

## 4. Adaptasyonlar

- **SerpSocialPreview domain prop:** `@/lib/seo` (SITE/SITE_DOMAIN — panic-cms'te YOK,
  runtime yasak) yerine `domain` prop. AyarKenari zaten editörden domain almalı → editör
  (②b-3a) AyarKenari'ye `domain` geçer, AyarKenari SerpSocialPreview'e iletir. (②b-3a
  editörü domain'i server wrapper'dan prop olarak zaten tutuyor.)
- **Revizyon API:** `GET /api/posts/[id]/revisions` → withApiTenant sarmalı, getTenantDb
  ile o kiracının postRevisions'ından postId'ye ait satırları (tarih azalan) döner.
  Cross-tenant: id kiracıya özel (②b-1 deseni). Dönüş `{ revisions: [...] }`.
- **image-upload-dropzone:** stub yerine gerçek; yükleme `/api/media` POST (multipart),
  seçim MediaPickerModal, düzenleme MediaDetailDrawer.

---

## 5. Görev Ayrımı

- **T1 — Revizyon API:** `GET /api/posts/[id]/revisions` + test (kiracıya özel liste,
  cross-tenant 404, oturumsuz 401). ②b-1 deseni.
- **T2 — AeoScoreMeter gerçek:** stub→port (lib/faq ✓). Doğrulama: tsc + build.
- **T3 — SerpSocialPreview gerçek + domain prop:** stub→port; SITE_DOMAIN→domain;
  AyarKenari + editör domain iletimi. tsc + build.
- **T4 — RevisionHistoryDrawer gerçek:** stub→port (T1 API). tsc + build.
- **T5 — Medya:** MediaPickerModal + MediaDetailDrawer + gerçek image-upload-dropzone
  (stub→port). tsc + build.
- **T6 — Tarayıcı uçtan uca kanıtı:** editörde revizyon geçmişi listelenir (önce bir PUT
  ile revizyon üret), medya seçici açılır/listeler, SERP önizleme + AEO puanı render eder.
  `docs/KANIT-studio-drawerlar.md`.

---

## 6. Kanıt Ölçütü

Tarayıcıda (t1 oturumu): editörde bir yazıyı düzenle+kaydet (revizyon üretir) → Revisions
çekmecesi geçmişi gösterir (revizyon API 200). AyarKenari'de SERP önizleme domain'le
render eder, AEO puanı hesaplanır. Görsel yükleme alanı medya seçiciyi açar, /api/media
listesini gösterir. Stub kalanlar (ImageStudioDrawer/UrunSecici) hata vermez. tsc + build
+ tüm vitest yeşil.

---

## 7. Riskler

- **SerpSocialPreview SITE kullanımı:** SITE_DOMAIN dışında `SITE` (site adı) da
  kullanıyorsa domain'den türet ya da ikinci bir prop; port sırasında netleşir.
- **Medya bileşenleri büyük (368+348+405):** /api/media sözleşmesi (②b-1: GET `{media}`,
  POST `{media}`) fabelo beklentisiyle karşılaştırılır; uyumsuzsa client kontrolü uyarlanır
  (②b-3a'daki `data.success` dersı).
- **Revizyon authorName:** ②b-1 PUT session.email'i yazıyor; authorId eşleme YOK (ayrı borç).
