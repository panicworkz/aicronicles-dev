# ① Çok-Kiracılık Çekirdek İskeleti — Uygulama Planı

> **Agentic worker'lar için:** GEREKLİ ALT-SKILL: Bu planı task-task uygulamak
> için superpowers:subagent-driven-development (önerilen) veya
> superpowers:executing-plans kullan. Adımlar takip için checkbox (`- [ ]`)
> söz dizimindedir.

**Goal:** Yeni `panic-cms` reposunda, multi-tenancy'nin birinci-sınıf olduğu,
iki geçici kiracıyla uçtan uca çalıştığı kanıtlanan bir çekirdek iskelet kurmak.

**Architecture:** Tek Next.js 15 uygulaması, `Host` başlığından kiracıyı çözer;
kontrol DB'si (`panic_control`) domain→DB haritasını tutar; her istek bir
AsyncLocalStorage tenant context'i içinde çalışır ve `db` sorgu anında doğru
kiracı havuzuna yönlenir (context yoksa hata). Site kimliği çalışma-anında
kiracıdan gelir; build-time `NEXT_PUBLIC_SITE_URL` yoktur.

**Tech Stack:** Next.js 15.1.7 (App Router), React 19, TypeScript, Tailwind,
Drizzle ORM + `pg`, Drizzle Kit (göç), `jose` + `bcryptjs` (auth), Docker,
Vitest (test).

**Spec:** [docs/superpowers/specs/2026-09-12-01-cok-kiracilik-cekirdek-iskelet-design.md](../specs/2026-09-12-01-cok-kiracilik-cekirdek-iskelet-design.md)
**Üst kararlar:** [docs/superpowers/specs/2026-09-12-panic-cms-cok-kiracilik-mimari-kararlar.md](../specs/2026-09-12-panic-cms-cok-kiracilik-mimari-kararlar.md)

## Global Constraints

- **Yama yok (K8):** Hiçbir dosyada "şimdilik tek site varsayalım" kısayolu
  yazılmaz. Her DB erişimi tenant context içinden geçer.
- **fabelo dokunulmaz:** Bu plan yeni `panic-cms` reposunda çalışır; mevcut
  `aicronicles-dev` reposu ve canlı fabelo.io HİÇ değişmez. fabelo taşıma ②→③'te.
- **database-per-tenant (K1):** Kiracı tablolarına `tenant_id` sütunu EKLENMEZ;
  ayrım DB düzeyinde.
- **Fail-safe (K3):** Tenant context olmadan yapılan DB sorgusu sessizce
  çalışmaz, hata fırlatır.
- **Node runtime:** DB'ye dokunan hiçbir kod Edge runtime'da çalışmaz.
- **Migration: elle SQL yok** — yalnızca Drizzle Kit.
- **Repo yolu:** `~/Documents/dev-pw/panic-cms` (mevcut `aicronicles-dev`'in
  yanında, ayrı git reposu).

---

## Dosya Yapısı

Oluşturulacak dosyalar ve sorumlulukları (panic-cms repo kökünden):

| Dosya | Sorumluluk |
|---|---|
| `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts` | proje tooling |
| `src/db/control/schema.ts` | kontrol DB Drizzle şeması (`tenants`) |
| `src/db/control/client.ts` | kontrol DB bağlantısı (tek, sabit havuz) |
| `src/db/tenant/schema.ts` | kiracı DB minimal şeması (① için `pages`, `users`) |
| `src/core/tenant/resolve.ts` | `resolveTenant(host)` — kontrol DB + cache |
| `src/core/tenant/pools.ts` | kiracı havuz cache'i (`getTenantPool(dbName)`) |
| `src/core/tenant/context.ts` | `runWithTenant`, `getTenantDb`, `db` proxy |
| `src/core/config/site.ts` | `getSiteConfig()` — runtime site kimliği |
| `src/core/auth/session.ts` | JWT, cookie, `createSession`/`getSession` |
| `src/middleware.ts` | `Host` → `x-tenant-host` başlığı (Edge) |
| `src/app/layout.tsx`, `src/app/(site)/page.tsx` | kiracı yüzü (minimal) |
| `src/app/panic/login/page.tsx`, `src/app/panic/page.tsx` | kiracı paneli iskelet |
| `drizzle.control.config.ts`, `drizzle.tenant.config.ts` | Drizzle Kit config |
| `scripts/seed-gecici-kiracilar.ts` | t1/t2 kiracı seed |
| `docker/Dockerfile`, `docker-compose.dev.yml` | konteyner |
| `.github/workflows/ci.yml` | CI iskeleti (derleme) |

---

## Task 0: AsyncLocalStorage + Next.js 15 spike (feasibility)

Tüm mimari, tenant context'in Server Component / route handler / server action
üçünde de taşınmasına dayanıyor (spec §8). Bunu kod yazmadan önce kanıtla.

**Files:**
- Create (geçici, spike): `spike/als-test/` altında minimal Next.js app

- [ ] **Step 1:** Minimal Next 15 app kur, bir `AsyncLocalStorage` context'i
  bir wrapper'da set et, bir Server Component + bir route handler + bir server
  action içinden `getStore()` oku.
- [ ] **Step 2:** Üçünde de store'un okunabildiğini doğrula.
  Beklenen: üçü de context değerini görür.
- [ ] **Step 3:** Eğer server action / route handler'da context KAYBOLUYORSA,
  fallback tasarımı not et (per-request context'i middleware header + Node
  başlangıcında yeniden kurma). Bulguyu spec §8'e işle.
- [ ] **Step 4:** Spike dizinini sil (throwaway). Bulgu bir cümleyle plana not
  düşülür.

**Not:** Bu bir spike — çıktısı koddan çok bir cevap. Sonuç "taşınıyor" ise
Task 4 tasarımı aynen geçerli; "taşınmıyor" ise Task 4'te context kurulumu her
giriş noktasında (layout + her route handler + her action) açıkça çağrılır.

---

## Task 1: Proje iskeleti + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`,
  `tailwind.config.ts`, `postcss.config.mjs`, `.gitignore`, `src/app/layout.tsx`,
  `src/app/(site)/page.tsx`, `vitest.config.ts`

**Interfaces:**
- Produces: çalışan bir Next.js 15 dev sunucusu; `npm test` (Vitest) koşar.

- [ ] **Step 1: Repo ve proje kurulumu**

```bash
cd ~/Documents/dev-pw
mkdir panic-cms && cd panic-cms
git init
npx create-next-app@15.1.7 . --typescript --tailwind --app --src-dir \
  --no-eslint --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Test altyapısı (Vitest) ekle**

```bash
npm i -D vitest @vitest/ui
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

`package.json` scripts'e ekle: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Bağımlılıklar**

```bash
npm i drizzle-orm pg jose bcryptjs
npm i -D drizzle-kit @types/pg @types/bcryptjs
```

- [ ] **Step 4: Doğrula — dev sunucu ve test koşar**

Run: `npm run dev` (aç/kapat), `npm test`
Beklenen: dev sunucu 3000'de açılır; `npm test` "no test files" ile temiz çıkar.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: panic-cms proje iskeleti (Next 15, TS, Tailwind, Drizzle, Vitest)"
```

---

## Task 2: Kontrol DB şeması ve bağlantısı

**Files:**
- Create: `src/db/control/schema.ts`, `src/db/control/client.ts`,
  `drizzle.control.config.ts`, `src/db/control/schema.test.ts`

**Interfaces:**
- Produces:
  - `tenants` tablosu; tip `Tenant = typeof tenants.$inferSelect`
  - `controlDb` — kontrol DB'sine bağlı Drizzle instance
  - alanlar: `id, slug, primaryDomain, dbName, status, createdAt`

- [ ] **Step 1: Şema testini yaz (failing)**

`src/db/control/schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { tenants } from "./schema";

describe("tenants şeması", () => {
  it("gerekli sütunları tanımlar", () => {
    const cols = Object.keys(tenants);
    for (const c of ["id", "slug", "primaryDomain", "dbName", "status", "createdAt"]) {
      expect(cols).toContain(c);
    }
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olsun**

Run: `npm test -- schema.test`
Beklenen: FAIL — `./schema` yok.

- [ ] **Step 3: Şemayı yaz**

`src/db/control/schema.ts`:
```ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  primaryDomain: text("primary_domain").notNull().unique(),
  dbName: text("db_name").notNull().unique(),
  status: text("status").notNull().default("provisioning"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
```

- [ ] **Step 4: Kontrol DB bağlantısı**

`src/db/control/client.ts`:
```ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const url = process.env.CONTROL_DATABASE_URL;
if (!url) throw new Error("CONTROL_DATABASE_URL tanımlı değil.");

const pool = new pg.Pool({ connectionString: url, max: 5 });
export const controlDb = drizzle(pool, { schema });
export { schema as controlSchema };
```

- [ ] **Step 5: Drizzle Kit config**

`drizzle.control.config.ts`:
```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/control/schema.ts",
  out: "./drizzle/control",
  dialect: "postgresql",
  dbCredentials: { url: process.env.CONTROL_DATABASE_URL! },
});
```

- [ ] **Step 6: Testi çalıştır, geçsin**

Run: `npm test -- schema.test`
Beklenen: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(kontrol-db): tenants semasi ve baglantisi"
```

---

## Task 3: Tenant resolver (Host → kiracı) + cache

**Files:**
- Create: `src/core/tenant/resolve.ts`, `src/core/tenant/resolve.test.ts`

**Interfaces:**
- Consumes: `controlDb`, `tenants`, `Tenant` (Task 2)
- Produces:
  - `resolveTenant(host: string): Promise<Tenant | null>`
  - `clearTenantCache(): void` (test ve ileride kontrol paneli invalidation)

- [ ] **Step 1: Testi yaz (failing)** — cache davranışı ve normalize

`src/core/tenant/resolve.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
vi.mock("@/db/control/client", () => ({
  controlDb: { query: { tenants: { findFirst: (...a: unknown[]) => findFirst(...a) } } },
}));

import { resolveTenant, clearTenantCache } from "./resolve";

beforeEach(() => { findFirst.mockReset(); clearTenantCache(); });

describe("resolveTenant", () => {
  it("host'u normalize eder (port ve büyük harf düşer)", async () => {
    findFirst.mockResolvedValue({ id: "1", primaryDomain: "a.localhost" });
    const t = await resolveTenant("A.localhost:3000");
    expect(t).toBeTruthy();
  });

  it("ikinci çağrıda cache'ten döner (DB'ye bir kez gider)", async () => {
    findFirst.mockResolvedValue({ id: "1", primaryDomain: "a.localhost" });
    await resolveTenant("a.localhost");
    await resolveTenant("a.localhost");
    expect(findFirst).toHaveBeenCalledTimes(1);
  });

  it("bilinmeyen host için null döner", async () => {
    findFirst.mockResolvedValue(undefined);
    expect(await resolveTenant("nope.localhost")).toBeNull();
  });
});
```

- [ ] **Step 2: Çalıştır, başarısız olsun**

Run: `npm test -- resolve.test`
Beklenen: FAIL — `./resolve` yok.

- [ ] **Step 3: Implementasyon**

`src/core/tenant/resolve.ts`:
```ts
import { eq } from "drizzle-orm";
import { controlDb } from "@/db/control/client";
import { tenants, type Tenant } from "@/db/control/schema";

const TTL_MS = 60_000;
type Kayit = { tenant: Tenant | null; expires: number };
const cache = new Map<string, Kayit>();

function normalize(host: string): string {
  return host.trim().toLowerCase().split(":")[0];
}

export function clearTenantCache(): void {
  cache.clear();
}

export async function resolveTenant(host: string): Promise<Tenant | null> {
  const key = normalize(host);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.tenant;

  const found = await controlDb.query.tenants.findFirst({
    where: eq(tenants.primaryDomain, key),
  });
  const tenant = found ?? null;
  cache.set(key, { tenant, expires: Date.now() + TTL_MS });
  return tenant;
}
```

- [ ] **Step 4: Çalıştır, geçsin**

Run: `npm test -- resolve.test`
Beklenen: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(tenant): Host->kiraci cozumu + bellek cache"
```

---

## Task 4: Tenant context + havuz cache + db proxy

**Files:**
- Create: `src/core/tenant/pools.ts`, `src/core/tenant/context.ts`,
  `src/core/tenant/context.test.ts`
- Create: `src/db/tenant/schema.ts` (① minimal: `pages`, `users`)

**Interfaces:**
- Consumes: `Tenant` (Task 2)
- Produces:
  - `getTenantPool(dbName: string)` — Drizzle instance (cache'li)
  - `runWithTenant<T>(tenant: Tenant, fn: () => Promise<T>): Promise<T>`
  - `getTenantDb()` — context'teki Drizzle instance; context yoksa **throw**
  - `getCurrentTenant()` — context'teki `Tenant`; yoksa **throw**
  - `db` — proxy; her erişimde `getTenantDb()`'ye yönlenir

- [ ] **Step 1: Kiracı minimal şeması**

`src/db/tenant/schema.ts`:
```ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 2: Context testini yaz (failing)** — fail-safe ve izolasyon

`src/core/tenant/context.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getTenantDb, getCurrentTenant, runWithTenant } from "./context";

const sahteKiraci = { id: "1", slug: "t1", primaryDomain: "t1.localhost",
  dbName: "tenant_t1", status: "active", createdAt: new Date() } as any;

describe("tenant context", () => {
  it("context DIŞINDA getTenantDb hata verir (fail-safe)", () => {
    expect(() => getTenantDb()).toThrow();
  });
  it("context İÇİNDE mevcut kiracıyı verir", async () => {
    const g = await runWithTenant(sahteKiraci, async () => getCurrentTenant());
    expect(g.slug).toBe("t1");
  });
});
```

- [ ] **Step 3: Çalıştır, başarısız olsun**

Run: `npm test -- context.test`
Beklenen: FAIL.

- [ ] **Step 4: Havuz cache**

`src/core/tenant/pools.ts`:
```ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as tenantSchema from "@/db/tenant/schema";

const pools = new Map<string, ReturnType<typeof drizzle>>();

function urlFor(dbName: string): string {
  const base = process.env.TENANT_DATABASE_BASE_URL;
  if (!base) throw new Error("TENANT_DATABASE_BASE_URL tanımlı değil.");
  return base.replace(/\/[^/]*$/, `/${dbName}`); // .../postgres -> .../<dbName>
}

export function getTenantPool(dbName: string) {
  const hit = pools.get(dbName);
  if (hit) return hit;
  const pool = new pg.Pool({ connectionString: urlFor(dbName), max: 5 });
  const inst = drizzle(pool, { schema: tenantSchema });
  pools.set(dbName, inst);
  return inst;
}
```

- [ ] **Step 5: Context (AsyncLocalStorage) + db proxy**

`src/core/tenant/context.ts`:
```ts
import { AsyncLocalStorage } from "node:async_hooks";
import type { Tenant } from "@/db/control/schema";
import { getTenantPool } from "./pools";

type Store = { tenant: Tenant; db: ReturnType<typeof getTenantPool> };
const als = new AsyncLocalStorage<Store>();

export function runWithTenant<T>(tenant: Tenant, fn: () => Promise<T>): Promise<T> {
  return als.run({ tenant, db: getTenantPool(tenant.dbName) }, fn);
}

export function getCurrentTenant(): Tenant {
  const s = als.getStore();
  if (!s) throw new Error("Tenant context yok: getCurrentTenant context dışında çağrıldı.");
  return s.tenant;
}

export function getTenantDb() {
  const s = als.getStore();
  if (!s) throw new Error("Tenant context yok: DB sorgusu context dışında çağrıldı.");
  return s.db;
}

// import { db } uyumu: her erişim sorgu anında doğru havuza yönlenir.
export const db = new Proxy({} as ReturnType<typeof getTenantPool>, {
  get(_t, prop) {
    const real = getTenantDb() as any;
    const v = real[prop];
    return typeof v === "function" ? v.bind(real) : v;
  },
});
```

- [ ] **Step 6: Çalıştır, geçsin**

Run: `npm test -- context.test`
Beklenen: PASS (2 test).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(tenant): AsyncLocalStorage context, havuz cache, db proxy (fail-safe)"
```

---

## Task 5: Middleware (Host → x-tenant-host)

**Files:**
- Create: `src/middleware.ts`, `src/middleware.test.ts`

**Interfaces:**
- Produces: gelen her isteğe `x-tenant-host` başlığı ekler (Host'tan).

- [ ] **Step 1: Test (failing)**

`src/middleware.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

describe("middleware", () => {
  it("Host'u x-tenant-host olarak geçirir", () => {
    const req = new NextRequest("https://t1.localhost/", {
      headers: { host: "t1.localhost" },
    });
    const res = middleware(req);
    expect(res.headers.get("x-tenant-host")).toBe("t1.localhost");
  });
});
```

- [ ] **Step 2: Çalıştır, başarısız olsun**

Run: `npm test -- middleware.test`
Beklenen: FAIL.

- [ ] **Step 3: Implementasyon**

`src/middleware.ts`:
```ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const res = NextResponse.next();
  res.headers.set("x-tenant-host", host);
  // İstek başlıklarına da ekle (Node runtime okuyabilsin)
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("x-tenant-host", host);
  return NextResponse.next({ request: { headers: reqHeaders } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
```

- [ ] **Step 4: Çalıştır, geçsin**

Run: `npm test -- middleware.test`
Beklenen: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(middleware): Host -> x-tenant-host (Edge, DB'ye dokunmaz)"
```

---

## Task 6: İstek başlangıcında context kurulumu + runtime site config

**Files:**
- Create: `src/core/tenant/withRequest.ts`, `src/core/config/site.ts`,
  `src/core/config/site.test.ts`
- Modify: `src/app/layout.tsx` (context sarmalayıcı), `src/app/(site)/page.tsx`

**Interfaces:**
- Consumes: `resolveTenant` (Task 3), `runWithTenant` (Task 4), `headers()` (next)
- Produces:
  - `withTenantRequest<T>(fn: () => Promise<T>): Promise<T>` — `x-tenant-host`
    okur, tenant çözer, yoksa `notFound()`, varsa `runWithTenant` içinde çalıştırır
  - `getSiteConfig(): { url: string; domain: string }` — context'teki kiracıdan

- [ ] **Step 1: site config testi (failing)**

`src/core/config/site.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { runWithTenant } from "@/core/tenant/context";
import { getSiteConfig } from "./site";

const kiraci = { id: "1", slug: "t1", primaryDomain: "t1.localhost",
  dbName: "tenant_t1", status: "active", createdAt: new Date() } as any;

describe("getSiteConfig", () => {
  it("kiracının domaininden url üretir", async () => {
    const cfg = await runWithTenant(kiraci, async () => getSiteConfig());
    expect(cfg.domain).toBe("t1.localhost");
    expect(cfg.url).toBe("https://t1.localhost");
  });
});
```

- [ ] **Step 2: Çalıştır, başarısız olsun**

Run: `npm test -- site.test`
Beklenen: FAIL.

- [ ] **Step 3: site config + withRequest**

`src/core/config/site.ts`:
```ts
import { getCurrentTenant } from "@/core/tenant/context";

export function getSiteConfig(): { url: string; domain: string } {
  const t = getCurrentTenant();
  return { domain: t.primaryDomain, url: `https://${t.primaryDomain}` };
}
```

`src/core/tenant/withRequest.ts`:
```ts
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveTenant } from "./resolve";
import { runWithTenant } from "./context";

export async function withTenantRequest<T>(fn: () => Promise<T>): Promise<T> {
  const host = (await headers()).get("x-tenant-host") ?? "";
  const tenant = await resolveTenant(host);
  if (!tenant || tenant.status !== "active") notFound();
  return runWithTenant(tenant, fn);
}
```

- [ ] **Step 4: Çalıştır, geçsin**

Run: `npm test -- site.test`
Beklenen: PASS.

- [ ] **Step 5: Kiracı yüzünü context'e bağla**

`src/app/(site)/page.tsx`:
```tsx
import { withTenantRequest } from "@/core/tenant/withRequest";
import { db } from "@/core/tenant/context";
import { pages } from "@/db/tenant/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const page = await withTenantRequest(async () => {
    return (db as any).query
      ? await (await import("@/core/tenant/context")).getTenantDb().query.pages.findFirst({ where: eq(pages.slug, "home") })
      : null;
  });
  return <main><h1>{page?.title ?? "Boş kiracı"}</h1><p>{page?.body}</p></main>;
}
```

*Not: Task 8'de gerçek seed verisi gelince bu sayfa t1/t2 için farklı başlık
gösterecek. Şimdilik context'in çalıştığını kanıtlar.*

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(tenant): istek context kurulumu (withTenantRequest) + runtime site config"
```

---

## Task 7: Tenant-scoped auth iskeleti

**Files:**
- Create: `src/core/auth/session.ts`, `src/core/auth/session.test.ts`,
  `src/app/panic/login/page.tsx`, `src/app/panic/login/actions.ts`,
  `src/app/panic/page.tsx`

**Interfaces:**
- Consumes: `getTenantDb` (Task 4), `users` (Task 4), `withTenantRequest` (Task 6)
- Produces:
  - `createSession(userId: string, email: string): Promise<void>`
  - `getSession(): Promise<{ userId: string; email: string } | null>`
  - `COOKIE_NAME = "panic_session"`

- [ ] **Step 1: session testi (failing)** — imza/çözme round-trip

`src/core/auth/session.test.ts`:
```ts
import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT, jwtVerify } from "jose";

beforeAll(() => { process.env.JWT_SECRET = "test-secret-en-az-otuz-iki-karakter-uzunlukta!!"; });

describe("jwt round-trip", () => {
  it("imzalanan token çözülür", async () => {
    const key = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ userId: "u1", email: "a@b.co" })
      .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(key);
    const { payload } = await jwtVerify(token, key);
    expect(payload.userId).toBe("u1");
  });
});
```

- [ ] **Step 2: Çalıştır, başarısız/geçer**

Run: `npm test -- session.test`
Beklenen: PASS (jose davranışını sabitler; regresyon koruması).

- [ ] **Step 3: session implementasyonu**

`src/core/auth/session.ts`:
```ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const COOKIE_NAME = "panic_session";

function key(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET eksik/kısa.");
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string, email: string): Promise<void> {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(key());
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 30 * 24 * 60 * 60, path: "/",
  });
}

export async function getSession(): Promise<{ userId: string; email: string } | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { userId: String(payload.userId), email: String(payload.email) };
  } catch { return null; }
}
```

- [ ] **Step 4: Login sayfası + action (kiracı DB'sinde doğrulama)**

`src/app/panic/login/actions.ts`:
```ts
"use server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { withTenantRequest } from "@/core/tenant/withRequest";
import { getTenantDb } from "@/core/tenant/context";
import { users } from "@/db/tenant/schema";
import { createSession } from "@/core/auth/session";
import { redirect } from "next/navigation";

export async function girisYap(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const sifre = String(formData.get("password") ?? "");
  const ok = await withTenantRequest(async () => {
    const u = await getTenantDb().query.users.findFirst({ where: eq(users.email, email) });
    if (!u) return null;
    return (await bcrypt.compare(sifre, u.passwordHash)) ? u : null;
  });
  if (!ok) redirect("/panic/login?hata=1");
  await createSession(ok.id, ok.email);
  redirect("/panic");
}
```

`src/app/panic/login/page.tsx`:
```tsx
import { girisYap } from "./actions";
export default function Login() {
  return (
    <form action={girisYap} style={{ maxWidth: 320, margin: "4rem auto" }}>
      <h1>Giriş</h1>
      <input name="email" type="email" placeholder="E-posta" required />
      <input name="password" type="password" placeholder="Şifre" required />
      <button type="submit">Giriş</button>
    </form>
  );
}
```

`src/app/panic/page.tsx`:
```tsx
import { getSession } from "@/core/auth/session";
import { redirect } from "next/navigation";
export default async function Panel() {
  const s = await getSession();
  if (!s) redirect("/panic/login");
  return <main><h1>Panel</h1><p>{s.email}</p></main>;
}
```

- [ ] **Step 5: Çalıştır, geçsin**

Run: `npm test`
Beklenen: tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(auth): tenant-scoped giris/oturum iskeleti (host-only cookie)"
```

---

## Task 8: Geçici kiracı seed + uçtan uca kanıt

**Files:**
- Create: `scripts/seed-gecici-kiracilar.ts`, `docker-compose.dev.yml`,
  `drizzle.tenant.config.ts`, `.env.example`, `docs/KANIT.md`

**Interfaces:**
- Consumes: `controlDb`, `tenants`, `getTenantPool`, tenant/control şemaları
- Produces: `panic_control` + `tenant_t1` + `tenant_t2` DB'leri, seed veri.

- [ ] **Step 1: Yerel Postgres (dev) ve env**

`docker-compose.dev.yml`:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: panic
      POSTGRES_PASSWORD: panic_dev
      POSTGRES_DB: postgres
    ports: ["5433:5432"]
```

`.env.example` (→ `.env.local` kopyalanır):
```
CONTROL_DATABASE_URL=postgresql://panic:panic_dev@localhost:5433/panic_control
TENANT_DATABASE_BASE_URL=postgresql://panic:panic_dev@localhost:5433/postgres
JWT_SECRET=degistir-en-az-otuz-iki-karakter-uzunlukta-bir-sir!!
```

- [ ] **Step 2: Göçleri üret ve uygula**

```bash
docker compose -f docker-compose.dev.yml up -d
# kontrol + iki kiracı DB'sini oluştur
psql "$CONTROL_DATABASE_URL_ADMIN" -c "CREATE DATABASE panic_control;" || true
# (kiracı DB'leri seed script'inde CREATE edilecek)
npx drizzle-kit push --config drizzle.control.config.ts
```

`drizzle.tenant.config.ts`:
```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/tenant/schema.ts",
  out: "./drizzle/tenant",
  dialect: "postgresql",
  dbCredentials: { url: process.env.TENANT_MIGRATION_URL! },
});
```

- [ ] **Step 3: Seed script'i**

`scripts/seed-gecici-kiracilar.ts`:
```ts
import pg from "pg";
import bcrypt from "bcryptjs";
import { controlDb } from "@/db/control/client";
import { tenants } from "@/db/control/schema";
import { getTenantPool } from "@/core/tenant/pools";
import { pages, users } from "@/db/tenant/schema";

const KIRACILAR = [
  { slug: "t1", primaryDomain: "t1.localhost", dbName: "tenant_t1", baslik: "Kiracı Bir" },
  { slug: "t2", primaryDomain: "t2.localhost", dbName: "tenant_t2", baslik: "Kiracı İki" },
];

async function main() {
  const admin = new pg.Client({ connectionString: process.env.TENANT_DATABASE_BASE_URL });
  await admin.connect();
  for (const k of KIRACILAR) {
    await admin.query(`CREATE DATABASE ${k.dbName}`).catch(() => {});
  }
  await admin.end();

  // Kiracı şemalarını push et (her DB'ye) — Drizzle Kit programatik yerine SQL push
  // Basitlik için: her kiracı DB'sine tabloları oluşturacak drizzle-kit push,
  // TENANT_MIGRATION_URL'i her kiracı için ayarlayıp çağır (Task 5/③'te orkestrasyon).

  for (const k of KIRACILAR) {
    await controlDb.insert(tenants).values({
      slug: k.slug, primaryDomain: k.primaryDomain, dbName: k.dbName, status: "active",
    }).onConflictDoNothing();

    const tdb = getTenantPool(k.dbName);
    await tdb.insert(pages).values({ slug: "home", title: k.baslik, body: `${k.slug} ana sayfa` }).onConflictDoNothing();
    await tdb.insert(users).values({
      email: `admin@${k.primaryDomain}`, passwordHash: await bcrypt.hash("parola123", 10),
    }).onConflictDoNothing();
  }
  console.log("Seed tamam: t1, t2");
}
main().then(() => process.exit(0));
```

- [ ] **Step 4: `/etc/hosts` ekle (yerel domain çözümü)**

```bash
echo "127.0.0.1 t1.localhost t2.localhost" | sudo tee -a /etc/hosts
```

- [ ] **Step 5: Uçtan uca kanıt — spec §7 senaryoları**

`docs/KANIT.md` içine sonuçları yaz. Elle doğrulama:
1. `http://t1.localhost:3000` → "Kiracı Bir"; `t2.localhost:3000` → "Kiracı İki".
2. t1'de `admin@t1.localhost/parola123` ile giriş → panel; aynı cookie t2'de
   çalışmaz (host-only).
3. `nope.localhost:3000` → 404.
4. (Birim) context dışı sorgu → hata (Task 4 testi zaten kanıtlıyor).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(seed): gecici t1/t2 kiracilari + uctan uca kanit (spec §7)"
```

---

## Task 9: Docker image + CI iskeleti

**Files:**
- Create: `docker/Dockerfile`, `.dockerignore`, `.github/workflows/ci.yml`

**Interfaces:**
- Produces: derlenebilir bir production image; CI'da `npm test` + `next build`.

- [ ] **Step 1: Dockerfile (multi-stage)**

`docker/Dockerfile`:
```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

- [ ] **Step 2: CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
```

- [ ] **Step 3: Doğrula — build ve test**

Run: `npm run build && npm test`
Beklenen: ikisi de başarılı.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore(ci): Dockerfile + GitHub Actions (test + build)"
```

- [ ] **Step 5: GitHub'a push (yeni repo)**

```bash
gh repo create panicworkz/panic-cms --private --source=. --remote=origin --push
```

---

## Self-Review Notları

- **Spec kapsamı:** §3.1→T1, §3.2→T2, §3.3→T3, §3.4→T4, §5(middleware)→T5,
  §3.5(config)→T6, §3.6(auth)→T7, §3.7+§7(kanıt)→T8, §6(deploy)→T9,
  §8(ALS riski)→T0. Tümü karşılandı.
- **Açık teknik borç (bilinçli):** Task 8 Step 2/3'te kiracı şemasının HER
  kiracı DB'sine uygulanması ① için elle/tekrarlı; programatik çok-DB göç
  orkestrasyonu ⑤'e ait (spec kapsam dışı). ①'de iki DB olduğu için kabul.
- **Tip tutarlılığı:** `Tenant`, `getTenantDb`, `runWithTenant`,
  `withTenantRequest`, `getSiteConfig`, `createSession`/`getSession`,
  `resolveTenant`/`clearTenantCache`, `getTenantPool` — task'lar arası isimler
  tutarlı.
- **Placeholder taraması:** kritik adımlarda gerçek kod var. Task 0 bir spike
  (kod değil cevap üretir, bilinçli). Task 6 Step 5'teki `page.tsx` Task 8
  seed'iyle gerçek veriyi gösterir.
