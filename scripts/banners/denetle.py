#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Afis kurallarini uretilen SVG'ler uzerinde olcer.

KURALLAR.md kuralin NIYETINI tutar, bu betik UYGULANDIGINI. Kural
eklendiginde buraya da eklenmeli; yoksa kural bir sure sonra sessizce
bozulur — nitekim bozuldu: panele ozel nefes payi, cizim kodunda kalan
eski bir kopya ve yazi logosunun hizasi hep boyle kacti.

    python3 denetle.py            # biten markalar
    python3 denetle.py --hepsi    # butun uretilenler

Cikis kodu 0 = ihlal yok.
"""

import glob
import pathlib
import re
import sys
import xml.etree.ElementTree as ET

from deney import MARKALAR, sans_olc, serif_olc

NS = "{http://www.w3.org/2000/svg}"
KOK = pathlib.Path(__file__).resolve().parents[2] / "public" / "media" / "deney"

# Sade seti tamamlanmis markalar. Yeni marka bitince buraya eklenir.
BITEN = ("panicworkz", "aicall", "yerine", "wpcare", "turco", "testworkz")

HEDEF_SATIR = {"measure": 1, "feature": 1, "panel": 2, "rail": 4}
ACIKLAMA_PUNTO = 14
ACIKLAMA_KURAL_BOSLUK = 12
KENAR_TOLERANS = 1.2


def _gecikme(e):
    m = re.search(r"animation-delay:([\d.]+)s", e.get("style") or "")
    return m.group(1) if m else None


def afisi_denetle(yol, hedef_satir_uygula=True):
    """Bir afisteki ihlalleri dondurur."""
    ihlal = []
    ad = str(yol).split("deney/")[1]
    bicim = yol.stem.split("-")[1]
    r = ET.parse(yol).getroot()
    W, H = [float(x) for x in r.get("viewBox").split()[2:]]
    st = r.find(f"{NS}style")
    css = st.text or ""

    # 36 — stil blogunda < > olamaz
    if "<" in css or ">" in css:
        ihlal.append((ad, "stilde < >", ""))

    # 31/32 — kullanilan her sinifin keyframe'i olmali
    kareler = set(re.findall(r"@keyframes\s+([\w-]+)", css))
    for c in {c for e in r.iter() for c in (e.get("class") or "").split()}:
        m = re.search(rf"\.{re.escape(c)}\s*\{{[^}}]*animation:\s*([\w-]+)", css)
        if m and m.group(1) not in kareler:
            ihlal.append((ad, "eksik keyframe", m.group(1)))

    ust, alt, sol, sag, kurallar, cizgiler = [], [], [], [], [], {}

    for e in r.iter(f"{NS}image"):
        y, x = float(e.get("y")), float(e.get("x"))
        ust.append(y); alt.append(y + float(e.get("height")))
        sol.append(x); sag.append(x + float(e.get("width")))

    for t in r.iter(f"{NS}text"):
        c = t.get("class") or ""
        s = float(t.get("font-size") or 0)
        if s > 70:                       # dekoratif dev harf — bilincli tasar
            continue
        y, x = float(t.get("y") or 0), float(t.get("x") or 0)
        tl = t.get("textLength")
        en = float(tl) if tl else (serif_olc if "disp" in c else sans_olc)(t.text or "", s)
        anc = t.get("text-anchor")
        x0 = x - en / 2 if anc == "middle" else (x - en if anc == "end" else x)
        # 24 — yazi buyuk harf yuksekligine gore hizalanir
        ust.append(y - s * 0.69); alt.append(y + s * 0.22)
        sol.append(x0); sag.append(x0 + en)
        # 8 — cerceve tasmasi
        if y + s * 0.3 > H + 1 or y - s * 0.95 < -1 or x0 < -1 or x0 + en > W + 1:
            ihlal.append((ad, "tasma", (t.text or "")[:20]))

    for g in r.iter(f"{NS}g"):
        m = re.match(r"translate\(([\d.]+),([\d.]+)\)", g.get("transform") or "")
        rc = g.find(f"{NS}rect")
        if not (m and rc is not None):
            continue
        gx, gy = float(m.group(1)), float(m.group(2))
        ust.append(gy); alt.append(gy + float(rc.get("height")))
        sol.append(gx); sag.append(gx + float(rc.get("width")))
        if rc.get("height") == "1":
            kurallar.append(gy)
        if "mciz" in (rc.get("class") or ""):
            cizgiler[_gecikme(rc)] = (gx, gy, float(rc.get("width")))

    # 1 — dort kenar esit
    kenar = [min(ust), H - max(alt), min(sol), W - max(sag)]
    if max(kenar) - min(kenar) > KENAR_TOLERANS:
        ihlal.append((ad, "kenar esit degil", [round(x, 1) for x in kenar]))

    # Perdeler
    punto, satir, bosluk = set(), set(), set()
    for g in r.iter(f"{NS}g"):
        if "perde" not in (g.get("class") or "") or list(g.iter(f"{NS}rect")):
            continue                      # rect'li perde = soylem listesi
        t = [x for x in g.iter(f"{NS}text") if "sans" in (x.get("class") or "")]
        d = [x for x in g.iter(f"{NS}text") if "disp" in (x.get("class") or "")]
        if not (t and d):
            continue
        punto.add((float(d[0].get("font-size")), float(t[0].get("font-size"))))
        satir.add(len(t))
        if len(kurallar) > 1:
            bosluk.add(round(max(kurallar) - float(t[-1].get("y"))))

    # 10 — perdeler ortak punto, 15 — ortak satir sayisi
    if len(punto) > 1:
        ihlal.append((ad, "perdeler arasi punto", sorted(punto)))
    if len(satir) > 1:
        ihlal.append((ad, "perdeler arasi satir", sorted(satir)))
    if len(bosluk) > 1:
        ihlal.append((ad, "perdeler arasi bosluk", sorted(bosluk)))
    # 7 — aciklama puntosu
    if punto and next(iter(punto))[1] != ACIKLAMA_PUNTO:
        ihlal.append((ad, "aciklama puntosu", next(iter(punto))[1]))
    # 5 — aciklama ile kural arasi
    if bosluk and next(iter(bosluk)) != ACIKLAMA_KURAL_BOSLUK:
        ihlal.append((ad, "aciklama-kural boslugu", next(iter(bosluk))))
    # 14 — formatin hedef satir sayisi
    if hedef_satir_uygula and satir and next(iter(satir)) != HEDEF_SATIR[bicim]:
        ihlal.append((ad, "satir hedefi", f"{next(iter(satir))} != {HEDEF_SATIR[bicim]}"))

    # 12 — cagri cizgisi metinle birebir, tam altinda
    #
    # Esleme PERDE GECIKMESINE gore. Yigin duzende uc cagri ayni
    # koordinatta durdugu icin konuma gore eslestirmek sahte ihlal
    # uretiyordu; ilk yazdigimda 92, ikincide 30 tane.
    for t in r.iter(f"{NS}text"):
        if "mcag" not in (t.get("class") or ""):
            continue
        c = cizgiler.get(_gecikme(t))
        if not c:
            ihlal.append((ad, "cagri cizgisi yok", (t.text or "")[:16])); continue
        tl, x, y = float(t.get("textLength")), float(t.get("x")), float(t.get("y"))
        if abs(c[0] - x) > 1 or abs(c[1] - (y + 7)) > 1.5:
            ihlal.append((ad, "cizgi konumu", (t.text or "")[:16]))
        if abs(c[2] - tl) > 1.2:
            ihlal.append((ad, "cizgi != metin", f"{c[2]:.0f} vs {tl:.0f}"))
    return ihlal


def metinleri_denetle(kodlar):
    """20 — kelime farki <= 1, genislik sapmasi <= %8; 19 — uc mesaj."""
    ihlal = []
    for m in MARKALAR:
        if m["kod"] not in kodlar:
            continue
        for dil in ("en", "tr"):
            v = m["metin"][dil]
            if len(v) != 3:
                ihlal.append((f'{m["kod"]}/{dil}', "mesaj sayisi", len(v)))
            if len(v) < 2:
                continue
            k = [len(x[1].split()) for x in v]
            g = [sans_olc(x[1], 14) for x in v]
            if max(k) - min(k) > 1:
                ihlal.append((f'{m["kod"]}/{dil}', "kelime farki", k))
            if (max(g) - min(g)) / min(g) > 0.08:
                ihlal.append((f'{m["kod"]}/{dil}', "genislik sapmasi",
                              [round(x) for x in g]))
    return ihlal


def main():
    hepsi = "--hepsi" in sys.argv
    kodlar = tuple(m["kod"] for m in MARKALAR) if hepsi else BITEN
    dosyalar = [pathlib.Path(f) for f in sorted(glob.glob(str(KOK / "**" / "*-plain.svg"),
                                                          recursive=True))
                if pathlib.Path(f).stem.split("-")[0] in kodlar]
    ihlal = []
    for f in dosyalar:
        # Hedef satir sayisi yalnizca ingilizce sette zorunlu; turkce
        # metinler farkli uzunlukta ve dil destegi henuz yayinda degil.
        ihlal += afisi_denetle(f, hedef_satir_uygula="/tr/" not in str(f))
    ihlal += metinleri_denetle(kodlar)

    print(f"  {len(dosyalar)} afis · {len(kodlar)} marka")
    if ihlal:
        print(f"  ✗ {len(ihlal)} ihlal")
        for x in ihlal:
            print("     ", *x)
        return 1
    print("  ✓ ihlal yok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
