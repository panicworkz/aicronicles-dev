# -*- coding: utf-8 -*-
"""Sade afisleri konu sayfalarina dagitir.

ANA SAYFA AYRI BIR HEDEF: ads.target_home. Once ana sayfa "hedefi
olmayan reklam" demekti; o zaman oraya reklam koymak icin butun
hedefleri silmek gerekiyordu ve bu reklami her yere birden aciyordu.
Simdi dort kampanya (her yuvaya bir marka) target_home ile
isaretleniyor; konu hedefi almadiklari icin hedefli reklami olmayan
sayfalari da beslemeyi surduruyorlar. Ev kampanyalari sepetim/feature,
glowi/rail, oryvane/measure, arackirala/panel; bu (marka, yuva) ciftleri
asagidaki KATEGORI / ETIKET tablolarinda YER ALMAZ. Markanin baska bir
yuvasi tabloda olabilir, kampanya ayri satirdir. Onceden superd/measure
secmistim, konu hedefi de aldi ve ana sayfanin measure yuvasi bos kaldi.

KURAL: bir sayfada dort yuva var (measure, feature, panel, rail),
dolayisiyla bir kategori ya da etiket icin ayni tarihlerde EN COK DORT
kampanya olabilir. Besincisine izin yok.

Her baglama dort MARKA veriliyor, her biri ayri bir yuvaya: sayfa dort
ayri marka gosteriyor, ayni markanin dort afisi degil.

Marka sirasi alakaya gore; ilk sirada duran markanin o konuyla bagi en
guclu olan. Uc marka (Oryvane, AracKirala, AracKiralama) icin dogal bir
konu yok — kiralamak satin almaktan ucuz oldugu ve sabun gunluk harcama
oldugu icin butce/tasarruf tarafina konuldu.
"""

# Sayfa turlerinin GERCEKTEN tasidigi yuvalar (src/app/(frontend)):
#   ana sayfa      panel, measure, feature, rail
#   kategori       measure
#   etiket         panel
#   yazar          panel
#   yazi           feature, rail   (baglam yazinin KATEGORISI)
#
# Bu yuzden yuva sirayla degil, SAYFANIN kullandigi yuvaya gore
# veriliyor: en alakali marka o baglamda gercekten gorunen yuvaya
# dusuyor. Once dondurmeli veriyordum ve /category/career'da birinci
# sirada TurcoPartners olmasina ragmen ekranda WP Care cikiyordu.
YUVA_SIRASI = {
    # kategori sayfasi measure basiyor; yazi sayfasi da kategoriyi
    # baglam olarak kullandigi icin feature ve rail hemen ardindan.
    "kategori": ["measure", "feature", "rail", "panel"],
    # etiket sayfasi panel basiyor.
    "etiket": ["panel", "measure", "feature", "rail"],
}

KATEGORI = {
    "ai-tech":          ["panicworkz", "aicall", "panictr", "uyorulmaz"],
    "career":           ["turco", "uyorulmaz", "testworkz", "wpcare"],
    "personal-finance": ["yerine", "superd", "cebinden", "sosyo"],
}

ETIKET = {
    "ai-tech":                  ["aicall", "panictr", "panicworkz", "testworkz"],
    "tools":                    ["panictr", "wpcare", "testworkz", "panicworkz"],
    "productivity":             ["testworkz", "wpcare", "panictr", "aicall"],
    "future-of-work":           ["aicall", "panicworkz", "uyorulmaz", "panictr"],
    "professional-development": ["uyorulmaz", "testworkz", "turco", "panicworkz"],
    "freelancing":              ["uyorulmaz", "wpcare", "panicworkz", "testworkz"],
    "remote-work":              ["aicall", "wpcare", "uyorulmaz", "panictr"],
    "career":                   ["turco", "panicworkz", "uyorulmaz", "testworkz"],
    "job-search":               ["turco", "panicworkz", "uyorulmaz", "wpcare"],
    "banking":                  ["turco", "cebinden", "sosyo", "yerine"],
    "investing":                ["turco", "superd", "yerine", "cebinden"],
    "wealth-building":          ["turco", "yerine", "arackirala", "superd"],
    "budgeting":                ["superd", "yerine", "arackiralama", "sepetim"],
    "savings":                  ["sosyo", "cebinden", "glowi", "oryvane"],
    "debt-management":          ["superd", "yerine", "cebinden", "sosyo"],
    "credit":                   ["cebinden", "sosyo", "turco", "yerine"],
    "side-income":              ["cebinden", "sosyo", "uyorulmaz", "yerine"],
    "personal-finance":         ["yerine", "cebinden", "superd", "sosyo"],
    "retirement":               ["yerine", "superd", "turco", "sosyo"],
}


# Ana sayfanin dort yuvasi — ads.target_home ile isaretli kampanyalar.
# Bunlar konu hedefi ALMAZ; hedefli reklami olmayan sayfalarin yedegi de
# onlar. Asagidaki tablolara sizarsa ana sayfada o yuva bos kalir.
EV = [
    ("oryvane", "measure"),
    ("sepetim", "feature"),
    ("arackirala", "panel"),
    ("glowi", "rail"),
]


def dagit():
    """(marka, yuva) -> {"kategori": [...], "etiket": [...]}"""
    hedef = {}
    for tur, sozluk in (("kategori", KATEGORI), ("etiket", ETIKET)):
        for konu, markalar in sozluk.items():
            assert len(markalar) <= 4, "%s icin dortten fazla marka" % konu
            for i, marka in enumerate(markalar):
                yuva = YUVA_SIRASI[tur][i]
                hedef.setdefault((marka, yuva), {"kategori": [], "etiket": []})
                hedef[(marka, yuva)][tur].append(konu)
    return hedef


if __name__ == "__main__":
    h = dagit()
    # Denetim: her baglamda en cok dort kampanya
    sayac = {}
    for (marka, yuva), d in h.items():
        for tur in ("kategori", "etiket"):
            for konu in d[tur]:
                sayac.setdefault((tur, konu), []).append((marka, yuva))
    asiri = {k: v for k, v in sayac.items() if len(v) > 4}
    assert not asiri, "dortten fazla: %s" % asiri
    yuvasiz = {k: v for k, v in sayac.items() if len({y for _, y in v}) != len(v)}
    assert not yuvasiz, "ayni yuvada iki kampanya: %s" % yuvasiz
    # Ev kampanyalari konu hedefi almamali, yoksa ana sayfada yuva bos kalir.
    sizan = [k for k in EV if k in h]
    assert not sizan, "ev kampanyasi konu hedefi aldi: %s" % sizan
    print("  bağlam sayısı:", len(sayac))
    print("  ana sayfa:", ", ".join("%s/%s" % x for x in EV))
    print("  hedeflenen kampanya:", len(h), "/ 64")
    print("  her bağlamda kampanya:", sorted({len(v) for v in sayac.values()}))
    for (tur, konu), v in sorted(sayac.items()):
        print("   %-9s %-26s %s" % (tur, konu, ", ".join("%s/%s" % x for x in v)))
