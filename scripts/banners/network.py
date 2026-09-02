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

import pathlib

# Fabelo belirtecleri
KAGIT, KAGIT2 = "#fcfaf7", "#f1ede2"
MUREKKEP, IKINCIL, UCUNCUL, KURAL = "#15171a", "#4a4f57", "#8b9098", "#d9d3c6"

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
    """940 x 180 — yazi govdesinin icinde, sakin.

    Marka fikri: pahali ithal markanin yerine ayni isi goren yerli
    muadili. Afisin yasayan ogesi bunu birebir canlandiriyor: ustteki
    kart soluyor, alttaki yerine geciyor."""
    w, h, K = 940, 180, 34
    A = "#f59e0b"   # markanin kehribar vurgusu
    sure = 10

    stil = temel_stil(sure, 2) + f'''
    /* Kart degisimi: "yerine" fikrinin kendisi.
       transform-box: fill-box KULLANMIYORUZ; tarayicilar arasinda
       tutarsiz. Ogeler kendi gruplarinda, orijinleri merkezlerinde. */
    .ustKart {{ animation: ustKart {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes ustKart {{ 0%,10%{{opacity:1;transform:none}} 26%,72%{{opacity:.28;transform:translateY(-6px)}} 88%,100%{{opacity:1;transform:none}} }}
    .altKart {{ animation: altKart {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes altKart {{ 0%,12%{{opacity:0;transform:translateY(16px)}} 28%,72%{{opacity:1;transform:none}} 88%,100%{{opacity:0;transform:translateY(16px)}} }}
    .ok {{ animation: ok {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes ok {{ 0%,14%{{opacity:0;transform:translateY(-8px)}} 30%,70%{{opacity:1;transform:none}} 86%,100%{{opacity:0;transform:translateY(-8px)}} }}

    @media (prefers-reduced-motion: reduce) {{
      * {{ animation: none !important }}
      .p0 {{ transform: scaleX(0) }} .p1 {{ transform: scaleX(1) }}
      .y0 {{ opacity: 0 }} .y1 {{ opacity: 1; transform: none }}
      .ustKart {{ opacity: .28 }} .altKart,.ok {{ opacity: 1; transform: none }}
    }}'''

    govde = f'''  <clipPath id="m0"><rect class="p0" x="{K}" y="46" width="380" height="92"/></clipPath>
  <clipPath id="m1"><rect class="p1" x="{K}" y="46" width="380" height="92"/></clipPath>

  <text class="disp" x="{K}" y="46" font-size="21" fill="{MUREKKEP}" letter-spacing="-.4">Yerine<tspan fill="{A}">.</tspan></text>
  <text class="sans" x="{K + 78}" y="44" font-size="9.5" letter-spacing="2.2" fill="{UCUNCUL}">ALTERNATIVE PRODUCT GUIDE</text>

  <g clip-path="url(#m0)">
    <text class="disp y0" x="{K}" y="94" font-size="34" fill="{MUREKKEP}" letter-spacing="-1">Same job.</text>
    <text class="disp y0" x="{K}" y="128" font-size="34" fill="{MUREKKEP}" letter-spacing="-1">Less money.</text>
  </g>
  <g clip-path="url(#m1)">
    <text class="disp y1" x="{K}" y="94" font-size="30" fill="{MUREKKEP}" letter-spacing="-.9">Find the local</text>
    <text class="disp y1" x="{K}" y="126" font-size="30" fill="{MUREKKEP}" letter-spacing="-.9">equivalent.</text>
  </g>

  <!-- Yasayan oge: ithal karti soluyor, muadili yerine geciyor -->
  <g class="ustKart">
    <rect x="470" y="34" width="230" height="52" rx="8" fill="#ffffff" stroke="{KURAL}"/>
    <rect x="484" y="50" width="20" height="20" rx="4" fill="{KURAL}"/>
    <text class="sans" x="516" y="58" font-size="11" fill="{IKINCIL}">Imported brand</text>
    <text class="sans" x="516" y="73" font-size="10" fill="{UCUNCUL}">premium price</text>
  </g>
  <g class="ok" fill="none" stroke="{A}" stroke-width="2" stroke-linecap="round">
    <path d="M585 92 v14"/><path d="M579 100 l6 6 6 -6"/>
  </g>
  <g class="altKart">
    <rect x="470" y="112" width="230" height="52" rx="8" fill="#ffffff" stroke="{A}" stroke-width="1.5"/>
    <rect x="484" y="128" width="20" height="20" rx="4" fill="{A}"/>
    <text class="sans" x="516" y="136" font-size="11" font-weight="700" fill="{MUREKKEP}">Local equivalent</text>
    <text class="sans" x="516" y="151" font-size="10" fill="{IKINCIL}">same function</text>
  </g>

  <rect x="{w-K-186}" y="{h//2-23}" width="186" height="46" rx="23" fill="{MUREKKEP}"/>
  <text class="sans" x="{w-K-93}" y="{h//2+5}" font-size="13.5" font-weight="700" fill="{KAGIT}" text-anchor="middle" letter-spacing=".3">Compare now →</text>'''

    return kabuk(w, h, "Yerine — find the local equivalent that does the same job for less. yerine.com.tr",
                 "Yerine — same job, less money", stil, govde)


# --------------------------------------------------------- TURCO PARTNERS
def turco() -> str:
    """511 x 300 — ana sayfa yan kolonu, dikeye yakin.

    Marka fikri: Turkiye'den ABD pazarina acilma. Yasayan oge iki nokta
    arasinda cizilen rota."""
    w, h, K = 511, 300, 32
    A = "#121212"
    sure = 10

    stil = temel_stil(sure, 2) + f'''
    /* Rota soldan saga ciziliyor — pazara acilma */
    .rota {{ stroke-dasharray: 300; animation: rota {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes rota {{ 0%,6%{{stroke-dashoffset:300}} 34%,92%{{stroke-dashoffset:0}} 100%{{stroke-dashoffset:300}} }}
    .varis {{ animation: varis {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes varis {{ 0%,32%{{opacity:0;transform:scale(.4)}} 40%,92%{{opacity:1;transform:none}} 100%{{opacity:0;transform:scale(.4)}} }}

    @media (prefers-reduced-motion: reduce) {{
      * {{ animation: none !important }}
      .p0 {{ transform: scaleX(0) }} .p1 {{ transform: scaleX(1) }}
      .y0 {{ opacity: 0 }} .y1 {{ opacity: 1; transform: none }}
      .rota {{ stroke-dashoffset: 0 }} .varis {{ opacity: 1; transform: none }}
    }}'''

    govde = f'''  <clipPath id="m0"><rect class="p0" x="{K}" y="96" width="{w-K*2}" height="96"/></clipPath>
  <clipPath id="m1"><rect class="p1" x="{K}" y="96" width="{w-K*2}" height="96"/></clipPath>

  <text class="disp" x="{K}" y="56" font-size="22" fill="{MUREKKEP}" letter-spacing="-.4">TurcoPartners</text>
  <text class="sans" x="{K}" y="76" font-size="9.5" letter-spacing="2.2" fill="{UCUNCUL}">GLOBAL E-EXPORT &amp; MARKET INTELLIGENCE</text>

  <g clip-path="url(#m0)">
    <text class="disp y0" x="{K}" y="140" font-size="34" fill="{MUREKKEP}" letter-spacing="-1">Sell into</text>
    <text class="disp y0" x="{K}" y="176" font-size="34" fill="{MUREKKEP}" letter-spacing="-1">the US market.</text>
  </g>
  <g clip-path="url(#m1)">
    <text class="disp y1" x="{K}" y="140" font-size="30" fill="{MUREKKEP}" letter-spacing="-.9">Company setup,</text>
    <text class="disp y1" x="{K}" y="172" font-size="30" fill="{MUREKKEP}" letter-spacing="-.9">logistics, data.</text>
  </g>

  <!-- Rota: cikis noktasindan varis noktasina -->
  <g transform="translate(0 214)">
    <circle cx="{K+5}" cy="0" r="5" fill="{A}"/>
    <path class="rota" d="M{K+14} 0 C {K+110} -26, {w-K-120} 26, {w-K-16} 0"
          fill="none" stroke="{UCUNCUL}" stroke-width="1.6" stroke-linecap="round"/>
    <g class="varis" transform="translate({w-K-5} 0)">
      <circle r="7" fill="none" stroke="{A}" stroke-width="1.6"/>
      <circle r="3" fill="{A}"/>
    </g>
  </g>

  <rect x="{K}" y="{h-K-46}" width="{w-K*2}" height="46" rx="23" fill="{MUREKKEP}"/>
  <text class="sans" x="{w//2}" y="{h-K-17}" font-size="13.5" font-weight="700" fill="{KAGIT}" text-anchor="middle" letter-spacing=".3">Explore the ecosystem →</text>'''

    return kabuk(w, h, "TurcoPartners — global e-export, US company setup and market intelligence. turcopartners.com",
                 "TurcoPartners — sell into the US market", stil, govde)


# ---------------------------------------------------------------- WP CARE
def wpcare() -> str:
    """387 x 540 — kenar rayi, dikey.

    Marka fikri: WordPress bakim planlari. Uc perde, uc hizmet; her
    perdede ilgili isaret ciziliyor."""
    w, h, K = 387, 540, 30
    A, YESIL = "#ff6b6b", "#00d084"
    sure = 12

    stil = temel_stil(sure, 3) + f'''
    /* Her perdenin isareti kendi zamaninda ciziliyor */
    .i0 {{ animation: i0 {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    .i1 {{ animation: i1 {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    .i2 {{ animation: i2 {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes i0 {{ 0%,3%{{opacity:0;transform:scale(.8)}} 10%,29%{{opacity:1;transform:none}} 33%,100%{{opacity:0}} }}
    @keyframes i1 {{ 0%,36%{{opacity:0;transform:scale(.8)}} 43%,62%{{opacity:1;transform:none}} 66%,100%{{opacity:0}} }}
    @keyframes i2 {{ 0%,69%{{opacity:0;transform:scale(.8)}} 76%,95%{{opacity:1;transform:none}} 99%,100%{{opacity:0}} }}

    @media (prefers-reduced-motion: reduce) {{
      * {{ animation: none !important }}
      .p0,.p1 {{ transform: scaleX(0) }} .p2 {{ transform: scaleX(1) }}
      .y0,.y1,.i0,.i1 {{ opacity: 0 }}
      .y2,.i2 {{ opacity: 1; transform: none }}
    }}'''

    perdeler = [
        ("Maintenance.", "Updates, plugins and", "themes kept current."),
        ("Backups.", "Restorable copies,", "off your server."),
        ("Security.", "Hardening, monitoring", "and clean-up."),
    ]
    maske = "\n  ".join(
        f'<clipPath id="m{i}"><rect class="p{i}" x="{K}" y="252" width="{w-K*2}" height="132"/></clipPath>'
        for i in range(3))
    metin = "\n  ".join(
        f'''<g clip-path="url(#m{i})">
    <text class="disp y{i}" x="{K}" y="296" font-size="33" fill="{MUREKKEP}" letter-spacing="-1">{b}</text>
    <text class="sans y{i}" x="{K}" y="330" font-size="13" fill="{IKINCIL}">{a1}</text>
    <text class="sans y{i}" x="{K}" y="350" font-size="13" fill="{IKINCIL}">{a2}</text>
  </g>''' for i, (b, a1, a2) in enumerate(perdeler))

    return kabuk(w, h,
        "WP Care — WordPress care plans: maintenance, backups and security. wpcare.pw",
        "WP Care — WordPress care plans", stil,
f'''  {maske}

  <text class="disp" x="{K}" y="62" font-size="24" fill="{MUREKKEP}" letter-spacing="-.5">WP Care<tspan fill="{A}">.</tspan></text>
  <text class="sans" x="{K}" y="82" font-size="9.5" letter-spacing="2.2" fill="{UCUNCUL}">WORDPRESS CARE PLANS</text>
  <rect x="{K}" y="104" width="{w-K*2}" height="1" fill="{KURAL}"/>

  <!-- Isaretler: her perde kendi simgesini ciziyor -->
  <g transform="translate({w//2} 176)" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <g class="i0" stroke="{A}">
      <circle r="30" stroke-opacity=".22"/>
      <path d="M0 -18 V0 l12 8"/>
    </g>
    <g class="i1" stroke="{A}">
      <circle r="30" stroke-opacity=".22"/>
      <path d="M-14 -12 h28 v24 h-28 z"/><path d="M-14 -4 h28"/><path d="M-6 6 h12"/>
    </g>
    <g class="i2" stroke="{YESIL}">
      <circle r="30" stroke-opacity=".22"/>
      <path d="M0 -18 l16 7 v10 c0 9 -7 15 -16 19 c-9 -4 -16 -10 -16 -19 v-10 z"/>
      <path d="M-6 2 l4 4 l8 -9"/>
    </g>
  </g>

  {metin}

  <rect x="{K}" y="{h-K-48}" width="{w-K*2}" height="48" rx="24" fill="{MUREKKEP}"/>
  <text class="sans" x="{w//2}" y="{h-K-18}" font-size="13.5" font-weight="700" fill="{KAGIT}" text-anchor="middle" letter-spacing=".3">See the care plans →</text>''')


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
