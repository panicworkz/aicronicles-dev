# ②b Editör/Studio'yu panic-cms'e Taşıma — Tasarım (Spec)

**Tarih:** 2026-09-17
**Alt-proje:** ②b (② "fabelo varlıklarını taşıma"nın ikinci parçası)
**Üst kararlar:** [2026-09-12-panic-cms-cok-kiracilik-mimari-kararlar.md](./2026-09-12-panic-cms-cok-kiracilik-mimari-kararlar.md)
**Önceki:** ①, ②a (içerik çekirdeği + styling) — GitHub'da, CI yeşil
**Durum:** Tasarım — kullanıcı incelemesi bekliyor

---

## 1. Amaç ve Kapsam

**Amaç:** fabelo'nun panelden **yazı/sayfa blok editörünü ve düzenleme studio'sunu**
panic-cms'e tenant-agnostik taşımak. ②a render'ı taşıdı (okuma); ②b düzenlemeyi
(yazma) taşır. Editör panel içinde (`<site>/panic`), tenant-scoped.

**Kapsam içi:**
- **Blok düzenleme çekirdeği:** blok-metin.ts (contentEditable/execCommand),
  blok-yuzeyi.ts (blok seçim/sürükleme/araç çubuğu). ②a'da bunlar STUB'tı;
  ②b gerçeğini koyar.
- **CanliOnizleme** düzenleme bağlantısı (②a'da render iskeleti var).
- **Editör studio bileşenleri:** AyarKenari, CanliTuval, FontSecici,
  KaynakDuzenleyici, MediaDetailDrawer, MediaPickerModal, RevisionHistoryDrawer,
  TaxonomyArticleDrawer, SerpSocialPreview, AeoScoreMeter.
- **Editör sayfaları:** panic/posts (liste) + posts/[id] (editör), panic/pages
  + pages/[id]. Yeni yazı/sayfa oluşturma, düzenleme, kaydetme, taslak/yayın.
- **API (CRUD, tenant-scoped):** posts, pages, media route'ları — getTenantDb.
- **Medya yönetimi:** yükleme + seçici (editör için), kiracı-başına depolama.
- **Revizyon:** postRevisions (②a-T1 şeması) — kaydet/geri al.

**Kapsam dışı (sonraki parçalar):**
- Ürün/mağaza studio: ProductSeoAeoSuite, ProductSpecificationsBuilder,
  UrunSecici, LiveRatesTicker → ②e
- Reklam yönetimi paneli → ②c
- Form/abonelik paneli → ②d
- Kontrol paneli (pw.panic.pw, süper-admin) → ⑥

**Kanıt kriteri:** t1 panelinde giriş → yeni yazı oluştur, blok ekle (metin,
başlık, görsel), kaydet (taslak+yayın), düzenle, önizle, revizyona geri dön;
medya yükle+seç; hepsi tenant-scoped (t2'nin içeriği görünmez). Kaydedilen
yazı ②a render'ında (public) doğru görünür.

---

## 2. Mimari: client-heavy editör + tenant-scoped API (②a'dan fark)

②a server-render'dı (getSiteConfig/getTenantDb withTenantRequest callback'inde).
②b **client-heavy**: blok editörü contentEditable ile TARAYICIDA çalışır.
Dolayısıyla:
- Editör bileşenleri `"use client"`; tenant-context'e (server-only AsyncLocalStorage)
  DOĞRUDAN erişemez.
- Editör veriyi **tenant-scoped API route'larından** alır/yazar (fetch). API
  route'ları Node runtime'da withTenantRequest ile tenant'ı çözer → getTenantDb.
- Yani izolasyon **API katmanında** zorlanır: her posts/pages/media route'u
  withTenantRequest sarmalı, kiracı DB'sine yazar. Client editör hangi kiracı
  olduğunu bilmez — API Host'tan çözer.
- **Güvenlik (kritik):** bir kiracının panelinden gelen yazma isteği, yalnızca
  o kiracının DB'sine gitmeli. API route Host→tenant çözümü + oturum kontrolü
  (②a auth: getSession tenant claim'i) birlikte. Çapraz-kiracı yazma imkânsız
  olmalı — ①'in T8 exploit'inin (cross-tenant) yazma tarafı.

---

## 3. Decompose (② çok büyük — alt-parçalara bölünür)

Her biri kendi plan+subagent-driven turu:

- **②b-1 — Editör API + panel çerçevesi:** posts/pages/media CRUD route'ları
  (tenant-scoped, withTenantRequest), panel layout + liste sayfaları
  (posts/pages), auth koruması. Kanıt: API'den t1 yazı oluştur/listele, t2 göremez.
- **②b-2 — Blok düzenleme çekirdeği:** blok-metin, blok-yuzeyi, CanliOnizleme
  düzenleme. En karmaşık/riskli parça (contentEditable). Kanıt: tarayıcıda blok
  ekle/düzenle/sırala.
- **②b-3 — Editör sayfaları + studio drawer'lar:** posts/[id]+pages/[id] editör
  sayfaları, AyarKenari/CanliTuval + drawer'lar (medya, revizyon, taksonomi,
  SEO önizleme, AEO). Kanıt: uçtan uca yazı oluştur→blok→kaydet→önizle→revizyon.

---

## 4. Riskler ve Açık Noktalar

- **contentEditable + Next 15 (②b-2):** blok-yuzeyi 1655 satır tarayıcı DOM
  manipülasyonu. Bir spike (①-T0 gibi) gerekebilir: contentEditable editör
  Next 15 client component'te çalışıyor mu, SSR/hydration sorunu var mı.
- **Medya depolama:** kiracı-başına klasör (K4 taşınabilirlik). Yükleme API'si
  hangi kiracıya yazacağını Host'tan çözmeli. fabelo yerel diske yazıyordu;
  panic-cms kiracı-başına dizin.
- **Cross-tenant yazma güvenliği:** en kritik — her yazma route'u tenant+oturum
  doğrulamalı. ②b-1'de test edilmeli (t1 oturumuyla t2'ye yazma reddedilmeli).
- **Auth kapsamı:** ① tenant-scoped login var; ②b panel sayfaları oturum
  gerektirir (getSession + tenant eşleşme). Süper-admin ⑥'da.
- **RevisionHistory:** postRevisions şeması ②a-T1'de taşındı; ②b yazma/okuma
  mantığını ekler.

---

## 5. Yürütme Notu

②b, ②a'dan büyük (3 alt-parça, her biri ①/②a-boyutunda subagent-driven tur).
Bu spec ②b'nin tamamını çerçeveler; her alt-parça (②b-1/2/3) kendi plan'ını
alır. En riskli ②b-2 (contentEditable) — bir spike ile başlamalı. Uygulama,
kullanıcı tempolu; oturum/rate-limit sınırları nedeniyle alt-parça alt-parça.
