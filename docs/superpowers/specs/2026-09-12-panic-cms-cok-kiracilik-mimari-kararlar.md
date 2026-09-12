# Panic CMS — Çok-Kiracılık Mimari Kararları

**Tarih:** 2026-09-12
**Durum:** Kararlaştırıldı (Model 1 uygulanacak; Model 2 belgelendi, sonraya bırakıldı)
**Bağlam:** fabelo.io için yapılmış tek-kiracı (single-tenant) CMS'i, birçok
markanın (aicronicles.com, sile.pw, meet.istanbul, …) arkasında çalışan
çok-siteli (multi-tenant) bir platforma dönüştürmek.

Bu doküman üst düzey mimari kararları tutar. Her alt-proje (①–⑦) kendi
ayrıntılı spec'ini alacak ve buraya referans verecek.

---

## 1. Hedef

- Tek Panic CMS çekirdeği, birçok sitenin arkasında.
- WordPress benzeri: **çekirdek güncellenince tüm siteler güncellensin.**
- Önce blog/magazine/newsletter/store kalıbı (fabelo mevcut şeması); zamanla
  etkinlik, rezervasyon, kurumsal firma gibi türler eklenecek (içerik modeli
  ileride esneyecek — YAGNI, ilk sürümde değil).
- İleride müşteriler de kendi sitelerinin paneline girecek → **katı veri
  izolasyonu baştan şart.**

---

## 2. Kararlar

### K1 — Veri izolasyonu: database-per-tenant
Her sitenin verisi kendi ayrı PostgreSQL veritabanında durur.

**Neden:** Müşteri izolasyonunu **koda değil altyapıya** dayandırır. Row-level
(`WHERE site_id`) modelinde unutulan tek bir filtre bir müşterinin verisini
diğerine sızdırır; müşteri senaryosunda bu kabul edilemez. Database-per-tenant'ta
o sınıf hata fiziksel olarak imkânsız.

**Bedeli:** Şema göçü (migration) her kiracı DB'sine uygulanmalı → alt-proje ③.

### K2 — İki katman: kontrol düzlemi + kiracı verisi
- **Kontrol DB'si (tek):** yalnızca yönlendirme ve kiracı listesi.
  `tenants` tablosu: domain → hangi DB, durum. **Sıfır içerik/iş verisi.**
- **Kiracı DB'si (site başına):** o sitenin bütün işi — yazı, sayfa, ürün,
  medya kaydı, ayar, kullanıcı.

**Kural:** Kontrol DB'si minimal kalır. Bir kiracının hiçbir verisi orada
durmaz. Bu, K4'teki taşınabilirliğin ön şartıdır.

### K3 — Tek çekirdek, iki modlu, tenant-agnostic
Tek kod tabanı. Kod hiçbir yerde belirli bir kiracıyı bilmez; kiracı kimliği
her zaman config/DB'den gelir. Bir ortam değişkeni modu seçer:
- `multi` (Model 1): kontrol DB'sinden `Host` başlığı → kiracı → DB çözülür.
  Bizim sunucumuzda, birçok kiracı.
- `single` (Model 2): tek kiracıya sabit, kontrol DB'si yok. Müşteri
  sunucusunda, tek kiracı.

Aynı image ikisini de çalıştırır. Bu, K4 geçişini ve Model 2'yi mümkün kılan
tasarımdır — ilk günden uygulanır (Model 1 için de en temiz olan bu).

### K4 — Kiracı = self-contained taşınabilir paket
Bir kiracının tamamı: kendi DB'si + kendi medya klasörü. Kontrol DB'sine
bağımlı içerik verisi yoktur. Böylece bir kiracı tek başına eksiksiz bir
sitedir ve sancısız taşınabilir (Model 1 ↔ Model 2).

### K5 — Kod dağıtımı: tek build → tüm siteler
Model 1'de tüm siteler aynı sunucuda tek container'da çalışır. Bir kez
`docker build` → tüm siteler aynı anda yeni sürümde. "Ayrı kurulum" YOKTUR.
Yeni site eklemek = boş DB oluştur + kontrol DB'sine bir satır ekle; dosya
kopyalama/ayrı deploy yok.

### K6 — Admin adresleri
- **Kiracı paneli:** her site kendi domain'i altında, `<site>/panic`
  (ör. `fabelo.io/panic`, `meet.istanbul/panic`). Kullanıcılar (`users`) o
  kiracının DB'sinde; oturum host-only cookie ile domain'e hapsli → izolasyon
  otomatik.
- **Kontrol paneli (süper-admin):** `pw.panic.pw`. Kontrol DB'sine bağlı;
  siteleri ekle/çıkar/domain bağla. Yalnızca platform sahibi girer.
- Panel yolu `/panic` kalır (marka görünür olması sorun değil kabul edildi).

### K7 — Hosting: Model 1 ana, Model 2 isteyene
- **Model 1 (SaaS, biz host ederiz)** — ana model, ilk sürüm. Tüm siteler
  bizim sunucumuzda. Müşteri yalnızca domain'ini yönlendirir (A kaydı / CNAME);
  SSL'i biz otomatik alırız (Let's Encrypt). Müşteri sunucusu yok.
- **Model 2 (self-hosted)** — isteyen müşteriye, SONRA. Aşağıda ayrı bölüm.

---

## 3. Model 2 — Self-hosted (GELECEK, alt-proje ⑦)

**Ne zaman:** Model 1 tamamen bitip testleri geçtikten SONRA geliştirilir,
yayına alınır, ayrıca test edilir. Model 1 tam oturmadan Model 2'ye geçilmez.

**Amaç:** Kurumsal müşteri "verim/sitem kendi sunucumda dursun" dediğinde net
çözüm. Ayrıca Model 1'de başlayıp sonra "her şeyi bana ver" diyen müşteri için
**sancısız geçiş.**

### Dağıtım ve güncelleme
- **Docker image ile dağıtım** (git pull + rebuild DEĞİL). Hazır image
  GitHub Container Registry'de (ghcr.io) yayınlanır. Müşteri sunucusu
  `docker pull panic-cms:vX && up -d` yapar. Atomik, ortamdan bağımsız,
  kırılmaz. (WordPress'in dosya-bazlı güncellemesinin kırılganlığından kaçınılır.)
- **Pull-based güncelleme** (push DEĞİL). Müşteri sunucusundaki CMS periyodik
  olarak "en son sürüm ne?" diye bize/registry'ye sorar. Yeni varsa panelde
  "Güncelleme mevcut → vX" gösterir; müşteri tıklar, çeker, yeniden başlar.
  (Müşteri sunucusu firewall arkasında olabilir; push güvenilmez, pull sağlam.)
- Müşteri sunucusundaki CMS `single` modda çalışır (K3): tek kiracı DB'si,
  kontrol DB'si yok.

### Sancısız geçiş (Model 1 → Model 2)
Müşteri "her şeyi bana ver" dediğinde, o site için:
1. Kiracının DB'sini dump al → müşteri sunucusuna aktar.
2. Aynı Docker image'ı `single` modda kur, o DB'ye bağla.
3. Medya klasörünü taşı.
4. Domain'i müşteri sunucusuna yönlendir (DNS).
5. Bizim taraftan kiracıyı çıkar (kontrol DB'sinden satırı sil).

Bunun sancısız olması K2 (kontrol DB'si içeriksiz) + K4 (kiracı self-contained)
sayesinde mümkündür. Ters geçiş (Model 2 → Model 1) de aynı adımların tersi.

### Açık sorular (⑦ tasarımında çözülecek)
- Repo/registry gizli mi, müşteri kaynağı görebilir mi? (Muhtemelen image
  gizli, kaynak paylaşılmaz.)
- Lisans/sürüm kontrolü: müşteri sunucusundaki CMS'in güncelleme yetkisi nasıl
  doğrulanır (abonelik bitince güncelleme kesilir mi)?
- Müşteri sunucusu asgari gereksinimleri (Docker, Postgres, kaynak).
- Medya taşıma otomasyonu.

---

## 4. Yol Haritası (alt-projeler)

Model 1:
- **① Çok-kiracılık temeli** — kontrol DB'si + `tenants`; `Host` → kiracı → DB
  çözümü; istek-kapsamlı DB bağlantısı; site kimliğini build-time'dan
  runtime'a taşıma (`NEXT_PUBLIC_SITE_URL` → kiracıdan); **fabelo.io'yu ilk
  kiracı olarak taşı.**
- **② İkinci kiracı + site kurma akışı** — yeni kiracı oluşturma aracı; gerçek
  ikinci siteyle doğrulama.
- **③ Göç (migration) yönetimi** — şema değişikliğini tüm kiracı DB'lerine
  güvenli uygulama; sürüm takibi; başarısız göç izolasyonu.
- **④ Kontrol paneli** (`pw.panic.pw`) — siteleri listele/ekle/çıkar, domain
  bağlama, SSL otomasyonu.

Sonra:
- **⑤ Kiracı-başına yetkilendirme** — müşteri erişimi, rol/izin modeli.
- **⑥ Esnek içerik türleri** — etkinlik/rezervasyon/kurumsal (YAGNI, çeşit
  artınca).
- **⑦ Model 2 (self-hosted)** — yukarıdaki bölüm. **Model 1 bitip test
  edilmeden başlanmaz.**

**Sıra kuralı:** ①→②→③→④ Model 1'i oluşturur ve test edilir. ⑦ ondan sonra.

### Yürütme ilkesi
① fabelo.io'yu (canlı site) taşıyacak. Doğrudan canlıda yapılmaz: önce
stage'de tam prova, geri dönüş noktası, sonra canlı. Mevcut çalışma düzeni bu.
