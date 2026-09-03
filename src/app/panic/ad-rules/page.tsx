import React from "react";
import Link from "next/link";
import { Megaphone, Ruler, Type, AlignLeft, FileText, Image as ImageIcon, Play } from "lucide-react";

/**
 * Reklam kurallari — CMS tarafindaki karsiligi.
 *
 * Kurallar `scripts/banners/KURALLAR.md` icinde yaziyor ve
 * `scripts/banners/denetle.py` her uretimde olcuyor. Bu ekran ayni
 * kurallari kampanyayi duzenleyen kisiye gosteriyor: bir afis siparis
 * edildiginde ya da elle bir gorsel yuklendiginde neye uymasi
 * gerektigi burada yaziyor.
 *
 * Metni koda gomuyoruz cunku kurallar uretici betikle birlikte
 * degisiyor; veritabaninda tutulsa ikisi ayrisir ve ekran gercegi
 * yansitmayi birakirdi.
 */

export const dynamic = "force-static";

const FORMATLAR = [
  { ad: "Measure", olcu: "1440 × 200", yer: "Tam içerik genişliği", satir: 1, baslik: 34 },
  { ad: "Feature", olcu: "940 × 180", yer: "Yazı gövdesi", satir: 1, baslik: 28 },
  { ad: "Panel", olcu: "511 × 300", yer: "Ana sayfa yan kolonu", satir: 2, baslik: 30 },
  { ad: "Rail", olcu: "387 × 540", yer: "Kenar rayı", satir: 4, baslik: 30 },
];

type Kural = { n: number; metin: string; neden?: string };

const BOLUMLER: { baslik: string; ikon: any; kurallar: Kural[] }[] = [
  {
    baslik: "Yerleşim",
    ikon: Ruler,
    kurallar: [
      { n: 1, metin: "Dört kenar eşit: üst, alt, sol ve sağ pay aynı.",
        neden: "Dikey pay içeriğin yüksekliğine, içeriğin genişliği yatay paya bağlı. İki geçişli hesap salınıp eşitsiz sonuç veriyordu; en geniş paydan aşağı taranıp dikey payın yetiştiği ilk değer alınır." },
      { n: 2, metin: "Dikey konumlar logo boyundan geriye hesaplanır, sabit paylarla değil.",
        neden: "Logo boyu markadan markaya değişiyor; sabit pay üstte 25, altta 41 piksel veriyordu." },
      { n: 3, metin: "Künye çizgisi ve alan adı afişin tam genişliğinde." },
      { n: 4, metin: "Çağrı şerit formatlarda sağa hizalı, yığın formatlarda solda.",
        neden: "Sola hizalıyken sağ pay kelimeye göre 31–81 piksel arası oynuyordu." },
      { n: 5, metin: "Açıklama ile altındaki kural arası 12 piksel — son satırın tabanına göre.",
        neden: "Blok alt kenarından hesaplanınca satır aralığına bağlı hale gelip panelde 31, rail'de 40 çıkıyordu." },
      { n: 6, metin: "Nefes payları bütün formatlarda aynı (26 piksel).",
        neden: "Panelde sığsın diye 13'e indirmek kuralın kendisini bozar." },
    ],
  },
  {
    baslik: "Tipografi",
    ikon: Type,
    kurallar: [
      { n: 7, metin: "Açıklama puntosu dört formatta da 14.",
        neden: "Measure'da 15'ti; ekranda ölçeklenince 12.5 piksele denk geliyor, ötekiler 11.1–11.8 arasında kalıyordu." },
      { n: 8, metin: "Sığmıyorsa küçülen başlıktır, açıklama değil." },
      { n: 9, metin: "Başlık tavanı formatın kendi ölçüsü.",
        neden: "Yığın düzen bu değeri kullanmayıp 46'ya çıkarken rail 43–46, panel 19 basılıyordu." },
      { n: 10, metin: "Bir afişteki üç perde ortak punto kullanır.",
        neden: "Perde başına hesaplandığında başlığı uzun olan perde küçülüyor, açıklaması da onunla küçülüyordu." },
      { n: 11, metin: "Punto seçimi gerçek harf genişliği tablosuyla yapılır, ortalama katsayıyla değil." },
      { n: 12, metin: "Çağrı yazısında textLength vardır; altı çizme metne birebir oturur.",
        neden: "Yazı tipi işletim sistemine göre değişiyor (Segoe UI, Roboto, Helvetica)." },
      { n: 13, metin: "Metin asla kırpılmaz. Sığmıyorsa punto düşer." },
    ],
  },
  {
    baslik: "Satır sayısı",
    ikon: AlignLeft,
    kurallar: [
      { n: 14, metin: "Her formatın hedef satır sayısı vardır: measure 1, feature 1, panel 2, rail 4." },
      { n: 15, metin: "Perdeler arasında satır sayısı eşittir; eksik kalan perdenin sarma genişliği daraltılır, puntosu değil." },
      { n: 16, metin: "Rail açıklamayı alanın tamamına değil daha dar bir sütuna sarar.",
        neden: "Aynı metin panelde 2, rail'de 4 satır olamaz: panelde 2 satır için en fazla ~119 karakter, rail'de 4 satır için en az ~130 gerekir." },
    ],
  },
  {
    baslik: "İçerik",
    ikon: FileText,
    kurallar: [
      { n: 17, metin: "Metin markanın kendi h1 ve meta açıklamasından alınır. Uydurma yok, rakam iddiası yok, fiyat verilmez." },
      { n: 18, metin: "Site haritasına değil, sitenin İÇERİĞİNE bakılır.",
        neden: "Site haritası neyin yayınlandığını söyler, neyin anlatıldığını değil; üstelik çoğu markada yok. TurcoPartners ve Testworkz tek sayfalık SPA — her yola index.html dönüyor. Sayfa tarayıcıda açılır, başlıklar ve paragraflar oradan okunur." },
      { n: 19, metin: "Sitede İngilizce sürüm varsa metin oradan alınır; yoksa sitenin kendi metninin sadık çevirisi yazılır ve marka kaydında not edilir.",
        neden: "Testworkz yalnızca Türkçe; /en aynı Türkçe sayfayı döndürüyor." },
      { n: 20, metin: "Üç mesaj, her biri kendi sayfasına gider." },
      { n: 21, metin: "Üç açıklamanın kelime sayısı farkı en fazla 1 VE basılan genişlik sapması en fazla %8.",
        neden: "Yalnızca kelimeyi eşitlemek yetmez: bileşik kelimeler tek kelime sayılırken satırı iki katına çıkarır." },
      { n: 22, metin: "Ortadaki liste o an oynamayan söylemleri gösterir, numarasız." },
    ],
  },
  {
    baslik: "Logo",
    ikon: ImageIcon,
    kurallar: [
      { n: 23, metin: "Sitede özel tasarlanmış bir resim logo varsa o kullanılır (Panicworkz, WP Care). Yoksa künye her zaman AraçKirala.pw'deki gibi çizilir: markanın adı, sonunda vurgu renginde bir nokta." },
      { n: 24, metin: "Yazı künyesi düz basılır, sitede italik olsa bile (Yerine).",
        neden: "Küçük puntoda italik serifin okunurluğu düşer." },
      { n: 25, metin: "Yazı künyesi büyük harf yüksekliğine göre hizalanır (≈0.69 em).",
        neden: "Taban çizgisi katsayısıyla hizalayınca künye resim logolu markalardan 1–2 piksel ayrışıyordu." },
      { n: 26, metin: "Logo base64 ile afişin içine gömülür; dış bağımlılık yok." },
      { n: 27, metin: "Logosu olmayan marka kelime markasıyla basılır. Uydurma işaret yok." },
      { n: 28, metin: "Bütün yazı künyeleri afişin display serifiyle basılır; korunan şey renkler ve yapı.",
        neden: "Testworkz'ünki sitede kalın sans, afişte serif. Her künyeyi kendi yazı tipiyle basmak on altı afişi tek bir yayının reklam alanı olmaktan çıkarıp derlemeye çevirirdi. Seçenek koddan kaldırıldı." },
    ],
  },
  {
    baslik: "Hareket",
    ikon: Play,
    kurallar: [
      { n: 29, metin: "Künye sabittir — logo, alan adı, kural. Mesaj değişirken marka yanıp sönmez." },
      { n: 30, metin: "Perde 7 saniye; üç mesaj 21 saniyede döner." },
      { n: 31, metin: "Sıra: başlık → çağrı yazısı → altına çizgi → el belirir, arar, bulur, basar → çağrı vurgu rengine döner." },
      { n: 32, metin: "animation-fill-mode: backwards şarttır.",
        neden: "Yoksa gecikmeyi bekleyen perdeler kendi normal hallerini gösterir, üçü üst üste basılır." },
      { n: 33, metin: "Her keyframe karesinde opacity açıkça yazılır.",
        neden: "Yazılmazsa CSS aradaki değeri doldurur ve öge sinsice solar." },
      { n: 34, metin: "Konumlandırma dış grupta, animasyon iç grupta.",
        neden: "CSS transform'u nitelik transform'unu ezer; el afişin sol üst köşesine gidiyordu." },
      { n: 35, metin: "transform-origin kullanılmaz.",
        neden: "SVG'de varsayılan transform-box view-box olduğu için 'sol' afişin kenarını gösterir." },
      { n: 36, metin: "Hareket kapalıyken (prefers-reduced-motion) afiş tek mesaja düşer." },
      { n: 37, metin: "Yalnızca opacity ve transform. Yeniden yerleşim ya da boyama tetikleyen kare yok." },
      { n: 38, metin: "SVG içindeki style bloğunda < veya > olamaz; XML'i keser." },
    ],
  },
];

export default function AdRulesPage() {
  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <Megaphone className="size-7 text-primary" />
          <h1 className="text-3xl font-extrabold tracking-tight">Ad Rules</h1>
        </div>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Ağ markası afişleri bu kurallara göre üretilir. Kurallar markadan
          markaya, formattan formata <strong>değişmez</strong>. Bir şey
          sığmıyorsa kural esnetilmez; küçülen punto olur.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Kaynak: <code className="font-mono">scripts/banners/KURALLAR.md</code> ·
          Denetim: <code className="font-mono">scripts/banners/denetle.py</code> —
          her üretimde 36 kuralın tamamı ölçülür.{" "}
          <Link href="/panic/ads" className="text-primary hover:underline">
            Kampanyalara git
          </Link>
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Formatlar
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="p-3 font-bold">Format</th>
                <th className="p-3 font-bold">Ölçü</th>
                <th className="p-3 font-bold">Nerede</th>
                <th className="p-3 font-bold">Açıklama satırı</th>
                <th className="p-3 font-bold">Başlık tavanı</th>
              </tr>
            </thead>
            <tbody>
              {FORMATLAR.map((f) => (
                <tr key={f.ad} className="border-t border-border">
                  <td className="p-3 font-bold">{f.ad}</td>
                  <td className="p-3 font-mono text-xs">{f.olcu}</td>
                  <td className="p-3 text-muted-foreground">{f.yer}</td>
                  <td className="p-3 font-mono">{f.satir}</td>
                  <td className="p-3 font-mono">{f.baslik}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Ölçüler IAB&apos;nin evrensel ölçüleri değil, sitenin on iki kolonluk
          ızgarasından çıkarıldı. 970&apos;lik bir billboard 1440&apos;lık alanın
          ortasında iki yanda 235&apos;er piksel boşluk bırakıyordu.
        </p>
      </section>

      {BOLUMLER.map((b) => {
        const Ikon = b.ikon;
        return (
          <section key={b.baslik} className="mb-8">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              <Ikon className="size-4" />
              {b.baslik}
            </h2>
            <ol className="space-y-2">
              {b.kurallar.map((k) => (
                <li
                  key={k.n}
                  className="rounded-lg border border-border bg-card p-3 flex gap-3"
                >
                  <span className="font-mono text-xs text-muted-foreground shrink-0 pt-0.5 w-6">
                    {String(k.n).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium leading-snug">{k.metin}</p>
                    {k.neden && (
                      /* Kuralin NEDENI de yaziyor: gerekcesi bilinmeyen bir
                         kural, sikisildiginda ilk esnetilen sey oluyor. */
                      <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                        {k.neden}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
