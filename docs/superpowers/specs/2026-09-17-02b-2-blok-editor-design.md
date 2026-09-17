# ②b-2 Blok Düzenleme Çekirdeği — Tasarım (Spec)

**Tarih:** 2026-09-17
**Alt-proje:** ②b-2 (②b editör/studio taşımanın ikinci parçası)
**Üst spec:** [2026-09-17-02b-editor-studio-tasima-design.md](./2026-09-17-02b-editor-studio-tasima-design.md)
**Önceki:** ①, ②a (içerik çekirdeği + render + STUB'lar), ②b-1 (editör API + panel çerçevesi) — GitHub'da, CI yeşil
**Durum:** Tasarım — kullanıcı incelemesi bekliyor

---

## 1. Amaç ve Kapsam

**Amaç:** fabelo'nun **blok düzenleme çekirdeğini** (satır-içi metin davranışı +
blok seçim/araç çubuğu/sürükle-bırak/geri-al yüzeyi) panic-cms'e tenant-agnostik
taşımak. ②a render'ı (okuma) taşıdı ve düzenleme yüzeyini bir STUB olarak bıraktı;
②b-2 o stub'ın yerine **gerçek** düzenleme yüzeyini koyar.

**Kapsam içi:**
- `src/lib/blok-turleri.ts` — blok tanımları (yeni; ②a'da yoktu).
- `src/components/magazine/blok-metin.ts` — satır-içi metin (biçim, yapıştırma
  temizliği, "/" komutu, markdown kısayolları). Yeni.
- `src/components/magazine/blok-yuzeyi.ts` — gerçek düzenleme yüzeyi; ②a
  STUB'ının yerini alır. Seçim çerçevesi, araç çubuğu, sürükle-bırak, geri/ileri-al.
- Tarayıcı uçtan uca kanıtı (blok ekle/düzenle/sırala/geri-al) + saf yardımcı birim testleri.

**Kapsam dışı (sonraki parçalar):**
- Editör sayfaları (`/panic/{posts,pages}/[id]`, `/new`) ve studio drawer'ları
  (AyarKenari/CanlıTuval, medya/revizyon/taksonomi/SEO/AEO çekmeceleri) → **②b-3**.
- Reklam ②c, form ②d, mağaza ②e.

**Fizibilite:** ②b-2 spike'ı (2026-09-17) contentEditable + execCommand + selection'ın
Next 15.5 client component'te SSR/hydration sorunu olmadan çalıştığını canlı tarayıcıda
doğruladı. Tek dikkat: araç-çubuğu düğmeleri seçimi bozar → mousedown preventDefault
gerekir (fabelo'da mevcut). Spike kodu atıldı.

---

## 2. Yaklaşım

**Birebir port** (kullanıcı onayı, 2026-09-17): fabelo'daki üç dosya tek dosya olarak
sadık taşınır; yalnızca import'lar (panic-cms `blok-sema`/`bloklar`) ve ②a'da sabitlenen
imza uyarlanır. Gerekçe: 1655 satırlık ince seçim/geri-al/sürükle DOM kodunu taşırken
AYNI ANDA yeniden yapılandırmak hataların saklandığı yerdir; önce çalışan (tarayıcıda
kanıtlanmış) bir taban, sonra istenirse ayrı bir refactor task'ı (K9: fabelo neredeyse
aynen taşınır; ②a ile tutarlı).

**Kaynak salt-okunur:** aicronicles-dev/fabelo DEĞİŞMEZ; yalnızca panic-cms'e yazılır.

---

## 3. Bağımlılık Haritası ve Sözleşme

| Dosya | Satır | Bağımlılık | Durum |
|---|---|---|---|
| `src/lib/blok-turleri.ts` | ~512 | `bloklar` (Blok tipi, ✓ ②a) | YENİ |
| `src/components/magazine/blok-metin.ts` | ~459 | `blok-sema` (TEHLIKELI/SEFFAF/SATIR_ICI/etiketGecerli/oznitelikGecerli, ✓ ②a) | YENİ |
| `src/components/magazine/blok-yuzeyi.ts` | ~1655 | `blok-turleri` (bu spec) + `blok-metin` (bu spec) | STUB'ı DEĞİŞTİR |

**Sabit sözleşme (②a'da CanlıÖnizleme + stub ile pinlendi, fabelo ile birebir):**
```
duzenlenebilirlikUygula(govde: HTMLElement): void
blokYuzeyiKur(ayarlar: {
  govde: HTMLElement;
  yolla: () => void;
  gorselAc: (img: HTMLImageElement) => void;
  urunAc: (blok: HTMLElement) => void;
  gecmisDegisti?: (geri: number, ileri: number) => void;
}): BlokYuzeyi   // { kaldir; geriAl; ileriAl; ... (süperset olabilir) }
```
`CanlıÖnizleme.tsx` (②a) bu imzayı çağırıyor; gerçek `BlokYuzeyi` fabelo'da daha zengin
olabilir — CanlıÖnizleme kullandığı alt-kümeyi çağırır, dokunmaya gerek kalmaz.

**Blok-sema yeterliliği:** `blok-metin.ts`'in ihtiyaç duyduğu tüm export'lar panic-cms
`blok-sema.ts`'de zaten var; ek taşıma gerekmez.

---

## 4. Görev Ayrımı (bağımlılık sırası)

- **T1 — `blok-turleri.ts` port:** blok tanımları (BLOK_TANIMLARI, EKLENEBILIR_TURLER,
  PARAGRAF_ROLLERI, TABLO_SETLERI, `Alan` tipi). Çoğu veri/config; `bloklar`'a bağlı.
  Doğrulama: tsc + (varsa) saf yardımcı testi.
- **T2 — `blok-metin.ts` port + birim test:** satır-içi metin davranışı. **Saf
  yardımcılar** (`yapistirmayiTemizle`, markdown kısayol ayrıştırma gibi DOM'suz kısımlar)
  birim testlenir; DOM'a dokunan `metinYuzeyiKur` T4'te tarayıcıda kanıtlanır.
- **T3 — `blok-yuzeyi.ts` gerçek yüzeyi:** stub'ı değiştir; blok-metin + blok-turleri'yi
  bağla; sabit imzayı koru. tsc + `next build` + CanlıÖnizleme'nin hâlâ derlendiği doğrulanır.
- **T4 — Tarayıcı uçtan uca kanıtı:** yüzeyi bir contentEditable gövdeye bağlayan
  tekrar üretilebilir bir harness'te (spike gibi) şunlar kanıtlanır: blok ekle, metin
  biçimle (bold + markdown "## "/"- "/"> "/"---"), sürükle-bırak sırala, geri/ileri-al,
  Word/Docs yapıştırma temizliği, "/" komut menüsü. Kontrol: hydration hatası YOK +
  kaydedilen HTML temiz (düzenleme artığı/mso-/boş span yok). `docs/KANIT-blok-editor.md`.

---

## 5. Veri Akışı

Editör tamamen client. CanlıÖnizleme (client component) bir `govde` HTMLElement'i
ref ile tutar; `useEffect` (mount sonrası) `blokYuzeyiKur({govde, ...})` çağırır. Yüzey
gövdeye contentEditable uygular (`duzenlenebilirlikUygula`), seçim/araç çubuğu/sürükle
olay dinleyicilerini kurar, blok-metin ile satır-içi biçimlendirmeyi bağlar. Değişiklikte
`yolla()` üst bileşene HTML senkronu verir; `gorselAc`/`urunAc` panel seçicilerini açar;
`gecmisDegisti` panel geri/ileri düğmelerini besler. Kaydetme: HTML → `htmlBloklara`
(②a) → bloklar; render `bloklarHtmle` (②a). Yüzey render'da `document`/`window`'a
ASLA dokunmaz — yalnızca useEffect içinde.

---

## 6. Riskler ve Kılavuz

- **contentEditable + Next 15:** spike'ta çözüldü — client-only, DOM davranışı
  useEffect'te. SSR/hydration temiz.
- **Seçim koruması:** araç-çubuğu düğmelerinde mousedown preventDefault (fabelo'da var,
  korunacak) — yoksa düğmeye basınca seçim kaybolur.
- **Kendi geri-al yığını:** tarayıcının undo'su her editable alan için ayrı; yüzey kendi
  yığınını tutar (fabelo mantığı birebir).
- **DOM birim testi zor:** bu yüzden çekirdek davranış tarayıcıda kanıtlanır (T4); yalnız
  saf yardımcılar birim testlenir.
- **Tenant güvenliği:** ②b-2 tümüyle client DOM; kalıcılık ②b-1 API'lerinden geçer
  (withApiTenant guard). Bu parça yeni yazma yolu AÇMAZ.

---

## 7. Kanıt Ölçütü

Tarayıcıda: boş gövdeye "/" ile blok ekle → metni yaz → bir kelimeyi bold + "## " ile
başlığa çevir → ikinci blok ekleyip sürükleyerek sırala → geri-al/ileri-al → Word'den
metin yapıştır (temizlenmeli). Kaydedilen HTML temiz ve `htmlBloklara` ile bloklara
dönüştürülebilir. Konsol hydration hatası vermez. Saf yardımcı birim testleri yeşil,
`next build` + tüm vitest yeşil.
