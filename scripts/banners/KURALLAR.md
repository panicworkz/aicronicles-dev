# Afiş kuralları

Fabelo'nun ağ markası afişleri (`deney.py`) bu kurallara göre üretilir.
Kurallar **markadan markaya, formattan formata değişmez**. Bir şey sığmıyorsa
kural esnetilmez; küçülen punto olur.

`denetle.py` bu dosyadaki her kuralı üretilen SVG'ler üzerinde ölçer.
Kural eklendiğinde denetime de eklenmelidir — yoksa kural bir süre sonra
sessizce bozulur. Bu belge kuralın *niyetini*, denetim ise *uygulandığını*
tutar.

## Formatlar

| ad | ölçü | nerede |
|---|---|---|
| `measure` | 1440 × 200 | tam içerik genişliği |
| `feature` | 940 × 180 | yazı gövdesi |
| `panel` | 511 × 300 | ana sayfa yan kolonu |
| `rail` | 387 × 540 | kenar rayı |

Ölçüler IAB'nin evrensel ölçüleri değil, sitenin on iki kolonluk ızgarasından
çıkarıldı. 970'lik bir billboard 1440'lık alanın ortasında iki yanda 235'er
piksel boşluk bırakıyordu.

## Yerleşim

1. **Dört kenar eşit.** Üst, alt, sol ve sağ pay aynı. Dikey pay içeriğin
   yüksekliğine, içeriğin genişliği yatay paya bağlı — ikisi birbirini
   kovalar. En geniş paydan aşağı taranıp dikey payın yetiştiği ilk değer
   alınır; iki geçişli yaklaşım salınıp eşitsiz sonuç veriyordu.
2. **Dikey konumlar logo boyundan geriye hesaplanır**, sabit paylarla değil.
   Logo boyu markadan markaya değişiyor; sabit pay üstte 25, altta 41 gibi
   sonuçlar veriyordu.
3. **Künye çizgisi ve alan adı afişin tam genişliğinde.**
4. **Çağrı**: şerit formatlarda sağa hizalı, yığın formatlarda solda. Sola
   hizalı bıraktığımda sağ pay kelimeye göre 31–81 piksel arası oynuyordu.
5. **Açıklama ile altındaki kural arası 12 piksel** — son satırın *tabanına*
   göre. Blok alt kenarından hesaplanınca satır aralığına bağlı hale gelip
   panelde 31, rail'de 40 çıkıyordu.
6. **Nefes payları bütün formatlarda aynı** (26 px). Panelde sığsın diye
   13'e indirmek kuralın kendisini bozar.

## Tipografi

7. **Açıklama puntosu dört formatta da 14.** Measure'da 15'ti; ekranda
   ölçeklenince 12.5 piksele denk geliyor, ötekiler 11.1–11.8 arasında
   kalıyordu.
8. **Sığmıyorsa küçülen başlıktır, açıklama değil.** Açıklama gövde metni;
   formatlar arasında sabit kalmalı.
9. **Başlık tavanı formatın kendi ölçüsü** (measure 34, feature 28, panel 30,
   rail 30). Yığın düzen bu değeri kullanmayıp 46'ya çıkarken rail 43–46,
   panel 19 basılıyordu — aynı markanın iki afişi iki kat farklı ölçekte.
10. **Perdeler ortak punto kullanır.** Perde başına hesaplandığında başlığı
    uzun olan perde küçülüyor, açıklaması da onunla küçülüyordu.
11. **Punto seçimi gerçek harf genişliği tablosuyla** yapılır (Georgia ve
    kalın sans için ayrı, tarayıcıdan `measureText` ile ölçüldü), ortalama
    katsayıyla değil.
12. **Çağrı yazısında `textLength` vardır.** Yazı tipi işletim sistemine göre
    değişse bile altı çizme metne birebir oturur.
13. **Metin asla kırpılmaz.** Sığmıyorsa punto düşer. Satır sarma üç satırla
    sınırlıyken uzun cümlelerin sonu sessizce düşüyordu.

## Satır sayısı

14. **Her formatın hedef satır sayısı vardır**: measure 1, feature 1,
    panel 2, rail 4.
15. **Perdeler arasında satır sayısı eşittir.** Kelime sayısı ve genişlik
    eşitlense bile kırılım aynı yere düşmez; eksik kalan perdenin sarma
    genişliği daraltılarak tamamlanır — punto değil.
16. Aynı metin panelde 2, rail'de 4 satır olamaz (panelde 2 satır için en
    fazla ~119 karakter, rail'de 4 satır için en az ~130 gerekir). Rail bu
    yüzden açıklamayı alanın tamamına değil **daha dar bir sütuna** sarar.
    Dizgide dar ölçü zaten daha okunur.

## İçerik

17. **Metin markanın kendi h1 ve meta açıklamasından** alınır. Uydurma yok,
    rakam iddiası yok, **fiyat verilmez**.
18. **Site haritasına değil, sitenin İÇERİĞİNE bakılır.** Site haritası
    neyin *yayınlandığını* söyler, neyin *anlatıldığını* değil; üstelik
    çoğu markada yok. TurcoPartners ve Testworkz tek sayfalık SPA — her
    yola `index.html` dönüyor, site haritası da robots da HTML. Sayfa
    tarayıcıda açılır, başlıklar ve paragraflar oradan okunur, sayfa içi
    çapalar DOM'dan alınır.
19. **Sitede İngilizce sürüm varsa metin oradan alınır.** Yoksa sitenin
    kendi metninin sadık çevirisi yazılır ve bu, marka kaydında not
    edilir — uydurma değil ama birebir alıntı da değil.
20. **Üç mesaj**, her biri kendi sayfasına gider: vaat, teknik derinlik,
    kapsam gibi farklı okurları tutan açılar.
21. **Üç açıklamanın kelime sayısı farkı en fazla 1** *ve* **basılan
    genişlik sapması en fazla %8**. Yalnızca kelimeyi eşitlemek yetmez:
    "native-quality", "sub-200ms" gibi bileşikler tek kelime sayılırken
    satırı iki katına çıkarır.
22. **Ortadaki liste o an oynamayan söylemleri gösterir**, numarasız. Numara
    ancak okur bütün diziyi görebiliyorsa anlam taşır; oynayan söylem
    listeden çıkınca sıra kopuk görünür.

## Logo

23. **Sitede özel tasarlanmış bir resim logo varsa o kullanılır** (Panicworkz,
    WP Care). Yoksa künye **her zaman AraçKirala.pw'deki gibi** çizilir:
    markanın adı, sonunda vurgu renginde bir nokta.
24. **Yazı künyesi düz basılır**, sitede italik olsa bile (Yerine). Küçük
    puntoda italik serifin okunurluğu düşer.
25. **Yazı logosu büyük harf yüksekliğine göre hizalanır** (Georgia'da
    ≈0.69 em). Taban çizgisi katsayısıyla hizalayınca künye resim logolu
    markalardan 1–2 piksel ayrışıyordu.
26. **Logo base64 ile afişin içine gömülür.** Siteden bütün dış görsel
    bağımlılıkları temizlendi; afiş de bağımsız kalmalı.
27. Logosu olmayan marka **kelime markasıyla** basılır. Uydurma işaret yok.
28. **Bütün yazı künyeleri afişin display serifiyle basılır**, markanın
    sitedeki yazı tipi ne olursa olsun; korunan şey **renkler ve yapı**.
    Testworkz'ünki sitede kalın sans (Manrope 800), afişte serif — çünkü
    her künyeyi kendi yazı tipiyle basmak on altı afişi tek bir yayının
    reklam alanı olmaktan çıkarıp derlemeye çevirirdi. Seçenek koddan
    kaldırıldı; kural orada zorunlu.

## Hareket

29. **Künye sabittir** — logo, alan adı, kural. Mesaj değişirken markanın
    yanıp sönmesi afişi huzursuz gösterir.
30. **Perde 7 saniye.** Üç mesaj 21 saniyede döner.
31. **Sıra**: başlık → çağrı yazısı → altına çizgi → el yakında belirir,
    arar, bulur, basar → çağrı vurgu rengine döner ve öyle kalır.
32. **`animation-fill-mode: backwards` şarttır.** Yoksa gecikmeyi bekleyen
    perdeler kendi normal hallerini gösterir; üçü üst üste basılır.
33. **Her `@keyframes` karesinde `opacity` açıkça yazılır.** Yazılmazsa CSS
    aradaki değeri doldurur ve öge sinsice solar.
34. **Konumlandırma dış grupta, animasyon iç grupta.** CSS `transform`ı
    nitelik `transform`ını ezer; el afişin sol üst köşesine gidiyordu.
35. **`transform-origin` kullanılmaz.** SVG'de varsayılan `transform-box`
    `view-box` olduğu için "sol" afişin kenarını gösterir. Öge kaydırılmış
    bir grubun içinde `0`'a konur, varsayılan orijin kendi ucudur.
36. **Hareket kapalıyken** (`prefers-reduced-motion`) afiş tek mesaja düşer.
37. **Yalnızca `opacity` ve `transform`.** Yeniden yerleşim ya da boyama
    tetikleyen kare yok; blur, filter, clip-path animasyonu yok.
38. **SVG içindeki `<style>`'da `<` veya `>` olamaz** — XML'i keser ve o
    noktadan sonraki bütün kurallar düşer. Üretici buna bakıp hata verir.
