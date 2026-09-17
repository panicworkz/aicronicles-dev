# ②b-3-UI Panel UI Temeli — Uygulama Planı

> **Agentic worker'lar için:** GEREKLİ ALT-SKILL: superpowers:subagent-driven-development
> (önerilen) veya superpowers:executing-plans. Adımlar checkbox (`- [ ]`).

**Goal:** Editör/studio'nun (②b-3a/b) dayandığı UI kit temelini (cn util + 8 ui
bileşeni + sonner/lucide) panic-cms'e birebir taşımak.

**Architecture:** fabelo ui bileşenleri radix/cva kullanmaz — `react` + `cn(clsx+
tailwind-merge)`. Tema token'ları ②a'da mevcut. Toaster panel layout'a bağlanır.

**Tech Stack:** Next 15.5.25, React 19, TS, Tailwind 3.4, Vitest, sonner, lucide-react.

**Spec:** [docs/superpowers/specs/2026-09-17-02b-3-ui-panel-temeli-design.md](../specs/2026-09-17-02b-3-ui-panel-temeli-design.md)
**Kaynak referans (SALT-OKUNUR):** fabelo `aicronicles-dev/src/lib/utils.ts`,
`aicronicles-dev/src/components/ui/{button,card,input,badge,label,textarea,modal,table}.tsx`.

## Global Constraints

- **Kaynak salt-okunur:** aicronicles-dev DEĞİŞMEZ; yalnızca panic-cms'e yazılır.
- **Birebir port:** bileşenler sadık taşınır; import'lar (`@/lib/utils`, `react`) aynen geçerli.
- **image-upload-dropzone HARİÇ:** studio drawer'lara bağlı; ②b-3a/b'de.
- **Repo panic-cms main. Commit + push her task sonunda.**

---

## Task 1: Bağımlılıklar + cn util

**Files:** Modify `package.json`; Create `src/lib/utils.ts`, `src/lib/utils.test.ts`.
Reference: fabelo `src/lib/utils.ts`.

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` — tüm ui bileşenleri (T2) tüketir.

- [ ] **Step 1: Bağımlılıkları kur** — `npm i clsx tailwind-merge lucide-react sonner`
  (panic-cms). Neden: cn util clsx+tailwind-merge; ui bileşenleri lucide (ikon), toast sonner.
- [ ] **Step 2: Failing test yaz** — `src/lib/utils.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("sınıfları birleştirir", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("koşullu/false değerleri atar", () => {
    expect(cn("a", false && "b", null, "c")).toBe("a c");
  });
  it("tailwind çakışmasında sonuncuyu tutar (twMerge)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
```

- [ ] **Step 3:** Çalıştır (`npx vitest run src/lib/utils.test.ts`), fail gör
  ("Cannot find module ./utils").
- [ ] **Step 4:** fabelo `src/lib/utils.ts`'i panic-cms'e KOPYALA (clsx + twMerge; cn).
- [ ] **Step 5:** Çalıştır, 3 test pass gör. `npx tsc --noEmit` temiz.
- [ ] **Step 6: Commit + push** — `feat(ui): cn util + bagimliliklar (clsx/tailwind-merge/lucide/sonner)`

---

## Task 2: ui bileşenleri portu

**Files:** Create `src/components/ui/{button,card,input,badge,label,textarea,modal,table}.tsx`.
Reference: fabelo `src/components/ui/` karşılıkları.

**Interfaces:**
- Consumes: `cn` (T1), react, react-dom (modal portal).
- Produces: `Button`, `Card`(+CardHeader/Title/Content...), `Input`, `Badge`, `Label`,
  `Textarea`, `Table`(+TableHeader/Body/Row/Head/Cell), `OnayKatmani`/`onayla` (modal)
  — editör/studio (②b-3a/b) tüketir.

- [ ] **Step 1:** fabelo 8 ui dosyasını panic-cms `src/components/ui/`'ye KOPYALA.
  Her dosyanın import'u `@/lib/utils` (cn) ve `react`/`react-dom` — panic-cms'te aynen
  geçerli. `"use client"` varsa KORU. BAŞKA `@/components/*` import EDEN dosya (ör.
  image-upload-dropzone) BU TURDA KOPYALANMAZ.
- [ ] **Step 2:** `npx tsc --noEmit` — 8 bileşen derlenmeli. Çözülemeyen import
  (beklenmeyen bir `@/components/ui/*` ya da `@/lib/*` bağımlılığı) çıkarsa: o dosya
  eksik bir kardeşe bağlı demektir — eksik kardeşi de bu listeden ekle ya da (studio'ya
  bağlıysa) o bileşeni ②b-3a/b'ye ertele, notu düş.
- [ ] **Step 3:** `npx next build` temiz.
- [ ] **Step 4:** `npx vitest run` — mevcut tüm testler yeşil (regresyon yok).
- [ ] **Step 5: Commit + push** — `feat(ui): panel ui bilesenleri (button/card/input/... port)`

---

## Task 3: Toaster + tarayıcı smoke kanıtı

**Files:** Modify `src/app/panic/layout.tsx` (Toaster); Create geçici harness
`src/app/ui-smoke/page.tsx` + `ui-smoke.tsx` (kanıt sonunda SİLİNİR); Create `docs/KANIT-ui-temeli.md`.

**Interfaces:** Consumes: ui bileşenleri (T2), sonner (T1).

- [ ] **Step 1: Toaster bağla** — `src/app/panic/layout.tsx`'e sonner `<Toaster />`
  ekle (auth'lı dalda ya da en dışta; toast panel genelinde çalışsın). tsc temiz.
- [ ] **Step 2: Harness yaz** — `src/app/ui-smoke/` (panic DIŞI, tenant gerektirmesin,
  ②b-2 harness dersı): `"use client"` bir sayfa; `Button`, `Input`, `Badge`, `Card`,
  `Table` render eder; bir düğme `toast.success("çalışıyor")` çağırır (kendi Toaster'ıyla).
- [ ] **Step 3:** `PORT=3987 npm run dev` (arka plan). Built-in browser ile
  `http://localhost:3987/ui-smoke` aç. Kontrol: bileşenler tema token'larıyla (bg-primary
  vb.) render eder, konsol hydration hatası vermez, düğmeye basınca toast görünür.
  Sonuçları `docs/KANIT-ui-temeli.md`'ye yaz (ekran/gözlem).
- [ ] **Step 4:** Dev server'ı durdur. **Harness'i sil** (`src/app/ui-smoke/`), `.next` temizle.
- [ ] **Step 5:** `npx vitest run` + `npx tsc --noEmit` + `npx next build` temiz (harness silindikten SONRA).
- [ ] **Step 6: Commit + push** — `feat(ui): panel Toaster + ui temeli tarayici kaniti`

---

## Self-Review Notları

- **Spec kapsamı:** T1 deps+cn, T2 8 bileşen, T3 Toaster+kanıt — spec §4 ile birebir.
  image-upload-dropzone ve editör/studio ②b-3a/b'de (kapsam dışı, notlandı).
- **Tip tutarlılığı:** cn (T1) → T2 tüm bileşenler tüketir; T2 bileşenleri → ②b-3a/b tüketir.
- **Doğrulama:** cn saf → birim test; ui statik sunum → tsc+build+tarayıcı smoke.
- **Açık borç:** image-upload-dropzone + onayla()'ya geçiş (②b-1 window.confirm) ②b-3'te.
