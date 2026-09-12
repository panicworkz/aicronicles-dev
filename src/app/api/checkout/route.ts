import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, inArray, sql } from "drizzle-orm";
import { handleApiError, apiBadRequest } from "@/lib/api-response";
import { turu, stokta } from "@/lib/magaza";
import { siparisBildir } from "@/lib/siparis-eposta";
import { kargoUcreti, bolgesi } from "@/lib/kargo";
import { kargoTarifesi } from "@/lib/kargo-ayar";
import { ulkeGecerli } from "@/lib/ulkeler";

export const dynamic = "force-dynamic";

/**
 * Siparis olusturma.
 *
 * SEPETTEKI FIYATA GUVENILMIYOR. Sepet tarayicida duruyor, yani okurun
 * duzenleyebilecegi bir yer; gelen govdedeki tutar dikkate alinmiyor.
 * Yalnizca URUN KIMLIGI ve ADET okunuyor, fiyat veritabanindan yeniden
 * cekiliyor ve toplam burada hesaplaniyor.
 *
 * Odeme: havale ya da kapida odeme. Ikisinde de para SONRA aliniyor,
 * yani bu uc para tahsil etmiyor — siparisi "odeme bekliyor" olarak
 * kaydediyor. Kart odemesi eklenince buraya bir saglayici adimi
 * girecek; o yuzden yontem tek bir alanda tutuluyor ve akis saglayiciya
 * bagli degil.
 *
 * Oturum ISTEMIYOR: magaza herkese acilinca okurun bir sey almak icin
 * hesap acmasi gerekmemeli. Middleware'in acik listesine POST olarak
 * eklendi — iletisim formundaki ayni gerekce.
 */

const YONTEMLER = ["bank_transfer", "cash_on_delivery"] as const;
type Yontem = (typeof YONTEMLER)[number];

/**
 * Kapida odeme yalnizca ELDEN teslim edilen bir sey icin ve yalnizca
 * KURYENIN NAKIT TOPLADIGI yerde anlamli.
 *
 * Ulke kosulu eksikti: Almanya'ya giden bir siparise de kapida odeme
 * secenegi aciliyordu. Boyle bir siparis alinsa parayi kimse tahsil
 * edemezdi — yurt disi kuryeler bu hizmeti vermiyor.
 */
function yontemUygun(yontem: Yontem, turler: string[], ulke?: string | null): boolean {
  if (yontem !== "cash_on_delivery") return true;
  if (!turler.every((t) => t === "physical")) return false;
  return bolgesi(ulke) === "tr";
}

function eposta(d: unknown): string | null {
  const s = String(d ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 200 ? s : null;
}

/** Siparis numarasi: tarih + rastgele. Sirali olsaydi kac satis
    yaptigimizi disaridan sayilabilirdi. */
function siparisNo(): string {
  const g = new Date();
  const tarih = `${g.getFullYear()}${String(g.getMonth() + 1).padStart(2, "0")}${String(g.getDate()).padStart(2, "0")}`;
  const rastgele = Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, "0");
  return `FB-${tarih}-${rastgele}`;
}

export async function POST(req: NextRequest) {
  try {
    const g = await req.json().catch(() => ({}) as any);

    /* Tuzak alan — iletisim formundakiyle ayni. Otomatik doldurucu
       her alani doldurur; insan bunu gormez bile. */
    if (String(g?.website_url ?? "").trim()) {
      return NextResponse.json({ success: true, orderNumber: siparisNo() });
    }

    const kalemler = Array.isArray(g?.items) ? g.items : [];
    if (kalemler.length === 0) return apiBadRequest("Your basket is empty.");
    if (kalemler.length > 50) return apiBadRequest("That is too many items for one order.");

    const email = eposta(g?.email);
    if (!email) return apiBadRequest("A valid e-mail address is required.");

    const ad = String(g?.name ?? "").trim().slice(0, 160);
    if (!ad) return apiBadRequest("A name is required.");

    const yontem = String(g?.paymentMethod ?? "") as Yontem;
    if (!YONTEMLER.includes(yontem)) return apiBadRequest("Choose how you want to pay.");

    /* On bilgilendirme onayi ZORUNLU ve burada da denetleniyor.
       Ekrandaki kutu yeterli degil: bu uc herkese acik, dogrudan
       cagrilabilir. Onayin alindigini SATICI ispat etmek zorunda
       (Mesafeli Sozlesmeler Yonetmeligi m.5), o yuzden onay olmadan
       siparis olusmuyor ve onay ZAMANI kayda yaziliyor. */
    if (!g?.termsAccepted) {
      return apiBadRequest("Please accept the pre-information form and the sales contract.");
    }

    /* Istenen urunler TEK sorguda okunuyor; kalem basina sorgu atmak
       elli kalemlik bir sepette elli gidis donus olurdu. */
    const istenen = kalemler
      .map((k: any) => parseInt(String(k?.urunId ?? k?.productId), 10))
      .filter((n: number) => Number.isFinite(n));
    if (istenen.length === 0) return apiBadRequest("Your basket is empty.");

    const urunler = await db.query.products.findMany({
      where: inArray(schema.products.id, Array.from(new Set(istenen))),
    });
    const urunById = new Map((urunler as any[]).map((u) => [u.id, u]));

    const varyantlar = await db.query.productVariants.findMany({
      where: inArray(
        schema.productVariants.productId,
        Array.from(new Set(istenen))
      ),
    });
    const varyantById = new Map((varyantlar as any[]).map((v) => [v.id, v]));

    const satirlar: any[] = [];
    let araToplam = 0;
    let paraBirimi: string | null = null;

    for (const k of kalemler) {
      const urun = urunById.get(parseInt(String(k?.urunId ?? k?.productId), 10));
      if (!urun) return apiBadRequest("One of the items is no longer available.");
      if (urun.status !== "published") {
        return apiBadRequest(`“${urun.title}” is no longer on sale.`);
      }
      if (!stokta(urun)) return apiBadRequest(`“${urun.title}” is out of stock.`);

      const adet = Math.max(1, Math.min(99, parseInt(String(k?.adet ?? k?.quantity ?? 1), 10) || 1));

      /* Varyant fiyati varsa o gecerli; yoksa urunun fiyati. Ikisi de
         VERITABANINDAN, gelen govdeden degil. */
      const varyant = k?.varyantId ? varyantById.get(parseInt(String(k.varyantId), 10)) : null;
      if (k?.varyantId && (!varyant || varyant.productId !== urun.id)) {
        return apiBadRequest("One of the options is no longer available.");
      }
      const birimFiyat = Number(varyant?.price ?? urun.price ?? 0);

      /* Tek siparis tek para birimi. Farkli birimleri toplamak tek bir
         tutar uretemez ve cevirmek dogru degil (fiyat kesin olmali). */
      const birim = urun.currency || "USD";
      if (paraBirimi && paraBirimi !== birim) {
        return apiBadRequest("An order can only be in one currency.");
      }
      paraBirimi = birim;

      const satirToplam = birimFiyat * adet;
      araToplam += satirToplam;

      satirlar.push({
        productId: urun.id,
        variantId: varyant?.id ?? null,
        title: varyant ? `${urun.title} — ${varyant.title}` : urun.title,
        productType: turu(urun.productType),
        digitalAssetUrl: urun.digitalAssetUrl ?? null,
        quantity: adet,
        unitPrice: birimFiyat.toFixed(2),
        totalPrice: satirToplam.toFixed(2),
      });
    }

    const turler = satirlar.map((s) => s.productType);

    /* Dijital urunde cayma hakki istisnasi ANCAK tuketici ayrica
       onayladiysa gecerli. Onay yoksa istisna dogmaz; o yuzden
       siparisi bu onay olmadan almiyoruz. */
    const dijitalVar = turler.some((t) => t !== "physical");
    if (dijitalVar && !g?.digitalWaiver) {
      return apiBadRequest(
        "Please confirm you understand that items delivered immediately cannot be cancelled."
      );
    }


    /* Kargo adresi yalnizca ELDE teslim edilen bir sey varsa gerekiyor.
       Dijital bir rehber icin adres istemek gereksiz veri toplamaktir. */
    const kargoGerekli = turler.includes("physical");
    const adres = g?.address ?? null;
    if (kargoGerekli) {
      const eksik = ["line1", "city", "postcode", "country"].filter(
        (a) => !String(adres?.[a] ?? "").trim()
      );
      if (eksik.length) return apiBadRequest("A delivery address is required.");
      /* Ulke kodu DOGRULANIYOR: kargo bolgesi buradan cikiyor ve
         serbest bir metin "Rest of world" tarifesine dusup yanlis
         ucret uretebilirdi. */
      if (!ulkeGecerli(adres?.country)) {
        return apiBadRequest("Please choose your country from the list.");
      }
    }

    /* Yontem kontrolu ADRESTEN SONRA: kapida odemenin gecerli olup
       olmadigi teslimat ulkesine bagli ve ulke ancak burada belli
       oluyor. */
    if (!yontemUygun(yontem, turler, adres?.country)) {
      return apiBadRequest(
        "Cash on delivery is available only for shipped orders inside Türkiye."
      );
    }

    const telefon = String(g?.phone ?? "").trim().slice(0, 40);
    if (kargoGerekli && !telefon) {
      return apiBadRequest("A phone number is required for delivery.");
    }

    /* KARGO SUNUCUDA HESAPLANIYOR.
       Istemci de hesapliyor (sepette gostermek icin) ama gonderdigi
       tutara guvenilmiyor: tarayicidan gelen bir sayiyi siparise
       yazmak, alicinin kargoyu sifira cekebilmesi demekti. Tarife
       girilmemisse sifir kaliyor ve eski davranis suruyor — tutar
       dispatch'ten once musteriyle konusuluyor. */
    const tarife = await kargoTarifesi();
    const kargo = kargoUcreti(tarife, adres?.country, kargoGerekli) ?? 0;

    /* Musteri kaydi e-postaya gore: ayni kisi ikinci kez alirsa yeni
       bir kayit acilmasin. */
    const mevcut = await db.query.customers.findFirst({
      where: eq(schema.customers.email, email),
    });
    let musteriId = mevcut?.id ?? null;
    if (!musteriId) {
      const [yeni] = await db
        .insert(schema.customers)
        .values({
          email,
          name: ad,
          phone: telefon || null,
          shippingAddressJson: kargoGerekli ? adres : null,
        } as any)
        .returning();
      musteriId = yeni.id;
    }

    const [siparis] = await db
      .insert(schema.orders)
      .values({
        orderNumber: siparisNo(),
        customerId: musteriId,
        customerEmail: email,
        customerName: ad,
        subtotal: araToplam.toFixed(2),
        /* Kargo ve vergi HENUZ SIFIR ve oyle yaziliyor. Uydurma bir
           kargo ucreti koymak yerine, tutar belirlenince buraya
           girecek — siparis kaydinda "bilinmiyor" diye bir sey yok. */
        shipping: kargo.toFixed(2),
        /* Vergi FIYATA DAHIL: gosterilen fiyat son fiyat, ayri bir
           satir yok. Sifir yazmak burada "vergi yok" demek degil,
           "ayrica eklenmedi" demek — satis sartlarinda da boyle
           yaziyor. */
        tax: "0.00",
        discount: "0.00",
        total: (araToplam + kargo).toFixed(2),
        currency: paraBirimi || "USD",
        /* Havale de kapida odeme de parayi SONRA aliyor. */
        paymentStatus: "pending",
        paymentMethod: yontem,
        orderStatus: "processing",
        shippingAddressJson: kargoGerekli ? adres : null,
        notes: String(g?.notes ?? "").trim().slice(0, 1000) || null,
        /* Zaman damgasi, boolean degil: bir uyusmazlikta sorulan
           "ne zaman onaylandi" sorusunun cevabi da dursun. */
        termsAcceptedAt: new Date(),
        digitalWaiverAt: dijitalVar ? new Date() : null,
      } as any)
      .returning();

    await db.insert(schema.orderItems).values(
      satirlar.map((s) => ({ ...s, orderId: siparis.id })) as any
    );

    /* Musteri ozeti — panelde "kac siparis, ne kadar" gorunsun diye. */
    await db
      .update(schema.customers)
      .set({
        orderCount: sql`coalesce(${schema.customers.orderCount}, 0) + 1`,
        /* Kargo DAHIL: musterinin bize odedigi tutar bu. Ara toplami
           yazsaydik panelde "ne kadar harcadi" sorusuna eksik cevap
           verirdik. */
        totalSpent: sql`coalesce(${schema.customers.totalSpent}, 0) + ${(araToplam + kargo).toFixed(2)}`,
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.customers.id, musteriId));

    /* SEPET GOLGESI KAPATILIYOR.
       Bu yapilmazsa siparise donusen her sepet, raporda sonsuza
       kadar "birakilmis sepet" olarak gorunurdu — yani en basarili
       alisverisler kayip gibi sayilirdi. */
    const sepetBelirteci = String(g?.cartToken ?? "").trim();
    if (/^[a-zA-Z0-9-]{8,64}$/.test(sepetBelirteci)) {
      await db
        .update(schema.carts)
        .set({
          status: "ordered",
          orderId: siparis.id,
          orderedAt: new Date(),
          email,
          name: ad,
          updatedAt: new Date(),
        } as any)
        .where(eq(schema.carts.token, sepetBelirteci));
    }

    /* Bildirim EN SONDA ve sonucu siparisi etkilemiyor: siparis zaten
       kaydedildi. Gecit dusse bile musteri onay sayfasini goruyor ve
       kayit elimizde — iletisim formundaki ayni sira. */
    await siparisBildir(siparis as any, satirlar);

    return NextResponse.json({
      success: true,
      orderNumber: siparis.orderNumber,
      total: siparis.total,
      currency: siparis.currency,
      paymentMethod: yontem,
    });
  } catch (hata) {
    return handleApiError(hata, "checkout.POST");
  }
}
