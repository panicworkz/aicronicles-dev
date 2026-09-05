import React from "react";
import Link from "next/link";
import { Megaphone, Ruler, Type, AlignLeft, FileText, Image as ImageIcon, Play, LayoutGrid, MousePointer2, Wrench } from "lucide-react";

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
      { n: 28, metin: "Künye metin sütununun en fazla %40'ını kaplar.",
        neden: "Ufuk Yorulmaz'ın terminal satırı yalnızca yüksekliğe göre ölçeklenince rail'de sütunun %66'sını kaplıyordu; öteki markalar %17–40 arasındaydı. Künye afişin sahibi değil, imzası." },
      { n: 29, metin: "Bütün yazı künyeleri afişin display serifiyle basılır; korunan şey renkler ve yapı.",
        neden: "Testworkz'ünki sitede kalın sans, afişte serif. Her künyeyi kendi yazı tipiyle basmak on altı afişi tek bir yayının reklam alanı olmaktan çıkarıp derlemeye çevirirdi. Seçenek koddan kaldırıldı." },
    ],
  },
  {
    baslik: "Hareket",
    ikon: Play,
    kurallar: [
      { n: 30, metin: "Künye sabittir — logo, alan adı, kural. Mesaj değişirken marka yanıp sönmez." },
      { n: 31, metin: "Perde 16 saniye; üç mesaj 48 saniyede döner.",
        neden: "Süre altı kez ölçülerek uzadı (7 → 8 → 9 → 10 → 12 → 14 → 16). Zincire kareler, alan adı durağı ve elin gezintisi eklendikçe elin payı daralıyor, bacaklar 300–990 px/s'ye fırlıyordu. Sıkıştırarak değil uzatarak çözülür." },
      { n: 32, metin: "Sıra, ekrandaki yerleşimin sırasıdır: başlık → açıklama → kareler → çağrı → çizgi → el.",
        neden: "Şerit formatlarda açıklama başlığın altında, kareler sağında; rail'de kareler açıklamanın üstünde olduğu için kareler açıklamadan önce gelir. Sayılar formata göre değişir, kural değişmez." },
      { n: 33, metin: "animation-fill-mode: backwards şarttır.",
        neden: "Yoksa gecikmeyi bekleyen perdeler kendi normal hallerini gösterir, üçü üst üste basılır." },
      { n: 34, metin: "Her keyframe karesinde opacity açıkça yazılır.",
        neden: "Yazılmazsa CSS aradaki değeri doldurur ve öge sinsice solar." },
      { n: 35, metin: "Konumlandırma dış grupta, animasyon iç grupta.",
        neden: "CSS transform'u nitelik transform'unu ezer; el afişin sol üst köşesine gidiyordu." },
      { n: 36, metin: "transform-origin kullanılmaz.",
        neden: "SVG'de varsayılan transform-box view-box olduğu için 'sol' afişin kenarını gösterir." },
      { n: 37, metin: "Hareket kapalıyken (prefers-reduced-motion) afiş tek mesaja düşer." },
      { n: 38, metin: "Yalnızca opacity ve transform. Yeniden yerleşim ya da boyama tetikleyen kare yok." },
      { n: 39, metin: "SVG içindeki style bloğunda < veya > olamaz; XML'i keser." },
    ],
  },
  {
    baslik: "Kareler",
    ikon: LayoutGrid,
    kurallar: [
      { n: 40, metin: "Kare sayısı formatın sabiti, markanın değil: panel 2, measure 5, feature 2, rail 3.",
        neden: "Marka değişince düzen değişemez. Ölçü sayıyı değil, kare kenarını belirler." },
      { n: 41, metin: "Kare kenarı yanındaki metin bloğunun yüksekliği; alt sınır fotoğrafta 48, ikonda 40 piksel.",
        neden: "48'in altında fotoğraf fotoğraf gibi değil renk lekesi gibi okunuyor; çizgi ikon 40'ta hâlâ rahat okunuyor." },
      { n: 42, metin: "Kareler metinle ortalı; üstten ve alttan aynı hizada.",
        neden: "Şerit yüksekliğinin tamamı kullanılınca kareler başlığın tepesinden 23 piksel yukarıda kalıyor, afişin üstüne yapışmış görünüyordu." },
      { n: 43, metin: "Ürün markasında fotoğraf, hizmet markasında ikon (lucide, ISC lisansı).",
        neden: "Hizmet markasının anlatacağı şey bir nesne değil bir yetenek; yönetim ekranı görüntüsü de 60 piksellik karede okunmuyor." },
      { n: 44, metin: "Somut işaret seçilir, soyut şema değil.",
        neden: "container, git-branch, workflow, brain-circuit küçük karede hiçbir şey anlatmıyordu; sunucu, sepet, kamyon, kilit herkesin tanıdığı nesneler." },
      { n: 45, metin: "Görseller markanın kendi sitesinden alınır; yoksa yalnızca CC0 / kamu malı kaynak.",
        neden: "Pexels tarama isteklerini engelliyor (403); bot koruması aşılmaz." },
      { n: 46, metin: "Görseller seçilmeden önce gözle görülür; dosya adına ve yazı başlığına güvenilmez.",
        neden: "\"Deri El Çantası\" etiketli fotoğrafta kolye, \"city-frankfurt\" dosyasında tropik ada, \"Ford Transit\" karesinde şehir manzarası çıktı." },
      { n: 47, metin: "Aynı perdede aynı kare iki kez olmaz; perdeler arası tekrar kabul edilebilir.",
        neden: "Site aynı fotoğrafı iki isimle kullanabiliyor. Perdeler arasında otuz saniye var, aynı perdede yok." },
      { n: 48, metin: "Kareler her perdede değişir ve soldan sağa birer birer açılır.",
        neden: "Künye markanın imzası, kare ise mesajın kendisi." },
      { n: 49, metin: "Kareler metinden ve elden ÖNCE çizilir.",
        neden: "Sonra çizilince elin üstüne biniyor ve el ürünlerin üzerinden geçerken görünmez oluyordu." },
    ],
  },
  {
    baslik: "El",
    ikon: MousePointer2,
    kurallar: [
      { n: 50, metin: "El, çağrı ve altı çizgisi tamamlandıktan sonra sahneye girer.",
        neden: "Tıklayacağı şey ekranda yokken dolaşan bir imleç anlamsız." },
      { n: 51, metin: "El ürün karelerini gezer, alan adına uğrar, sonra butona iner.",
        neden: "Yapay bir yay noktasında el boş alandan geçiyor ve okur neden oraya gittiğini anlamıyordu; uğrak gerçek bir öge olmalı." },
      { n: 52, metin: "Parmak ucu alan adının ortasına değil altına konur.",
        neden: "El gövdesi ucundan aşağı ve sağa sarkıyor; ortaya konunca adresin sağ yarısını kapatıyordu." },
      { n: 53, metin: "Bacak süresi mesafeye bağlıdır; ürün bakışları üç kat ağırlık alır, hiçbir bacak çeyrek saniyeden kısa olamaz.",
        neden: "Sabit ağırlıkla kısa bacaklar 120, uzun bacaklar 994 px/s çıkıyordu — aynı el bir yerde süzülüp bir yerde fırlıyordu." },
      { n: 54, metin: "Yalnızca ilk ve son durakta kıpırdar.",
        neden: "Her durakta kıpırdayınca gezintinin yarısını kıpırtı yiyordu." },
      { n: 55, metin: "Elin yolu her afişe ve her perdeye ayrı yazılır.",
        neden: "Kareler her formatta başka yerde, çağrı her perdede başka genişlikte." },
    ],
  },
  {
    baslik: "Üretim",
    ikon: Wrench,
    kurallar: [
      { n: 56, metin: "Amblem ile ad arası, amblemin boyunun %34'ü.",
        neden: "Adın puntosuna bağlıyken oran dört formatta %31, %35, %34, %39 çıkıyordu — aynı kilit dört afişte dört ayrı sıkılıkta görünüyordu." },
      { n: 57, metin: "Adın büyük harf ortası, amblemin dikey ortasıyla aynı çizgide.",
        neden: "Taban çizgisi amblemin altına konunca kelime şeritlerde 6–8 piksel aşağıda asılı kalıyordu." },
      { n: 58, metin: "Sınıf ve keyframe önekine format da girer.",
        neden: "Dördü aynı öneki paylaşınca, geometriye bağlı olan el yolunda sayfadaki son tanım hepsine uygulanıyor; measure ve panel rail'in yolunu oynuyordu." },
      { n: 59, metin: "Lucide ikonu eksik ayrıştırılırsa üretim durur.",
        neden: "Uzun ögeler dosyada çok satıra yayılıyor; ilk desen path'leri düşürüyor, sepetten geriye iki tekerlek kalıyordu. Her ögenin bir key'i var, sayılar tutmazsa hata verilir." },
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
