# Panic CMS — Next.js 15 Publishing & Commerce Platform (Fabelo & AI Chronicles Architecture)

A state-of-the-art, 100% open-source (MIT), ultra-fast publishing platform built with **Panic CMS** on **Next.js 15 (App Router)**, Drizzle ORM and PostgreSQL. Designed to replace legacy CMS platforms (such as Ghost/WordPress) with extreme performance, instant search engine indexation, and native **AEO / GEO (Answer Engine Optimization)**.

---

## ⚡ Key Highlights

- **100% MIT Open Source**: No proprietary paywalls or licensing lock-ins.
- **Fullstack Next.js 15 App Router**: Server Components, on-demand ISR (Incremental Static Regeneration), and Lexical rich text editor.
- **Instant IndexNow Integration**: Automatically pings Bing, Yandex, and IndexNow-compatible search engines whenever a post is published or edited.
- **AEO (Answer Engine Optimization) & LLM Readiness**:
  - `/llms.txt`: Standardized knowledge index for ChatGPT, Claude, Perplexity, and Google AI Overviews.
  - `/api/llm/[slug]`: Ultra-clean Markdown endpoint for AI agents and web scrapers to parse content without HTML bloat.
  - **Schema.org JSON-LD**: Comprehensive `NewsArticle`, `Article`, `Author`, `Person`, and `Organization` structured entity graphs.
- **Dynamic XML Sitemaps**:
  - `/sitemap.xml`: Standard comprehensive sitemap for all posts, pages, and categories.
  - `/sitemap-news.xml`: Google News compliant sitemap.
- **Multi-Instance Docker Architecture (Approach 1)**: Independent, isolated containers for `fabelo.io` (`fabelo.testworkz.com`) and future high-traffic properties like `aicronicles.com`.

---

## 📂 Project Structure

```
├── Dockerfile                  # Multi-stage optimized Docker build
├── docker-compose.yml          # PostgreSQL 16 + Panic CMS container setup
├── media/                      # Uploaded images and media assets
├── migration_data/             # Scraped Ghost export data & original assets
├── scripts/
│   ├── scrape_fabelo.mjs       # Live Ghost scraper engine
│   └── import_fabelo.ts        # Database importer
└── src/
    ├── app/
    │   ├── (frontend)/         # Public site (Home, Articles, Categories, Tags, Authors, Store)
    │   ├── panic/              # Panic CMS admin panel (/panic, login at /panic/login)
    │   ├── api/                # REST API (posts, categories, tags, media, orders, auth, ai)
    │   ├── api/llm/[slug]/     # Clean Markdown API for AI crawlers
    │   ├── llms.txt/           # LLMS.txt AEO index endpoint
    │   ├── sitemap.xml/        # Standard XML Sitemap
    │   └── sitemap-news.xml/   # Google News XML Sitemap
    ├── components/             # Reusable UI components (magazine, studio, dashboard, editor)
    ├── db/                     # Drizzle ORM schema & database client
    └── lib/                    # Helpers (auth, utilities)
```

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
pnpm install

# 2. Start local development server (uses local SQLite by default)
pnpm dev

# 3. Access the platform:
# - Frontend: http://localhost:3000
# - Panic CMS Admin: http://localhost:3000/panic
```

---

## 🐳 Docker Deployment (`fabelo.testworkz.com`)

### 1. Start Docker Containers
```bash
docker compose up -d --build
```

### 2. Import Ghost / Fabelo Content (First Run)
```bash
docker compose exec fabelo-cms pnpm run import:fabelo
```

### 3. Nginx / Reverse Proxy Configuration Sample

```nginx
server {
    server_name fabelo.testworkz.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔁 Replicating for AI Chronicles (`aicronicles.com`)

To launch a dedicated container for **AI Chronicles**:
1. Copy this repository to `aicronicles-cms`.
2. Update `docker-compose.yml` with container name `aicronicles-cms`, port `3002`, and database `aicronicles_db`.
3. Set domain `NEXT_PUBLIC_SITE_DOMAIN=aicronicles.com`.
4. Deploy and start publishing tech & AI news at scale!
