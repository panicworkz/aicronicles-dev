# Yayin ortamlari

Iki ortam, **tek imaj**: `panic-cms:v1.0` bir kez derlenir, ikisi de onu
calistirir. Boylece stage'de sinanan sey canliya cikanin ta kendisi olur —
"stage'de calisiyordu" durumu ortadan kalkar.

| | canli | stage |
|---|---|---|
| adres | fabelo.io | panic.panic.pw |
| port | 8230 | 8231 |
| veritabani | `panic_cms` | `panic_cms_stage` |
| medya | `/opt/panic/media` | `/opt/panic/media-stage` |
| arama motoru | acik | **kapali** (uc katman) |
| nginx onbellegi | 60 sn | yok |
| e-posta gecidi | acik | **kapali** |

## Neden ayri veritabani

Stage'de yapilan icerik denemeleri canliya sizmasin diye. **Yalnizca KOD
canliya gecer, icerik gecmez.** Stage veritabani gerektiginde canlinin
yedeginden yeniden doldurulur.

## Neden stage'de onbellek yok

Canlida nginx yanitlari 60 saniye tutuyor. Stage'de bu, yayinladigin
degisikligi gormemene ve "olmadi" sanmana yol aciyor. Burada `no-store`.

## Arama motorlarina kapali — uc katman

Birini atlamak yeterli oldugu icin uc tane:

1. `robots.txt` → `Disallow: /`
2. `X-Robots-Tag` basligi → `noindex, nofollow, noarchive, nosnippet, noimageindex`
3. `sitemap.xml` ve `sitemap-news.xml` → 404

Uygulamanin kendi meta etiketlerine GUVENILMIYOR: stage, fabelo.io ile ayni
kodu calistiriyor ve orada sayfalar dizine acik.

## Akis

```
gelistir  →  stage'e yayinla  →  panic.panic.pw'de sina  →  canliya al
```

Stage'e yayin:
    cd /opt/panic && git fetch && git reset --hard origin/<dal>
    docker compose build panic-cms && docker compose up -d panic-cms-stage

Canliya alma:
    docker compose up -d panic-cms && find /var/cache/nginx/fabelo -type f -delete

**Ayni anda tek derleme.** Ikisini cakistirmak konteyneri eski imajla
birakiyor; 8 Eylul'de iki kez yasandi. "Indi" demeden once konteynerin
ICINDEKI kaynagi dogrula:

    docker compose exec -T panic-cms grep -c '<yeni dize>' src/<dosya>
