#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PanicWorkz agindaki markalar icin Fabelo afisleri.

  Yerine         feature 940x180   yazi govdesi
  TurcoPartners  panel   511x300   ana sayfa yan kolonu
  WP Care        rail    387x540   kenar rayi

Ortak dil (AICall afisiyle ayni):
  - Kagit zemin, ust kural cizgisi, editoryel dizgi
  - Marka kilidi solda/ustte, cagri butonu en yuksek kontrastli oge
  - Perdeler maskeyle aciliyor, yumusatma expo.out
  - YALNIZCA transform ve opacity degisiyor; hicbiri yeniden yerlesim
    ya da boyama tetiklemiyor
  - En fazla iki yazi tipi, sistem fontlari (SVG bir <img> icinde
    acildigi icin web fontu yuklenmez)

DIKKAT — hicbir sayi iddiasi yok: fiyat, musteri sayisi, calisma suresi,
tasarruf orani. Dogrulayamadigimiz rakami afise koymuyoruz.
"""

import html
import pathlib

# Fabelo belirtecleri
KAGIT, KAGIT2 = "#fcfaf7", "#f1ede2"
MUREKKEP, IKINCIL, UCUNCUL, KURAL = "#15171a", "#4a4f57", "#8b9098", "#d9d3c6"

# --- Ortak ritim -------------------------------------------------------------
# Butun afisler ayni 2 saniyelik vurusa oturuyor ve her vurusta YALNIZCA
# BIR bolge degisiyor. Once boyle degildi: Yerine'de ozellik seridi 16
# saniyelik, kart degisimi 8 saniyelik ayri bir saatte donuyordu; ikisi
# hic ortusmedigi icin her an bir yerde bir sey oynuyor ve goz saga sola
# atliyordu. Tek izgara bunu bitiriyor.
VURUS = 2

SANS = "-apple-system, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
DISP = "Georgia, \"Times New Roman\", serif"


def temel_stil(sure: int, perde_sayisi: int) -> str:
    """Perde zamanlamalari — esit paylar, expo.out yumusatma."""
    adim = 100 / perde_sayisi
    p = []
    for i in range(perde_sayisi):
        b = i * adim
        a1, a2, a3, a4 = round(b + 2, 1), round(b + 8, 1), round(b + adim - 4, 1), round(b + adim - 1, 1)
        p.append(f".p{i}{{transform-origin:0 0;animation:p{i} {sure}s cubic-bezier(.16,1,.3,1) infinite}}")
        p.append(f".y{i}{{animation:y{i} {sure}s cubic-bezier(.16,1,.3,1) infinite}}")
        p.append(f"@keyframes p{i}{{0%,{a1}%{{transform:scaleX(0)}} {a2}%,{a3}%{{transform:scaleX(1)}} {a4}%,100%{{transform:scaleX(0)}}}}")
        p.append(f"@keyframes y{i}{{0%,{a1}%{{opacity:0;transform:translateY(14px)}} {a2}%,{a3}%{{opacity:1;transform:none}} {a4}%,100%{{opacity:0;transform:translateY(-10px)}}}}")
    return "\n    ".join(p)


def kabuk(w: int, h: int, etiket: str, baslik: str, stil: str, govde: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{etiket}">
  <title>{baslik}</title>
  <style>
    .disp {{ font-family: {DISP} }}
    .sans {{ font-family: {SANS} }}
{stil}
  </style>
  <defs>
    <linearGradient id="kagit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{KAGIT}"/><stop offset="100%" stop-color="{KAGIT2}"/>
    </linearGradient>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#kagit)"/>
  <rect x="0" y="0" width="{w}" height="3" fill="{MUREKKEP}"/>
{govde}
</svg>
'''


# ---------------------------------------------------------------- YERINE
def yerine() -> str:
    """940 x 180 — yazi govdesinin icinde.

    Sekiz ozellik, sekiz vurus, 16 saniye. Kart degisimi de AYNI
    izgarada: 3. vurusta yerli muadile geciyor, 7. vurusta geri
    donuyor. Boylece iki bagimsiz saat yok, tek ritim var."""
    w, h, K = 940, 180, 34
    A = "#f59e0b"

    ozellikler = [
        "Smart alternative search",
        "Transparent comparison",
        "Price history across sellers",
        "Real rating filter",
        "Domestic maker protection",
        "Smart price alerts",
        "Ad-free rankings",
        "Eight shopping categories",
    ]
    n = len(ozellikler)
    sure = n * VURUS          # 16 sn
    pay = 100 / n             # bir vurus = %12.5

    serit = "\n    ".join(
        f".o{i}{{animation:o{i} {sure}s cubic-bezier(.16,1,.3,1) infinite}}\n"
        f"    @keyframes o{i}{{0%,{i*pay:.2f}%{{opacity:0;transform:translateY(6px)}}"
        f" {i*pay+2:.2f}%,{(i+1)*pay-2:.2f}%{{opacity:1;transform:none}}"
        f" {(i+1)*pay:.2f}%,100%{{opacity:0;transform:translateY(-5px)}}}}"
        for i in range(n))

    # Kart olayi vurus izgarasinda: 3. vurusta gec, 7. vurusta don
    gec, don = 2 * pay, 6 * pay
    stil = f'''    {serit}

    /* Kart degisimi ozellik seridiyle AYNI saatte — vurus 3 ve vurus 7.
       transform-box: fill-box KULLANMIYORUZ; tarayicilar arasinda
       tutarsiz. Ogeler kendi gruplarinda. */
    .ustKart {{ animation: ustKart {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes ustKart {{ 0%,{gec:.2f}%{{opacity:1}} {gec+3:.2f}%,{don:.2f}%{{opacity:.24}} {don+3:.2f}%,100%{{opacity:1}} }}
    .altKart {{ animation: altKart {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes altKart {{ 0%,{gec:.2f}%{{opacity:0;transform:translateY(12px)}} {gec+3:.2f}%,{don:.2f}%{{opacity:1;transform:none}} {don+3:.2f}%,100%{{opacity:0;transform:translateY(12px)}} }}
    .ok {{ animation: ok {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes ok {{ 0%,{gec:.2f}%{{opacity:0}} {gec+3:.2f}%,{don:.2f}%{{opacity:1}} {don+3:.2f}%,100%{{opacity:0}} }}

    @media (prefers-reduced-motion: reduce) {{
      * {{ animation: none !important }}
      .o0 {{ opacity: 1; transform: none }}
      {",".join("."+f"o{i}" for i in range(1, n))} {{ opacity: 0 }}
      .ustKart {{ opacity: .24 }}
      .altKart,.ok {{ opacity: 1; transform: none }}
    }}'''

    seritler = "\n  ".join(
        f'<text class="sans o{i}" x="{K+14}" y="152" font-size="12.5" fill="{IKINCIL}">{html.escape(t)}</text>'
        for i, t in enumerate(ozellikler))

    govde = f'''  <text class="disp" x="{K}" y="46" font-size="21" fill="{MUREKKEP}" letter-spacing="-.4">Yerine<tspan fill="{A}">.</tspan></text>
  <text class="sans" x="{K+78}" y="44" font-size="9.5" letter-spacing="2.2" fill="{UCUNCUL}">SMART ALTERNATIVE FINDER</text>

  <text class="disp" x="{K}" y="96" font-size="34" fill="{MUREKKEP}" letter-spacing="-1">What you want,</text>
  <text class="disp" x="{K}" y="130" font-size="34" fill="{MUREKKEP}" letter-spacing="-1">for less.</text>

  <circle cx="{K+4}" cy="148" r="3" fill="{A}"/>
  {seritler}

  <g class="ustKart">
    <rect x="452" y="30" width="208" height="54" rx="8" fill="#ffffff" stroke="{KURAL}"/>
    <rect x="466" y="46" width="22" height="22" rx="4" fill="{KURAL}"/>
    <text class="sans" x="500" y="54" font-size="11" fill="{IKINCIL}">Imported original</text>
    <text class="sans" x="500" y="70" font-size="10" fill="{UCUNCUL}">premium price</text>
  </g>
  <g class="ok" fill="none" stroke="{A}" stroke-width="2" stroke-linecap="round">
    <path d="M556 90 v12"/><path d="M550 97 l6 6 l6 -6"/>
  </g>
  <g class="altKart">
    <rect x="452" y="110" width="208" height="54" rx="8" fill="#ffffff" stroke="{A}" stroke-width="1.5"/>
    <rect x="466" y="126" width="22" height="22" rx="4" fill="{A}"/>
    <text class="sans" x="500" y="134" font-size="11" font-weight="700" fill="{MUREKKEP}">Local equivalent</text>
    <text class="sans" x="500" y="150" font-size="10" fill="{IKINCIL}">same job, ranked honestly</text>
  </g>

  <rect x="{w-K-196}" y="{h//2-24}" width="196" height="48" rx="24" fill="{MUREKKEP}"/>
  <text class="sans" x="{w-K-98}" y="{h//2+5}" font-size="13.5" font-weight="700" fill="{KAGIT}" text-anchor="middle" letter-spacing=".3">Find the alternative →</text>'''

    return kabuk(w, h,
        "Yerine — find the local alternative that does the same job for less: smart search, transparent comparison, price history, real rating filter and ad-free rankings. yerine.com.tr",
        "Yerine — what you want, for less", stil, govde)


# --------------------------------------------------------- TURCO PARTNERS
def turco() -> str:
    """511 x 300 — ana sayfa yan kolonu.

    Iki tur once uc hizmet yaziyordu ve buton ucuncu satirin ustune
    biniyordu. Asil sorun sayilardaydi: site kendini "THE 7 CORE
    SERVICES" diye tanimliyor, uc madde bunun yarisini bile anlatmiyor.

    Simdi yedi hizmetin TAMAMI donuyor. Ustte "01 — 07" sayaci sabit
    duruyor, yani okuyan kisi bir hizmet gorse bile yedi tane oldugunu
    biliyor. Kucuk bir alanda hem genislik hem ayrinti veren yol bu.

    Hizmet adlari sitenin kendi basliklarindan cevrildi; hicbir metrik
    (GMV, cagri sayisi, hibe orani) alinmadi — dogrulayamadigimiz
    rakami afise koymuyoruz."""
    w, h, K = 511, 300, 32
    A = "#0f5132"
    IC = w - K * 2
    hizmetler = [
        ("Global e-export", "Amazon US market intelligence"),
        ("Geopolitical risk", "country analysis for investors"),
        ("US company setup", "law, trademark and incentives"),
        ("Voice AI", "autonomous call handling"),
        ("Process management", "CRM, WhatsApp and email"),
        ("E-commerce growth", "storefront and digital advertising"),
        ("B2B liquidity", "vertical marketplaces"),
    ]
    n = len(hizmetler)
    sure = n * VURUS   # 7 hizmet x 2 sn = 14 sn, vurus izgarasinda
    pay = 100 / n

    ad_stil = "\n    ".join(
        f".h{i}{{animation:h{i} {sure}s cubic-bezier(.16,1,.3,1) infinite}}\n"
        f"    @keyframes h{i}{{0%,{i*pay:.1f}%{{opacity:0;transform:translateY(10px)}}"
        f" {i*pay+3:.1f}%,{(i+1)*pay-3:.1f}%{{opacity:1;transform:none}}"
        f" {(i+1)*pay:.1f}%,100%{{opacity:0;transform:translateY(-8px)}}}}"
        for i in range(n))

    stil = f'''    .bas {{ transform-origin:0 0; animation: bas {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes bas {{ 0%,1%{{transform:scaleX(0)}} 8%,96%{{transform:scaleX(1)}} 100%{{transform:scaleX(0)}} }}
    {ad_stil}

    @media (prefers-reduced-motion: reduce) {{
      * {{ animation: none !important }}
      .h0 {{ opacity: 1; transform: none }}
      .h1,.h2,.h3,.h4,.h5,.h6 {{ opacity: 0 }}
    }}'''

    # Donen hizmet blogu: buyuk numara + iki satir.
    # Onceki surumdeki nokta siralayici kaldirildi — amator duruyordu ve
    # yedi ayri sonsuz animasyon daha demekti.
    bloklar = "\n  ".join(f'''<g class="h{i}">
    <text class="disp" x="{K}" y="192" font-size="40" fill="{A}" letter-spacing="-1">{i+1:02d}</text>
    <text class="sans" x="{K+62}" y="178" font-size="16" font-weight="700" fill="{MUREKKEP}">{html.escape(ad)}</text>
    <text class="sans" x="{K+62}" y="197" font-size="12.5" fill="{IKINCIL}">{html.escape(alt)}</text>
  </g>''' for i, (ad, alt) in enumerate(hizmetler))

    govde = f'''  <text class="sans" x="{K}" y="42" font-size="9.5" letter-spacing="2.4" fill="{A}">§ TURCOPARTNERS</text>
  <text class="sans" x="{w-K}" y="42" font-size="9.5" letter-spacing="2.4" fill="{UCUNCUL}" text-anchor="end">SEVEN CORE SERVICES</text>

  <text class="disp" x="{K}" y="92" font-size="36" fill="{MUREKKEP}" letter-spacing="-1.1">Istanbul to the US.</text>
  <rect x="{K}" y="112" width="{IC}" height="1" fill="{KURAL}"/>
  <text class="sans" x="{K}" y="136" font-size="12.5" fill="{IKINCIL}">One desk for the whole crossing —</text>

  {bloklar}

  <rect x="{K}" y="238" width="{IC}" height="44" rx="22" fill="{MUREKKEP}"/>
  <text class="sans" x="{w//2}" y="266" font-size="13.5" font-weight="700" fill="{KAGIT}" text-anchor="middle" letter-spacing=".3">Explore all seven →</text>'''

    return kabuk(w, h,
        "TurcoPartners — seven services for selling from Turkey into the US: e-export, geopolitical risk, company setup, voice AI, process management, e-commerce growth and B2B liquidity. turcopartners.com",
        "TurcoPartners — Istanbul to the US", stil, govde)


# ---------------------------------------------------------------- WP CARE
def wpcare() -> str:
    """387 x 540 — kenar rayi, dikey.

    Onceki iki surumun kusurlari:
      1. Sahte tarayici penceresi dergi sayfasinda ucuz duruyordu.
      2. Ilerleme cubugu kartin disina tasiyordu — .tara sinifinda
         transform-origin:0 0 vardi; SVG'de bu ogenin kendi sol kenarini
         DEGIL tuvalin sol kenarini gosterir.
      3. Bes madde yaziyordum, biri ("A person who answers you") sitede
         hic gecmiyordu. Sitenin hizmet sayfasi DOKUZ hizmet sayiyor.

    Simdi dokuzunun tamami, sitenin kendi adlariyla, sirayla
    isaretleniyor. 540 piksellik ray bunun icin bicilmis kaftan: liste
    dikey alani gercekten kullaniyor.

    Metrik yok — sitedeki "300+ startup" gibi rakamlar reklamverenin
    kendi iddiasi, dogrulayamadigimiz icin afise almadik."""
    w, h, K = 387, 540, 28
    A, YESIL = "#ff6b6b", "#0f8a5f"
    IC = w - K * 2

    # Adlar wpcare.pw/en/services sayfasindan, birebir
    hizmetler = [
        "Update management",
        "Automated backups",
        "Firewall protection",
        "Uptime monitoring",
        "Performance optimization",
        "Technical SEO",
        "Email deliverability",
        "Support SLA",
        "Cookie management",
    ]
    n = len(hizmetler)
    sure = n * VURUS   # 9 hizmet x 2 sn = 18 sn, ortak vurus izgarasinda

    madde_stil = "\n    ".join(
        f".k{i}{{animation:k{i} {sure}s cubic-bezier(.16,1,.3,1) infinite}}\n"
        f"    @keyframes k{i}{{0%,{8+i*4.5:.1f}%{{opacity:0;transform:translateX(-9px)}}"
        f" {14+i*4.5:.1f}%,93%{{opacity:1;transform:none}} 98%,100%{{opacity:0;transform:translateX(-5px)}}}}"
        for i in range(n))

    stil = f'''    .bas {{ transform-origin:0 0; animation: bas {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes bas {{ 0%,1%{{transform:scaleX(0)}} 9%,95%{{transform:scaleX(1)}} 100%{{transform:scaleX(0)}} }}
    {madde_stil}

    /* Sayac: liste doldukça ilerler, dokuzda durur */
    .sayac {{ animation: sayac {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes sayac {{ 0%,10%{{opacity:0}} 16%,93%{{opacity:1}} 98%,100%{{opacity:0}} }}

    @media (prefers-reduced-motion: reduce) {{
      * {{ animation: none !important }}
      {",".join("."+f"k{i}" for i in range(n))} {{ opacity: 1; transform: none }}
      .sayac {{ opacity: 1 }}
    }}'''

    # Dokuz madde, 29px araliklarla 208'den basliyor -> 208..440
    liste = "\n  ".join(f'''<g class="k{i}">
    <g transform="translate({K+8} {204+i*29})" fill="none" stroke="{YESIL}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle r="7.5" stroke-opacity=".28"/><path d="M-3.2 0 l2.4 2.8 l4.8 -5.6"/>
    </g>
    <text class="sans" x="{K+28}" y="{208+i*29}" font-size="12.5" fill="{MUREKKEP}">{html.escape(m)}</text>
  </g>''' for i, m in enumerate(hizmetler))

    govde = f'''  <text class="disp" x="{K}" y="62" font-size="28" fill="{MUREKKEP}" letter-spacing="-.6">WP Care<tspan fill="{A}">.</tspan></text>
  <text class="sans" x="{K}" y="84" font-size="9.5" letter-spacing="2.2" fill="{UCUNCUL}">WORDPRESS CARE PLANS</text>
  <rect x="{K}" y="100" width="{IC}" height="1" fill="{KURAL}"/>

  <text class="disp" x="{K}" y="140" font-size="30" fill="{MUREKKEP}" letter-spacing="-.9">Nine things we</text>
  <text class="disp" x="{K}" y="172" font-size="30" fill="{MUREKKEP}" letter-spacing="-.9">watch for you.</text>

  {liste}

  <!-- Sayac: kac hizmetin dahil oldugu her an gorunur -->
  <text class="sans sayac" x="{w-K}" y="84" font-size="9.5" letter-spacing="2.2" fill="{YESIL}" text-anchor="end">09 / 09</text>

  <rect x="{K}" y="{h-K-48}" width="{IC}" height="48" rx="24" fill="{MUREKKEP}"/>
  <text class="sans" x="{w//2}" y="{h-K-18}" font-size="14" font-weight="700" fill="{KAGIT}" text-anchor="middle" letter-spacing=".3">See the care plans →</text>'''

    return kabuk(w, h,
        "WP Care — nine WordPress care services: update management, automated backups, firewall protection, uptime monitoring, performance optimization, technical SEO, email deliverability, support SLA and cookie management. wpcare.pw",
        "WP Care — nine things we watch for you", stil, govde)


AFISLER = {
    "yerine-feature": yerine,
    "turco-panel": turco,
    "wpcare-rail": wpcare,
}

if __name__ == "__main__":
    import sys
    hedef = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    hedef.mkdir(parents=True, exist_ok=True)
    for ad, uret in AFISLER.items():
        yol = hedef / f"{ad}.svg"
        yol.write_text(uret(), encoding="utf-8")
        print(f"  {ad}.svg  ({yol.stat().st_size/1024:.1f} KB)")
