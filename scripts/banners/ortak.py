#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Afisler icin ortak yardimcilar."""

import re


def markala(svg: str, onek: str) -> str:
    """Sinif ve keyframe adlarini markaya ozel hale getirir.

    NEDEN: afisler artik sayfaya GOMULUYOR (bkz. src/lib/inlineSvg.ts) ve
    dordu de ayni belgede duruyor. Hepsi ayni adlari kullaniyordu — .h0,
    .o0, @keyframes k1 — dolayisiyla birinin stili digerine uyguluyordu.

    Ilk cozum stil kurallarini duzenli ifadeyle kapsamlamakti; o yaklasim
    "@keyframes h0" kuralinin da onune secici koydu, kural gecersiz oldu,
    tarayici attı ve HICBIR animasyon calismadi. Kirilgandi.

    Dogru cozum burada: adlari kaynakta benzersiz yapiyoruz. Kapsamlamaya
    hic gerek kalmiyor, CSS'e dokunulmuyor.
    """
    # class="a b" iceriginden butun adlari topla
    siniflar = set()
    for m in re.finditer(r'class="([^"]+)"', svg):
        siniflar.update(m.group(1).split())

    # @keyframes adlari da genel kapsamdadir, onlar da benzersiz olmali
    kareler = set(re.findall(r"@keyframes\s+([\w-]+)", svg))

    for ad in sorted(siniflar, key=len, reverse=True):
        yeni = f"{onek}-{ad}"
        # Stil bloğundaki seçici
        svg = re.sub(rf"\.{re.escape(ad)}\b", f".{yeni}", svg)
        # class niteliği içindeki ad (tam kelime)
        svg = re.sub(
            rf'(class="[^"]*?)\b{re.escape(ad)}\b', rf"\1{yeni}", svg
        )

    for ad in sorted(kareler, key=len, reverse=True):
        yeni = f"{onek}-{ad}"
        svg = re.sub(rf"@keyframes\s+{re.escape(ad)}\b", f"@keyframes {yeni}", svg)
        # animation kisayolundaki ad
        svg = re.sub(rf"(animation:\s*){re.escape(ad)}\b", rf"\1{yeni}", svg)

    return svg
