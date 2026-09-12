# ① Çok-Kiracılık Çekirdek İskeleti — Tasarım (Spec)

**Tarih:** 2026-09-12
**Alt-proje:** ① (yol haritasının ilk parçası)
**Üst doküman:** [2026-09-12-panic-cms-cok-kiracilik-mimari-kararlar.md](./2026-09-12-panic-cms-cok-kiracilik-mimari-kararlar.md)
**Durum:** Tasarım — kullanıcı incelemesi bekliyor

---

## 1. Amaç ve Kapsam

**Amaç:** Yeni `panic-cms` reposunda, multi-tenancy'nin birinci-sınıf olduğu,
uçtan uca çalışan **minimal ama doğru** bir çekirdek iskelet kurmak. fabelo
henüz taşınmaz; temelin sağlam olduğu iki örnek kiracıyla kanıtlanır.

**Kapsam içi:**
- `panic-cms` repo kurulumu (Next.js 15, React 19, Drizzle, PostgreSQL, TS, Tailwind)
- Kontrol DB'si + `tenants` şeması (Drizzle Kit ile)
- Tenant resolver: `Host` → kiracı → DB
- Tenant-context DB erişimi (AsyncLocalStorage, açık mimari)
- Çalışma-anı konfigürasyon (site kimliği tenant'tan; build-time SITE yok)
- Tenant-scoped auth iskeleti (giriş, oturum, host-only cookie)
- İki örnek kiracı ile uçtan uca kanıt
- Minimal git-CI/CD iskeleti (image derleme; tam registry akışı ⑤/⑥'da olgunlaşır)

**Kapsam dışı (sonraki alt-projeler):**
- fabelo Drizzle şeması ve bileşenlerinin taşınması → ②
- fabelo canlı verisinin migrate'i → ③
- Yeni kiracı oluşturma aracı/akışı → ④
- Çok-DB göç orkestrasyonu (tüm kiracılara uygulama) → ⑤
- Kontrol paneli UI (`pw.panic.pw`) → ⑥
- Gerçek içerik, gerçek tema, gerçek mağaza

**Kanıt — iki kademeli:**

- **Kademe 1 (①'in kendi kanıtı, geçici/atılabilir):** İki *boş/minimal*
  geçici kiracı (`t1.localhost`, `t2.localhost`) ile yalnızca boru hattı
  doğrulanır: iki domain doğru DB'ye gider, biri diğerinin verisini göremez,
  tenant context yoksa sorgu hata verir, giriş domain'e hapslidir. fabelo
  şeması/verisi YOK — sadece "iskelet ayakta mı". Bu, fabelo'yu hiç riske
  atmadan temeli doğrular. Geçici kiracılar sonra atılır.
- **Kademe 2 (gerçek kanıt, hedef):** ②(fabelo şema+bileşen) ve ③(fabelo veri
  migrate) sonrası **fabelo tüm güncel içeriğiyle kiracı 1** olarak çalışır;
  ④'te **meet.istanbul kiracı 2** olarak eklenir (meet.istanbul şu an
  statik/dummy; içeriği ④'te birkaç mantıklı örnekle kurulur — ayrıca
  konuşulacak). Gerçek-site doğrulaması burada yapılır.

Bu spec (①) yalnızca Kademe 1'i kapsar; Kademe 2 ②→④'e aittir.

---

## 2. Mimari Genel Bakış

İki düzlem (K2):
- **Kontrol düzlemi:** tek `panic_control` DB'si. Yalnızca `tenants` (domain →
  DB adı, durum) ve ilerideki platform metaverisi. Sıfır içerik.
- **Kiracı düzlemi:** her site kendi DB'si (`tenant_<slug>`). O sitenin tüm işi.

İstek yaşam döngüsü:

```
İstek (Host: demo-a.localhost)
  │
  ▼
middleware (Edge) — Host'u okur, x-tenant-host header'ına koyar
  │                  (Edge'de DB YOK; yalnızca başlık taşır)
  ▼
Node runtime — tenant context kurulumu:
  1. x-tenant-host → tenant map cache'ine bak
  2. cache miss ise panic_control.tenants sorgusu, cache'e yaz
  3. tenant bulunamazsa → 404 (bilinmeyen domain)
  4. tenant.dbName için kiracı havuzunu (pool cache) al/oluştur
  5. AsyncLocalStorage'a { tenant, db } koy
  │
  ▼
Sayfa/route — import { db } ... db sorgu anında context'ten doğru havuzu okur
  │            context yoksa FIRLATIR (fail-safe, sızıntı değil)
  ▼
Render — site kimliği (url, ayarlar) da context'ten
```

---

## 3. Bileşenler

### 3.1 Proje iskeleti + teknoloji
Yeni repo `~/Documents/dev-pw/panic-cms`. Next.js 15 App Router, React 19,
TypeScript, Tailwind, Drizzle ORM + `pg`, Drizzle Kit (göç), Docker.
**Sorumluluk:** temel proje; hiçbir tek-kiracı kısayolu içermez (K8).

### 3.2 Kontrol DB + `tenants` şeması
`panic_control` DB'si, Drizzle Kit ile yönetilir.

`tenants` tablosu (ilk taslak):
| alan | tip | not |
|---|---|---|
| id | uuid pk | |
| slug | text unique | DB adı türetimi: `tenant_<slug>` |
| primary_domain | text unique | ör. `demo-a.localhost` |
| db_name | text unique | kiracı DB adı |
| status | text | `active` / `suspended` / `provisioning` |
| created_at | timestamptz | |

İkincil domainler (www, alan takma adları) için ilerde `tenant_domains`
tablosu; ① için `primary_domain` yeter (YAGNI).

**Sorumluluk:** domain → hangi kiracı, hangi DB. Başka hiçbir şey.

### 3.3 Tenant resolver (`Host` → kiracı → DB)
- **Edge parçası (middleware):** yalnızca `Host` başlığını normalize edip
  `x-tenant-host` olarak geçirir. DB'ye dokunmaz.
- **Node parçası (`resolveTenant`):** `x-tenant-host` → bellek cache → (miss)
  `panic_control` sorgusu. Bulunamazsa 404. Cache: `Map<host, tenant>` + kısa
  TTL (ör. 60 sn) ya da açık invalidation (kontrol paneli değişiklik yapınca).
  ① için TTL yeterli.

**Bağımlılık:** kontrol DB. **Arayüz:** `resolveTenant(host): Promise<Tenant | null>`.

### 3.4 Tenant-context DB erişimi
AsyncLocalStorage tabanlı, **açık mimari** (gizli sihir değil, K3):
- `runWithTenant(tenant, fn)` — context'i kurar, `fn`'i içinde çalıştırır.
- `getTenantDb()` — context'ten { db } döndürür; context YOKSA fırlatır.
- `db` proxy'si: `import { db }` uyumu için — sorgu anında `getTenantDb()`'yi
  çağırır. Böylece taşınacak fabelo kodu `import { db }` yazımını korur ama
  arkada her zaman tenant-scoped olur.
- **Havuz cache'i:** `Map<dbName, DrizzleInstance>`. Kiracı başına tek havuz,
  yeniden kullanılır.

**Kritik güvenlik:** context olmadan sorgu = hata. Bir kod yolu tenant
kurmadan DB'ye giderse sessizce yanlış veriye değil, gürültülü hataya düşer.

### 3.5 Çalışma-anı konfigürasyon
Build-time `NEXT_PUBLIC_SITE_URL` **yok** (K3). Site kimliği tenant'tan:
- `getSiteConfig()` — context'teki tenant'tan { url, domain, ayarlar }.
- `seo.ts`, sitemap, robots, canonical hepsi bunu okur.
- Kiracı ayarları (tema, font, mağaza açık/kapalı) kiracı DB'sindeki
  `settings` tablosunda; ① için minimal (url/domain yeter, gerisi ②'de gelir).

### 3.6 Tenant-scoped auth iskeleti
- `users` tablosu **kiracı DB'sinde** (her sitenin kendi kullanıcıları).
- Giriş: `<site>/panic/login` → o kiracının DB'sinde doğrulama (bcrypt).
- Oturum: JWT (jose), host-only cookie → domain'e hapsli.
- `getSession()` context'teki kiracı DB'sinden okur.
- **Süper-admin (kontrol paneli) auth'u ① kapsamı DIŞINDA** — ⑥'da.

### 3.7 Geçici iskelet kiracıları (Kademe 1 kanıtı)
İki *geçici/atılabilir* kiracı seed'i: `t1.localhost` ve `t2.localhost`, her
biri kendi DB'sinde birer minimal sayfa + birer kullanıcı. Amaç yalnızca boru
hattını kanıtlamak; fabelo şeması/içeriği YOK. Yerel `*.localhost` çözümü ile
test. İskelet kanıtlanınca atılabilir. Gerçek kanıt kiracıları (fabelo,
meet.istanbul) ②→④'te devreye girer. Senaryolar için bkz. §7.

---

## 4. Dizin Yapısı (ilk taslak)

```
panic-cms/
  src/
    app/
      (site)/            # kiracı yüzü (public site) — ① minimal
      panic/             # kiracı paneli (login + iskelet)
    core/
      tenant/
        resolve.ts       # resolveTenant(host)
        context.ts       # runWithTenant, getTenantDb, db proxy
        pools.ts         # havuz cache
      config/
        site.ts          # getSiteConfig (runtime)
      auth/
        session.ts       # JWT, cookie, getSession
    db/
      control/           # kontrol DB şeması + Drizzle Kit config
      tenant/            # kiracı DB şeması (① minimal; ②'de fabelo şeması)
    middleware.ts        # Host → x-tenant-host
  drizzle/               # göç dosyaları (Drizzle Kit)
  docker/                # Dockerfile, compose (dev)
  .github/workflows/     # CI iskeleti (image build)
```

`core/` ayrımı bilinçli: tenant/config/auth çekirdeği, uygulama kodundan
(app/) izole, tek sorumluluklu ve bağımsız test edilebilir birimler.

---

## 5. Migration Yaklaşımı (Drizzle Kit)

- Kontrol DB ve kiracı DB **ayrı şema tanımları**, ayrı Drizzle Kit config.
- Kiracı göçleri sürümlü; her kiracı DB'sinin sürümü takip edilir (③/⑤'te
  orkestrasyon). ① için: tek kiracı şeması + göçü tek DB'ye uygulama yeter,
  ama yapı çok-DB'ye hazır kurulur (elle SQL yok).

## 6. Deploy (① için minimal)

- Dockerfile (tek image, iki modu K3 ortam değişkeniyle destekleyecek şekilde
  ama ① yalnızca `multi` modu çalıştırır).
- `.github/workflows` CI iskeleti: derleme + (ilerde) ghcr.io push. ① için
  image'ın derlenmesi ve yerel/dev'de koşması yeter; tam registry + prod
  cutover ⑥ ve ③'te olgunlaşır.

---

## 7. Test / Kanıt Kriteri

Uçtan uca kanıt senaryoları (① biterken, geçici kiracılarla geçmeli):
1. `t1.localhost` → 1'in içeriği; `t2.localhost` → 2'nin içeriği.
2. t1 panelinde giriş yapan kullanıcı t2 paneline geçemez (host-only cookie).
3. Tenant kurulmadan bir DB sorgusu çağrılırsa → hata (fail-safe doğrulaması).
4. Bilinmeyen domain (`nope.localhost`) → 404.
5. `seo.ts`/sitemap/robots t1 ve t2 için farklı, doğru domaini basar (runtime
   config doğrulaması).

(Gerçek-site doğrulaması — fabelo + meet.istanbul — Kademe 2'de, ②→④.)

Birim testleri: `resolveTenant`, havuz cache, context fail-safe, `getSiteConfig`.

---

## 8. Riskler ve Açık Noktalar

- **AsyncLocalStorage + Next.js 15:** Next'in kendi request context'iyle
  uyum; Server Components / route handler / server action üçünde de context'in
  taşındığı doğrulanmalı. (Erken bir spike ile sınanabilir.)
- **Havuz sayısı:** çok kiracıda çok havuz → bağlantı tükenmesi. ① için sorun
  değil (2 kiracı); ölçekte PgBouncer / lazy-close değerlendirilir (sonra).
- **`*.localhost` çözümü:** yerel geliştirmede alt-domain çözümü; gerekirse
  `/etc/hosts` veya dnsmasq. Dev-only.
- **Kontrol DB cache invalidation:** ① TTL ile; kontrol paneli (⑥) gelince
  açık invalidation eklenir.
