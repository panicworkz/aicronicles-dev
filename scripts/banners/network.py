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
    """511 x 300 — ana sayfa yan kolonu.

    Onceki surumde tek bir ince rota cizgisi vardi; markanin asil gucunu
    anlatmiyordu. TurcoPartners bir EKOSISTEM: sirket kurulusu, lojistik,
    pazar istihbarati. Simdi uc hizmet sirayla isaretleniyor — okuyan
    kisi neyin dahil oldugunu goruyor.

    Hicbir sayi yok: ne ulke sayisi ne musteri. Kendi sitelerinde gecen
    rakamlari da almadik; dogrulayamadigimiz seyi afise koymuyoruz."""
    w, h, K = 511, 300, 32
    A = "#0f5132"   # ticaret yesili — koyu, kagit uzerinde okunur
    sure = 9

    hizmetler = [
        ("Company setup", "Delaware / Florida"),
        ("Logistics", "fulfilment and customs"),
        ("Intelligence", "market and country risk"),
    ]

    # Her satir sirayla beliriyor, yanindaki isaret ciziliyor
    satir_stil = "\n    ".join(
        f".r{i}{{animation:r{i} {sure}s cubic-bezier(.16,1,.3,1) infinite}}\n"
        f"    @keyframes r{i}{{0%,{8+i*9}%{{opacity:0;transform:translateX(-10px)}}"
        f" {16+i*9}%,88%{{opacity:1;transform:none}} 96%,100%{{opacity:0;transform:translateX(-6px)}}}}"
        for i in range(3))

    stil = f'''    .bas {{ transform-origin:0 0; animation: bas {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes bas {{ 0%,2%{{transform:scaleX(0)}} 12%,90%{{transform:scaleX(1)}} 98%,100%{{transform:scaleX(0)}} }}
    {satir_stil}

    @media (prefers-reduced-motion: reduce) {{
      * {{ animation: none !important }}
      .bas {{ transform: scaleX(1) }}
      .r0,.r1,.r2 {{ opacity: 1; transform: none }}
    }}'''

    satirlar = "\n  ".join(f'''<g class="r{i}">
    <g transform="translate({K+9} {158+i*44})" fill="none" stroke="{A}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle r="9" stroke-opacity=".3"/><path d="M-4 0 l3 3.4 l6 -7"/>
    </g>
    <text class="sans" x="{K+32}" y="{163+i*44}" font-size="14.5" font-weight="700" fill="{MUREKKEP}">{html.escape(ad)}</text>
    <text class="sans" x="{K+32}" y="{180+i*44}" font-size="11.5" fill="{IKINCIL}">{html.escape(alt)}</text>
  </g>''' for i, (ad, alt) in enumerate(hizmetler))

    govde = f'''  <clipPath id="mb"><rect class="bas" x="{K}" y="60" width="{w-K*2}" height="52"/></clipPath>

  <text class="sans" x="{K}" y="46" font-size="9.5" letter-spacing="2.4" fill="{A}">§ TURCOPARTNERS</text>
  <g clip-path="url(#mb)">
    <text class="disp" x="{K}" y="100" font-size="38" fill="{MUREKKEP}" letter-spacing="-1.1">Sell into the US.</text>
  </g>
  <rect x="{K}" y="122" width="{w-K*2}" height="1" fill="{KURAL}"/>

  {satirlar}

  <rect x="{K}" y="{h-K-46}" width="{w-K*2}" height="46" rx="23" fill="{MUREKKEP}"/>
  <text class="sans" x="{w//2}" y="{h-K-17}" font-size="13.5" font-weight="700" fill="{KAGIT}" text-anchor="middle" letter-spacing=".3">Explore the ecosystem →</text>'''

    return kabuk(w, h, "TurcoPartners — company setup, logistics and market intelligence for selling into the US. turcopartners.com",
                 "TurcoPartners — sell into the US", stil, govde)


# ---------------------------------------------------------------- WP CARE
def wpcare() -> str:
    """387 x 540 — kenar rayi, dikey.

    Onceki surumde icerik 540 pikselin ortasinda kucuk kaliyordu: 60
    piksellik bir simge 148 piksellik bos bantta yuzuyordu. Simdi alan
    dort banda bolundu ve her bant isini yapiyor:
        0..118   marka kilidi
      118..300   site durum karti — afisin yasayan ogesi
      300..452   baslik ve aciklama
      452..540   cagri

    Yasayan oge: bir WordPress sitesinin bakim panosu. Uc perdede uc
    hizmet calisiyor ve durum satiri "sorun" halinden "temiz" haline
    geciyor — bakim planinin ne yaptigini birebir gosteriyor."""
    w, h, K = 387, 540, 28
    A, YESIL = "#ff6b6b", "#00a86b"
    sure = 12
    IC = w - K * 2

    perdeler = [
        ("Maintenance.", "Core, plugins and themes", "kept current, every week."),
        ("Backups.",     "Restorable copies kept",   "off your own server."),
        ("Security.",    "Hardening, monitoring",    "and clean-up after."),
    ]
    durumlar = [("Updates pending", A), ("Backup running", A), ("All clear", YESIL)]

    ek = "\n    ".join(
        f".d{i}{{animation:d{i} {sure}s steps(1) infinite}}\n"
        f"    @keyframes d{i}{{0%,{i*33.3:.1f}%{{opacity:0}} {i*33.3+2:.1f}%,{(i+1)*33.3-2:.1f}%{{opacity:1}} {(i+1)*33.3:.1f}%,100%{{opacity:0}}}}"
        for i in range(3))

    stil = temel_stil(sure, 3) + f'''
    {ek}
    /* Tarama cubugu: bakimin surdugunu gosterir */
    .tara {{ transform-origin: 0 0; animation: tara 2.4s ease-in-out infinite }}
    @keyframes tara {{ 0%{{transform:scaleX(0)}} 70%,100%{{transform:scaleX(1)}} }}

    @media (prefers-reduced-motion: reduce) {{
      * {{ animation: none !important }}
      .p0,.p1 {{ transform: scaleX(0) }} .p2 {{ transform: scaleX(1) }}
      .y0,.y1,.d0,.d1 {{ opacity: 0 }}
      .y2,.d2 {{ opacity: 1; transform: none }}
      .tara {{ transform: scaleX(1) }}
    }}'''

    maske = "\n  ".join(
        f'<clipPath id="m{i}"><rect class="p{i}" x="{K}" y="310" width="{IC}" height="140"/></clipPath>'
        for i in range(3))

    metin = "\n  ".join(f'''<g clip-path="url(#m{i})">
    <text class="disp y{i}" x="{K}" y="358" font-size="40" fill="{MUREKKEP}" letter-spacing="-1.2">{html.escape(b)}</text>
    <text class="sans y{i}" x="{K}" y="394" font-size="13.5" fill="{IKINCIL}">{html.escape(a1)}</text>
    <text class="sans y{i}" x="{K}" y="414" font-size="13.5" fill="{IKINCIL}">{html.escape(a2)}</text>
  </g>''' for i, (b, a1, a2) in enumerate(perdeler))

    durum_satiri = "\n    ".join(f'''<g class="d{i}">
      <circle cx="{K+22}" cy="248" r="5" fill="{renk}"/>
      <text class="sans" x="{K+38}" y="253" font-size="12.5" font-weight="600" fill="{MUREKKEP}">{html.escape(ad)}</text>
    </g>''' for i, (ad, renk) in enumerate(durumlar))

    govde = f'''  {maske}

  <text class="disp" x="{K}" y="64" font-size="27" fill="{MUREKKEP}" letter-spacing="-.6">WP Care<tspan fill="{A}">.</tspan></text>
  <text class="sans" x="{K}" y="86" font-size="9.5" letter-spacing="2.2" fill="{UCUNCUL}">WORDPRESS CARE PLANS</text>
  <rect x="{K}" y="108" width="{IC}" height="1" fill="{KURAL}"/>

  <!-- Yasayan oge: bakim panosu -->
  <g>
    <rect x="{K}" y="134" width="{IC}" height="140" rx="10" fill="#ffffff" stroke="{KURAL}"/>
    <rect x="{K}" y="134" width="{IC}" height="34" rx="10" fill="{KAGIT2}"/>
    <rect x="{K}" y="158" width="{IC}" height="10" fill="{KAGIT2}"/>
    <g fill="{UCUNCUL}">
      <circle cx="{K+18}" cy="151" r="3.5"/><circle cx="{K+31}" cy="151" r="3.5"/><circle cx="{K+44}" cy="151" r="3.5"/>
    </g>
    <text class="sans" x="{K+62}" y="155" font-size="10.5" letter-spacing=".4" fill="{IKINCIL}">yoursite.com</text>

    <!-- Tarama cubugu -->
    <rect x="{K+22}" y="196" width="{IC-44}" height="5" rx="2.5" fill="{KAGIT2}"/>
    <rect class="tara" x="{K+22}" y="196" width="{IC-44}" height="5" rx="2.5" fill="{A}"/>
    <text class="sans" x="{K+22}" y="186" font-size="10.5" letter-spacing="1.6" fill="{UCUNCUL}">CARE PLAN RUNNING</text>

    <rect x="{K+22}" y="222" width="{IC-44}" height="1" fill="{KURAL}"/>
    {durum_satiri}
  </g>

  {metin}

  <rect x="{K}" y="{h-K-50}" width="{IC}" height="50" rx="25" fill="{MUREKKEP}"/>
  <text class="sans" x="{w//2}" y="{h-K-19}" font-size="14" font-weight="700" fill="{KAGIT}" text-anchor="middle" letter-spacing=".3">See the care plans →</text>'''

    return kabuk(w, h, "WP Care — WordPress care plans: maintenance, backups and security. wpcare.pw",
                 "WP Care — WordPress care plans", stil, govde)


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
