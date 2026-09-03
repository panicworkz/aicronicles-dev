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
import re
import sys
from ortak import markala

# Fabelo belirtecleri — sitenin globals.css'iyle ayni
KAGIT, KAGIT2 = "#faf8f4", "#f2eee6"
MUREKKEP, IKINCIL, UCUNCUL = "#15171a", "#4a4f57", "#8b9098"
KURAL = "#d9d3c6"
# Sitenin vurgu rengi — cagriya basildigi anda kullaniliyor
VURGU = "#0a7d8f"

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



# Kalin sans yazi tipinin harf genisligi (em cinsinden), tarayicida
# canvas measureText ile olculdu.
#
# Once harf basina tek bir ortalama katsayi vardi ve alti cizme bazen
# kelimeden uzun bazen kisa kaliyordu: "Start a project" gercekte 6.72
# em, ortalamayla 8.18 em cikiyordu — yaklasik dortte bir fazla.
SANS_GENISLIK = {"0": 0.5562, "1": 0.5562, "2": 0.5562, "3": 0.5562, "4": 0.5562, "5": 0.5562, "6": 0.5562, "7": 0.5562, "8": 0.5562, "9": 0.5562, "a": 0.5562, "b": 0.6108, "c": 0.5562, "d": 0.6108, "e": 0.5562, "f": 0.333, "g": 0.6108, "h": 0.6108, "i": 0.2778, "j": 0.2778, "k": 0.5562, "l": 0.2778, "m": 0.8892, "n": 0.6108, "o": 0.6108, "p": 0.6108, "q": 0.6108, "r": 0.3892, "s": 0.5562, "t": 0.333, "u": 0.6108, "v": 0.5562, "w": 0.7778, "x": 0.5562, "y": 0.5562, "z": 0.5, "A": 0.7222, "B": 0.7222, "C": 0.7222, "D": 0.7222, "E": 0.667, "F": 0.6108, "G": 0.7778, "H": 0.7222, "I": 0.2778, "J": 0.5562, "K": 0.7222, "L": 0.6108, "M": 0.833, "N": 0.7222, "O": 0.7778, "P": 0.667, "Q": 0.7778, "R": 0.7222, "S": 0.667, "T": 0.6108, "U": 0.7222, "V": 0.667, "W": 0.9438, "X": 0.667, "Y": 0.667, "Z": 0.6108, " ": 0.2778, ".": 0.2778, ",": 0.2778, "'": 0.2378, "?": 0.6108, "!": 0.333, "-": 0.333, "&": 0.7222, "ç": 0.5562, "ğ": 0.6108, "ı": 0.2778, "ö": 0.6108, "ş": 0.5562, "ü": 0.6108, "Ç": 0.7222, "Ğ": 0.7778, "İ": 0.2778, "Ö": 0.7778, "Ş": 0.667, "Ü": 0.7222}
SANS_VARSAYILAN = 0.5562


def sans_olc(metin, punto):
    """Bir dizgenin kalin sans yazi tipindeki genisligi."""
    return sum(SANS_GENISLIK.get(k, SANS_VARSAYILAN) for k in metin) * punto


def sans_en(t, p):
    return len(t) * SANS_EM * p



# Georgia serifin harf genisligi (em), tarayicidan olculdu.
# Basliklarda sabit 0.50 katsayisi kullaniyordum; "and LLM agents."
# gercekte 7.42 em, katsayiyla 7.5 cikiyordu — bazi satirlar alana
# sigmiyor gorunup gereksiz kuculuyordu.
SERIF_GENISLIK = {"0": 0.6138, "1": 0.4297, "2": 0.5586, "3": 0.5518, "4": 0.5649, "5": 0.5283, "6": 0.5659, "7": 0.5024, "8": 0.5962, "9": 0.5659, "a": 0.5039, "b": 0.5601, "c": 0.4541, "d": 0.5742, "e": 0.4834, "f": 0.3252, "g": 0.5093, "h": 0.582, "i": 0.293, "j": 0.292, "k": 0.5356, "l": 0.2861, "m": 0.8809, "n": 0.5908, "o": 0.5391, "p": 0.5713, "q": 0.5596, "r": 0.4097, "s": 0.4321, "t": 0.3452, "u": 0.5752, "v": 0.4966, "w": 0.7373, "x": 0.5049, "y": 0.4922, "z": 0.4438, "A": 0.6709, "B": 0.6538, "C": 0.6421, "D": 0.749, "E": 0.6533, "F": 0.5991, "G": 0.7251, "H": 0.8149, "I": 0.3896, "J": 0.5176, "K": 0.6943, "L": 0.6035, "M": 0.9272, "N": 0.7671, "O": 0.7441, "P": 0.6099, "Q": 0.7441, "R": 0.7017, "S": 0.561, "T": 0.6187, "U": 0.7563, "V": 0.6665, "W": 0.9756, "X": 0.7104, "Y": 0.6152, "Z": 0.6016, " ": 0.2412, ".": 0.2695, ",": 0.2695, "'": 0.2153, "?": 0.4785, "!": 0.3311, "-": 0.374, "&": 0.7104, "ç": 0.4541, "ğ": 0.5093, "ı": 0.293, "ö": 0.5391, "ş": 0.4321, "ü": 0.5752, "Ç": 0.6421, "Ğ": 0.7251, "İ": 0.3896, "Ö": 0.7441, "Ş": 0.561, "Ü": 0.7563}
SERIF_VARSAYILAN = 0.55


def serif_olc(metin, punto):
    return sum(SERIF_GENISLIK.get(k, SERIF_VARSAYILAN) for k in metin) * punto


def sigan(satirlar, alan, tavan, taban=17, em=None):
    """En uzun satiri alana sigdiran en buyuk punto.

    Gercek harf genisligiyle: sabit katsayi bazi satirlari olduğundan
    genis sanip puntoyu gereksiz duşuruyordu.
    """
    olc = sans_olc if em == SANS_EM else serif_olc
    for punto in range(int(tavan), int(taban) - 1, -1):
        if max(olc(x, punto) for x in satirlar) <= alan:
            return punto
    return int(taban)


def sar(metin, en, azami=99):
    """Metni satirlara boler.

    Varsayilan olarak KIRPMIYOR. Once 3 satirla siniriyordu ve uzun bir
    aciklamanin sonu sessizce duşuyordu — okur cumlenin yarisini
    goruyordu. Sigmiyorsa cozum metni kesmek degil, puntoyu duşurmek.
    """
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
def M(kod, ad, alan, kol, stil, renk, koyu, en, tr, hedef=(), yazi_logo=None):
    """Bir marka.

    en / tr: tek bir (baslik, destek, cagri) uclusu ya da BOYLE UCLULERIN
    LISTESI. Liste verilirse her biri ayri bir afis oluyor ve dorduncu
    alan olarak kendi sayfasinin yolunu tasiyabiliyor:

        (baslik_satirlari, destek, cagri)            -> ana sayfaya
        (baslik_satirlari, destek, cagri, "/yol")    -> o sayfaya

    Neden: bir markanin tek bir cumlesi yok. Panicworkz'un ana sayfasi
    "we thrive under pressure" diyor, hizmet sayfasi LLM ajanlarindan,
    iletisim sayfasi 24 saatte donmekten bahsediyor. Ucu de gercek ve
    ucu de farkli okuru tutuyor; hangisinin tuttugunu olcecegiz.
    """
    def liste(x):
        return list(x) if isinstance(x, list) else [x]
    return dict(kod=kod, ad=ad, alan=alan, kol=kol, stil=stil,
                renk=renk, koyu=koyu,
                metin={"en": liste(en), "tr": liste(tr)},
                hedef=list(hedef),
                # (yazi, son_isaret, yazi_rengi, isaret_rengi)
                # Bazi markalarin logosu resim degil YAZI. AICall'inki
                # Playfair Display 700 lacivert "AICall" ve kirmizi bir
                # nokta. Favicon rozetini basmak yanlisti: sitede oyle
                # bir isaret yok.
                yazi_logo=yazi_logo)


MARKALAR = [
    # ---- ORTUSEN KOL -------------------------------------------------
    # Uc mesaj, ucu de sitenin kendi sayfalarindan (79 sayfalik bir
    # site; ana sayfadaki baglantilar capa oldugu icin once tek sayfa
    # sanmistim, sitemap.xml gercegi gosterdi). Vaat, fiyat, ekosistem.
    # Uc mesaj, ucu de sitenin kendi sayfalarindan (79 sayfalik bir
    # site; ana sayfadaki baglantilar capa oldugu icin once tek sayfa
    # sanmistim, sitemap.xml gercegi gosterdi).
    #
    # Fiyat ve "5000 entegrasyon" mesajlari cikarildi. Kalanlar: vaat,
    # teknik derinlik, sektor genisligi.
    M("aicall", "AICall", "aicall.pw", "context", "editorial", "#0FA36B", "#0A0908",
      yazi_logo=("AICall", ".", "#0c0c3f", "#d83f3f"),
      en=[
        (["Every call.", "Answered."],
         "Human-like AI voice agents answer, qualify and act on every business call, "
         "any language.",
         "Book a free demo"),
        (["Voice AI", "engine."],
         "A neural speech engine with accurate recognition, low latency and 27 "
         "supported languages.",
         "See the engine", "/voice-engine"),
        (["Your sector.", "Your AI."],
         "AI voice agents for 28 industries — banking, healthcare, hospitality, "
         "logistics and real estate.",
         "Find your fit", "/industries"),
      ],
      tr=[
        (["Her arama.", "Yanıtlanır."],
         "İnsandan ayırt edilemeyen sesli asistan, her işletme aramasını yanıtlar, "
         "niteler ve aksiyona dönüştürür — 7/24, 50+ dilde.",
         "Ücretsiz demo alın"),
        (["Yapay zeka", "ses motoru."],
         "Üretim aramaları için ayarlanmış nöral konuşma motoru. %98,7 ASR. "
         "200ms altı ilk söz. Markaya uyumlu ses klonlama.",
         "Motoru gör", "/tr/voice-engine"),
        (["Sektörünüz.", "Yapay zekanız."],
         "28 sektör için hazır senaryolar, uyuma hazır asistanlar ve kanıtlanmış çağrı "
         "betikleri. İşinize uyan kapıyı kendiniz seçin.",
         "Sektörünüzü seçin", "/tr/industries"),
      ],
      hedef=["ai-tech"]),

    M("yerine", "Yerine", "yerine.com.tr", "context", "tag", "#ce3d19", "#0a2018",
      # Sitede italik; afiste butun kunyeler gibi duz serif. Renkler siteden.
      yazi_logo=("Yerine", ".", "#0a2018", "#ce3d19"),
      en=[
        (["What you want,", "for less."],
         "Transparent consumer guide to alternatives. Quality domestic equivalents "
         "instead of costly imports.",
         "Compare prices"),
        (["Type a product,", "see alternatives."],
         "An alternative exists for everything you buy. Domestic production, price "
         "advantage, transparency.",
         "See how it works", "/en/guide/how-it-works"),
        (["A better answer", "to what to buy."],
         "Honest, transparent alternatives to expensive brands. Compare price, features "
         "and user experience.",
         "About Yerine", "/en/about-us"),
      ],
      tr=[
        (["Aynı işi görür,", "daha uygununa."],
         "Şeffaf tüketici rehberi. Pahalı ithal markaların yerine kaliteli ve yerli "
         "muadilleri bulun.",
         "Fiyatları karşılaştır"),
        (["Ürün yaz,", "alternatifi gör."],
         "Aradığınız her şeyin bir alternatifi var. Yerli üretim, fiyat avantajı, "
         "şeffaf karşılaştırma.",
         "Nasıl çalışır", "/rehber/nasil-calisir"),
        (["Daha iyi bir cevap", "ne almalı."],
         "Pahalı markalara dürüst ve şeffaf alternatifler. Fiyat, özellik ve deneyimi "
         "karşılaştırın.",
         "Yerine hakkında", "/hakkimizda"),
      ]),

    # Site tek sayfa ve SPA — site haritasi yok, her yola index.html
    # donuyor. Icerik tarayicida okundu; EN dugmesiyle sitenin kendi
    # ingilizce metnine gecildi. Baglantilar sayfa ici capalara gidiyor.
    M("turco", "TurcoPartners", "turcopartners.com", "offset", "split", "#c5a059", "#14263A",
      yazi_logo=("TurcoPartners", ".", "#14263A", "#c5a059"),
      en=[
        (["Expand from Turkey", "into global markets."],
         "Real-time Amazon trend intelligence, turnkey US entity and trademark setup, "
         "and growth marketing.",
         "See the services"),
        (["Seven core", "execution services."],
         "Turnkey operational services scaling Turkish manufacturers and tech "
         "enterprises into global markets.",
         "See the seven", "/#sectors"),
        (["US formation,", "legal and grants."],
         "LLC and C-Corp formation, Operating Agreements, IRS EIN processing and "
         "commercial banking.",
         "See the flywheel", "/#approach"),
      ],
      tr=[
        (["Türkiye'den küresel", "pazarlara açılın."],
         "Amazon ABD canlı pazar istihbaratı, ABD şirket kuruluşu, marka tescili ve "
         "reklam yönetimi.",
         "Hizmetleri gör"),
        (["Yedi temel", "hizmet."],
         "Üretim ve teknoloji gücünü ABD ve küresel pazarlara taşıyan entegre "
         "operasyon hatları.",
         "Yediyi gör", "/#sectors"),
        (["ABD şirket kurulumu,", "hukuk ve teşvik."],
         "LLC ve C-Corp kuruluşu, Operating Agreement, IRS EIN onayı ve ticari "
         "bankacılık hattı.",
         "Modeli gör", "/#approach"),
      ]),

    M("wpcare", "WP Care", "wpcare.pw", "context", "swiss", "#2563EB", "#0F172A",
      en=[
        (["Keeping WordPress sites", "updated and safe."],
         "Core, plugin and theme updates with safe versioning, plus backups and "
         "security monitoring.",
         "See the plans", "/en/about/"),
        (["Reliable WordPress", "uptime monitoring."],
         "Monitored continuously with instant alerts, so downtime is caught early "
         "and fixed fast.",
         "See monitoring", "/en/uptime-monitoring/"),
        (["Advanced WordPress", "firewall protection."],
         "Proactive rules stop hackers and bots; harmful code is detected, isolated "
         "and blocked.",
         "See protection", "/en/firewall-protection/"),
      ],
      tr=[
        (["WordPress sitelerini", "güncel ve güvenli tut."],
         "Çekirdek, eklenti ve tema güncellemeleri; yedekleme ve sürekli güvenlik "
         "izlemesi.",
         "Paketleri gör", "/tr/about/"),
        (["Güvenilir WordPress", "çalışma süresi izleme."],
         "Anlık uyarılarla kesintisiz izleme; kesintiler erken yakalanır ve hızla "
         "giderilir.",
         "İzlemeyi gör", "/tr/uptime-monitoring/"),
        (["Gelişmiş WordPress", "güvenlik duvarı koruması."],
         "Proaktif kurallar korsanı ve botu durdurur; zararlı kod tespit edilip "
         "engellenir.",
         "Korumayı gör", "/tr/firewall-protection/"),
      ],
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

    # Site tek sayfa, dort bolumlu ve YALNIZCA TURKCE. /en gibi yollar
    # ayni Turkce sayfayi donduruyor (catch-all). Ingilizce metin
    # sitenin kendi Turkce metninin sadik cevirisi; uydurma degil ama
    # birebir alinti da degil — bunu boyle biliyoruz.
    M("testworkz", "Testworkz", "testworkz.com", "offset", "ledger", "#EF4F2F", "#121212",
      yazi_logo=("Testworkz", ".", "#121212", "#ef4f2f"),
      en=[
        (["Ship with", "confidence."],
         "Registration, checkout and quote flows checked against real usage "
         "scenarios before release.",
         "See software testing", "/#software"),
        (["What happens", "under load?"],
         "Load testing surfaces bottlenecks, delays and the problems that hurt "
         "experience under traffic.",
         "See performance", "/#performance"),
        (["Accessible", "to everyone."],
         "Keyboard use, screen reader experience, focus order and contrast verified "
         "against WCAG 2.2.",
         "See accessibility", "/#accessibility"),
      ],
      tr=[
        (["Yazılım testiyle", "yayına güvenle çıkın."],
         "Kayıt, ödeme ve teklif akışları gerçek kullanım senaryolarıyla yayın "
         "öncesi doğrulanır.",
         "Yazılım testini gör", "/#software"),
        (["Yük altında", "ne oluyor?"],
         "Performans ve yük testiyle darboğazlar, gecikmeler ve kaynak sınırları "
         "önceden bulunur.",
         "Performansı gör", "/#performance"),
        (["Herkes için", "erişilebilir."],
         "Klavye, ekran okuyucu, odak sırası ve kontrast WCAG 2.2 ölçütlerine göre "
         "doğrulanır.",
         "Erişilebilirliği gör", "/#accessibility"),
      ]),

    # PANIC afisi markanin kendisini degil PANIC CMS'i anlatiyor —
    # kullanicinin istegi. Sitede CMS'ten hic bahsedilmiyor (2026-09-03),
    # o yuzden metin siteden degil SISTEMIN KENDISINDEN cikarildi:
    # Fabelo Panic CMS uzerinde calisiyor, ozellikler dogrudan kod
    # tabaninda dogrulandi — 18 tablo, 15 yonetim modulu, Next.js 15.1.7,
    # Drizzle + PostgreSQL, reklam olay kaydi, icerik revizyonu,
    # sitemap.xml ve sitemap-news.xml. Uydurma yok, alinti da degil.
    M("panictr", "PANIC", "panic.com.tr", "offset", "swiss", "#bd3425", "#161817",
      yazi_logo=("PANIC", ".", "#161817", "#bd3425"),
      en=[
        (["One system.", "Content and commerce."],
         "Articles, pages, media and taxonomy beside products, orders, customers "
         "and coupons.",
         "See the studio"),
        (["Ad campaigns,", "measured."],
         "Placements and topic targeting, with every impression and click recorded "
         "in context.",
         "See the studio"),
        # SEO ve AEO birlikte — ikisi de editorde duruyor.
        #
        # Once "AEO iddiasinin dayanagi yok" demistim; yaniliyordum.
        # Panic CMS'te AEO editorde duruyor: yazi duzenleyicide "AI & AEO"
        # sekmesi ve AeoScoreMeter (baslik uzunlugu, kelime sayisi, H2/H3
        # yapisi, SSS, liste, sayi ve meta aciklamasi uzerinden 100 uzerinden
        # puan), gorsel studyosunda yanit motoru icin anlamsal baglam
        # (media.aeo_context), urunlerde JSON-LD sema. Yalnizca YAYIN
        # tarafinda makale sayfalari henuz JSON-LD basmiyor; o yuzden
        # cumle editorun yaptigini soyluyor, sayfanin yapmadigini degil.
        # SEO tarafi: SerpSocialPreview (SERP ve sosyal kart benzetimi),
        # meta baslik/aciklama alanlari; ayrica RevisionHistoryDrawer.
        (["Found by search,", "cited by AI."],
         "SERP preview, AEO readiness scoring and revision history, on Next.js "
         "and Postgres.",
         "See the studio"),
      ],
      tr=[
        (["Tek sistem.", "İçerik ve ticaret."],
         "Yazı, sayfa, medya, taksonomi, ürün, sipariş, müşteri ve kupon tek bir "
         "şemada.",
         "Stüdyoyu gör"),
        (["Reklam kampanyaları,", "ölçülür."],
         "Reklam alanı ve konu hedefleme; her gösterim ve tıklama bağlamıyla "
         "kaydedilir.",
         "Stüdyoyu gör"),
        (["Aramada bulunur,", "yapay zekada anılır."],
         "SERP önizlemesi, AEO hazırlık puanı ve revizyon; Next.js ve Postgres "
         "üzerinde.",
         "Stüdyoyu gör"),
      ]),

    M("panicworkz", "Panicworkz", "panicworkz.com", "offset", "poster", "#D83F3F", "#0C0C3F",
      en=[
        (["We thrive", "under pressure."],
         "Full-service digital agency and outsourcing partner for e-commerce, AI and "
         "custom software.",
         "Start a project"),
        (["AI integration", "and LLM agents."],
         "AI integration and LLM agent development with OpenAI, Anthropic Claude and "
         "Google Gemini.",
         "See the work", "/services/ai-integration"),
        # Tek cumle kalinca "yangin" mecazi havada kaliyor ve itfaiye
        # gibi okunuyordu. Ikinci cumle sitenin kendi iletisim sayfasi
        # aciklamasindan: ne is yaptigimizi soyluyor.
        (["Got a fire?", "We'll pick up."],
         "Describe your fire and we respond within twenty-four hours. Agency and "
         "outsourcing partner.",
         "Tell us", "/contact"),
      ],
      tr=[
        (["Baskı altında", "büyürüz."],
         "Dijital ajans ve dış kaynak ortağı. E-ticaret, yapay zeka entegrasyonu ve "
         "özel yazılım.",
         "Projeye başla"),
        (["Yapay zeka entegrasyonu", "ve LLM ajanları."],
         "Üretim seviyesinde yapay zeka ve LLM ajan geliştirme. OpenAI, Anthropic "
         "Claude, Gemini.",
         "Çalışmaları gör", "/services/ai-integration"),
        (["Yangın mı var?", "Biz açarız."],
         "Yangınınızı anlatın, yirmi dört saat içinde dönüyoruz. Dijital ajans ve dış "
         "kaynak ortağı.",
         "Anlatın", "/contact"),
      ]),

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

# --- Marka logolari ---------------------------------------------------
#
# Her marka kendi sitesinin logosunu tasiyor. Kelime markasi tek basina
# kimlik vermiyordu; okur "bu kimin reklami" sorusuna bir isarete
# bakarak cevap veriyor.
#
# Logolar base64 ile AFISIN ICINE gomuluyor, disaridan cagrilmiyor.
# Sitedeki butun dis gorsel bagimliliklarini temizlemistik; afisin
# kendisi de bagimsiz kalmali. Afisler zaten sayfaya gomuluyor, yani
# ayri bir istek hic atilmiyor.
#
# sosyomarket.com ve superdamping.com'da favicon hic yok (butun standart
# yollar 404). O ikisi logosuz basiliyor — uydurma bir isaret koymak
# yanlis olurdu.
import base64
import functools

LOGO_KOK = pathlib.Path(__file__).resolve().parents[2] / "public" / "media" / "deney" / "logo"


@functools.lru_cache(maxsize=None)
def logo_veri(kod: str):
    """(veri-uri, en/boy orani) ya da logosu yoksa None.

    Oran onemli: Panicworkz'un isareti bir KELIME MARKASI (285x57).
    Kare kutuya sigdirinca yuksekligin besde biri kadar kalip
    okunmuyordu. Genislik orandan hesaplaniyor.
    """
    for uz, tur in ((".svg", "image/svg+xml"), (".png", "image/png")):
        yol = LOGO_KOK / f"{kod}{uz}"
        if not yol.exists():
            continue
        ham = yol.read_bytes()
        oran = 1.0
        if uz == ".svg":
            m = re.search(rb'viewBox="([\d.\-]+)\s+([\d.\-]+)\s+([\d.]+)\s+([\d.]+)"', ham)
            if m:
                gen, yuk = float(m.group(3)), float(m.group(4))
                if yuk:
                    oran = gen / yuk
        else:
            # PNG basligindaki genislik ve yukseklik (IHDR)
            if len(ham) > 24 and ham[12:16] == b"IHDR":
                gen = int.from_bytes(ham[16:20], "big")
                yuk = int.from_bytes(ham[20:24], "big")
                if yuk:
                    oran = gen / yuk
        b64 = base64.b64encode(ham).decode("ascii")
        return f"data:{tur};base64,{b64}", oran
    return None


def yazi_logosu(m, x, y, boy):
    """Yazi olarak cizilen marka isareti.

    Sitenin kendi yazi tipi (orn. Playfair Display) elimizde yok ve
    disaridan font cekmiyoruz; afisin kendi display serifi en yakin
    karsilik. Onemli olan yapisi: kalin serif ad, sonunda marka
    renginde bir isaret.
    """
    # Bes ogeli de olabilir: son oge italik olup olmadigini soyluyor.
    # Yerine'nin logosu italik Playfair, AICall'inki duz.
    # (yazi, isaret, yazi_rengi, isaret_rengi)
    #
    # KUNYE HER ZAMAN AFISIN DISPLAY SERIFIYLE basilir — markanin
    # sitedeki yazi tipi ne olursa olsun. Korunan sey renkler ve yapi:
    # ad, sonunda vurgu renginde bir nokta. AraçKirala, AICall, Yerine,
    # TurcoPartners ve Testworkz boyle; ozel tasarlanmis resim logosu
    # olanlar (Panicworkz, WP Care) kendi dosyasiyla basilir.
    #
    # Kunyeleri kendi yazi tipleriyle basmak on alti afisi tek bir
    # yayinin reklam alani olmaktan cikarip derlemeye cevirirdi. Sans
    # secenegi bu yuzden koddan kaldirildi: kural burada zorunlu.
    yl = m["yazi_logo"]
    yazi, isaret, r1, r2 = yl[0], yl[1], yl[2], yl[3]
    # y = harfin GORSEL UST hizasi, resim logonun y'siyle ayni anlamda.
    # Once 0.78 ile taban cizgisine geciyordum; Georgia'nin buyuk harf
    # yuksekligi 0.69 em oldugu icin yazi logolu markalarda kunye 1-2
    # piksel yukarida duruyor, kenar payi resim logolu markalardan
    # ayrisiyordu.
    return ('<text class="disp" x="%.0f" y="%.0f" font-size="%.0f" font-weight="700" '
            'letter-spacing="-0.02em" fill="%s">%s'
            '<tspan fill="%s">%s</tspan></text>'
            % (x, y + boy * 0.69, boy, r1, kacir(yazi), r2, kacir(isaret)))


def yazi_logosu_eni(m, boy):
    yl = m["yazi_logo"]
    return serif_olc(yl[0] + yl[1], boy) * 1.02


def logo(kod: str, x, y, boy, azami_en=None, sinif=""):
    """Marka logosu.

    sinif VARSAYILAN OLARAK BOS: sade afiste kunye sabit duruyor.
    Logoya da g1 verdigim surumde marka her dongude solup geri
    geliyordu; mesaj degisirken markanin yanip sonmesi afisi huzursuz
    gosteriyor. Stilli set kendi girisini istiyorsa sinifi acikca
    veriyor.
    """
    v = logo_veri(kod)
    if not v:
        return ""
    uri, oran = v
    en = boy * oran
    if azami_en and en > azami_en:
        en, boy = azami_en, azami_en / oran
    c = ' class="%s"' % sinif if sinif else ""
    return ('<image%s x="%.0f" y="%.0f" width="%.1f" height="%.1f" '
            'href="%s" preserveAspectRatio="xMidYMid meet"/>' % (c, x, y, en, boy, uri))


def logo_eni(kod: str, boy, azami_en=None):
    """Kunyede metni ne kadar saga kaydiracagiz."""
    v = logo_veri(kod)
    if not v:
        return 0
    en = boy * v[1]
    return min(en, azami_en) if azami_en else en



def kelime_markasi(kod: str) -> bool:
    """Logo bir KELIME markasi mi (isaret degil)?

    Panicworkz'un logosu markanin adini zaten yaziyor. Yanina bir de
    "PANICWORKZ" koyunca ad iki kez okunuyor, ustelik 20 piksel boyda
    logonun altindaki slogan satiri lapaya donuyor. Genis olanlarda
    logo tek basina, biraz daha buyuk duruyor.
    """
    v = logo_veri(kod)
    return bool(v) and v[1] > 2.2


def stil_blogu(ek="", perde=1):
    """Butun hareket tek yerde.

    DIKKAT: her .sinif icin @keyframes'i de burada olmali. Bir
    duzenlemede uc tanim (dokunus, cizik, harf) yanlislikla silindi;
    siniflar sayfada durdu ama animasyonlari olmadigi icin afisin
    yarisi donmus goruldu. Sinif eklerken keyframe'ini de ekle.
    """
    sablon = """
    .disp { font-family: Georgia, "Times New Roman", serif }
    .sans { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif }
    .mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace }

    /* Govde: baslik, destek metni, kunye — kademeli girer */
    .g1 { animation: gir __SURE__s cubic-bezier(.16,1,.3,1) infinite }
    .g2 { animation: gir __SURE__s cubic-bezier(.16,1,.3,1) .18s infinite }
    .g3 { animation: gir __SURE__s cubic-bezier(.16,1,.3,1) .36s infinite }
    @keyframes gir {
      0%      { opacity:0; transform:translateY(10px) }
      7%,92%  { opacity:1; transform:none }
      100%    { opacity:0; transform:translateY(-6px) }
    }

    /* Stilli setteki hap dugme */
    .cag { animation: cagri __SURE__s cubic-bezier(.16,1,.3,1) infinite }
    @keyframes cagri {
      0%      { opacity:0; transform:translateY(10px) scale(.98) }
      9%,34%  { opacity:1; transform:none }
      40%     { transform:scale(1.035) }
      46%,92% { transform:none }
      100%    { opacity:0; transform:translateY(-6px) }
    }

    /* Kunye kurali.
       transform-origin YOK. SVG'de varsayilan transform-box view-box,
       yani "left center" AFISIN sol kenarini gosteriyordu; cizgi kendi
       basindan degil sayfanin kenarindan aciliyordu. Dikdortgen artik
       x=0'da, kaydirilmis bir grubun icinde: varsayilan orijin (0 0)
       zaten kendi sol ucu. */
    .cizgi { animation: cizgi __SURE__s cubic-bezier(.16,1,.3,1) infinite }
    @keyframes cizgi {
      0%      { opacity:0; transform:scaleX(0) }
      10%,92% { opacity:1; transform:scaleX(1) }
      100%    { opacity:0; transform:scaleX(1) }
    }

    /* Bas harf: sessiz zemin dokusu */
    .harf { animation: harf __SURE__s cubic-bezier(.16,1,.3,1) infinite }
    @keyframes harf {
      0%      { opacity:0; transform:translateY(14px) }
      16%,92% { opacity:1; transform:none }
      100%    { opacity:0; transform:translateY(-8px) }
    }

    /* --- COK MESAJLI SADE AFIS ---------------------------------
       Dongu perde sayisi kadar uzun; her mesaj kendi perdesinde
       oynuyor ve sirasi animation-delay ile veriliyor, yani ayni
       keyframe seti dordu icin de yetiyor.

       Kunye (logo, alan adi, kural, bas harf) perdelerin DISINDA ve
       sabit: her mesaj degisiminde markanin yanip sonmesi afisi
       huzursuz gosterirdi.

       Zamanlar PERDEYE ORANLI yaziliyor (Q ve yuzde) ve asagida butun
       dongunun yuzdesine cevriliyor — CSS keyframe'leri dongu uzerinden
       calisiyor, ama perde icindeki ritmi dusunmek cok daha kolay.

       Perde 6 saniye: dort mesaj 24 saniyede donuyor. 9 saniyelik
       ortak saatte kalsaydi dorduncu mesaji gormek 27 saniye
       beklemek olurdu. */
    /* backwards SART. animation-delay suresince eleman henuz
       animasyona girmemis sayiliyor ve KENDI normal halini
       gosteriyor — yani opaklik 1. Uc perde de ilk saniyelerde
       ust uste basiliyordu. backwards, gecikme boyunca %0
       karesini tutturuyor. */
    .perde { animation: perde __TOPLAM__s cubic-bezier(.16,1,.3,1) infinite backwards }
    @keyframes perde {
      0%       { opacity:0; transform:translateY(10px) }
      Q8,Q86   { opacity:1; transform:none }
      Q96,100% { opacity:0; transform:translateY(-6px) }
    }
    .mcag { animation: mcag __TOPLAM__s cubic-bezier(.16,1,.3,1) infinite backwards }
    @keyframes mcag {
      /* Perdenin SONUNDA sonuyor. Onceki surumde son kare
         "100% { opacity:1 }" idi — tiklamadan sonra kaybolmasin diye.
         Tek mesajli afiste dogruydu; uc perdelide her cagri kendi
         perdesinden sonra da ekranda kalip otekilerin ustune biniyordu. */
      0%,Q18   { opacity:0; transform:none; fill:__MUREKKEP__ }
      Q26,Q75  { opacity:1; transform:none; fill:__MUREKKEP__ }
      Q79      { opacity:1; transform:translateY(1.5px); fill:__VURGU__ }
      Q84,Q88  { opacity:1; transform:none; fill:__VURGU__ }
      Q96,100% { opacity:0; transform:none; fill:__VURGU__ }
    }
    .mciz { animation: mciz __TOPLAM__s cubic-bezier(.16,1,.3,1) infinite backwards }
    @keyframes mciz {
      0%,Q28   { opacity:0; transform:scaleX(0); fill:__MUREKKEP__ }
      Q38,Q75  { opacity:1; transform:scaleX(1); fill:__MUREKKEP__ }
      Q79,Q88  { opacity:1; transform:scaleX(1); fill:__VURGU__ }
      Q96,100% { opacity:0; transform:scaleX(1); fill:__VURGU__ }
    }
    /* El yakinda belirir, ARAR, bulur, basar ve yerinde kalir. */
    .mel { animation: mel __TOPLAM__s ease-in-out infinite backwards }
    @keyframes mel {
      /* El, perdenin %40'indan %88'ine kadar sahnede: beliriyor, uc
         kez yokluyor, buluyor, basiyor. Once bu is perdenin yalnizca
         %22'sine sikismisti ve el sinek gibi gidip geliyordu. */
      0%,Q40   { opacity:0; transform:translate(14px,12px) }
      Q50      { opacity:1; transform:translate(11px,9px) }
      Q60      { opacity:1; transform:translate(-13px,4px) }
      Q68      { opacity:1; transform:translate(5px,-7px) }
      Q75      { opacity:1; transform:translate(0,0) }
      Q79      { opacity:1; transform:translate(0,2.5px) }
      Q84,Q88  { opacity:1; transform:translate(0,0) }
      Q96,100% { opacity:0; transform:translate(0,0) }
    }

    /* --- Cagri uc adimda kuruluyor (tek mesajli stilli set) --- */

    /* 1. yazi */
    /* Basinca RENK degisiyor. Once eli kaybediyordum; tiklanan sey
       kayboluyor, geriye hicbir iz kalmiyordu. Simdi el yerinde
       duruyor ve cagri sitenin vurgu rengine geciyor — tiklandigi
       goruluyor. */
    .dokunus { animation: dokunus __SURE__s cubic-bezier(.16,1,.3,1) infinite }
    @keyframes dokunus {
      /* Her karede opacity YAZILI. Yazmadigimda CSS eksik ozelligi
         komsu karelerden dogrusal olarak dolduruyordu: %65'te 1,
         %100'de 0, yani tiklamanin oldugu %68'den itibaren cagri
         yavasca siliniyordu. Tiklanan sey gozden kaybolmamali. */
      0%      { opacity:0; transform:translateY(8px); fill:__MUREKKEP__ }
      18%,65% { opacity:1; transform:none; fill:__MUREKKEP__ }
      68%     { opacity:1; transform:translateY(1.5px); fill:__VURGU__ }
      73%,92% { opacity:1; transform:none; fill:__VURGU__ }
      100%    { opacity:0; transform:translateY(-6px); fill:__VURGU__ }
    }

    /* 2. yazinin altina cizgi, soldan saga */
    .cizik { animation: cizik __SURE__s cubic-bezier(.16,1,.3,1) infinite }
    @keyframes cizik {
      0%,24%  { opacity:0; transform:scaleX(0); fill:__MUREKKEP__ }
      34%,65% { opacity:1; transform:scaleX(1); fill:__MUREKKEP__ }
      68%,92% { opacity:1; transform:scaleX(1); fill:__VURGU__ }
      100%    { opacity:0; transform:scaleX(1); fill:__VURGU__ }
    }

    /* 3. el yakinda belirir, ARAR, bulur, basar.
       ease-in-out cunku arama gezinme; expo snap yapardi. */
    .imlec { animation: imlec __SURE__s ease-in-out infinite }
    @keyframes imlec {
      0%,36%   { opacity:0; transform:translate(14px,12px) }
      42%      { opacity:1; transform:translate(11px,9px) }
      50%      { opacity:1; transform:translate(-13px,4px) }
      57%      { opacity:1; transform:translate(5px,-7px) }
      64%      { opacity:1; transform:translate(0,0) }
      68%      { opacity:1; transform:translate(0,2.5px) }
      73%,88%  { opacity:1; transform:translate(0,0) }
      100%     { opacity:0; transform:translate(0,-4px) }
    }
__EK__
    /* Hareketi azaltilmis modda cok perdeli afis TEK mesaja duşuyor.
       Onceki kural her seyi opacity:1 yapiyordu; uc perde ust uste
       basilip okunmaz bir yigin cikiyordu. Sonraki perdeler burada
       tamamen kaldiriliyor, ilk mesaj sabit duruyor. */
    @media (prefers-reduced-motion: reduce) {
      * { animation:none !important; opacity:1 !important; transform:none !important }
      .sonraki { display:none !important }
    }
"""
    # Yer tutucular ayrac icinde.
    #
    # Once duz "EK", "SURE", "MUREKKEP" yaziyordum. "MUREKKEP" kelimesi
    # kendi icinde EK harflerini tasiyor, dolayisiyla .replace("EK", "")
    # onu MURKEP'e ceviriyordu; ortaya "fill:MURKEP" gibi gecersiz CSS
    # cikip butun blok duşuyordu ve afisin yarisi hic kipirdamiyordu.
    sablon = (sablon
              .replace("__EK__", ek)
              .replace("__SURE__", str(SURE))
              .replace("__MUREKKEP__", MUREKKEP)
              .replace("__VURGU__", VURGU))
    css = _perde_yuzdeleri(sablon, perde)
    # SVG bir XML belgesi: <style> icindeki bir "<" etiket baslatir ve
    # stil metnini oradan keser. Bir yorumda "(Q<yuzde>)" yazmistim;
    # ondan sonraki BUTUN kurallar duştu ve afisin yarisi kipirdamadi.
    # Sessizce olmasin diye burada patliyoruz.
    if "<" in css or ">" in css:
        raise ValueError("Stil blogunda < ya da > var; SVG icinde XML'i bozar")
    return css


PERDE_SURE = 7  # saniye — bir mesajin ekranda kaldigi sure


def _perde_yuzdeleri(css: str, perde: int) -> str:
    """Q<perde yuzdesi> -> dongu yuzdesi.

    Bir perde dongunun 1/N'i. Perdenin kendi ritmini yazip burada
    cevirmek, dort ayri keyframe seti yazmaktan cok daha az hataliydi.
    """
    css = css.replace("__TOPLAM__", str(PERDE_SURE * perde))

    def cevir(m):
        return "%.3f%%" % (float(m.group(1)) / perde)

    return re.sub(r"Q(\d+(?:\.\d+)?)\b", cevir, css)


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
    dili; burada yalnizca 1.5 piksellik kisa bir cokme var.
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
# Klasik piksel el imleci.
#
# KENDIM CIZMIYORUM. Uc denemede de tutmadi: once konturu elle cizdim
# ve avuc delik kaldi, sonra oranlari kacirdim ve el kurek gibi
# goruldu. Hazir ve dogru cizilmis bir tane kullanmak dogrusu.
#
# Kaynak : Wikimedia Commons — Mouse-cursor-hand-pointer.svg
#          https://commons.wikimedia.org/wiki/File:Mouse-cursor-hand-pointer.svg
# Lisans : Kamu mali ("simple geometry, ineligible for copyright").
#          Atif zorunlu degil; yine de kaynagi burada tutuyoruz.
#
# Ozgun dosya iki imlec tasiyor (ok + el), 32x24'luk bir tuvalde. Yalnizca
# el kismini aliyoruz; sola 14 birim kaydirinca 18x23'luk kendi cercevesine
# oturuyor. Renkler sabit siyah/beyaz degil, sitenin murekkep ve kagit
# belirteclerine bagli — koyu temada da dogru duruyor.
EL_HAT = ("M19 1h2v1h1v4h2v1h3v1h2v1h1v1h1v7h-1v3h-1v3H19v-3h-1v-2h-1v-2"
          "h-1v-2h-1v-1h-1v-3h3v1h1V2h1")
EL_IC = ("M21 2v9h1V7h2v4h1V8h2v4h1V9h1v1h1v7h-1v3h-1v2h-8v-2h-1v-2h-1v-2"
         "h-1v-2h-1v-1h-1v-2h2v1h1v1h1V2")
EL_EN, EL_BOY, EL_KAYDIR = 18, 23, 14
# Parmak ucu, kaydirilmis cercevede
EL_UC_X, EL_UC_Y = 6, 1


def imlec_piksel(x, y, boy=34, renk=None):
    """Kamu malı piksel el imleci, verilen boyda."""
    c = renk or MUREKKEP
    o = boy / EL_BOY
    # Animasyon sinifi EN DISTA, olcekleme icte.
    #
    # Kamu mali eli koyarken class="imlec" nitelig ini duşurmustum; el
    # sayfada duruyordu ama hicbir animasyona bagli degildi, yani
    # kipirdamiyordu.
    #
    # Sinif olcekli grubun icinde olsaydi CSS'in piksel cinsinden
    # verdigi hareketler de olceklenirdi — 34 piksellik elde arama
    # hareketi bir buçuk katina cikardi.
    return ('<g class="imlec">'
            '<g transform="translate(%.1f,%.1f) scale(%.4f) translate(%d,0)" '
            'shape-rendering="crispEdges">'
            '<path d="%s" fill="%s"/><path d="%s" fill="%s"/></g></g>'
            % (x, y, o, -EL_KAYDIR, EL_HAT, c, EL_IC, KAGIT))


def cagri_baglantisi(x, y, metin, punto, renk=None):
    """Alti cizili cagri + parmak ucuyla ona dokunan klasik el imleci.

    Dugmenin yerini aliyor: hap dugme gozu her seferinde asagi cekiyor,
    okunan sey afis degil dugme oluyordu.

    YERLESIM: el metnin USTUNE degil, cizginin sag ucunun ALTINA
    geliyor. Ilk denemede tam metnin ortasindaydi ve kelimeleri
    kapatiyordu.
    Parmak ucu cizgiye deger, govde asagi sarkar — ekranda gercekte
    oldugu gibi.
    """
    c = renk or MUREKKEP
    # Cizgi tam metnin altinda bitsin. Onceki tahmin fazla genisti ve
    # cizgi kelimeden tasip bosluga uzaniyordu.
    en = len(metin) * 0.545 * punto
    boy = punto * 2.4
    # Parmak ucu izgarada (5, 0) hucresi; el oraya gore konumlaniyor ki
    # uc tam cizginin sag ucuna dokunsun.
    o = boy / EL_BOY
    # Parmak ucu cagrinin UZERINE basiyor — yaninda degil. Once
    # cizginin sag ucuna koymustum; el ayri bir sey gibi duruyordu.
    # Tiklanan sey cagrinin kendisi, o yuzden ucu metnin uzerine
    # getiriyoruz ve el asagi saga sarkiyor.
    uc_x, uc_y = x + en * 0.58, y - punto * 0.30
    el_x = uc_x - EL_UC_X * o
    el_y = uc_y - EL_UC_Y * o
    return en, (
        # Halka once: elin ve metnin ARKASINDA kalsin
        # Halka yok. Parmak ucunda bir nabiz denendi; cirkindi ve
        # afisin sakin dilini bozuyordu. Dokunus hissi zaten metnin
        # kisa cokusunde var — fazlasi gurultu.
        '<g class="dokunus">'
        '<text class="sans" x="%d" y="%d" font-size="%d" letter-spacing="0.6" '
        'font-weight="700" fill="%s">%s</text>'
        '</g>'
        '<g transform="translate(%d,%.0f)"><rect class="cizik" x="0" y="0" '
        'width="%.0f" height="1.5" fill="%s"/></g>'
        '%s'
        % (x, y, punto, c, metin,
           x, y + 7, en, c,
           imlec_piksel(el_x, el_y, boy, c)))


def _olcu(bicim):
    # Serit formatlarin puntolari panelinkilerle uyumlu tutuluyor.
    # Onceki tavanlar (42 / 32) ayni markanin genis afisini dar
    # afisinden bambaska gosteriyordu.
    if bicim == "measure":
        # Aciklama dort formatta da 14. Measure'da 15'ti; ekranda
        # olceklenince 12.5 piksele denk geliyor, otekiler 11.1-11.8
        # arasinda kaliyordu. Ayni markanin dort afisinde govde metni
        # ayni boyda okunmali.
        return dict(K=48, ad=14, bas_tavan=34, alt=14, cag=13)
    if bicim == "feature":
        return dict(K=40, ad=13, bas_tavan=28, alt=14, cag=12)
    if bicim == "panel":
        return dict(K=34, ad=12, bas_tavan=30, alt=14, cag=12)
    # rail: dar ama uzun. Tavan 30 — measure 34, feature 28, panel 30
    # ile ayni ailede kalsin diye. Once yigin duzen bu degeri hic
    # kullanmiyor, 46'ya kadar cikiyordu: ayni markanin rail afisi
    # panelinkinin iki kati puntoyla basiliyordu.
    return dict(K=32, ad=13, bas_tavan=30, alt=14, cag=12)


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
def _plain_cagri(x, y, metin, punto, gecikme, ek=""):
    """Alti cizili cagri + uzerine basan el — bir perdeye ait.

    Tek mesajli surumdeki cagri_baglantisi ile ayni fikir; farki, bu
    perdeye ozel gecikmeyi tasimasi. Ayni keyframe seti uc mesaj icin
    de yetiyor, sirayi yalnizca animation-delay veriyor.
    """
    g = 'style="animation-delay:%.2fs"' % gecikme
    # Gercek harf genisligiyle olculuyor; ayrica metne textLength
    # veriliyor, boylece cizgi ile yazi HER PLATFORMDA birebir esit.
    # Yazi tipi isletim sistemine gore degisiyor (Segoe UI, Roboto,
    # Helvetica...), tek bir tabloyla tam tutturmak mumkun degil;
    # textLength bunu tarayiciya zorla yaptiriyor.
    en = sans_olc(metin, punto)
    o = EL_BOY and (punto * 2.4) / EL_BOY
    boy = punto * 2.4
    uc_x, uc_y = x + en * 0.58, y - punto * 0.30
    el_x = uc_x - EL_UC_X * o
    el_y = uc_y - EL_UC_Y * o
    el = ('<g class="mel%s" %s><g transform="translate(%.1f,%.1f) scale(%.4f) translate(%d,0)" '
          'shape-rendering="crispEdges"><path d="%s" fill="%s"/><path d="%s" fill="%s"/></g></g>'
          % (ek, g, el_x, el_y, o, -EL_KAYDIR, EL_HAT, MUREKKEP, EL_IC, KAGIT))
    return en, (
        '<text class="sans mcag%s" %s x="%d" y="%d" font-size="%d" textLength="%.1f" '
        'lengthAdjust="spacing" font-weight="700" fill="%s">%s</text>'
        '<g transform="translate(%d,%.0f)"><rect class="mciz%s" %s x="0" y="0" '
        'width="%.0f" height="1.5" fill="%s"/></g>'
        '%s' % (ek, g, x, y, punto, en, MUREKKEP, metin,
                x, y + 7, ek, g, en, MUREKKEP, el))


def k_plain(m, w, h, bicim, t, o, serit):
    """On alti markanin hepsinde AYNI duzen. Deneyin kontrol grubu.

    Marka rengi yok, sus yok — kagit, murekkep, tek hairline. Sade
    olmasi bos olmasi demek degil: dikey formatin ortasi bombostu ve
    ucuz duruyordu, artik tipografiyle doluyor.

    Hap dugme yok. Goz her seferinde dugmeye cekiliyor, okunan sey afis
    degil dugme oluyordu. Yerine alti cizili bir cagri ve uzerine basan
    klasik el imleci var.

    COK MESAJ: bir markanin tek cumlesi yok. Panicworkz'un ana sayfasi
    "we thrive under pressure" diyor, hizmet sayfasi LLM ajanlarindan,
    iletisim sayfasi 24 saatte donmekten bahsediyor. Ucu de afiste
    sirayla oynuyor; kunye sabit kaliyor ki marka her degisimde yanip
    sonmesin.
    """
    K, p = o["K"], []
    mesajlar = t["mesajlar"]
    n = len(mesajlar)

    def gec(i):
        return i * PERDE_SURE

    def sonraki(i):
        """Ilk perde disindakiler. Hareket kapaliyken gizlenecekler."""
        return " sonraki" if i else ""

    if serit:
        var = bool(logo_veri(m["kod"]))
        tek_logo = kelime_markasi(m["kod"])
        # feature 180 piksel: 34'luk kelime markasi tavana yapisiyordu.
        if tek_logo:
            lg = 26 if bicim == "feature" else 34
        else:
            lg = 22 if bicim == "feature" else 26

        NEFES = 22

        def duzen(K):
            """Verilen kenar payiyla olculeri cikarir."""
            cagri_en = max(sans_olc(mes["cagri"], o["cag"] + 1) for mes in mesajlar)
            cx = w - K - cagri_en
            alan = cx - K - 56
            olculer = []
            # Serit formatta da satir sayisi butun perdelerde ayni olmali;
            # yigin duzendeki ile ayni gerekce.
            _ab0 = o["alt"]
            _hedef = max(len(sar(x["alt"], int(alan / (SANS_EM * _ab0)))) for x in mesajlar)
            _hedef = min(_hedef, 2)
            ortak_bb = min(sigan([" ".join(x["bas"])], alan, o["bas_tavan"], 20)
                           for x in mesajlar)
            for mes in mesajlar:
                tek = " ".join(mes["bas"])
                bb = ortak_bb
                ab = o["alt"]
                parca = sar(mes["alt"], int(alan / (SANS_EM * ab)))
                while len(parca) > 2 and ab > 12:
                    ab -= 1
                    parca = sar(mes["alt"], int(alan / (SANS_EM * ab)))
                tam_en = int(alan / (SANS_EM * ab))
                dar = tam_en
                while len(parca) < _hedef and dar > tam_en * 0.6:
                    dar -= 1
                    parca = sar(mes["alt"], dar)
                lh = int(ab * 1.45)
                toplam = (lg + 5) + 26 + bb + NEFES + ab + (len(parca) - 1) * lh + ab * 0.22
                olculer.append((tek, bb, ab, parca, lh, toplam))
            blok = max(x[5] for x in olculer)
            return cagri_en, cx, alan, olculer, blok, max(8.0, (h - blok) / 2)

        # DORT KENAR ESIT.
        #
        # Dikey pay icerigin yuksekligine, icerigin genisligi de yatay
        # paya bagli — ikisi birbirini kovaliyor. Iki gecis yetiyor:
        # once mevcut payla dikeyi buluyoruz, sonra yatayi ona esitleyip
        # olculeri yeniliyoruz.
        # Kenar payi ile dikey pay birbirini kovaliyor: dar kenar payi
        # metne daha cok yer verir, metin daha az satira siger, blok
        # kisalir, dikey pay buyur. Iki gecisli yaklasim salindiginda
        # ust 18 sol 30 gibi sonuclar veriyordu.
        #
        # Onun yerine tariyoruz: dikey payin kenar payina yetistigi ilk
        # degeri aliyoruz. Boylece dort kenar tanimi geregi esit.
        # BUYUKTEN kucuge. Kucukten baslayinca ilk uyan deger daima 8
        # oluyordu ve kenarlar 8 piksele cokuyordu; oysa aranan sey
        # dikey payin yetistigi EN BUYUK kenar payi.
        K_ilk = K
        for aday in range(K_ilk, 7, -1):
            cagri_en, cx, alan, olculer, blok, V = duzen(aday)
            if V >= aday:
                K = aday
                break
        else:
            K = K_ilk
        cagri_en, cx, alan, olculer, blok, V = duzen(K)
        V = K
        ust = V + lg + 5

        if m.get("yazi_logo"):
            p.append(yazi_logosu(m, K, ust - 9 - lg + 4, lg))
        elif var:
            p.append(logo(m["kod"], K, ust - 9 - lg + 4, lg, azami_en=lg * 4.2))
        if not tek_logo and not m.get("yazi_logo"):
            mx = K + (int(logo_eni(m["kod"], lg, azami_en=lg * 3.4)) + 12 if var else 0)
            p.append('<text class="sans" x="%d" y="%.0f" font-size="%d" letter-spacing="1.8" '
                     'font-weight="700" fill="%s">%s</text>'
                     % (mx, ust - 9, o["ad"], MUREKKEP, t["ad"].upper()))
        p.append('<text class="sans" x="%d" y="%.0f" font-size="11" letter-spacing="1.2" '
                 'fill="%s" text-anchor="end">%s</text>' % (w - K, ust - 9, UCUNCUL, m["alan"]))
        p.append('<g transform="translate(%d,%.0f)"><rect x="0" y="0" width="%d" height="1" '
                 'fill="%s"/></g>' % (K, ust, w - 2 * K, KURAL))

        for i, (tek, bb, ab, parca, lh, _yuk) in enumerate(olculer):
            g = 'style="animation-delay:%.2fs"' % gec(i)
            nefes = (h - V - ab * 0.22) - (ust + 26 + bb) - ab - (len(parca) - 1) * lh
            nefes = max(14, nefes)
            ic = ['<text class="disp" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                  % (K, ust + 26 + bb, bb, MUREKKEP, tek)]
            for j, satir in enumerate(parca):
                ic.append('<text class="sans" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                          % (K, ust + 26 + bb + nefes + ab + j * lh, ab, IKINCIL, satir))
            p.append('<g class="perde%s" %s>%s</g>' % (sonraki(i), g, "".join(ic)))
            cy = (ust + 26 - bb * 0.72 + h - V) / 2 + (o["cag"] + 1) * 0.36
            # Cagri SAGA hizali. Hepsini ayni x'ten baslatinca metin
            # uzunlugu degistigi icin sag pay perdeye gore 31, 39, 81
            # piksel cikiyordu; esit kenar sozu o perdede bozuluyordu.
            # Metin alani yine EN UZUN cagriya gore ayrildi, cakisma yok.
            kendi_en = sans_olc(mesajlar[i]["cagri"], o["cag"] + 1)
            _, cg = _plain_cagri(w - K - kendi_en, cy, mesajlar[i]["cagri"],
                                 o["cag"] + 1, gec(i), sonraki(i))
            p.append(cg)
    else:
        alan = w - 2 * K
        # Dort kenar da esit: logonun ustu, cagrinin alti, sol ve sag
        # hepsi K kadar. Once y_ad ve y_cagri sabit 16 piksellik paylarla
        # yaziliyordu; logo boyu markadan markaya degistigi icin ust pay
        # 25, alt pay 41.5 cikiyordu.
        var = bool(logo_veri(m["kod"]))
        tek_logo = kelime_markasi(m["kod"])
        lb = 30 if tek_logo else 20
        y_ad = K + lb - 5              # logo ustu tam K'da
        y_cagri = h - K - 8            # cagri cizgisinin alti tam K'da

        if m.get("yazi_logo"):
            p.append(yazi_logosu(m, K, y_ad - lb + 5, lb))
        elif var:
            p.append(logo(m["kod"], K, y_ad - lb + 5, lb, azami_en=alan * 0.68))
        if not tek_logo and not m.get("yazi_logo"):
            p.append('<text class="sans" x="%d" y="%d" font-size="%d" letter-spacing="1.8" '
                     'font-weight="700" fill="%s">%s</text>'
                     % (K + (int(logo_eni(m["kod"], lb, azami_en=68)) + 12 if var else 0),
                        y_ad, o["ad"], MUREKKEP, t["ad"].upper()))
        p.append('<text class="sans" x="%d" y="%d" font-size="11" letter-spacing="1.2" '
                 'fill="%s" text-anchor="end">%s</text>' % (w - K, y_ad, UCUNCUL, m["alan"]))
        p.append('<g transform="translate(%d,%d)"><rect x="0" y="0" width="%d" height="1" '
                 'fill="%s"/></g>' % (K, y_ad + 12, alan, KURAL))
        p.append('<g transform="translate(%d,%d)"><rect x="0" y="0" width="%d" height="1" '
                 'fill="%s"/></g>' % (K, y_cagri - 30, alan, KURAL))

        bosluk = y_cagri - (y_ad + 34) - 30
        en_dip = y_ad + 40      # butun perdelerin en alcak baslik dibi

        # FORMATIN HEDEF SATIR SAYISI.
        #
        # Ayni metin panelde 2, rail'de 4 satir olsun isteniyor. Bu tek
        # basina mumkun degil: panelde 443 piksellik olcude 2 satir icin
        # metin en fazla ~119 karakter, rail'in 323 pikselinde 4 satir
        # icinse en az ~130 karakter olmali.
        #
        # Cozum sutunu daraltmak. Rail uzun ve dar; aciklamayi alanin
        # tamamina degil bir bolumune sariyoruz. Dizgide dar olcu zaten
        # daha okunur, ve satir sayisi boylece metnin uzunluguna degil
        # tasarima bagli oluyor.
        HEDEF = {"panel": 2, "rail": 4}.get(bicim)

        # ORTAK SATIR SAYISI.
        #
        # Aciklamalarin kelime sayisi ve genisligi esitlense bile satir
        # kirilimi ayni yere duşmuyor: Yerine'nin rail afisinde perdeler
        # 4, 4 ve 3 satir cikiyordu. Ayni kutuda bir perde uc bir perde
        # dort satir olunca afis her mesajda baska bir tasarim gibi
        # goruluyor.
        #
        # Cozum puntoyu degil SARMA GENISLIGINI oynatmak: yazi boyu
        # butun perdelerde ayni kaliyor, yalnizca kisa metin biraz daha
        # erken kiriliyor. Once en cok satiri bulup hedef aliyoruz.
        # ORTAK PUNTO.
        #
        # Punto perde basina hesaplaniyordu: basligi uzun olan perdede
        # kuculuyor, aciklama da ona bagli oldugu icin o perdede daha
        # ufak basiliyordu. Ayni afiste bir mesaj iri, otekisi ufak
        # goruluyordu.
        #
        # Butun perdeleri hesaplayip EN KUCUK puntoyu hepsine
        # veriyoruz: en sikisik mesaj neye siginiyorsa olcu o.
        ortak_bb = min(sigan(x["bas"], alan, o["bas_tavan"], 22) for x in mesajlar)
        # Aciklama puntosu FORMATIN kendi olcusu.
        #
        # Once baslikta turetiliyordu (bb * 0.44) ve rail'de 12 piksele
        # duşuyordu; ayni metin measure'da 15, feature'da 14 punto
        # basiliyordu. Ayni markanin dort afisi ayni aileden gorunmuyordu.
        # Sigmazsa once baslik kuculuyor, aciklama en son.
        _ab0 = o["alt"]
        hedef_satir = max(len(sar(x["alt"], int(alan / (SANS_EM * _ab0)))) for x in mesajlar)
        if HEDEF:
            hedef_satir = max(hedef_satir, HEDEF)

        for i, mes in enumerate(mesajlar):
            g = 'style="animation-delay:%.2fs"' % gec(i)
            ic = []
            # NEFES: aciklama ile altindaki kural arasi ve baslikla
            # aciklama arasi sabit. Once "kurala hizala, ama basligin
            # altindan asagi kalmasin" diye max() aliyordum; basligi
            # uzun mesajlarda aciklama asagi itilip kurala yapisiyordu.
            # Simdi aciklama HEP kuraldan 26 piksel yukarida duruyor ve
            # sigmiyorsa kuculen sey baslik oluyor.
            # Nefes paylari BUTUN formatlarda ayni. Panelde sigsin diye
            # 13'e indirmistim; sigdirmak icin kurali formata gore
            # esnetmek, kuralin kendisini bozuyor. Sigmiyorsa kuculecek
            # olan puntodur, pay degil.
            NEFES_KURAL = NEFES_BASLIK = 26
            satirlar = mes["bas"]
            bb = ortak_bb

            def olc(bb, ab=None):
                satir = int(bb * 1.18)
                ab = ab or o["alt"]
                tam_en = int(alan / (SANS_EM * ab))
                parca = sar(mes["alt"], tam_en)
                # Eksik satir varsa sarma genisligini daralt
                dar = tam_en
                while len(parca) < hedef_satir and dar > tam_en * 0.6:
                    dar -= 1
                    parca = sar(mes["alt"], dar)
                lh = int(ab * 1.45)
                alt_yuk = len(parca) * lh
                y_son = y_ad + 40 + bb + (len(satirlar) - 1) * satir
                # SON SATIRIN TABANI kuraldan tam NEFES_KURAL kadar
                # yukarida. Once blogun altindan hesapliyordum; aradaki
                # fark satir araligina bagli oldugu icin panelde 31,
                # rail'de 40 piksel cikiyordu. Ayni kural her formatta
                # ayni sonucu vermeli.
                y_alt = y_cagri - 30 - NEFES_KURAL - (len(parca) - 1) * lh
                return satir, ab, parca, alt_yuk, y_son, y_alt

            satir, ab, parca, alt_yuk, y_son, y_alt = olc(bb)
            # Baslik 20'ye kadar iniyor. Once 22'de duruyordu ve kalan
            # acigi aciklama kapatiyordu: panelde 12 punto, oteki
            # formatlarda 14. Aciklama govde metni, formatlar arasinda
            # sabit kalmali; esneyecek olan basliktir.
            # Baslik tabani da butun formatlarda ayni.
            while y_son + NEFES_BASLIK > y_alt and bb > 20:
                bb -= 1
                satir, ab, parca, alt_yuk, y_son, y_alt = olc(bb)
            # Baslik tabana vurduysa son care aciklamayi kucultmek
            _ab = o["alt"]
            while y_son + NEFES_BASLIK > y_alt and _ab > 12:
                _ab -= 1
                satir, ab, parca, alt_yuk, y_son, y_alt = olc(bb, _ab)

            y = y_ad + 40 + bb
            for j, sat in enumerate(satirlar):
                ic.append('<text class="disp" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                          % (K, y + j * satir, bb, MUREKKEP, sat))
            y += (len(satirlar) - 1) * satir
            en_dip = max(en_dip, y)

            # y_alt olc() icinde hesaplandi; burada YENIDEN hesaplamiyoruz.
            #
            # Burada eski bir kopya kalmisti: NEFES_KURAL yerine sabit 34
            # kullaniyor ve kaldirdigimi sandigim max(..., y+26) kelepcesini
            # uyguluyordu. Panelde kelepceye takilip 13, rail'de 34'e gore
            # 40 piksel bosluk cikiyordu — ayni kural iki formatta iki
            # sonuc veriyordu.
            alt_yuk = len(parca) * int(ab * 1.45)
            en_ust_alt = min(locals().get("en_ust_alt", 10**9), y_alt)
            for j, par in enumerate(parca):
                ic.append('<text class="sans" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                          % (K, y_alt + ab + j * int(ab * 1.45), ab, IKINCIL, par))
            p.append('<g class="perde%s" %s>%s</g>' % (sonraki(i), g, "".join(ic)))
            _, cg = _plain_cagri(K, y_cagri, mes["cagri"], o["cag"] + 1, gec(i), sonraki(i))
            p.append(cg)

        # Ortadaki bant: o an OYNAMAYAN soylemler.
        #
        # Once ucu birden listeleniyordu ve oynayan koyu basiliyordu;
        # ama o cumle zaten hemen ustte iri puntoyla duruyordu, liste
        # onu tekrar ediyordu. Simdi yalnizca DIGER ikisi yaziliyor:
        # okur "afiste baska ne var" sorusunun cevabini goruyor,
        # tekrar olmadan.
        #
        # NUMARA YOK. Once 01/02/03 yaziyordu; ama oynayan soylem
        # listeden cikinca sira kopuk goruluyor (02, 03 sonra 01, 03)
        # ve eksik bir sey varmis izlenimi veriyordu. Numara ancak okur
        # butun diziyi gorebiliyorsa anlam tasir. Yerine kisa bir
        # cizgi: satirlarin liste oldugunu soyluyor, sayi iddia
        # etmiyor. Liste perdenin icinde, cunku icerigi her perdede
        # degisiyor.
        bant_ust = en_dip + 22
        bant_alt = locals().get("en_ust_alt", y_cagri - 30) - 16
        lb_punto = 13
        lsatir = int(lb_punto * 1.9)
        if len(mesajlar) > 1 and (bant_alt - bant_ust) > lsatir * (len(mesajlar) - 1):
            for i in range(len(mesajlar)):
                g = 'style="animation-delay:%.2fs"' % gec(i)
                ic = []
                for k, j in enumerate([x for x in range(len(mesajlar)) if x != i]):
                    metin = " ".join(mesajlar[j]["bas"])
                    pn = lb_punto
                    while sans_olc(metin, pn) > alan - 22 and pn > 10:
                        pn -= 1
                    ly = bant_ust + lsatir * k + pn
                    ic.append('<rect x="%d" y="%.0f" width="12" height="1" fill="%s"/>'
                              % (K, ly - pn * 0.32, KURAL))
                    ic.append('<text class="sans" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                              % (K + 22, ly, pn, UCUNCUL, metin))
                p.append('<g class="perde%s" %s>%s</g>' % (sonraki(i), g, "".join(ic)))

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
        p.append('<g transform="translate(%d,%.0f)"><rect class="cizgi" x="0" y="0" width="%.0f" height="4" fill="%s"/></g>' % (K, ust, alan, m["renk"]))
        p.append('<text class="disp g1" x="%d" y="%.0f" font-size="%d" font-style="italic" '
                 'fill="%s">%s</text>' % (K, ust - 11, o["ad"] + 5, m["koyu"], t["ad"]))
        p.append('<g transform="translate(%d,%.0f)"><rect class="cizgi" x="0" y="0" width="%.0f" height="1" fill="%s"/></g>'
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
        p.append('<g transform="translate(%d,%d)"><rect class="cizgi" x="0" y="0" width="%d" height="4" fill="%s"/></g>' % (K, y+10, alan, m["renk"]))
        p.append('<g transform="translate(%d,%d)"><rect class="cizgi" x="0" y="0" width="%d" height="1" fill="%s"/></g>' % (K, y+18, alan, KURAL))
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
    .serit { animation: serit __SURE__s cubic-bezier(.16,1,.3,1) infinite }
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
        p.append('<g transform="translate(%d,%.0f)"><rect class="cizgi" x="0" y="0" width="%.0f" height="2" fill="%s"/></g>' % (K, ust, alan, MUREKKEP))
        p.append('<text class="disp g2" x="%d" y="%.0f" font-size="%d" fill="%s">%s</text>'
                 % (K, ust + 24 + bb, bb, MUREKKEP, tek))
        ab = o["alt"]
        while sans_en(t["alt"], ab) > alan and ab > 11:
            ab -= 1
        p.append('<g transform="translate(%d,%.0f)"><rect class="cizgi" x="0" y="0" width="%.0f" height="1" fill="%s"/></g>'
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
        p.append('<g transform="translate(%d,%d)"><rect class="cizgi" x="0" y="0" width="%d" height="2" fill="%s"/></g>' % (K, y+10, alan, MUREKKEP))
        y += 30 + bb
        for i, s in enumerate(t["bas"]):
            p.append('<text class="disp g2" x="%d" y="%d" font-size="%d" fill="%s">%s</text>'
                     % (K, y + i*int(bb*1.2), bb, MUREKKEP, s))
        y += (len(t["bas"])-1)*int(bb*1.2)
        p.append('<g transform="translate(%d,%d)"><rect class="cizgi" x="0" y="0" width="%d" height="1" fill="%s"/></g>' % (K, y+12, alan, KURAL))
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
    .sutun { animation: sutun __SURE__s cubic-bezier(.16,1,.3,1) infinite; transform-origin: center top }
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
    .hale { animation: hale __SURE__s cubic-bezier(.16,1,.3,1) infinite; transform-origin: center }
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
    .isaret { animation: isaret __SURE__s cubic-bezier(.16,1,.3,1) infinite; transform-origin: right center }
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


def afis(m, bicim, dil, varyant, mesaj_no=0):
    w, h = FORMATLAR[bicim]
    serit = bicim in ("measure", "feature")
    o = _olcu(bicim)

    hepsi = m["metin"][dil]
    mesaj = hepsi[mesaj_no]
    bas, alt, cagri = mesaj[0], mesaj[1], mesaj[2]

    # Sade set butun mesajlari BIR afiste sirayla oynatiyor; stilli set
    # su an tek mesajli.
    perde = len(hepsi) if varyant == "plain" else 1
    t = dict(ad=kacir(m["ad"]), bas=[kacir(x) for x in bas],
             alt=kacir(alt), cagri=kacir(cagri),
             mesajlar=[dict(bas=[kacir(x) for x in v[0]], alt=kacir(v[1]),
                            cagri=kacir(v[2])) for v in hepsi])

    karakter = "plain" if varyant == "plain" else m["stil"]
    parcalar, zemin, ek, ust_serit = KARAKTERLER[karakter](m, w, h, bicim, t, o, serit)
    etiket = kacir("%s - %s" % (m["ad"], " / ".join(" ".join(v[0]) for v in hepsi)
                                if varyant == "plain" else " ".join(bas)))

    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
           'role="img" aria-label="%s">\n'
           '  <style>%s</style>\n'
           '  <rect width="%d" height="%d" fill="%s"/>\n'
           '  <rect x="0" y="0" width="%d" height="3" fill="%s"/>\n'
           '%s\n</svg>\n'
           % (w, h, w, h, etiket, stil_blogu(ek, perde).replace("SURE", str(SURE)),
              w, h, zemin, w, ust_serit,
              "\n".join("  " + x for x in parcalar)))

    # Afisler sayfaya GOMULUYOR; sinif ve keyframe adlari benzersiz
    # olmazsa birinin stili otekine uygulaniyor. Varyant da oneke
    # giriyor, yoksa ayni markanin iki afisi carpisir.
    return markala(svg, "d%s%s%d" % (m["kod"][:6], varyant[0], mesaj_no))


def _mesajlari_denetle():
    """Uc mesajin aciklamalari ayni uzunlukta gorunmeli.

    Afiste uc perde ayni kutuyu dolduruyor. Aciklamalar birbirinden
    uzun olunca satir sayisi ve punto degisiyor, afis her mesajda baska
    bir tasarima donusuyor.

    OLCU KELIME DEGIL, BASILAN GENISLIK. Once kelime sayisini
    esitlemistim; ucu de 16 kelimeydi ama genislikleri 591, 891 ve 702
    piksel cikti — arada yuzde elli bir fark. "native-quality",
    "high-accuracy", "sub-200ms" gibi bilesikler tek kelime sayilirken
    satiri iki katina cikariyor.
    """
    for m in MARKALAR:
        for dil in ("en", "tr"):
            v = m["metin"][dil]
            if len(v) < 2:
                continue
            gen = [sans_olc(x[1], 14) for x in v]
            sapma = (max(gen) - min(gen)) / min(gen)
            if sapma > 0.08:
                raise ValueError(
                    "%s/%s aciklama genislikleri %s — sapma %%%.0f, en fazla %%8"
                    % (m["kod"], dil, [round(x) for x in gen], sapma * 100))
            # Genislik tek basina yetmiyor: ayni genislikte ama biri 11
            # otekisi 20 kelime olan iki metin sayfada farkli okunuyor.
            # Ikisi birden tutmali.
            kel = [len(x[1].split()) for x in v]
            if max(kel) - min(kel) > 1:
                raise ValueError(
                    "%s/%s aciklama kelime sayilari %s — fark en fazla 1 olmali"
                    % (m["kod"], dil, kel))


def main():
    _mesajlari_denetle()
    dil = sys.argv[1] if len(sys.argv) > 1 else "en"
    assert dil in ("en", "tr"), "dil: en | tr"
    kok = pathlib.Path(__file__).resolve().parents[2] / "public" / "media" / "deney"
    cikti = kok if dil == "en" else kok / "tr"
    cikti.mkdir(parents=True, exist_ok=True)
    n = 0
    for m in MARKALAR:
        for bicim in FORMATLAR:
            # Sade set: butun mesajlar TEK afiste sirayla oynuyor.
            (cikti / ("%s-%s-plain.svg" % (m["kod"], bicim))).write_text(
                afis(m, bicim, dil, "plain", 0), encoding="utf-8")
            n += 1
            # Stilli set: her mesaj kendi afisi
            for i in range(len(m["metin"][dil])):
                ek = "" if len(m["metin"][dil]) == 1 else "-%d" % (i + 1)
                (cikti / ("%s-%s-styled%s.svg" % (m["kod"], bicim, ek))).write_text(
                    afis(m, bicim, dil, "styled", i), encoding="utf-8")
                n += 1
    print("%d afis (%s) -> %s" % (n, dil, cikti))


if __name__ == "__main__":
    main()
