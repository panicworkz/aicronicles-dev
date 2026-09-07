import { SITE } from "@/lib/seo";
import { fiyat, TUR_VAADI, turu } from "@/lib/magaza";

/**
 * Siparis bildirimi.
 *
 * ONCE HIC E-POSTA GITMIYORDU. Musteri onay sayfasini goruyordu, o
 * kadar; sekmeyi kapatinca elinde siparis numarasi bile kalmiyordu ve
 * havale bilgileri hicbir yere ulasmiyordu. Bizim tarafta da kimse
 * yeni siparisten haberdar olmuyordu.
 *
 * Iletisim formunun kullandigi GECIT uzerinden gidiyor — ayri bir SMTP
 * kurmak yerine calisan yolu kullaniyoruz.
 *
 * SIRA ONEMLI, iletisim formundaki ayni gerekce: siparis ONCE
 * veritabanina yaziliyor, e-posta sonra. Gecit dusse bile siparis
 * elimizde kaliyor; e-posta gitmedi diye siparis kaybolmuyor.
 */

const GECIT =
  process.env.GATEWAY_URL || "http://host.docker.internal:8787/ingest/fabelo";

type Kalem = {
  title: string;
  productType: string | null;
  quantity: number;
  totalPrice: unknown;
};

type Siparis = {
  orderNumber: string;
  customerName: string | null;
  customerEmail: string;
  total: unknown;
  currency: string | null;
  paymentMethod: string | null;
  shippingAddressJson: any;
};

/** Havale bilgileri koda degil ORTAMA yaziliyor; bkz. store/order sayfasi. */
const HAVALE = {
  banka: process.env.BANKA_ADI || "",
  iban: process.env.BANKA_IBAN || "",
  unvan: process.env.BANKA_UNVAN || "",
};

function govde(siparis: Siparis, kalemler: Kalem[]): string {
  const birim = siparis.currency || "USD";
  const satirlar = kalemler
    .map(
      (k) =>
        `  ${k.title} — ${TUR_VAADI[turu(k.productType)]} × ${k.quantity} — ${fiyat(k.totalPrice, birim)}`
    )
    .join("\n");

  const havale = siparis.paymentMethod === "bank_transfer";

  /* Hesap bilgisi tanimli degilse UYDURULMUYOR; musteriye nereden
     ogrenecegi soyleniyor. Onay sayfasindaki kural burada da gecerli. */
  const odemeBolumu = havale
    ? HAVALE.iban
      ? `Send ${fiyat(siparis.total, birim)} to:\n` +
        (HAVALE.unvan ? `  Account name: ${HAVALE.unvan}\n` : "") +
        (HAVALE.banka ? `  Bank: ${HAVALE.banka}\n` : "") +
        `  IBAN: ${HAVALE.iban}\n` +
        `  Reference: ${siparis.orderNumber}\n\n` +
        `We start as soon as it lands. Nothing has been charged yet.`
      : `We will send you the account details for the transfer, quoting ` +
        `${siparis.orderNumber} as the reference. Nothing has been charged yet.`
    : `Have ${fiyat(siparis.total, birim)} ready for the courier. ` +
      `We will confirm the delivery date first. Nothing has been charged yet.`;

  const adres = siparis.shippingAddressJson;
  const adresBolumu = adres
    ? `\n\nDelivering to:\n  ${[adres.line1, adres.line2, adres.city, adres.postcode, adres.country]
        .filter(Boolean)
        .join(", ")}`
    : "";

  return (
    `Order ${siparis.orderNumber}\n\n` +
    `${satirlar}\n\n` +
    `Total due: ${fiyat(siparis.total, birim)}\n\n` +
    `${odemeBolumu}` +
    adresBolumu +
    `\n\nYour order: ${SITE}/store/order/${siparis.orderNumber}\n` +
    `Something wrong? ${SITE}/contact`
  );
}

/**
 * Gonderir; basarisiz olursa YUTAR ve false doner.
 *
 * Cagiran taraf siparisi zaten kaydetmis oluyor — burada atilan bir
 * hata, olusmus bir siparisi basarisiz gostermeye yol acardi.
 */
export async function siparisBildir(
  siparis: Siparis,
  kalemler: Kalem[]
): Promise<boolean> {
  const kontrol = new AbortController();
  const zamanAsimi = setTimeout(() => kontrol.abort(), 15000);
  try {
    const cevap = await fetch(GECIT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: siparis.customerName || "Customer",
        email: siparis.customerEmail,
        subject: `Order ${siparis.orderNumber}`,
        message: govde(siparis, kalemler),
        form_name: "Fabelo — Store order",
        source_url: `${SITE}/store/order/${siparis.orderNumber}`,
        lang: "en",
      }),
      signal: kontrol.signal,
    });
    if (!cevap.ok) console.error("[siparis] gecit yaniti:", cevap.status);
    return cevap.ok;
  } catch (hata) {
    console.error("[siparis] bildirilemedi:", hata);
    return false;
  } finally {
    clearTimeout(zamanAsimi);
  }
}
