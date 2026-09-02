#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ag markalari icin afisler — 16 marka, 2 kreatif varyanti, 4 format.

DENEY
-----
Iki sey ayni anda olculuyor:

  kol      context | offset   Sayfanin konusuyla ortusuyor mu?
  kreatif  plain   | styled   Tek tip sade mi, kendi tarzi mi?

Bu iki faktoru boyle ayirmak sart. Yalnizca konu uyumunu olcup
tasarimlari serbest biraksaydik daha guzel afislere sahip kol kazanir
ve sonuc konu uyumu hakkinda hicbir sey soylemezdi. Simdi tasarim
karistirici degil, kendisi olculen degisken: kac okur sadeligi ve
icerigi onemsedi, kac okuru tasarim yonlendirdi.

  plain  : on altisi da AYNI. Marka rengi bile yok — saf Fabelo
           editoryali, kagit ve murekkep. Kontrol grubu.
  styled : sekiz tasarim karakteri (editorial, poster, ledger, split,
           swiss, tag, soft, mark); her marka kimligine uyani aliyor.

Ucuncu kirilim bedava geliyor: ad_events.created_at duruyor, yani gun
icindeki saate gore de bakabiliyoruz.

DIL
---
Sitenin butun icerigi su an ingilizce, afisler de oyle. Turkce destegi
geldigi gun her afisin Turkcesi hazir olsun diye metinler iki dilde
duruyor ve uretici dili parametre aliyor:

    python3 deney.py        -> public/media/deney/*.svg
    python3 deney.py tr     -> public/media/deney/tr/*.svg

Turkce metinler markalarin kendi sitelerinden alindi, ingilizceleri
onlarin sadik cevirisi. Hicbiri uydurulmadi.

RITIM
-----
Karakterler farkli ama SAAT ortak: 9 saniye, cubic-bezier(.16,1,.3,1).
Bir sayfada dort afis varsa dordu ayni anda giriyor, ayni anda cikiyor.
Senkron olmayinca goz saga sola cekilip yoruluyor.

ISLEMCI
-------
Yalnizca opacity ve transform. Yeniden yerlesim ya da boyama tetikleyen
hicbir kare yok; blur, filter, clip-path animasyonu yok.
"""

import pathlib
import sys
from ortak import markala

# Fabelo belirtecleri — sitenin globals.css'iyle ayni
KAGIT, KAGIT2 = "#faf8f4", "#f2eee6"
MUREKKEP, IKINCIL, UCUNCUL = "#15171a", "#4a4f57", "#8b9098"
KURAL = "#d9d3c6"

SURE = 9  # saniye — house.py ile ayni saat

FORMATLAR = {
    "measure": (1440, 200),
    "feature": (940, 180),
    "panel":   (511, 300),
    "rail":    (387, 540),
}

# Kaba genislik tahmini — gercek font metrigi yok, temkinli katsayilar.
# Punto bu tahmine gore SECILIYOR; sabit punto verince uzun basliklar
# cagri dugmesinin uzerine biniyordu.
SERIF_EM, SANS_EM = 0.50, 0.53


def kacir(s):
    """SVG bir XML belgesi; kacirilmamis & belgeyi bozar."""
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def sans_en(t, p):
    return len(t) * SANS_EM * p


def sigan(satirlar, alan, tavan, taban=17, em=SERIF_EM):
    """En uzun satiri alana sigdiran en buyuk punto."""
    u = max(len(x) for x in satirlar)
    return max(taban, min(tavan, int(alan / (u * em))))


def sar(metin, en, azami=3):
    kelimeler, satirlar, su = metin.split(), [], ""
    for k in kelimeler:
        if len(su) + len(k) + 1 <= en:
            su = (su + " " + k).strip()
        else:
            satirlar.append(su)
            su = k
    if su:
        satirlar.append(su)
    return satirlar[:azami]


# ---------------------------------------------------------------------
# Markalar
# ---------------------------------------------------------------------
def M(kod, ad, alan, kol, stil, renk, koyu, en, tr, hedef=()):
    return dict(kod=kod, ad=ad, alan=alan, kol=kol, stil=stil,
                renk=renk, koyu=koyu, metin={"en": en, "tr": tr},
                hedef=list(hedef))


MARKALAR = [
    # ---- ORTUSEN KOL -------------------------------------------------
    M("aicall", "AICall", "aicall.pw", "context", "editorial", "#0FA36B", "#0A0908",
      en=(["Every call answered.", "Any language."],
          "AI voice agents that pick up 24/7, at any scale.", "Hear a live demo"),
      tr=(["Her arama yanıtlanır.", "Her dilde."],
          "7/24 açan yapay zeka sesli ajanlar, her ölçekte.", "Canlı demoyu dinle"),
      hedef=["ai-tech"]),

    M("yerine", "Yerine", "yerine.com.tr", "context", "tag", "#E4572E", "#1B1B1B",
      en=(["Compare first.", "Then buy."],
          "Price comparison and purchase, in one place.", "See prices"),
      tr=(["Önce karşılaştır.", "Sonra al."],
          "Fiyat karşılaştırma ve satın alma, tek yerde.", "Fiyatlara bak"),
      hedef=["personal-finance"]),

    M("turco", "TurcoPartners", "turcopartners.com", "offset", "split", "#B08D57", "#14263A",
      en=(["Made in Türkiye.", "Sold in America."],
          "Sourcing, compliance, fulfilment and customs, end to end.", "Start sourcing"),
      tr=(["Türkiye'de üretilir.", "Amerika'da satılır."],
          "Tedarik, uygunluk, sevkiyat ve gümrük, uçtan uca.", "Tedariğe başla")),

    M("wpcare", "WP Care", "wpcare.pw", "context", "swiss", "#2563EB", "#0F172A",
      en=(["Your WordPress,", "looked after."],
          "Updates, backups, security and uptime, handled.", "See the plans"),
      tr=(["WordPress'iniz,", "emin ellerde."],
          "Güncelleme, yedek, güvenlik ve çalışma süresi, hepsi bizde.", "Paketleri gör"),
      hedef=["ai-tech"]),

    # ---- ORTUSMEYEN KOL ----------------------------------------------
    M("sepetim", "Sepetimbenim", "sepetimbenim.com", "offset", "soft", "#FFB000", "#2A2418",
      en=(["Chosen with care", "for small paws."],
          "Food, toys and grooming for dogs, cats and little companions.", "Visit the shop"),
      tr=(["Patili dostlar için", "özenle seçildi."],
          "Köpek, kedi ve küçük dostlar için mama, oyuncak ve bakım.", "Mağazaya git")),

    M("cebinden", "Cebinden", "cebinden.com", "offset", "poster", "#FF929A", "#6F020A",
      en=(["Buy and sell.", "Pocket intact."],
          "Transparent commission and secure escrow payments.", "Join early access"),
      tr=(["Cebini yakmadan", "al-sat."],
          "Şeffaf komisyon ve güvenli emanet ödemeli ikinci el pazar yeri.", "Erken erişime katıl")),

    M("sosyo", "SosyoMarket", "sosyomarket.com", "offset", "tag", "#7C3AED", "#111111",
      en=(["Shopping is not", "a solo sport."],
          "Real reviews, community picks and group deals.", "See the community"),
      tr=(["Alışveriş artık", "tek başına değil."],
          "Gerçek yorumlar, topluluk önerileri ve grup fırsatları.", "Topluluğu gör")),

    M("superd", "Superdamping", "superdamping.com", "offset", "ledger", "#C2410C", "#111111",
      en=(["Someone closed.", "You get the price."],
          "Bankruptcy lots and end-of-line stock, every lot numbered.", "Open the ledger"),
      tr=(["Birinin kapanışı,", "senin fiyatın."],
          "İflas partileri ve seri sonu stok, her lot numaralı.", "Kaydı aç")),

    M("uyorulmaz", "Ufuk Yorulmaz", "ufukyorulmaz.com", "offset", "mark", "#FFB000", "#222533",
      en=(["Systems architect.", "AI builder."],
          "Founder of PanicWorkz, WpCare, Yerine, AICall and Fabelo.", "See the work"),
      tr=(["Kurumsal mimar.", "Yapay zeka sistemleri."],
          "PanicWorkz, WpCare, Yerine, AICall ve Fabelo'nun kurucusu.", "Çalışmaları gör")),

    M("glowi", "Glowi", "glowi.today", "offset", "editorial", "#C9756C", "#2B1F1D",
      en=(["Real beauty advice.", "Honest reviews."],
          "Ingredients that work, and the ones that do not.", "Read the reviews"),
      tr=(["Gerçek güzellik tavsiyesi.", "Dürüst incelemeler."],
          "İşe yarayan içerikler ve yaramayanlar.", "İncelemeleri oku")),

    M("oryvane", "Oryvane", "oryvane.com", "offset", "soft", "#00D084", "#101410",
      en=(["Pure harmony,", "made of botanicals."],
          "Sustainable soaps and natural skincare, gentle and elegant.", "Shop the range"),
      tr=(["Saf uyum,", "bitkilerden."],
          "Sürdürülebilir sabunlar ve doğal cilt bakımı, zarif ve nazik.", "Ürünlere bak")),

    M("testworkz", "Testworkz", "testworkz.com", "offset", "ledger", "#EF4F2F", "#133E31",
      en=(["Ship with", "confidence."],
          "User flows, WCAG 2.2 accessibility, performance and load testing.", "Start testing"),
      tr=(["Yazılım testiyle", "yayına güvenle çıkın."],
          "Kullanıcı akışı, WCAG 2.2 erişilebilirlik, performans ve yük testi.", "Testi başlat")),

    M("panictr", "PANIC", "panic.com.tr", "offset", "swiss", "#4A4F57", "#0C0D12",
      en=(["Software and", "infrastructure."],
          "One technical owner for product, data and operations.", "See the studio"),
      tr=(["Yazılım ve altyapı", "mühendisliği."],
          "Ürün, veri ve operasyon için tek teknik sorumluluk.", "Stüdyoyu gör")),

    M("panicworkz", "Panicworkz", "panicworkz.com", "offset", "poster", "#D83F3F", "#0C0C3F",
      en=(["We thrive", "under pressure."],
          "Digital agency and outsourcing partner, 17+ years.", "Start a project"),
      tr=(["Baskı altında", "büyürüz."],
          "Dijital ajans ve dış kaynak ortağı, 17+ yıl.", "Projeye başla")),

    M("arackiralama", "AracKiralama", "arackiralama.pw", "offset", "mark", "#C2410C", "#14263A",
      en=(["The open road,", "within budget."],
          "Economy, mid-size, SUV, commercial and hybrid, by the day.", "Pick a car"),
      tr=(["Yola çıkmak", "artık hesaplı."],
          "Ekonomi, orta sınıf, SUV, ticari ve hibrit, günlük kiralama.", "Araç seç")),

    M("arackirala", "AracKirala", "arackirala.pw", "offset", "split", "#C8A45C", "#12100C",
      en=(["Premium cars,", "booked online."],
          "A wide luxury fleet and effortless online reservation.", "See the fleet"),
      tr=(["Premium araç,", "online rezervasyon."],
          "Geniş lüks filo ve kolay online rezervasyon.", "Filoyu gör")),
]


# ---------------------------------------------------------------------
# Ortak hareket. Karakterler farkli, saat ayni.
# ---------------------------------------------------------------------
def stil_blogu(ek=""):
    return """
    .disp { font-family: Georgia, "Times New Roman", serif }
    .sans { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif }
    .mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace }

    .g1 { animation: gir SUREs cubic-bezier(.16,1,.3,1) infinite }
    .g2 { animation: gir SUREs cubic-bezier(.16,1,.3,1) .18s infinite }
    .g3 { animation: gir SUREs cubic-bezier(.16,1,.3,1) .36s infinite }
    @keyframes gir {
      0%      { opacity:0; transform:translateY(10px) }
      7%,92%  { opacity:1; transform:none }
      100%    { opacity:0; transform:translateY(-6px) }
    }

    .cag { animation: cagri SUREs cubic-bezier(.16,1,.3,1) infinite }
    @keyframes cagri {
      0%      { opacity:0; transform:translateY(10px) scale(.98) }
      9%,34%  { opacity:1; transform:none }
      40%     { transform:scale(1.035) }
      46%,92% { transform:none }
      100%    { opacity:0; transform:translateY(-6px) }
    }

    .cizgi { animation: cizgi SUREs cubic-bezier(.16,1,.3,1) infinite; transform-origin: left center }
    @keyframes cizgi {
      0%      { opacity:0; transform:scaleX(0) }
      10%,92% { opacity:1; transform:scaleX(1) }
      100%    { opacity:0; transform:scaleX(1) }
    }
    /* Imlec: sagdan gelir, cagrinin ustune konar, dokunur, cekilir.
       Ayni 9 saniyelik saatin icinde — afisteki her sey gibi. */
    .imlec { animation: imlec SUREs cubic-bezier(.16,1,.3,1) infinite }
    @keyframes imlec {
      0%,30%   { opacity:0; transform:translate(22px,16px) }
      42%,50%  { opacity:1; transform:translate(0,0) }
      54%      { opacity:1; transform:translate(0,2.5px) }
      58%,78%  { opacity:1; transform:translate(0,0) }
      88%,100% { opacity:0; transform:translate(14px,10px) }
    }
    /* Dokunusta cagri 1.5 piksel coküyor — ziplama yok. */
    .dokunus { animation: dokunus SUREs cubic-bezier(.16,1,.3,1) infinite }
    @keyframes dokunus {
      0%      { opacity:0; transform:translateY(10px) }
      9%,52%  { opacity:1; transform:none }
      55%     { transform:translateY(1.5px) }
      60%,92% { transform:none }
      100%    { opacity:0; transform:translateY(-6px) }
    }
    /* Tek halka, tek kez. Surekli yanip sonen hicbir sey yok. */
    .halka { animation: halka SUREs cubic-bezier(.16,1,.3,1) infinite; transform-origin: center }
    @keyframes halka {
      0%,53%  { opacity:0; transform:scale(.35) }
      57%     { opacity:.5; transform:scale(.6) }
      68%,100%{ opacity:0; transform:scale(1.15) }
    }
EK
    @media (prefers-reduced-motion: reduce) {
      * { animation:none !important; opacity:1 !important; transform:none !important }
    }
""".replace("EK", ek).replace("SURE", str(SURE))


def dugme(x, y, metin, punto, zemin, yazi, yuk=40):
    en = sans_en(metin, punto) + 44
    return en, ('<g class="cag"><rect x="%.0f" y="%.0f" width="%.0f" height="%d" rx="%.0f" fill="%s"/>'
                '<text class="sans" x="%.0f" y="%.0f" font-size="%d" letter-spacing="0.8" '
                'font-weight="600" fill="%s" text-anchor="middle">%s</text></g>'
                % (x, y, en, yuk, yuk/2, zemin, x + en/2, y + yuk/2 + punto*0.36, punto, yazi, metin))



def imlec(x, y, boy=30, renk=None):
    """Klasik el imleci — isaret parmagi yukari, basparmak acik.

    NEDEN: sade afislerde koca bir hap dugme vardi ve goz her seferinde
    asagi cekiliyordu; afisin kendisi degil dugme okunuyordu. Yerine
    ince alti cizili bir cagri koyduk, imlec de gelip ona dokunuyor.
    Anlatilan sey su: "baktim, dogru karar, tikliyorum."

    Dokunus dugmeyi ZIPLATMIYOR. Sert bir hareket reklam paniginin
    dili; burada 1.5 piksellik bir cokme ve sonen tek bir halka var.
    """
    c = renk or MUREKKEP
    o = boy / 34.0
    return ('<g class="imlec" transform="translate(%.1f,%.1f) scale(%.3f)">'
            # Cevresine kagit renginde ince bir hat: koyu zeminde de,
            # acik zeminde de eli metinden ayiriyor.
            '<g fill="%s" stroke="%s" stroke-width="2.5" stroke-linejoin="round">'
            '<path d="M13 4a2.5 2.5 0 0 1 5 0v12h-5z"/>'
            '<path d="M18 10a2.2 2.2 0 0 1 4.4 0v6h-4.4z"/>'
            '<path d="M22.4 11.5a2.2 2.2 0 0 1 4.4 0v4.5h-4.4z"/>'
            '<path d="M13 12.5 8.6 17c-1.4 1.4-1.4 2.9 0 4.3l4.4 4.4z"/>'
            '<path d="M13 14h13.8a3.6 3.6 0 0 1 3.6 3.6v6.6a8 8 0 0 1-8 8h-5.2a8 8 0 0 1-8-8V17z"/>'
            '</g>'
            '<g fill="%s">'
            '<path d="M13 4a2.5 2.5 0 0 1 5 0v12h-5z"/>'
            '<path d="M18 10a2.2 2.2 0 0 1 4.4 0v6h-4.4z"/>'
            '<path d="M22.4 11.5a2.2 2.2 0 0 1 4.4 0v4.5h-4.4z"/>'
            '<path d="M13 12.5 8.6 17c-1.4 1.4-1.4 2.9 0 4.3l4.4 4.4z"/>'
            '<path d="M13 14h13.8a3.6 3.6 0 0 1 3.6 3.6v6.6a8 8 0 0 1-8 8h-5.2a8 8 0 0 1-8-8V17z"/>'
            '</g></g>' % (x, y, o, KAGIT, KAGIT, c))



# Klasik piksel el imleci — dogrudan cizildi, disaridan indirilmedi.
# Stok gorseller "ticari olmayan kullanim" lisansiyla dagitiliyor ve
# siteye dis bagimlilik geri gelirdi; oysa butun dis gorselleri
# temizlemistik.
#
# Yalnizca SILUET yaziliyor; kontur ondan TURETILIYOR (dort komsusundan
# biri disarida olan piksel hattir). Ilk denemede konturu elle cizmistim,
# avucun sol ve alt kenarinda hat kapanmadi ve el delik goruldu.
#
# CIZGILER: parmak aralari. Ikinci denemede el tek parca bir kurek gibi
# goruyordu — klasik imlecin okunmasini saglayan sey kademeli parmaklar
# ve aralarindaki hat. Bunlar siluetten turemez, ayrica yaziliyor.
PIKSEL_EL = [
    ".....XXX........",
    ".....XXX........",
    ".....XXX........",
    ".....XXX........",
    ".....XXX........",
    ".....XXX........",
    ".....XXXXXX.....",
    ".....XXXXXX.....",
    ".....XXXXXXXXX..",
    ".XXX.XXXXXXXXX..",
    ".XXXXXXXXXXXXXX.",
    ".XXXXXXXXXXXXXX.",
    ".XXXXXXXXXXXXXX.",
    "..XXXXXXXXXXXXX.",
    "..XXXXXXXXXXXXX.",
    "...XXXXXXXXXXXX.",
    "...XXXXXXXXXXXX.",
    "...XXXXXXXXXXXX.",
    "...XXXXXXXXXXXX.",
    "....XXXXXXXXXXX.",
    "....XXXXXXXXXX..",
]

# (x, ilk_satir, son_satir) — parmak aralarindaki dikey hatlar
PIKSEL_CIZGI = [
    (8,  6, 10),   # isaret / orta
    (11, 8, 10),   # orta / yuzuk
    (13, 9, 10),   # yuzuk / serce
    (4,  9, 12),   # basparmak ayrimi
]


def imlec_piksel(x, y, boy=34, renk=None):
    """Klasik piksel el imleci.

    shape-rendering=crispEdges sart: onsuz tarayici kareleri yumusatir
    ve piksel olmanin anlami kalmaz.
    """
    c = renk or MUREKKEP
    g = PIKSEL_EL
    yuk, en = len(g), len(g[0])
    bir = boy / yuk

    def dolu(sx, sy):
        return 0 <= sy < yuk and 0 <= sx < en and g[sy][sx] == "X"

    hatlar = set()
    for cx, y0, y1 in PIKSEL_CIZGI:
        for sy in range(y0, y1 + 1):
            hatlar.add((cx, sy))

    kareler = []
    for sy in range(yuk):
        for sx in range(en):
            if not dolu(sx, sy):
                continue
            kenar = not (dolu(sx-1, sy) and dolu(sx+1, sy)
                         and dolu(sx, sy-1) and dolu(sx, sy+1))
            murekkep = kenar or (sx, sy) in hatlar
            kareler.append('<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f" fill="%s"/>'
                           % (sx*bir, sy*bir, bir + .03, bir + .03,
                              c if murekkep else KAGIT))
    return ('<g class="imlec" transform="translate(%.1f,%.1f)" shape-rendering="crispEdges">%s</g>'
            % (x, y, "".join(kareler)))


def cagri_baglantisi(x, y, metin, punto, renk=None):
    """Alti cizili cagri + parmak ucuyla ona dokunan klasik el imleci.

    Dugmenin yerini aliyor: hap dugme gozu her seferinde asagi cekiyor,
    okunan sey afis degil dugme oluyordu.

    YERLESIM: el metnin USTUNE degil, cizginin sag ucunun ALTINA
    geliyor. Ilk denemede tam metnin ortasindaydi ve kelimeleri
    kapatiyordu; halka da bir kelimeyi cemberlemis gibi duruyordu.
    Parmak ucu cizgiye deger, govde asagi sarkar — ekranda gercekte
    oldugu gibi.
    """
    c = renk or MUREKKEP
    en = sans_en(metin, punto) + 2
    boy = punto * 2.4
    # Parmak ucu izgarada (5, 0) hucresi; el oraya gore konumlaniyor ki
    # uc tam cizginin sag ucuna dokunsun.
    bir = boy / len(PIKSEL_EL)
    uc_x, uc_y = x + en + 7, y + 7
    el_x = uc_x - 6 * bir
    el_y = uc_y
    return en, (
        # Halka once: elin ve metnin ARKASINDA kalsin
        # Dokunusta parmak ucunda tek bir nabiz. Sonsuz yanip sonen
        # hicbir sey yok; bir kez cikip soner.
        '<circle class="halka" cx="%.0f" cy="%.0f" r="9" fill="none" stroke="%s" stroke-width="1.5"/>'
        '<g class="dokunus">'
        '<text class="sans" x="%d" y="%d" font-size="%d" letter-spacing="0.6" '
        'font-weight="700" fill="%s">%s</text>'
        '<rect x="%d" y="%.0f" width="%.0f" height="1.5" fill="%s"/>'
        '</g>'
        '%s'
        % (uc_x, uc_y + 1, c,
           x, y, punto, c, metin,
           x, y + 7, en + 5, c,
           imlec_piksel(el_x, el_y, boy, c)))


def _olcu(bicim):
    if bicim == "measure":
        return dict(K=48, ad=15, bas_tavan=42, alt=17, cag=14)
    if bicim == "feature":
        return dict(K=40, ad=13, bas_tavan=32, alt=15, cag=13)
    if bicim == "panel":
        return dict(K=34, ad=12, bas_tavan=30, alt=14, cag=12)
    return dict(K=32, ad=13, bas_tavan=28, alt=14, cag=12)


def _kuyruk(m, t, o, K, y, w, h, alan, ikincil, zemin_d=None, yazi_d=None):
    """Yigin duzenlerde ortak kuyruk: destek metni + tabana yasli cagri."""
    p = []
    cy = h - K - 36
    ab = o["alt"]
    parca = sar(t["alt"], int(alan / (SANS_EM*ab)))
    while len(parca)*int(ab*1.45) > (cy - y - 14) and ab > 11:
        ab -= 1
        parca = sar(t["alt"], int(alan / (SANS_EM*ab)))
    for i, s in enumerate(parca):
        p.append('<text class="sans g3" x="%d" y="%d" font-size="%d" fill="%s">%s</text>'
                 % (K, y + 20 + ab + i*int(ab*1.45), ab, ikincil, s))
    _, dg = dugme(K, cy, t["cagri"], o["cag"], zemin_d or m["koyu"], yazi_d or KAGIT, 34)
    p.append(dg)
    p.append('<text class="sans g3" x="%d" y="%d" font-size="11" letter-spacing="1.2" '
             'fill="%s" text-anchor="end">%s</text>' % (w-K, cy+22, UCUNCUL, m["alan"]))
    return p


def _sag_cagri(m, t, o, w, h, cx, cw, zemin=None, yazi=None):
    p = []
    _, dg = dugme(cx, h/2 - 20, t["cagri"], o["cag"], zemin or m["koyu"], yazi or KAGIT)
    p.append(dg)
    p.append('<text class="sans g3" x="%.0f" y="%.0f" font-size="11" letter-spacing="1.2" '
             'fill="%s" text-anchor="middle">%s</text>' % (cx + cw/2, h/2 + 38, UCUNCUL, m["alan"]))
    return p


# ---------------------------------------------------------------------
# KONTROL: tek tip sade
# ---------------------------------------------------------------------
def k_plain(m, w, h, bicim, t, o, serit):
    """On alti markanin hepsinde AYNI. Deneyin kontrol grubu.

    Marka rengi yok, sus yok — kagit, murekkep ve tek bir hairline.
    Ama SADE, BOS demek degil. Ilk surumde dikey formatin ortasi
    bombostu ve ucuz duruyordu; bosluk artik susle degil TIPOGRAFIYLE
    doluyor: baslik alani ne kadar veriyorsa o kadar buyuyor. Guvenli
    bir punto secip ortayi bos birakmak kolaydi, dogru olan degil.

    Hap dugme de kalkti. Goz her seferinde asagi, dugmeye cekiliyordu;
    okunan sey afis degil dugme oluyordu. Yerine alti cizili bir cagri
    ve ona dokunan klasik el imleci var.
    """
    K, p = o["K"], []

    if serit:
        cagri_en = sans_en(t["cagri"], o["cag"] + 1) + 2
        cx = w - K - cagri_en
        alan = cx - K - 56          # imlece de yer birakiyoruz
        tek = " ".join(t["bas"])
        bb = sigan([tek], alan, o["bas_tavan"], 20)
        blok = 20 + bb + o["alt"] + 22
        ust = (h - blok) / 2
        p.append('<text class="sans g1" x="%d" y="%.0f" font-size="%d" letter-spacing="1.8" '
                 'font-weight="700" fill="%s">%s</text>' % (K, ust - 9, o["ad"], MUREKKEP, t["ad"].upper()))
        p.append('<rect class="cizgi" x="%d" y="%.0f" width="%.0f" height="1" fill="%s"/>' % (K, ust, alan, KURAL))
        p.append('<text class="disp g2" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + 22 + bb, bb, MUREKKEP, tek))
        ab = o["alt"]
        while sans_en(t["alt"], ab) > alan and ab > 11:
            ab -= 1
        p.append('<text class="sans g3" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + blok, ab, IKINCIL, t["alt"]))
        _, cg = cagri_baglantisi(cx, h/2 - 4, t["cagri"], o["cag"] + 1)
        p.append(cg)
        p.append('<text class="sans g3" x="%.0f" y="%.0f" font-size="11" letter-spacing="1.2" '
                 'fill="%s" text-anchor="middle">%s</text>'
                 % (cx + cagri_en/2, h/2 + 34, UCUNCUL, m["alan"]))
    else:
        alan = w - 2*K
        y_ad = K + 16
        y_cagri = h - K - 16
        # Baslik ve destek metni icin gercekte kalan yukseklik. Punto bunu
        # DOLDURACAK sekilde seciliyor; sabit bir tavan verip ortayi bos
        # birakmak dikey formati ucuz gosteriyordu.
        bosluk = y_cagri - (y_ad + 34) - 30
        satirlar = t["bas"]
        parca_alt = None
        for tavan in range(46, 18, -1):
            sat = int(tavan * 1.18)
            if max(len(x) for x in satirlar) * SERIF_EM * tavan > alan:
                continue
            ab = max(12, min(o["alt"] + 3, int(tavan * 0.46)))
            pa = sar(t["alt"], int(alan / (SANS_EM * ab)))
            yuk = len(satirlar) * sat + 26 + len(pa) * int(ab * 1.45)
            if yuk <= bosluk:
                bb, satir, parca_alt, ab_son = tavan, sat, pa, ab
                break
        else:
            bb, satir, ab_son = 19, 23, o["alt"]
            parca_alt = sar(t["alt"], int(alan / (SANS_EM * ab_son)))

        p.append('<text class="sans g1" x="%d" y="%d" font-size="%d" letter-spacing="1.8" '
                 'font-weight="700" fill="%s">%s</text>' % (K, y_ad, o["ad"], MUREKKEP, t["ad"].upper()))
        p.append('<rect class="cizgi" x="%d" y="%d" width="%d" height="1" fill="%s"/>' % (K, y_ad + 12, alan, KURAL))

        # Blok dikeyde ortalaniyor — ustte toplanip altta bosluk birakmasin
        yuk = len(satirlar) * satir + 26 + len(parca_alt) * int(ab_son * 1.45)
        y = y_ad + 34 + max(0, (bosluk - yuk) / 2) + bb
        for i, sat_metin in enumerate(satirlar):
            p.append('<text class="disp g2" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                     % (K, y + i*satir, bb, MUREKKEP, sat_metin))
        y += (len(satirlar)-1)*satir + 26
        for i, parca in enumerate(parca_alt):
            p.append('<text class="sans g3" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                     % (K, y + ab_son + i*int(ab_son*1.45), ab_son, IKINCIL, parca))

        p.append('<rect class="cizgi" x="%d" y="%d" width="%d" height="1" fill="%s"/>'
                 % (K, y_cagri - 30, alan, KURAL))
        _, cg = cagri_baglantisi(K, y_cagri, t["cagri"], o["cag"] + 1)
        p.append(cg)
        p.append('<text class="sans g3" x="%d" y="%d" font-size="11" letter-spacing="1.2" '
                 'fill="%s" text-anchor="end">%s</text>' % (w-K, y_cagri, UCUNCUL, m["alan"]))

    # Ust seritte bile marka rengi yok — kontrolun tek tipligi bozulmasin
    return p, KAGIT, "", MUREKKEP


# ---------------------------------------------------------------------
# STILLI: sekiz karakter
# ---------------------------------------------------------------------
def k_editorial(m, w, h, bicim, t, o, serit):
    """Dergi sayfasi: ince ust kural, iri serif baslik, sagda cagri."""
    K, p = o["K"], []
    if serit:
        cw, _ = dugme(0, 0, t["cagri"], o["cag"], m["koyu"], KAGIT)
        cx = w - K - cw
        alan = cx - K - 30
        tek = " ".join(t["bas"])
        bb = sigan([tek], alan, o["bas_tavan"], 20)
        blok = 20 + bb + o["alt"] + 22
        ust = (h - blok) / 2
        p.append('<rect class="cizgi" x="%d" y="%.0f" width="%.0f" height="4" fill="%s"/>' % (K, ust, alan, m["renk"]))
        p.append('<text class="disp g1" x="%d" y="%.0f" font-size="%d" font-style="italic" '
                 'fill="%s">%s</text>' % (K, ust - 11, o["ad"] + 5, m["koyu"], t["ad"]))
        p.append('<rect class="cizgi" x="%d" y="%.0f" width="%.0f" height="1" fill="%s"/>'
                 % (K, ust + 8, alan, KURAL))
        p.append('<text class="disp g2" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + 22 + bb, bb, MUREKKEP, tek))
        ab = o["alt"]
        while sans_en(t["alt"], ab) > alan and ab > 11:
            ab -= 1
        p.append('<text class="sans g3" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + blok, ab, IKINCIL, t["alt"]))
        p += _sag_cagri(m, t, o, w, h, cx, cw)
    else:
        alan = w - 2*K
        bb = sigan(t["bas"], alan, o["bas_tavan"], 19)
        y = K + 16
        p.append('<text class="disp g1" x="%d" y="%d" font-size="%d" font-style="italic" '
                 'fill="%s">%s</text>' % (K, y, o["ad"] + 5, m["koyu"], t["ad"]))
        p.append('<rect class="cizgi" x="%d" y="%d" width="%d" height="4" fill="%s"/>' % (K, y+10, alan, m["renk"]))
        p.append('<rect class="cizgi" x="%d" y="%d" width="%d" height="1" fill="%s"/>' % (K, y+18, alan, KURAL))
        y += 38 + bb
        for i, s in enumerate(t["bas"]):
            p.append('<text class="disp g2" x="%d" y="%d" font-size="%d" fill="%s">%s</text>'
                     % (K, y + i*int(bb*1.2), bb, MUREKKEP, s))
        y += (len(t["bas"])-1)*int(bb*1.2)
        p += _kuyruk(m, t, o, K, y, w, h, alan, IKINCIL)
    return p, KAGIT, "", m["koyu"]


def k_poster(m, w, h, bicim, t, o, serit):
    """Afis: koyu marka zemini, kagit rengi yazi, tek diyagonal serit."""
    K, p = o["K"], []
    zemin, yazi, ikincil = m["koyu"], KAGIT, "#ffffffb3"
    p.append('<rect class="serit" x="%.0f" y="-20" width="%.0f" height="%d" fill="%s" opacity=".16" '
             'transform="skewX(-16)"/>' % (w*0.62, w*0.5, h+40, m["renk"]))
    if serit:
        cw, _ = dugme(0, 0, t["cagri"], o["cag"], KAGIT, zemin)
        cx = w - K - cw
        alan = cx - K - 30
        tek = " ".join(t["bas"])
        bb = sigan([tek], alan, o["bas_tavan"], 20, SANS_EM)
        blok = 20 + bb + o["alt"] + 22
        ust = (h - blok)/2
        p.append('<text class="sans g1" x="%d" y="%.0f" font-size="%d" letter-spacing="2.6" '
                 'font-weight="700" fill="%s">%s</text>' % (K, ust - 4, o["ad"], m["renk"], t["ad"].upper()))
        p.append('<text class="sans g2" x="%d" y="%.0f" font-size="%d" font-weight="800" '
                 'letter-spacing="-0.4" fill="%s">%s</text>' % (K, ust + 22 + bb, bb, yazi, tek.upper()))
        ab = o["alt"]
        while sans_en(t["alt"], ab) > alan and ab > 11:
            ab -= 1
        p.append('<text class="sans g3" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + blok, ab, ikincil, t["alt"]))
        _, dg = dugme(cx, h/2 - 20, t["cagri"], o["cag"], KAGIT, zemin)
        p.append(dg)
    else:
        alan = w - 2*K
        bb = sigan(t["bas"], alan, o["bas_tavan"], 19, SANS_EM)
        y = K + 16
        p.append('<text class="sans g1" x="%d" y="%d" font-size="%d" letter-spacing="2.6" '
                 'font-weight="700" fill="%s">%s</text>' % (K, y, o["ad"], m["renk"], t["ad"].upper()))
        y += 26 + bb
        for i, s in enumerate(t["bas"]):
            p.append('<text class="sans g2" x="%d" y="%d" font-size="%d" font-weight="800" '
                     'letter-spacing="-0.4" fill="%s">%s</text>' % (K, y + i*int(bb*1.15), bb, yazi, s.upper()))
        y += (len(t["bas"])-1)*int(bb*1.15)
        p += _kuyruk(m, t, o, K, y, w, h, alan, ikincil, KAGIT, zemin)
    ek = """
    .serit { animation: serit SUREs cubic-bezier(.16,1,.3,1) infinite }
    @keyframes serit {
      0%      { opacity:0; transform:skewX(-16deg) translateX(40px) }
      12%,92% { opacity:.16; transform:skewX(-16deg) translateX(0) }
      100%    { opacity:0; transform:skewX(-16deg) translateX(-20px) }
    }
"""
    return p, zemin, ek, m["renk"]


def k_ledger(m, w, h, bicim, t, o, serit):
    """Kayit defteri: monospace ust satir, yatay kurallar, lot hissi."""
    K, p = o["K"], []
    ust_satir = "%s . %s" % (m["ad"].upper(), m["alan"])
    if serit:
        cw, _ = dugme(0, 0, t["cagri"], o["cag"], m["koyu"], KAGIT)
        cx = w - K - cw
        alan = cx - K - 30
        tek = " ".join(t["bas"])
        bb = sigan([tek], alan, o["bas_tavan"], 20)
        blok = 22 + bb + o["alt"] + 24
        ust = (h - blok)/2
        p.append('<text class="mono g1" x="%d" y="%.0f" font-size="%d" letter-spacing="1.4" fill="%s">%s</text>'
                 % (K, ust - 6, o["ad"]-2, m["renk"], ust_satir))
        p.append('<rect class="cizgi" x="%d" y="%.0f" width="%.0f" height="2" fill="%s"/>' % (K, ust, alan, MUREKKEP))
        p.append('<text class="disp g2" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + 24 + bb, bb, MUREKKEP, tek))
        ab = o["alt"]
        while sans_en(t["alt"], ab) > alan and ab > 11:
            ab -= 1
        p.append('<rect class="cizgi" x="%d" y="%.0f" width="%.0f" height="1" fill="%s"/>'
                 % (K, ust + blok - ab - 12, alan, KURAL))
        p.append('<text class="mono g3" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + blok + 2, ab-1, IKINCIL, t["alt"]))
        p += _sag_cagri(m, t, o, w, h, cx, cw)
    else:
        alan = w - 2*K
        bb = sigan(t["bas"], alan, o["bas_tavan"], 19)
        y = K + 14
        p.append('<text class="mono g1" x="%d" y="%d" font-size="%d" letter-spacing="1.4" fill="%s">%s</text>'
                 % (K, y, o["ad"]-2, m["renk"], ust_satir))
        p.append('<rect class="cizgi" x="%d" y="%d" width="%d" height="2" fill="%s"/>' % (K, y+10, alan, MUREKKEP))
        y += 30 + bb
        for i, s in enumerate(t["bas"]):
            p.append('<text class="disp g2" x="%d" y="%d" font-size="%d" fill="%s">%s</text>'
                     % (K, y + i*int(bb*1.2), bb, MUREKKEP, s))
        y += (len(t["bas"])-1)*int(bb*1.2)
        p.append('<rect class="cizgi" x="%d" y="%d" width="%d" height="1" fill="%s"/>' % (K, y+12, alan, KURAL))
        p += _kuyruk(m, t, o, K, y+6, w, h, alan, IKINCIL)
    return p, KAGIT2, "", MUREKKEP


def k_split(m, w, h, bicim, t, o, serit):
    """Ikiye bolunmus: koyu marka blogu ve kagit uzerinde metin."""
    K, p = o["K"], []
    if serit:
        bw = int(w * 0.19)
        p.append('<rect x="0" y="0" width="%d" height="%d" fill="%s"/>' % (bw, h, m["koyu"]))
        p.append('<rect x="%d" y="0" width="4" height="%d" fill="%s"/>' % (bw, h, m["renk"]))
        p.append('<text class="sans g1" x="%.0f" y="%.0f" font-size="%d" letter-spacing="2.2" '
                 'font-weight="700" fill="%s" text-anchor="middle">%s</text>'
                 % (bw/2, h/2 - 4, o["ad"]+3, KAGIT, t["ad"].upper()))
        p.append('<text class="sans g3" x="%.0f" y="%.0f" font-size="11" letter-spacing="1.2" '
                 'fill="%s" text-anchor="middle">%s</text>' % (bw/2, h/2 + 16, m["renk"], m["alan"]))
        sol = bw + 34
        cw, _ = dugme(0, 0, t["cagri"], o["cag"], m["koyu"], KAGIT)
        cx = w - K - cw
        alan = cx - sol - 30
        tek = " ".join(t["bas"])
        bb = sigan([tek], alan, o["bas_tavan"], 20)
        blok = bb + o["alt"] + 22
        ust = (h - blok)/2
        p.append('<text class="disp g2" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (sol, ust + bb, bb, MUREKKEP, tek))
        ab = o["alt"]
        while sans_en(t["alt"], ab) > alan and ab > 11:
            ab -= 1
        p.append('<text class="sans g3" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (sol, ust + blok, ab, IKINCIL, t["alt"]))
        _, dg = dugme(cx, h/2 - 20, t["cagri"], o["cag"], m["koyu"], KAGIT)
        p.append(dg)
    else:
        bh = int(h * 0.26)
        p.append('<rect x="0" y="0" width="%d" height="%d" fill="%s"/>' % (w, bh, m["koyu"]))
        p.append('<rect x="0" y="%d" width="%d" height="4" fill="%s"/>' % (bh, w, m["renk"]))
        p.append('<text class="sans g1" x="%d" y="%.0f" font-size="%d" letter-spacing="2.2" '
                 'font-weight="700" fill="%s">%s</text>' % (K, bh/2 + 2, o["ad"]+2, KAGIT, t["ad"].upper()))
        p.append('<text class="sans g1" x="%d" y="%.0f" font-size="11" letter-spacing="1.2" '
                 'fill="%s" text-anchor="end">%s</text>' % (w-K, bh/2 + 2, m["renk"], m["alan"]))
        alan = w - 2*K
        bb = sigan(t["bas"], alan, o["bas_tavan"], 19)
        y = bh + 30 + bb
        for i, s in enumerate(t["bas"]):
            p.append('<text class="disp g2" x="%d" y="%d" font-size="%d" fill="%s">%s</text>'
                     % (K, y + i*int(bb*1.2), bb, MUREKKEP, s))
        y += (len(t["bas"])-1)*int(bb*1.2)
        cy = h - K - 36
        ab = o["alt"]
        parca = sar(t["alt"], int(alan/(SANS_EM*ab)))
        while len(parca)*int(ab*1.45) > (cy - y - 14) and ab > 11:
            ab -= 1
            parca = sar(t["alt"], int(alan/(SANS_EM*ab)))
        for i, s in enumerate(parca):
            p.append('<text class="sans g3" x="%d" y="%d" font-size="%d" fill="%s">%s</text>'
                     % (K, y + 20 + ab + i*int(ab*1.45), ab, IKINCIL, s))
        _, dg = dugme(K, cy, t["cagri"], o["cag"], m["koyu"], KAGIT, 34)
        p.append(dg)
    return p, KAGIT, "", m["renk"]


def k_swiss(m, w, h, bicim, t, o, serit):
    """Isvicre gridi: sola dayali sans, siki satir, sol kenarda sutun."""
    K, p = o["K"], []
    sol = K + 18
    p.append('<rect class="sutun" x="%d" y="%d" width="5" height="%d" fill="%s"/>' % (K, K, h - 2*K, m["renk"]))
    if serit:
        cw, _ = dugme(0, 0, t["cagri"], o["cag"], m["koyu"], KAGIT)
        cx = w - K - cw
        alan = cx - sol - 30
        tek = " ".join(t["bas"])
        bb = sigan([tek], alan, o["bas_tavan"] - 2, 20, SANS_EM)
        blok = 18 + bb + o["alt"] + 20
        ust = (h - blok)/2
        p.append('<text class="sans g1" x="%d" y="%.0f" font-size="%d" letter-spacing="2.8" '
                 'font-weight="700" fill="%s">%s</text>' % (sol, ust, o["ad"]-1, m["koyu"], t["ad"].upper()))
        p.append('<text class="sans g2" x="%d" y="%.0f" font-size="%d" font-weight="700" '
                 'letter-spacing="-0.6" fill="%s">%s</text>' % (sol, ust + 18 + bb, bb, MUREKKEP, tek))
        ab = o["alt"]
        while sans_en(t["alt"], ab) > alan and ab > 11:
            ab -= 1
        p.append('<text class="sans g3" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (sol, ust + blok, ab, IKINCIL, t["alt"]))
        p += _sag_cagri(m, t, o, w, h, cx, cw)
    else:
        alan = w - sol - K
        bb = sigan(t["bas"], alan, o["bas_tavan"] - 2, 19, SANS_EM)
        y = K + 16
        p.append('<text class="sans g1" x="%d" y="%d" font-size="%d" letter-spacing="2.8" '
                 'font-weight="700" fill="%s">%s</text>' % (sol, y, o["ad"]-1, m["koyu"], t["ad"].upper()))
        y += 26 + bb
        for i, s in enumerate(t["bas"]):
            p.append('<text class="sans g2" x="%d" y="%d" font-size="%d" font-weight="700" '
                     'letter-spacing="-0.6" fill="%s">%s</text>' % (sol, y + i*int(bb*1.12), bb, MUREKKEP, s))
        y += (len(t["bas"])-1)*int(bb*1.12)
        p += _kuyruk(m, t, o, sol, y, w, h, alan, IKINCIL)
    ek = """
    .sutun { animation: sutun SUREs cubic-bezier(.16,1,.3,1) infinite; transform-origin: center top }
    @keyframes sutun {
      0%      { opacity:0; transform:scaleY(0) }
      12%,92% { opacity:1; transform:scaleY(1) }
      100%    { opacity:0; transform:scaleY(1) }
    }
"""
    return p, KAGIT, ek, m["koyu"]


def k_tag(m, w, h, bicim, t, o, serit):
    """Fiyat etiketi: delikli rozet, yuvarlak hatlar, vurgu renginde."""
    K, p = o["K"], []
    rozet = t["ad"].upper()
    # Delik rozetin SAG ucunda duruyor; metin genisligine ek olarak
    # ona da pay ayirmazsak son harfin uzerine biniyor.
    rw = sans_en(rozet, o["ad"]) + 40
    if serit:
        cw, _ = dugme(0, 0, t["cagri"], o["cag"], m["renk"], "#ffffff")
        cx = w - K - cw
        alan = cx - K - 30
        tek = " ".join(t["bas"])
        bb = sigan([tek], alan, o["bas_tavan"], 20)
        blok = 26 + bb + o["alt"] + 22
        ust = (h - blok)/2
        p.append('<g class="g1"><rect x="%d" y="%.0f" width="%.0f" height="24" rx="12" fill="%s"/>'
                 '<circle cx="%.0f" cy="%.0f" r="3" fill="%s"/>'
                 '<text class="sans" x="%.0f" y="%.0f" font-size="%d" letter-spacing="1.6" '
                 'font-weight="700" fill="#ffffff">%s</text></g>'
                 % (K, ust - 12, rw, m["renk"], K + rw - 12, ust, KAGIT, K + 13, ust + 5, o["ad"]-2, rozet))
        p.append('<text class="disp g2" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + 26 + bb, bb, MUREKKEP, tek))
        ab = o["alt"]
        while sans_en(t["alt"], ab) > alan and ab > 11:
            ab -= 1
        p.append('<text class="sans g3" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + blok, ab, IKINCIL, t["alt"]))
        p += _sag_cagri(m, t, o, w, h, cx, cw, m["renk"], "#ffffff")
    else:
        alan = w - 2*K
        bb = sigan(t["bas"], alan, o["bas_tavan"], 19)
        y = K + 14
        p.append('<g class="g1"><rect x="%d" y="%d" width="%.0f" height="24" rx="12" fill="%s"/>'
                 '<circle cx="%.0f" cy="%d" r="3" fill="%s"/>'
                 '<text class="sans" x="%.0f" y="%d" font-size="%d" letter-spacing="1.6" '
                 'font-weight="700" fill="#ffffff">%s</text></g>'
                 % (K, y - 13, rw, m["renk"], K + rw - 12, y - 1, KAGIT, K + 13, y + 4, o["ad"]-2, rozet))
        y += 30 + bb
        for i, s in enumerate(t["bas"]):
            p.append('<text class="disp g2" x="%d" y="%d" font-size="%d" fill="%s">%s</text>'
                     % (K, y + i*int(bb*1.2), bb, MUREKKEP, s))
        y += (len(t["bas"])-1)*int(bb*1.2)
        p += _kuyruk(m, t, o, K, y, w, h, alan, IKINCIL, m["renk"], "#ffffff")
    return p, KAGIT, "", m["renk"]


def k_soft(m, w, h, bicim, t, o, serit):
    """Yumusak: genis bosluk, hafif renkli hale, sakin tipografi."""
    K, p = o["K"], []
    p.append('<circle class="hale" cx="%.0f" cy="%.0f" r="%.0f" fill="%s" opacity=".13"/>'
             % (w*0.86, h*0.3, min(w, h)*0.42, m["renk"]))
    if serit:
        cw, _ = dugme(0, 0, t["cagri"], o["cag"], m["koyu"], KAGIT)
        cx = w - K - cw
        alan = cx - K - 40
        tek = " ".join(t["bas"])
        bb = sigan([tek], alan, o["bas_tavan"] - 2, 20)
        blok = 20 + bb + o["alt"] + 22
        ust = (h - blok)/2
        p.append('<text class="sans g1" x="%d" y="%.0f" font-size="%d" letter-spacing="3.2" '
                 'font-weight="600" fill="%s">%s</text>' % (K, ust, o["ad"]-1, m["koyu"], t["ad"].upper()))
        p.append('<text class="disp g2" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + 22 + bb, bb, MUREKKEP, tek))
        ab = o["alt"]
        while sans_en(t["alt"], ab) > alan and ab > 11:
            ab -= 1
        p.append('<text class="sans g3" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + blok, ab, IKINCIL, t["alt"]))
        p += _sag_cagri(m, t, o, w, h, cx, cw)
    else:
        alan = w - 2*K
        bb = sigan(t["bas"], alan, o["bas_tavan"] - 2, 19)
        y = K + 16
        p.append('<text class="sans g1" x="%d" y="%d" font-size="%d" letter-spacing="3.2" '
                 'font-weight="600" fill="%s">%s</text>' % (K, y, o["ad"]-1, m["koyu"], t["ad"].upper()))
        y += 32 + bb
        for i, s in enumerate(t["bas"]):
            p.append('<text class="disp g2" x="%d" y="%d" font-size="%d" fill="%s">%s</text>'
                     % (K, y + i*int(bb*1.24), bb, MUREKKEP, s))
        y += (len(t["bas"])-1)*int(bb*1.24)
        p += _kuyruk(m, t, o, K, y, w, h, alan, IKINCIL)
    ek = """
    .hale { animation: hale SUREs cubic-bezier(.16,1,.3,1) infinite; transform-origin: center }
    @keyframes hale {
      0%      { opacity:0; transform:scale(.86) }
      14%,92% { opacity:.13; transform:scale(1) }
      100%    { opacity:0; transform:scale(1.04) }
    }
"""
    return p, KAGIT, ek, m["renk"]


def k_mark(m, w, h, bicim, t, o, serit):
    """Isaret: markanin bas harfi devasa ve soluk bir doku olarak arkada."""
    K, p = o["K"], []
    harf = kacir(m["ad"][0].upper())
    dev = int(h * 1.05)
    p.append('<text class="isaret disp" x="%d" y="%.0f" font-size="%d" fill="%s" opacity=".12" '
             'text-anchor="end">%s</text>' % (w - K, h*0.5 + dev*0.34, dev, m["renk"], harf))
    if serit:
        cw, _ = dugme(0, 0, t["cagri"], o["cag"], m["koyu"], KAGIT)
        cx = w - K - cw
        alan = cx - K - 40
        tek = " ".join(t["bas"])
        bb = sigan([tek], alan, o["bas_tavan"], 20)
        blok = 20 + bb + o["alt"] + 22
        ust = (h - blok)/2
        p.append('<text class="sans g1" x="%d" y="%.0f" font-size="%d" letter-spacing="2.4" '
                 'font-weight="700" fill="%s">%s</text>' % (K, ust, o["ad"], m["koyu"], t["ad"].upper()))
        p.append('<text class="disp g2" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + 22 + bb, bb, MUREKKEP, tek))
        ab = o["alt"]
        while sans_en(t["alt"], ab) > alan and ab > 11:
            ab -= 1
        p.append('<text class="sans g3" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + blok, ab, IKINCIL, t["alt"]))
        p += _sag_cagri(m, t, o, w, h, cx, cw)
    else:
        alan = w - 2*K
        bb = sigan(t["bas"], alan, o["bas_tavan"], 19)
        y = K + 16
        p.append('<text class="sans g1" x="%d" y="%d" font-size="%d" letter-spacing="2.4" '
                 'font-weight="700" fill="%s">%s</text>' % (K, y, o["ad"], m["koyu"], t["ad"].upper()))
        y += 30 + bb
        for i, s in enumerate(t["bas"]):
            p.append('<text class="disp g2" x="%d" y="%d" font-size="%d" fill="%s">%s</text>'
                     % (K, y + i*int(bb*1.2), bb, MUREKKEP, s))
        y += (len(t["bas"])-1)*int(bb*1.2)
        p += _kuyruk(m, t, o, K, y, w, h, alan, IKINCIL)
    ek = """
    .isaret { animation: isaret SUREs cubic-bezier(.16,1,.3,1) infinite; transform-origin: right center }
    @keyframes isaret {
      0%      { opacity:0; transform:translateX(24px) }
      14%,92% { opacity:.12; transform:none }
      100%    { opacity:0; transform:translateX(-10px) }
    }
"""
    return p, KAGIT2, ek, m["koyu"]


KARAKTERLER = {
    "plain": k_plain,
    "editorial": k_editorial, "poster": k_poster, "ledger": k_ledger,
    "split": k_split, "swiss": k_swiss, "tag": k_tag,
    "soft": k_soft, "mark": k_mark,
}


def afis(m, bicim, dil, varyant):
    w, h = FORMATLAR[bicim]
    serit = bicim in ("measure", "feature")
    o = _olcu(bicim)

    bas, alt, cagri = m["metin"][dil]
    t = dict(ad=kacir(m["ad"]), bas=[kacir(x) for x in bas],
             alt=kacir(alt), cagri=kacir(cagri))

    karakter = "plain" if varyant == "plain" else m["stil"]
    parcalar, zemin, ek, ust_serit = KARAKTERLER[karakter](m, w, h, bicim, t, o, serit)
    etiket = kacir("%s - %s %s %s" % (m["ad"], " ".join(bas), alt, m["alan"]))

    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
           'role="img" aria-label="%s">\n'
           '  <style>%s</style>\n'
           '  <rect width="%d" height="%d" fill="%s"/>\n'
           '  <rect x="0" y="0" width="%d" height="3" fill="%s"/>\n'
           '%s\n</svg>\n'
           % (w, h, w, h, etiket, stil_blogu(ek).replace("SURE", str(SURE)),
              w, h, zemin, w, ust_serit,
              "\n".join("  " + x for x in parcalar)))

    # Afisler sayfaya GOMULUYOR; sinif ve keyframe adlari benzersiz
    # olmazsa birinin stili otekine uygulaniyor. Varyant da oneke
    # giriyor, yoksa ayni markanin iki afisi carpisir.
    return markala(svg, "d%s%s" % (m["kod"][:6], varyant[0]))


def main():
    dil = sys.argv[1] if len(sys.argv) > 1 else "en"
    assert dil in ("en", "tr"), "dil: en | tr"
    kok = pathlib.Path(__file__).resolve().parents[2] / "public" / "media" / "deney"
    cikti = kok if dil == "en" else kok / "tr"
    cikti.mkdir(parents=True, exist_ok=True)
    n = 0
    for m in MARKALAR:
        for bicim in FORMATLAR:
            for varyant in ("plain", "styled"):
                (cikti / ("%s-%s-%s.svg" % (m["kod"], bicim, varyant))).write_text(
                    afis(m, bicim, dil, varyant), encoding="utf-8")
                n += 1
    print("%d afis (%s) -> %s" % (n, dil, cikti))


if __name__ == "__main__":
    main()
