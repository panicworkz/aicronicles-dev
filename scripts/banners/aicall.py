#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AICall afislerini uretir.

Neden uretec: konusma bolumu her sektor icin tekrar eden bir yapi ve dort
ayri formatta (measure / feature / panel / rail) yeniden kullanilacak.
Elle yazmak hem uzun hem de bir zamanlamayi degistirince uc yerde birden
duzeltmeyi gerektiriyor.

Kurgu: 15 saniyelik ana dongu, uc perde. Her perdede bir baslik ve BIR
SEKTORDEN soru-cevap. Cevap gercekten geliyor: balon aciliyor, noktalar
konusuyor, sonra yerini cevap metni aliyor.
"""

import html
import pathlib as _pl
import sys as _sys

_sys.path.insert(0, str(_pl.Path(__file__).parent))
from ortak import markala

# --- Marka ------------------------------------------------------------------
LOGO_SYMBOL = '''    <symbol id="marka" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="12" fill="#0A0908"/>
      <g transform="translate(9.582,46.381) scale(0.037785,-0.037785)">
        <g fill="#F5F3EE"><path d="M367.9981689453125 710.0001220703125 610.7982177734375 84Q625.1982421875 48.39990234375 642.3983154296875 34.699951171875Q659.598388671875 21 673.7984619140625 20V0Q644.1988525390625 2 603.79931640625 2.5Q563.3997802734375 3 521.80029296875 3Q475.6005859375 3 435.0008544921875 2.5Q394.401123046875 2 369.80126953125 0V20Q420.80126953125 22 434.50128173828125 37.5Q448.2012939453125 53 428.2012939453125 104L257.8006591796875 568.601318359375L276.2005615234375 594.80078125L123.7996826171875 198.5985107421875Q102.39990234375 143.59912109375 97.89996337890625 108.8994140625Q93.4000244140625 74.19970703125 102.79998779296875 55.1998291015625Q112.199951171875 36.199951171875 133.59991455078125 28.5999755859375Q154.9998779296875 21 185.39990234375 20V0Q152.0001220703125 2 122.10009765625 2.5Q92.2000732421875 3 60.80029296875 3Q39.400146484375 3 19.500244140625 2.5Q-0.399658203125 2 -15.399658203125 0V20Q6.4002685546875 24.4000244140625 28.30023193359375 47.099853515625Q50.2001953125 69.7996826171875 71.4000244140625 124.999267578125L298.600341796875 710.0001220703125Q314.599853515625 708.8001708984375 333.29925537109375 708.8001708984375Q351.9986572265625 708.8001708984375 367.9981689453125 710.0001220703125ZM437.80029296875 288V268H139.80029296875L149.80029296875 288Z"/></g>
        <g fill="#F5F3EE" transform="translate(667.0,0)"><path d="M153.799560546875 775.1995849609375Q195.39892578125 775.1995849609375 220.09869384765625 754.6996459960938Q244.7984619140625 734.19970703125 244.7984619140625 698.0001220703125Q244.7984619140625 661.800537109375 220.09869384765625 641.3005981445312Q195.39892578125 620.8006591796875 153.799560546875 620.8006591796875Q112.2001953125 620.8006591796875 87.50042724609375 641.3005981445312Q62.8006591796875 661.800537109375 62.8006591796875 698.0001220703125Q62.8006591796875 734.19970703125 87.50042724609375 754.6996459960938Q112.2001953125 775.1995849609375 153.799560546875 775.1995849609375ZM232.198486328125 528.39990234375V93.21537585136218Q232.198486328125 51 246.6986083984375 36.0Q261.19873046875 21 296.198974609375 21V0Q277.53857705759447 1 239.66894673192223 2.5Q201.79931640625 4 162.5994873046875 4Q123.89198655348558 4 84.04602989783655 2.5Q44.2000732421875 1 24.2001953125 0V21Q59.200439453125 21 73.7005615234375 36.0Q88.20068359375 51 88.20068359375 93.25198974609376V408.1299133300781Q88.20068359375 453.39990234375 74.72689658717105 474.89990234375Q61.25310958059211 496.39990234375 24.2001953125 496.39990234375V517.39990234375Q56.2001953125 514.39990234375 86.2001953125 514.39990234375Q127.7996826171875 514.39990234375 164.499267578125 517.89990234375Q201.1988525390625 521.39990234375 232.198486328125 528.39990234375Z"/></g>
        <g fill="#d83f3f" transform="translate(982.0,0)"><path d="M134.9996337890625 140.39892578125Q173.59912109375 140.39892578125 196.7989501953125 119.89898681640625Q219.998779296875 99.3990478515625 219.998779296875 63.199462890625Q219.998779296875 26.9998779296875 196.7989501953125 6.49993896484375Q173.59912109375 -14 134.9996337890625 -14Q95.8001708984375 -14 72.90032958984375 6.49993896484375Q50.00048828125 26.9998779296875 50.00048828125 63.199462890625Q50.00048828125 99.3990478515625 72.90032958984375 119.89898681640625Q95.8001708984375 140.39892578125 134.9996337890625 140.39892578125Z"/></g>
      </g>
    </symbol>'''

# --- Icerik -----------------------------------------------------------------
# Her perde: bir baslik + bir sektorden soru-cevap.
PERDELER = [
    {
        "sektor": "RESTAURANT",
        # Burada once "27% of calls never get answered" yaziyordu. O rakamin
        # hicbir kaynagi yoktu — uydurmaydi. Reklamverenin arkasinda
        # duramayacagi bir istatistik afise konmaz. Yerine kaynak
        # gerektirmeyen, retorik bir cumle: iddia degil, sav.
        "baslik": [("Missed calls", "#9a938a"), ("don’t call back.", "#0A0908")],
        "soru": "“Do you have a table for six?”",
        "cevap": "Yes — 8pm tonight, booked.",
    },
    {
        "sektor": "CLINIC",
        "baslik": [("Every call.", "#0A0908"), ("Answered.", "#0A0908")],
        "soru": "“Can I move my appointment?”",
        "cevap": "Done. Thursday at 3pm.",
    },
    {
        "sektor": "LOGISTICS",
        "baslik": [("24/7, in any language,", "#0A0908"), ("at any scale.", "#0A0908")],
        "soru": "“Where is my order?”",
        "cevap": "Out for delivery today.",
    },
]

SURE = 16          # ana dongu — 2 sn'lik ortak vurus izgarasinda
                   # (bkz. network.py VURUS): butun afisler ayni ritimde
ADIM = 100 / 3     # bir perdenin yuzde payi


def yuzde(perde: int, ofset: float) -> float:
    """Perde icindeki bir ani, ana dongunun yuzdesine cevirir."""
    return round(perde * ADIM + ofset, 1)


# Donen ogelerin TABAN durumu gizli. Gizlemeyi yalnizca animasyona
# birakmak kirilgan: animasyon herhangi bir sebeple calismazsa (gizli
# sekme, azaltilmis hareket, stil carpismasi) hepsi varsayilan opaklikta
# kalir ve ust uste biner. Sitede tam olarak bu oldu.
TABAN_KURAL = (
    ".yuksel0,.yuksel1,.yuksel2,.soru0,.soru1,.soru2,"
    ".balon0,.balon1,.balon2,.nokta0,.nokta1,.nokta2,"
    ".cevap0,.cevap1,.cevap2 { opacity: 0 }\n"
    "    .yuksel0,.soru0 { opacity: 1 }"
)


def zamanlama() -> str:
    """Uc perdenin butun keyframe'lerini uretir."""
    p = []
    for i in range(3):
        # Baslik: maske perdesi + hafif yukselme
        # Maskeli perde kaldirildi: kirpma her karede yeniden hesaplanir
        # ve GPU'ya gitmez. Ayni etki opacity + translate ile, bilesik
        # katmanda ve cok daha ucuza aliniyor.
        a, b, c, d = yuzde(i, 2), yuzde(i, 6), yuzde(i, 29), yuzde(i, 32.6)
        p.append(f"@keyframes yuksel{i} {{ 0%,{a}%{{opacity:0;transform:translateY(14px)}} {b}%,{c}%{{opacity:1;transform:none}} {d}%,100%{{opacity:0;transform:translateY(-12px)}} }}")

        # Soru balonu
        sa, sb, sc, sd = yuzde(i, 1), yuzde(i, 5), yuzde(i, 30), yuzde(i, 32.6)
        p.append(f"@keyframes soru{i} {{ 0%,{sa}%{{opacity:0;transform:translateY(10px)}} {sb}%,{sc}%{{opacity:1;transform:none}} {sd}%,100%{{opacity:0;transform:translateY(-8px)}} }}")

        # Cevap balonu — sorudan sonra asagidan gelir
        ba, bb, bc, bd = yuzde(i, 9), yuzde(i, 13), yuzde(i, 30), yuzde(i, 32.6)
        p.append(f"@keyframes balon{i} {{ 0%,{ba}%{{opacity:0;transform:translateY(20px)}} {bb}%,{bc}%{{opacity:1;transform:none}} {bd}%,100%{{opacity:0;transform:translateY(-8px)}} }}")

        # Noktalar once konusur, sonra yerini cevaba birakir
        na, nb, nc = yuzde(i, 12), yuzde(i, 17), yuzde(i, 19)
        p.append(f"@keyframes nokta{i} {{ 0%,{na}%{{opacity:0}} {round(na+1,1)}%,{nb}%{{opacity:1}} {nc}%,100%{{opacity:0}} }}")

        # Cevap metni
        ca, cb, cc, cd = yuzde(i, 19), yuzde(i, 22), yuzde(i, 30), yuzde(i, 32.6)
        p.append(f"@keyframes cevap{i} {{ 0%,{ca}%{{opacity:0}} {cb}%,{cc}%{{opacity:1}} {cd}%,100%{{opacity:0}} }}")
    return "\n    ".join(p)


def measure() -> str:
    """1440 x 200 — tam icerik genisligi."""
    K = 48                      # kenar payi
    BASLIK_X, BASLIK_W = 326, 520
    SOHBET_X = 886
    BTN_X, BTN_W = 1152, 240

    siniflar, perdeler, sohbet = [], [], []
    for i, s in enumerate(PERDELER):
        siniflar.append(
            f"    .yuksel{i}{{animation:yuksel{i} {SURE}s cubic-bezier(.16,1,.3,1) infinite}}\n"
            f"    .soru{i}{{animation:soru{i} {SURE}s cubic-bezier(.16,1,.3,1) infinite}}\n"
            f"    .balon{i}{{animation:balon{i} {SURE}s cubic-bezier(.16,1,.3,1) infinite}}\n"
            f"    .nokta{i}{{animation:nokta{i} {SURE}s steps(1) infinite}}\n"
            f"    .cevap{i}{{animation:cevap{i} {SURE}s cubic-bezier(.16,1,.3,1) infinite}}"
        )

        punto = 50 if i < 2 else 44
        satirlar = "\n    ".join(
            f'<text class="disp yuksel{i}" x="{BASLIK_X}" y="{86 + n*56}" font-size="{punto}" '
            f'fill="{renk}" letter-spacing="-1.5">{html.escape(metin)}</text>'
            for n, (metin, renk) in enumerate(s["baslik"])
        )
        perdeler.append(f'<g>\n    {satirlar}\n  </g>')

        # Soru balonu: kuyruk sol altta. Cevap balonu: kuyruk sag altta.
        sohbet.append(f'''<g class="soru{i}">
    <path d="M{SOHBET_X} 34 h190 a13 13 0 0 1 13 13 v26 a13 13 0 0 1 -13 13 h-172 l-15 12 v-12 a13 13 0 0 1 -13 -13 v-26 a13 13 0 0 1 13 -13 z" fill="#e9e3d7"/>
    <text class="sans" x="{SOHBET_X + 16}" y="65" font-size="11.5" fill="#6b665f">{html.escape(s["soru"])}</text>
    <text class="sans" x="{SOHBET_X + 16}" y="24" font-size="9" letter-spacing="2" fill="#b3ac9f">{s["sektor"]}</text>
  </g>
  <g class="balon{i}">
    <path d="M{SOHBET_X + 20} 104 h182 a13 13 0 0 1 13 13 v26 a13 13 0 0 1 -13 13 h-14 l15 12 v-12 h-183 a13 13 0 0 1 -13 -13 v-26 a13 13 0 0 1 13 -13 z" fill="#0A0908"/>
    <g class="nokta{i}" fill="#F5F3EE">
      <g transform="translate({SOHBET_X + 40} 130)"><circle class="zipla" r="3.4" style="animation-delay:0s"/></g>
      <g transform="translate({SOHBET_X + 58} 130)"><circle class="zipla" r="3.4" style="animation-delay:.15s"/></g>
      <g transform="translate({SOHBET_X + 76} 130)"><circle class="zipla" r="3.4" style="animation-delay:.30s"/></g>
    </g>
    <text class="cevap{i} sans" x="{SOHBET_X + 36}" y="135" font-size="11.5" font-weight="600" fill="#F5F3EE">{html.escape(s["cevap"])}</text>
  </g>''')

    maskeler = "\n    ".join(
        f'' for i in range(3))

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 200" width="1440" height="200" role="img" aria-label="AICall — AI voice agents answer every business call, 24/7, in any language, at any scale. Hear a live demo at aicall.pw">
  <title>AICall — Every call, answered</title>

  <style>
    /* Iki yazi tipi. SVG bir &lt;img&gt; icinde acildigi icin web fontu
       yuklenmez; her iki isletim sisteminde de bulunan aileler. */
    .disp {{ font-family: Georgia, "Times New Roman", serif }}
    .sans {{ font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif }}

    /* {SURE} saniyelik ana dongu, uc perde, surekli.
       Her perdede bir baslik ve BIR SEKTORDEN soru-cevap: balon aciliyor,
       noktalar konusuyor, sonra yerini gercek cevap aliyor.
       IAB'nin "en fazla 3 tur" olcutu borsadan gelen ucuncu taraf
       reklamlari icin; burasi kendi agimizin reklami, sinirsiz donuyor.
       Yumusatma expo.out — hizli baslar, uzun ve yumusak biter. */
    {TABAN_KURAL}
    {chr(10).join("    " + s for s in siniflar).strip()}

    /* Noktalar konusurken zipliyor.
       transform-box: fill-box KULLANMIYORUZ; tarayicilar arasinda
       tutarsiz. Her nokta kendi grubunda, orijini merkezinde. */
    .zipla {{ transform-origin: 0 0; animation: zipla 1s ease-in-out infinite }}
    /* Not: noktalar yalnizca gorunur olduklari ~1 sn boyunca ise yarar;
       gorunmezken de ticklemesin diye .nokta grubu steps(1) ile
       aciliyor-kapaniyor, boylece tarayici cogu zaman hicbir sey
       cizmiyor. */
    @keyframes zipla {{ 0%,100%{{transform:translateY(0);opacity:.5}} 50%{{transform:translateY(-3px);opacity:1}} }}

    .btn {{ transform-origin: {BTN_X + BTN_W//2}px 98px; animation: btn {SURE}s ease-in-out infinite }}
    @keyframes btn {{ 0%,30%{{transform:scale(1)}} 33%{{transform:scale(1.035)}} 36%,63%{{transform:scale(1)}} 66%{{transform:scale(1.035)}} 69%,100%{{transform:scale(1)}} }}
    .parla {{ animation: parla {SURE}s ease-in-out infinite }}
    @keyframes parla {{ 0%,90%,100%{{transform:translateX(-160px)}} 97%{{transform:translateX(260px)}} }}

    {zamanlama()}

    @media (prefers-reduced-motion: reduce) {{
      * {{ animation: none !important }}
      .perde0,.perde1 {{ transform: scaleX(0) }}
      .perde2 {{ transform: scaleX(1) }}
      .soru0,.balon0,.soru1,.balon1,.nokta0,.nokta1,.nokta2 {{ opacity: 0 }}
      .soru2,.balon2,.cevap2 {{ opacity: 1 }}
      .cevap0,.cevap1 {{ opacity: 0 }}
    }}
  </style>

  <defs>
    <linearGradient id="kagit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fcfaf7"/><stop offset="100%" stop-color="#f1ede2"/>
    </linearGradient>
    <linearGradient id="isik" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#fff" stop-opacity=".4"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="btnKirp"><rect x="{BTN_X}" y="68" width="{BTN_W}" height="60" rx="30"/></clipPath>
    {maskeler}

{LOGO_SYMBOL}
  </defs>

  <rect width="1440" height="200" fill="url(#kagit)"/>
  <rect x="0" y="0" width="1440" height="3" fill="#0A0908"/>

  <!-- Marka kilidi — kenardan {K}px icerde -->
  <use href="#marka" x="{K}" y="64" width="52" height="52"/>
  <text class="disp" x="{K + 68}" y="98" font-size="30" fill="#0A0908" letter-spacing="-.7">AICall<tspan fill="#d83f3f">.</tspan></text>
  <circle cx="{K + 72}" cy="120" r="3.5" fill="#00A651"/>
  <text class="sans" x="{K + 85}" y="124" font-size="11" letter-spacing="2.2" fill="#8a857d">AI VOICE AGENTS</text>

  <rect x="290" y="50" width="1" height="100" fill="#ddd7cb"/>

  <g class="btn">
    <rect x="{BTN_X}" y="68" width="{BTN_W}" height="60" rx="30" fill="#0A0908"/>
    <text class="sans" x="{BTN_X + BTN_W//2}" y="105" font-size="16" font-weight="700" fill="#F5F3EE" text-anchor="middle" letter-spacing=".3">Hear a live demo →</text>
    <g clip-path="url(#btnKirp)"><rect class="parla" x="{BTN_X}" y="68" width="100" height="60" fill="url(#isik)"/></g>
  </g>

  {chr(10).join("  " + b for b in sohbet).strip()}

  {chr(10).join("  " + p for p in perdeler).strip()}
</svg>
'''


if __name__ == "__main__":
    import pathlib, sys
    hedef = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "aicall-measure.svg")
    hedef.write_text(markala(measure(), "ac"), encoding="utf-8")
    print(f"yazildi: {hedef}  ({hedef.stat().st_size/1024:.1f} KB)")
