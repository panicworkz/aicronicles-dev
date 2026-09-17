# ②b-3-UI Panel UI Temeli — Tasarım (Spec)

**Tarih:** 2026-09-17
**Alt-proje:** ②b-3-UI (②b-3 editör/studio'nun ÖN KOŞULU)
**Üst spec:** [2026-09-17-02b-editor-studio-tasima-design.md](./2026-09-17-02b-editor-studio-tasima-design.md)
**Önceki:** ①, ②a, ②b-1, ②b-2 — GitHub'da, CI yeşil
**Durum:** Tasarım — kullanıcı incelemesi bekliyor

---

## 1. Amaç ve Kapsam

**Amaç:** Editör sayfaları (②b-3a) ve studio drawer'larının (②b-3b) dayandığı
**UI kit temelini** panic-cms'e taşımak. Fabelo panel/editör bileşenleri baştan aşağı
`@/components/ui/*` (button/input/card/...) + `sonner` (toast) + `lucide-react`
(ikon) kullanıyor; panic-cms'te bunların HİÇBİRİ yok (② b-1 paneli bilinçli olarak
sade HTML kullandı). Bu tur o temeli kurar; editör/studio ondan sonra birebir oturur.

**Kapsam içi:**
- Bağımlılıklar: `clsx`, `tailwind-merge` (cn util için), `lucide-react`, `sonner`.
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge).
- 8 ui bileşeni (fabelo `src/components/ui/`): `button`, `card`, `input`, `badge`,
  `label`, `textarea`, `modal` (OnayKatmani/`onayla`), `table`.
- `sonner` Toaster'ı panel layout'una bağlamak (toast'lar çalışsın).

**Kapsam dışı:**
- `image-upload-dropzone` — fabelo'da `@/components/studio/MediaPickerModal` +
  `MediaDetailDrawer`'a bağlı (henüz yok); ②b-3a/b'de o drawer'larla birlikte gelir.
- Ürün/font/oran ui bileşenleri (UrunSecici, FontSecici, LiveRatesTicker) → ②e/ertelendi.
- Editör sayfaları ve studio drawer'ları → ②b-3a / ②b-3b.

**Viyabilite (doğrulandı):** fabelo ui bileşenleri radix/cva KULLANMIYOR — yalnız
`react` + `cn`. Tema token'ları (`--background`, `--primary`, `--border`, `--muted`,
`--accent`, `--card`, `--ring`, `--sidebar`, `--popover`...) ②a'da tailwind.config +
globals.css'e zaten taşındı; ek tema gerekmez.

---

## 2. Yaklaşım

**Birebir port** (②b-2 ile tutarlı): fabelo `src/components/ui/*` ve `src/lib/utils.ts`
sadık taşınır; yalnızca import'lar (hepsi `@/lib/utils` ve `react`; uyarlama gerekmez)
ve gerekiyorsa `"use client"` korunur. Kaynak aicronicles-dev SALT-OKUNUR.

---

## 3. Bağımlılık Haritası

| Öğe | Kaynak | Bağımlılık | Durum |
|---|---|---|---|
| deps | (npm) | clsx, tailwind-merge, lucide-react, sonner | YENİ |
| `src/lib/utils.ts` | fabelo `lib/utils.ts` | clsx, tailwind-merge | YENİ |
| `src/components/ui/{button,card,input,badge,label,textarea,table}.tsx` | fabelo karşılıkları | react, `@/lib/utils` | YENİ |
| `src/components/ui/modal.tsx` | fabelo `ui/modal.tsx` | react, react-dom (portal) | YENİ |
| Panel layout Toaster | `sonner` | sonner | Modify `src/app/panic/layout.tsx` |

**Not:** modal.tsx `onayla()`/`OnayKatmani` sağlar (editör/liste silme onayları bunu
kullanır; ②b-1 liste `window.confirm` kullanıyordu — ②b-3'te onayla()'ya geçebilir,
bu turda ZORUNLU değil).

---

## 4. Görev Ayrımı

- **T1 — Bağımlılıklar + cn util:** `npm i clsx tailwind-merge lucide-react sonner`;
  `src/lib/utils.ts` port. Doğrulama: `cn` birim testi (saf string birleştirme).
- **T2 — ui bileşenleri portu:** 8 bileşen taşınır; import'lar `@/lib/utils`/`react`.
  Doğrulama: tsc + build temiz (statik sunum; birim test anlamsız).
- **T3 — Toaster + smoke kanıtı:** `sonner` Toaster panel layout'a; geçici bir harness'te
  (tarayıcı) bileşenler + bir toast render edilip görsel doğrulanır, harness silinir.
  `docs/KANIT-ui-temeli.md`.

---

## 5. Doğrulama Ölçütü

`tsc` + `next build` + tüm vitest yeşil. `cn` birim testi geçer. Tarayıcıda ui
bileşenleri (button/input/card/badge/table) tema token'larıyla doğru render eder ve
bir `toast` görünür. Kalıcı panel/editör kodunda regresyon yok.

---

## 6. Riskler

- **Tema uyumu:** düşük — token'lar ②a'da mevcut (doğrulandı).
- **sonner/React 19 uyumu:** sonner React 19 destekli; build doğrular.
- **modal react-dom portal + SSR:** modal client bileşeni; render'da document'e
  dokunmaz (portal mount'ta). ②b-2 spike deseniyle aynı — build doğrular.
- **image-upload-dropzone ertelendi:** editör yükleme alanı ②b-3a/b'ye kadar yok (açık borç).
