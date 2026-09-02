#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fabelo'nun kendi reklam daveti — dort formatta.

Bir alanda yayinda reklam yoksa (hic tanimlanmamis ya da takvimi dolmus)
orada gri bir yer tutucu duruyordu. Yer tutucu hicbir sey kazandirmiyor;
oysa o alan bos oldugu icin satilabilir. Bu afis onun yerine geciyor ve
ziyaretciyi /advertise sayfasina yonlendiriyor.

Metin ingilizce: CMS ve site ingilizce, ceviri destegi sonra gelecek.

DIKKAT — hicbir sayi iddiasi yok. Ne okur sayisi, ne gosterim, ne
tiraj. Elimizde dogrulanabilir bir rakam olmadigi surece afis yalnizca
yayinin NE OLDUGUNU soyluyor.
"""

import pathlib

# Fabelo belirtecleri — sitenin globals.css'indeki degerlerle ayni
KAGIT, KAGIT2 = "#faf8f4", "#f2eee6"
MUREKKEP, IKINCIL, UCUNCUL = "#15171a", "#4a4f57", "#8b9098"
KURAL = "#d9d3c6"
VURGU, VURGU_OKUNUR = "#0fb5ce", "#0a7d8f"

FORMATLAR = {
    # ad:        (genislik, yukseklik, dikey mi)
    "measure": (1440, 200, False),
    "feature": (940, 180, False),
    "panel":   (511, 300, False),
    "rail":    (387, 540, True),
}


def stil(sure: int = 9) -> str:
    """Iki perde: davet ve cagri. Yalnizca transform/opacity degisiyor —
    hicbiri yeniden yerlesim ya da boyama tetiklemiyor."""
    return f"""
    .disp {{ font-family: Georgia, "Times New Roman", serif }}
    .sans {{ font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif }}

    /* {sure} sn dongu, iki perde. Yumusatma expo.out. */
    .s1 {{ animation: s1 {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    .s2 {{ animation: s2 {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes s1 {{
      0%      {{ opacity:0; transform:translateY(12px) }}
      6%,44%  {{ opacity:1; transform:none }}
      50%,100%{{ opacity:0; transform:translateY(-10px) }}
    }}
    @keyframes s2 {{
      0%,50%  {{ opacity:0; transform:translateY(12px) }}
      56%,94% {{ opacity:1; transform:none }}
      100%    {{ opacity:0; transform:translateY(-10px) }}
    }}

    /* Kose ayraclari: alanin olculdugu hissi — "burasi bos, sizin olabilir" */
    .kose {{ animation: kose {sure}s cubic-bezier(.16,1,.3,1) infinite }}
    @keyframes kose {{
      0%      {{ opacity:0; transform:scale(.9) }}
      8%,94%  {{ opacity:.75; transform:none }}
      100%    {{ opacity:0; transform:scale(.98) }}
    }}

    @media (prefers-reduced-motion: reduce) {{
      * {{ animation: none !important }}
      .s1 {{ opacity: 0 }}
      .s2, .kose {{ opacity: 1; transform: none }}
    }}
"""


def koseler(w: int, h: int, u: int = 16, p: int = 26) -> str:
    """Dort kosede L bicimli ayrac."""
    c = UCUNCUL
    return f'''<g class="kose" fill="none" stroke="{c}" stroke-width="1.5">
    <path d="M{p} {p+u} V{p} H{p+u}"/>
    <path d="M{w-p-u} {p} H{w-p} V{p+u}"/>
    <path d="M{w-p} {h-p-u} V{h-p} H{w-p-u}"/>
    <path d="M{p+u} {h-p} H{p} V{h-p-u}"/>
  </g>'''


def yatay(ad: str, w: int, h: int) -> str:
    """measure / feature / panel — yatay yerlesim."""
    K = 48 if w > 900 else 34
    orta = h // 2
    buyuk = 46 if w >= 1400 else (34 if w >= 900 else 27)
    kucuk = 14 if w >= 900 else 12.5
    btn_w, btn_h = (232, 54) if w >= 900 else (196, 46)
    btn_x = w - K - btn_w
    metin_w = btn_x - K - 40

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="This space is available. Advertise on Fabelo — independent coverage of money, career and AI.">
  <title>Advertise on Fabelo</title>
  <style>{stil()}</style>
  <defs>
    <linearGradient id="kagit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{KAGIT}"/><stop offset="100%" stop-color="{KAGIT2}"/>
    </linearGradient>
  </defs>

  <rect width="{w}" height="{h}" fill="url(#kagit)"/>
  <rect x="0" y="0" width="{w}" height="2.5" fill="{MUREKKEP}"/>
  {koseler(w, h)}

  <text class="sans" x="{K}" y="{orta - buyuk//2 - 18}" font-size="10.5" letter-spacing="2.6" fill="{VURGU_OKUNUR}">
    § ADVERTISE ON FABELO
  </text>

  <g class="s1">
    <text class="disp" x="{K}" y="{orta + 12}" font-size="{buyuk}" fill="{MUREKKEP}" letter-spacing="-1.2">This space is available.</text>
    <text class="sans" x="{K}" y="{orta + 42}" font-size="{kucuk}" fill="{IKINCIL}">Independent coverage of money, career and AI.</text>
  </g>

  <g class="s2">
    <text class="disp" x="{K}" y="{orta + 12}" font-size="{buyuk}" fill="{MUREKKEP}" letter-spacing="-1.2">Put your brand here.</text>
    <text class="sans" x="{K}" y="{orta + 42}" font-size="{kucuk}" fill="{IKINCIL}">Display, sponsored articles and newsletter placements.</text>
  </g>

  <rect x="{btn_x}" y="{orta - btn_h//2}" width="{btn_w}" height="{btn_h}" rx="{btn_h//2}" fill="{MUREKKEP}"/>
  <text class="sans" x="{btn_x + btn_w//2}" y="{orta + 5}" font-size="{14 if w>=900 else 12.5}" font-weight="700"
        fill="{KAGIT}" text-anchor="middle" letter-spacing=".3">Get in touch →</text>
</svg>
'''


def dikey(ad: str, w: int, h: int) -> str:
    """rail — dikey yerlesim."""
    K = 30
    btn_w, btn_h = w - K*2, 48
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="This space is available. Advertise on Fabelo — independent coverage of money, career and AI.">
  <title>Advertise on Fabelo</title>
  <style>{stil()}</style>
  <defs>
    <linearGradient id="kagit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{KAGIT}"/><stop offset="100%" stop-color="{KAGIT2}"/>
    </linearGradient>
  </defs>

  <rect width="{w}" height="{h}" fill="url(#kagit)"/>
  <rect x="0" y="0" width="{w}" height="2.5" fill="{MUREKKEP}"/>
  {koseler(w, h, u=14, p=20)}

  <text class="sans" x="{K}" y="76" font-size="10" letter-spacing="2.4" fill="{VURGU_OKUNUR}">§ ADVERTISE</text>
  <text class="sans" x="{K}" y="94" font-size="10" letter-spacing="2.4" fill="{VURGU_OKUNUR}">ON FABELO</text>

  <g class="s1">
    <text class="disp" x="{K}" y="180" font-size="34" fill="{MUREKKEP}" letter-spacing="-1">This space</text>
    <text class="disp" x="{K}" y="218" font-size="34" fill="{MUREKKEP}" letter-spacing="-1">is available.</text>
    <text class="sans" x="{K}" y="256" font-size="13" fill="{IKINCIL}">Independent coverage of</text>
    <text class="sans" x="{K}" y="276" font-size="13" fill="{IKINCIL}">money, career and AI.</text>
  </g>

  <g class="s2">
    <text class="disp" x="{K}" y="180" font-size="34" fill="{MUREKKEP}" letter-spacing="-1">Put your</text>
    <text class="disp" x="{K}" y="218" font-size="34" fill="{MUREKKEP}" letter-spacing="-1">brand here.</text>
    <text class="sans" x="{K}" y="256" font-size="13" fill="{IKINCIL}">Display, sponsored articles</text>
    <text class="sans" x="{K}" y="276" font-size="13" fill="{IKINCIL}">and newsletter placements.</text>
  </g>

  <rect x="{K}" y="{h - K - btn_h}" width="{btn_w}" height="{btn_h}" rx="{btn_h//2}" fill="{MUREKKEP}"/>
  <text class="sans" x="{K + btn_w//2}" y="{h - K - btn_h//2 + 5}" font-size="13.5" font-weight="700"
        fill="{KAGIT}" text-anchor="middle" letter-spacing=".3">Get in touch →</text>
</svg>
'''


if __name__ == "__main__":
    import sys
    hedef = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    hedef.mkdir(parents=True, exist_ok=True)
    for ad, (w, h, dik) in FORMATLAR.items():
        icerik = dikey(ad, w, h) if dik else yatay(ad, w, h)
        yol = hedef / f"house-{ad}.svg"
        yol.write_text(icerik, encoding="utf-8")
        print(f"  house-{ad}.svg  {w}x{h}  ({yol.stat().st_size/1024:.1f} KB)")
