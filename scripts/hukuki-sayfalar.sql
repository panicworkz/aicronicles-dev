-- HUKUKI SAYFALAR
--
-- Magaza gercek satisa acilacagi icin gerekli metinler. Uc dosyada
-- degil, PANELDE duruyorlar (pages tablosu): sirket ve banka bilgileri
-- henuz belli degil ve "...." olarak birakildi; editor bunlari
-- panelden dolduracak, her degisiklik icin yeniden yayin gerekmesin.
--
-- KAYNAK: Mesafeli Sozlesmeler Yonetmeligi (RG 27.11.2014/29188),
-- 24.05.2025 tarihli degisiklikle 01.01.2026'dan itibaren yururlukte
-- olan hali. Metne giren maddeler:
--   Madde 5    on bilgilendirmenin zorunlu icerigi
--   Madde 9    on dort gunluk cayma hakki ve baslangici
--   Madde 12   iade masrafi SATICIYA ait (2026 degisikligi)
--   Madde 15   cayma hakki istisnalari (dijital urun dahil)
--   Madde 16   teslimat en gec otuz gun
--   2026 eki   arabuluculuk sartinin yazilmasi zorunlulugu
--
-- Turkce metinler TURK tuketici icin; yasa Turkce sunulmasini
-- gerektiriyor. Ingilizce "Terms of Sale" yurt disi alicilar icin ve
-- Turk mevzuatinin yerine gecmiyor — Turkiye'den alan tuketici icin
-- Turkce metinler gecerli, bunu her iki metin de yaziyor.
--
-- ONEMLI: Bu metinler hukuk danismanligi degildir. Yururlukteki
-- yonetmelige gore hazirlanmis bir taslaktir; yayina alinmadan once
-- bir avukata okutulmasi gerekir. "...." ile isaretli her yer
-- doldurulmadan magaza acilmamali.

BEGIN;

-- ============================================================
-- 1) ON BILGILENDIRME FORMU  (Madde 5)
-- ============================================================
INSERT INTO pages (title, slug, status, meta_title, meta_description, content_html)
VALUES (
'Ön Bilgilendirme Formu',
'on-bilgilendirme-formu',
'published',
'Ön Bilgilendirme Formu | Fabelo',
'Mesafeli Sözleşmeler Yönetmeliği uyarınca satıştan önce bilmeniz gerekenler: satıcı bilgileri, fiyat, teslimat, cayma hakkı ve uyuşmazlık yolları.',
$html$
<p><strong>Bu form, siparişinizi onaylamadan önce okumanız için hazırlanmıştır.</strong> Mesafeli Sözleşmeler Yönetmeliği’nin 5. maddesi, satıcının aşağıdaki hususlarda sizi önceden bilgilendirmesini zorunlu kılar. Siparişi onayladığınızda bu formu okuduğunuzu ve bilgilendirildiğinizi kabul etmiş olursunuz.</p>

<h2 id="satici">1. Satıcı bilgileri</h2>
<ul>
<li><strong>Unvan:</strong> ....</li>
<li><strong>Adres:</strong> ....</li>
<li><strong>Telefon:</strong> ....</li>
<li><strong>MERSİS numarası:</strong> ....</li>
<li><strong>Vergi dairesi ve numarası:</strong> ....</li>
<li><strong>İletişim ve şikâyet kanalı:</strong> <a href="/contact">fabelo.io/contact</a></li>
</ul>
<p>Sitede e-posta adresi yayımlanmamaktadır; her türlü bildirim, talep ve şikâyet iletişim formu üzerinden alınır ve kayda geçer.</p>

<h2 id="urun">2. Ürünün temel nitelikleri</h2>
<p>Sipariş ettiğiniz ürünün adı, temel özellikleri, adedi ve satış fiyatı ürün sayfasında ve sepet ekranında yer alır. Bu bilgiler siparişi onayladığınız andaki hâliyle geçerlidir.</p>

<h2 id="fiyat">3. Fiyat ve ödeme</h2>
<ul>
<li>Sepette gösterilen tutar <strong>tüm vergiler dâhil</strong> toplam bedeldir.</li>
<li>Ürün hangi para biriminde listelenmişse o birimde tahsil edilir; kur çevrimi yapılmaz.</li>
<li><strong>Kargo bedeli</strong> ürünün gönderileceği adrese göre belirlenir ve siparişiniz onaylanmadan önce ayrıca bildirilir. Onayınız olmadan hiçbir tutar tahsil edilmez.</li>
<li>Ödeme yöntemleri: <strong>havale/EFT</strong> ve <strong>kapıda ödeme</strong>. Kapıda ödeme yalnızca kargoyla gönderilen ürünlerde geçerlidir.</li>
<li>Havalede ödeme, sipariş numaranız açıklama olarak yazılarak aşağıdaki hesaba yapılır: <strong>Banka:</strong> .... — <strong>IBAN:</strong> .... — <strong>Hesap sahibi:</strong> ....</li>
<li>Uzaktan iletişim aracının kullanımı için olağan ücret tarifesinin üzerinde bir bedel alınmaz.</li>
</ul>

<h2 id="teslimat">4. Teslimat</h2>
<ul>
<li><strong>Fiziksel ürünler</strong> kargo ile gönderilir. Teslimat, siparişin tarafımıza ulaşmasından itibaren <strong>en geç 30 gün</strong> içinde yapılır (Yönetmelik m.16). Bu süre içinde gönderilmemesi hâlinde sözleşmeyi feshedebilirsiniz.</li>
<li><strong>Dijital ürünler</strong> ödeme onaylandıktan sonra elektronik ortamda teslim edilir.</li>
<li><strong>Hizmetler</strong> için tarih ve kapsam sizinle ayrıca kararlaştırılır.</li>
<li>Teslimat masrafları aksi belirtilmedikçe alıcıya aittir ve sipariş onayından önce bildirilir.</li>
</ul>

<h2 id="cayma">5. Cayma hakkı</h2>
<p>Malı teslim aldığınız günden, hizmetlerde ise sözleşmenin kurulduğu günden itibaren <strong>14 gün içinde</strong>, hiçbir gerekçe göstermeden ve cezai şart ödemeden sözleşmeden cayabilirsiniz (Yönetmelik m.9).</p>
<p>Cayma bildiriminizi <a href="/contact">iletişim formu</a> üzerinden, 14 günlük süre dolmadan iletmeniz yeterlidir.</p>
<p><strong>İade masrafı bize aittir.</strong> 1 Ocak 2026’dan itibaren yürürlükte olan düzenleme uyarınca, cayma hakkını kullanmanız hâlinde iade gönderisinin masrafı tüketiciye yüklenemez. Ürünü hangi kargo firmasıyla göndereceğinizi cayma bildiriminizden sonra size bildiririz.</p>
<p>Cayma bildiriminiz bize ulaştıktan sonra, teslimat masrafları da dâhil olmak üzere tahsil edilen tüm ödemeler <strong>14 gün içinde</strong> iade edilir.</p>

<h2 id="cayma-istisna">6. Cayma hakkının bulunmadığı hâller</h2>
<p>Yönetmeliğin 15. maddesi uyarınca aşağıdaki ürünlerde cayma hakkı kullanılamaz:</p>
<ul>
<li><strong>Elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayrimaddi ürünler.</strong> Rehber, şablon, dosya ve benzeri dijital ürünlerimiz bu kapsamdadır: satın alma sırasında bu bilgiyi onaylamanız istenir ve onayınızın ardından cayma hakkınız bulunmaz.</li>
<li>Tesliminden sonra ambalaj, bant, mühür veya koruyucu unsurları açılmış olan; sağlık ve hijyen açısından iadeye uygun olmayan ürünler.</li>
<li>Tüketicinin istekleri doğrultusunda kişiye özel hazırlanan ürünler.</li>
<li>Çabuk bozulan veya son kullanma tarihi geçebilecek ürünler.</li>
<li>Tesliminden sonra başka ürünlerle karışan ve doğası gereği ayrıştırılması mümkün olmayan ürünler.</li>
<li>Cayma süresi dolmadan, onayınızla ifasına başlanan hizmetler.</li>
</ul>

<h2 id="ayipli">7. Ayıplı ürün</h2>
<p>Cayma hakkı ayrı bir haktır; ürünün ayıplı çıkması hâlinde 6502 sayılı Kanun’un 11. maddesindeki seçimlik haklarınız (ücretsiz onarım, ayıpsızıyla değiştirme, bedel indirimi, sözleşmeden dönme) süreden bağımsız olarak saklıdır. Bu durumda iade ve gönderim masrafları bize aittir.</p>

<h2 id="uyusmazlik">8. Uyuşmazlık ve başvuru yolları</h2>
<p>Şikâyetlerinizi öncelikle <a href="/contact">iletişim formu</a> üzerinden bize iletebilirsiniz.</p>
<p>Uyuşmazlık hâlinde, parasal sınırlar dâhilinde <strong>Tüketici Hakem Heyetlerine</strong> veya <strong>Tüketici Mahkemelerine</strong> başvurabilirsiniz. Başvuru, mal veya hizmeti satın aldığınız ya da ikametgâhınızın bulunduğu yerdeki heyete yapılır.</p>
<p><strong>Arabuluculuk şartı:</strong> 1 Ocak 2026’dan itibaren, parasal sınırlar dâhilinde tüketici mahkemesinin görevine giren uyuşmazlıklarda mahkemeye başvurmadan önce <strong>arabulucuya başvurulması dava şartıdır</strong>.</p>
<p>Parasal sınırlar her yıl yeniden belirlenir; güncel tutarlar Ticaret Bakanlığı’nca ilan edilir.</p>

<h2 id="saklama">9. Kayıtların saklanması</h2>
<p>Sipariş kayıtlarınız, ilgili mevzuatın öngördüğü süre boyunca saklanır ve talebiniz hâlinde tarafınıza sunulur. Kişisel verilerinizin işlenmesine ilişkin ayrıntılar için <a href="/data-and-privacy">Veri ve Gizlilik</a> sayfasına bakınız.</p>

<hr>
<p><em>Bu form <a href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</a> ile birlikte okunur. Son güncelleme: ....</em></p>
$html$
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      content_html = EXCLUDED.content_html,
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      updated_at = now();

-- ============================================================
-- 2) MESAFELI SATIS SOZLESMESI
-- ============================================================
INSERT INTO pages (title, slug, status, meta_title, meta_description, content_html)
VALUES (
'Mesafeli Satış Sözleşmesi',
'mesafeli-satis-sozlesmesi',
'published',
'Mesafeli Satış Sözleşmesi | Fabelo',
'Fabelo mağazasından yapılan alışverişlerde geçerli mesafeli satış sözleşmesi: tarafların hak ve yükümlülükleri, teslimat, cayma hakkı ve uyuşmazlık çözümü.',
$html$
<h2 id="taraflar">Madde 1 — Taraflar</h2>
<p><strong>SATICI</strong><br>
Unvan: ....<br>
Adres: ....<br>
Telefon: ....<br>
MERSİS: ....<br>
Vergi dairesi ve numarası: ....<br>
İletişim: <a href="/contact">fabelo.io/contact</a></p>
<p><strong>ALICI</strong><br>
Sipariş sırasında bildirdiğiniz ad, e-posta adresi, telefon ve — fiziksel ürünlerde — teslimat adresi.</p>

<h2 id="konu">Madde 2 — Konu</h2>
<p>Bu sözleşme, ALICI’nın SATICI’ya ait <a href="/store">fabelo.io/store</a> adresinden elektronik ortamda sipariş verdiği ürün veya hizmetin satışı ve teslimine ilişkin olarak, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların hak ve yükümlülüklerini düzenler.</p>

<h2 id="urun-bedel">Madde 3 — Sözleşme konusu ürün ve bedel</h2>
<p>Ürünün adı, temel nitelikleri, adedi ve tüm vergiler dâhil satış fiyatı, sipariş onayı ekranında ve tarafınıza iletilen sipariş özetinde yer alır; bu bilgiler sözleşmenin ayrılmaz parçasıdır.</p>
<p>Kargo bedeli, gönderim adresine göre belirlenir ve ALICI’nın onayı alınmadan tahsil edilmez.</p>

<h2 id="odeme">Madde 4 — Ödeme</h2>
<p>Ödeme <strong>havale/EFT</strong> veya <strong>kapıda ödeme</strong> ile yapılır. Her iki yöntemde de bedel sipariş anında tahsil edilmez.</p>
<ul>
<li><strong>Havale/EFT:</strong> Sipariş numarası açıklamaya yazılarak SATICI hesabına gönderilir. Banka: .... — IBAN: .... — Hesap sahibi: ....</li>
<li><strong>Kapıda ödeme:</strong> Yalnızca kargoyla gönderilen ürünlerde geçerlidir; bedel teslim sırasında kuryeye ödenir.</li>
</ul>
<p>Havale ile ödenen siparişlerde ürün, ödeme SATICI hesabına geçtikten sonra hazırlanır. Ödemenin makul süre içinde yapılmaması hâlinde SATICI siparişi iptal edebilir.</p>

<h2 id="teslim">Madde 5 — Teslimat</h2>
<p>Fiziksel ürünler, siparişin SATICI’ya ulaşmasından itibaren <strong>en geç 30 gün</strong> içinde ALICI’nın bildirdiği adrese gönderilir. Dijital ürünler ödeme onayının ardından elektronik ortamda teslim edilir. Hizmetlerde tarih taraflarca ayrıca kararlaştırılır.</p>
<p>ALICI’nın bildirdiği adresin hatalı veya eksik olması nedeniyle teslim edilemeyen gönderilerden SATICI sorumlu tutulamaz.</p>
<p>SATICI edimini süresinde yerine getirmezse ALICI sözleşmeyi feshedebilir; bu hâlde tahsil edilen tüm ödemeler <strong>14 gün içinde</strong> iade edilir.</p>

<h2 id="cayma-hakki">Madde 6 — Cayma hakkı</h2>
<p>ALICI, malı teslim aldığı — hizmetlerde sözleşmenin kurulduğu — tarihten itibaren <strong>14 gün içinde</strong> gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayabilir.</p>
<p>Cayma bildirimi, süre dolmadan <a href="/contact">iletişim formu</a> üzerinden SATICI’ya yöneltilir.</p>
<p><strong>İade masrafı SATICI’ya aittir.</strong> ALICI, iadeye ilişkin masraflardan sorumlu tutulamaz (Yönetmelik m.12, 01.01.2026’dan itibaren geçerli hâli). İade gönderisinin hangi taşıyıcı ile yapılacağı cayma bildiriminden sonra ALICI’ya bildirilir.</p>
<p>SATICI, cayma bildiriminin kendisine ulaşmasından itibaren <strong>14 gün içinde</strong>, teslimat masrafları dâhil tahsil edilen tüm ödemeleri iade eder.</p>

<h2 id="cayma-istisnalari">Madde 7 — Cayma hakkının kullanılamayacağı hâller</h2>
<p>Yönetmeliğin 15. maddesi uyarınca, aşağıdaki sözleşmelerde cayma hakkı kullanılamaz:</p>
<ul>
<li><strong>Elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayrimaddi ürünler.</strong> SATICI’nın dijital ürünleri bu kapsamdadır; ALICI, satın alma sırasında bu hususu ayrıca onaylar.</li>
<li>Ambalajı, bandı veya mührü açılmış, sağlık ve hijyen bakımından iadeye uygun olmayan ürünler.</li>
<li>ALICI’nın istekleri doğrultusunda kişiye özel hazırlanan ürünler.</li>
<li>Çabuk bozulan veya son kullanma tarihi geçebilecek ürünler.</li>
<li>Teslimden sonra başka ürünlerle karışan ve ayrıştırılması mümkün olmayan ürünler.</li>
<li>Cayma süresi dolmadan, ALICI’nın onayıyla ifasına başlanan hizmetler.</li>
</ul>

<h2 id="ayipli-mal">Madde 8 — Ayıplı ürün</h2>
<p>Ürünün ayıplı olması hâlinde ALICI, 6502 sayılı Kanun’un 11. maddesindeki seçimlik haklarını kullanabilir. Bu hâlde gönderim ve iade masrafları SATICI’ya aittir. Ayıba ilişkin haklar cayma hakkından bağımsızdır.</p>

<h2 id="mucbir">Madde 9 — Mücbir sebep</h2>
<p>Tarafların iradesi dışında gelişen, öngörülemeyen ve engellenemeyen durumlarda edimin yerine getirilememesi hâlinde taraflar sorumlu tutulamaz. Bu durumda ALICI sözleşmeyi feshedebilir ve ödediği bedel <strong>14 gün içinde</strong> iade edilir.</p>

<h2 id="kisisel-veri">Madde 10 — Kişisel veriler</h2>
<p>ALICI’nın sipariş sırasında verdiği kişisel veriler, yalnızca siparişin yerine getirilmesi ve yasal yükümlülüklerin karşılanması amacıyla işlenir. Ayrıntılar için <a href="/data-and-privacy">Veri ve Gizlilik</a> sayfasına bakınız.</p>

<h2 id="uyusmazlik-cozumu">Madde 11 — Uyuşmazlıkların çözümü</h2>
<p>ALICI, uyuşmazlık hâlinde parasal sınırlar dâhilinde <strong>Tüketici Hakem Heyetlerine</strong> veya <strong>Tüketici Mahkemelerine</strong> başvurabilir.</p>
<p>1 Ocak 2026’dan itibaren, parasal sınırlar dâhilinde tüketici mahkemesinin görevine giren uyuşmazlıklarda mahkemeye başvurmadan önce <strong>arabulucuya başvurulması dava şartıdır</strong>.</p>

<h2 id="yururluk">Madde 12 — Yürürlük</h2>
<p>ALICI, siparişi onaylamakla bu sözleşmenin ve <a href="/on-bilgilendirme-formu">Ön Bilgilendirme Formu</a>’nun tüm koşullarını okuduğunu, anladığını ve kabul ettiğini beyan eder. Sözleşme, siparişin onaylandığı anda kurulmuş sayılır ve bir nüshası ALICI’ya elektronik ortamda iletilir.</p>

<hr>
<p><em>Son güncelleme: ....</em></p>
$html$
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      content_html = EXCLUDED.content_html,
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      updated_at = now();

-- ============================================================
-- 3) TERMS OF SALE  (yurt disi alicilar icin)
-- ============================================================
INSERT INTO pages (title, slug, status, meta_title, meta_description, content_html)
VALUES (
'Terms of Sale',
'terms-of-sale',
'published',
'Terms of Sale | Fabelo',
'What you are agreeing to when you order from the Fabelo store: prices, payment, delivery, cancellation and refunds.',
$html$
<p>These terms cover anything you buy from the Fabelo store. They sit alongside our <a href="/terms-and-conditions">Terms &amp; Conditions</a>, which cover reading the publication.</p>
<p><strong>If you are buying from Turkey</strong>, Turkish consumer law applies and the binding documents are the <a href="/on-bilgilendirme-formu">Ön Bilgilendirme Formu</a> and the <a href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</a>. Where those differ from this page, they win.</p>

<h2 id="who-we-are">Who you are buying from</h2>
<p>....<br>
Registered address: ....<br>
Company number: ....<br>
Tax number: ....</p>
<p>There is no e-mail address on this site by design. Everything reaches us through the <a href="/contact">contact form</a>, which puts your message on the record rather than in someone's inbox.</p>

<h2 id="prices">Prices</h2>
<p>Prices are shown in the currency each product is sold in and include tax where it applies. We do not convert prices at today's rate: the amount you see is the amount you pay.</p>
<p>An order can only be in one currency. If your basket has items priced differently, order them separately.</p>

<h2 id="payment">Payment</h2>
<p>We take payment by <strong>bank transfer</strong> or <strong>cash on delivery</strong>. No card details are collected on this site.</p>
<ul>
<li><strong>Bank transfer.</strong> We send the account details with your confirmation. Quote your order number as the reference. We start work once the money arrives.</li>
<li><strong>Cash on delivery.</strong> Available only when everything in the order is shipped; you pay the courier.</li>
</ul>
<p>Nothing is charged when you place the order.</p>

<h2 id="delivery">Delivery</h2>
<ul>
<li><strong>Physical goods</strong> are shipped to the address you give us. Delivery cost depends on where it is going; we quote it and confirm with you before dispatch.</li>
<li><strong>Digital goods</strong> are sent to you electronically once payment is confirmed.</li>
<li><strong>Sessions and services</strong> are arranged with you directly.</li>
</ul>
<p>If we cannot deliver within 30 days of your order, you may cancel and we refund everything you have paid, delivery included.</p>

<h2 id="cancelling">Cancelling and refunds</h2>
<p>You may cancel within <strong>14 days</strong> — from the day a physical item reaches you, or from the day the contract is made for a service. Tell us through the <a href="/contact">contact form</a>; you do not have to give a reason.</p>
<p><strong>We pay the return postage.</strong> We will tell you which carrier to use.</p>
<p>Refunds are made within <strong>14 days</strong> of your cancellation reaching us, and include what you paid for delivery.</p>

<h2 id="digital">Digital goods are an exception</h2>
<p>Files delivered to you immediately cannot be returned once you have them, for the obvious reason: a downloaded file cannot be given back. You are asked to confirm this at checkout, before you buy.</p>
<p>This does not affect your rights if the file is faulty, is not what was described, or does not work as it should. Tell us and we will fix it or refund you.</p>

<h2 id="faulty">If something is wrong</h2>
<p>If an item arrives damaged, faulty, or is not what was described, tell us and we will put it right — repair, replacement, a reduction, or a refund. We cover the postage both ways. This is separate from the 14-day cancellation above and is not limited to 14 days.</p>

<h2 id="your-details">Your details</h2>
<p>We ask for a delivery address only when something is actually being posted. For a digital purchase we do not need one and do not collect one. What we do with what you give us is set out in <a href="/data-and-privacy">Data &amp; Privacy</a>.</p>

<h2 id="disputes">Disputes</h2>
<p>Tell us first through the <a href="/contact">contact form</a> — most things are settled there.</p>
<p>Buyers in Turkey may apply to a Consumer Arbitration Committee (<em>Tüketici Hakem Heyeti</em>) or a Consumer Court; since 1 January 2026, mediation must be attempted before court proceedings within the relevant thresholds. Buyers elsewhere: these terms are governed by Turkish law, without prejudice to any mandatory consumer protections in your own country of residence.</p>

<hr>
<p><em>Last updated: ....</em></p>
$html$
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      content_html = EXCLUDED.content_html,
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      updated_at = now();

-- ============================================================
-- 4) DELIVERY & RETURNS  (pratik ozet — hukuki metin degil)
-- ============================================================
INSERT INTO pages (title, slug, status, meta_title, meta_description, content_html)
VALUES (
'Delivery & Returns',
'delivery-and-returns',
'published',
'Delivery & Returns | Fabelo',
'How your order reaches you, what delivery costs, and how to send something back.',
$html$
<p>The short version. The binding text is in <a href="/terms-of-sale">Terms of Sale</a>, and for buyers in Turkey the <a href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</a>.</p>

<h2 id="how-it-arrives">How your order reaches you</h2>
<ul>
<li><strong>Something to hold</strong> — posted to your address. We quote the delivery cost once we know where it is going, and confirm with you before anything is sent or charged.</li>
<li><strong>A file</strong> — sent to you electronically once your payment is confirmed. Nothing is posted, so we do not ask for an address.</li>
<li><strong>A session</strong> — we arrange the time with you directly.</li>
</ul>

<h2 id="how-long">How long it takes</h2>
<p>We aim to send physical orders within a few working days of the payment clearing. The outside limit is 30 days from your order; if we cannot manage it, you can cancel and we refund everything.</p>
<p>Bank transfers usually clear the next working day. Your order waits until then.</p>

<h2 id="sending-back">Sending something back</h2>
<p>You have <strong>14 days</strong> from the day it reaches you, and you do not need a reason. Tell us through the <a href="/contact">contact form</a> and we will tell you which carrier to use.</p>
<p><strong>The return postage is on us.</strong> You should not be out of pocket for changing your mind.</p>
<p>Your refund — including what you paid for delivery — is sent within 14 days of your message reaching us.</p>

<h2 id="files">Files are different</h2>
<p>A file you have already downloaded cannot be sent back, so digital purchases are final. You confirm this at checkout, before you pay — not afterwards.</p>
<p>If the file is faulty, incomplete, or not what the page described, that is our problem, not yours. Tell us and we will fix it or refund you.</p>

<h2 id="damaged">If it arrives damaged</h2>
<p>Photograph it and send us a message. We will replace it or refund you, and we cover the postage. This is not limited to 14 days.</p>

<hr>
<p><em>Last updated: ....</em></p>
$html$
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      content_html = EXCLUDED.content_html,
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      updated_at = now();

COMMIT;

SELECT slug, title, status, length(content_html) AS uzunluk FROM pages ORDER BY id;
