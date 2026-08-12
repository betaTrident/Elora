# Elora + RitualScore — Strategic Implementation Plan

> This document is the single source of truth for building the MVP.
> It translates the product plan into concrete files, commands, phases, and acceptance criteria.

---

## Brand lock

| Role | Name | Notes |
|------|------|-------|
| Store / theme | **Elora** | Customer-facing beauty brand |
| Tagline | **Your everyday beauty ritual.** | Hero, meta title, cart empty state |
| Voice | Soft, elegant, distinctly feminine — not literal | No cute slang, no clinical lab-speak |
| Embedded Admin app | **RitualScore** | Merchant SaaS; kit health scoring |

Repo folder: `elora/`. Theme shop name in `settings_schema.json` / locales: Elora. App `shopify.app.toml` name remains RitualScore.

---

## Table of Contents

1. [Monorepo Structure](#1-monorepo-structure)
2. [Tech Stack & Tooling](#2-tech-stack--tooling)
3. [Phase 0 — Prerequisites & Accounts](#phase-0--prerequisites--accounts)
4. [Phase 1 — Project Scaffold & Tooling](#phase-1--project-scaffold--tooling)
5. [Phase 2 — Database Schema & Migrations](#phase-2--database-schema--migrations)
6. [Phase 3 — Shopify OAuth & Embedded Auth](#phase-3--shopify-oauth--embedded-auth)
7. [Phase 4 — Backend API Core](#phase-4--backend-api-core)
8. [Phase 5 — Frontend Shell (Vite + Polaris)](#phase-5--frontend-shell-vite--polaris)
9. [Phase 6 — Dashboard Page & KPIs](#phase-6--dashboard-page--kpis)
10. [Phase 7 — Ritual CRUD (Create / Update / Archive)](#phase-7--ritual-crud-create--update--archive)
11. [Phase 8 — Activity Log](#phase-8--activity-log)
12. [Phase 9 — Health Score Engine + Alerts](#phase-9--health-score-engine--alerts)
13. [Phase 10 — Settings Page](#phase-10--settings-page)
14. [Phase 11 — Shopify Theme (Elora)](#phase-11--shopify-theme-elora)
15. [Phase 12 — Soft Ritual Builder (Interactive Feature)](#phase-12--soft-ritual-builder-interactive-feature)
16. [Phase 13 — Seed Data & Demo Script](#phase-13--seed-data--demo-script)
17. [Phase 14 — Testing](#phase-14--testing)
18. [Phase 15 — Security & Polish](#phase-15--security--polish)
19. [Phase 16 — Documentation & Deliverables](#phase-16--documentation--deliverables)
20. [Verification Checklist](#verification-checklist)
21. [Shopify Cursor Skills Reference](#shopify-cursor-skills-reference)

---

## Phase progress

| Phase | Status |
|-------|--------|
| 0 — Prerequisites & Accounts | **DONE** |
| 1 — Project Scaffold & Tooling | **DONE** |
| 2 — Database Schema & Migrations | **DONE** |
| 3 — Shopify OAuth & Embedded Auth | **DONE** |
| 4 — Backend API Core | **DONE** |
| 5 — Frontend Shell (Vite + Polaris) | NOT STARTED |
| 6 — Dashboard Page & KPIs | NOT STARTED |
| 7 — Ritual CRUD | NOT STARTED |
| 8 — Activity Log | NOT STARTED |
| 9 — Health Score Engine + Alerts | NOT STARTED |
| 10 — Settings Page | NOT STARTED |
| 11 — Shopify Theme (Elora) | NOT STARTED |
| 12 — Soft Ritual Builder | NOT STARTED |
| 13 — Seed Data & Demo Script | NOT STARTED |
| 14 — Testing | NOT STARTED |
| 15 — Security & Polish | NOT STARTED |
| 16 — Documentation & Deliverables | NOT STARTED |

---

## 1. Monorepo Structure

```
elora/
├── theme/                          # Shopify Liquid theme (Elora)
│   ├── assets/
│   │   ├── base.css
│   │   ├── brand.css               # CSS custom properties, tokens
│   │   ├── component-*.css         # per-section CSS modules
│   │   ├── ritual-builder.js       # Soft Ritual Builder vanilla JS
│   │   └── theme.js                # cart ajax, global interactions
│   ├── config/
│   │   ├── settings_data.json
│   │   └── settings_schema.json
│   ├── layout/
│   │   └── theme.liquid
│   ├── locales/
│   │   └── en.default.json
│   ├── sections/
│   │   ├── header.liquid
│   │   ├── footer.liquid
│   │   ├── hero-editorial.liquid
│   │   ├── soft-ritual-builder.liquid   # standout interactive section
│   │   ├── ingredient-honesty.liquid    # custom section 2
│   │   ├── routine-editorial.liquid     # custom section 3
│   │   ├── scent-wardrobe.liquid        # bonus section
│   │   ├── featured-collection.liquid
│   │   └── announcement-bar.liquid
│   ├── snippets/
│   │   ├── product-card.liquid
│   │   ├── score-badge.liquid
│   │   ├── ritual-tag.liquid
│   │   └── icon-*.liquid
│   └── templates/
│       ├── index.json
│       ├── collection.json
│       ├── product.json
│       └── cart.json
│
├── app/                            # Embedded Shopify app
│   ├── server/                     # Node.js Express backend
│   │   ├── src/
│   │   │   ├── index.ts            # entry; mounts routes + middleware
│   │   │   ├── config.ts           # env vars, constants
│   │   │   ├── shopify/
│   │   │   │   ├── auth.ts         # verify JWT, token exchange
│   │   │   │   ├── graphql.ts      # Admin GraphQL client factory
│   │   │   │   └── webhooks.ts     # app/uninstalled handler
│   │   │   ├── middleware/
│   │   │   │   ├── requireAuth.ts  # JWT verify + shop context
│   │   │   │   ├── errorHandler.ts # central error → JSON
│   │   │   │   └── rawBody.ts      # for webhook HMAC
│   │   │   ├── db/
│   │   │   │   ├── client.ts       # drizzle client singleton
│   │   │   │   └── schema/
│   │   │   │       ├── shops.ts
│   │   │   │       ├── sessions.ts
│   │   │   │       ├── shopSettings.ts
│   │   │   │       ├── rituals.ts
│   │   │   │       ├── ritualComponents.ts
│   │   │   │       ├── scoreSnapshots.ts
│   │   │   │       ├── alerts.ts
│   │   │   │       └── activityLogs.ts
│   │   │   ├── services/
│   │   │   │   ├── scoring.ts      # pure calculateHealthScore()
│   │   │   │   ├── rituals.ts      # orchestrate CRUD + score
│   │   │   │   ├── alerts.ts       # upsert + resolve alerts
│   │   │   │   ├── activity.ts     # logActivity() helper
│   │   │   │   └── dashboard.ts    # aggregate KPI query
│   │   │   └── routes/
│   │   │       ├── dashboard.ts
│   │   │       ├── rituals.ts
│   │   │       ├── scores.ts
│   │   │       ├── alerts.ts
│   │   │       ├── activity.ts
│   │   │       ├── settings.ts
│   │   │       └── webhooks.ts
│   │   ├── drizzle/                # generated SQL migrations
│   │   │   └── 0001_initial.sql
│   │   ├── drizzle.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── web/                        # Vite + React frontend
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx             # App Bridge + Polaris + Router
│   │   │   ├── routes.tsx          # route definitions
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard/
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── KpiCards.tsx
│   │   │   │   │   ├── RitualHealthTable.tsx
│   │   │   │   │   └── RecentActivity.tsx
│   │   │   │   ├── Rituals/
│   │   │   │   │   ├── index.tsx   # list page
│   │   │   │   │   └── RitualForm/
│   │   │   │   │       ├── index.tsx
│   │   │   │   │       ├── ComponentList.tsx
│   │   │   │   │       └── ComponentRow.tsx
│   │   │   │   ├── Activity/
│   │   │   │   │   └── index.tsx
│   │   │   │   └── Settings/
│   │   │   │       └── index.tsx
│   │   │   ├── components/
│   │   │   │   ├── ScoreBadge.tsx
│   │   │   │   ├── ScoreBreakdown.tsx
│   │   │   │   ├── AlertBanner.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── ConfirmModal.tsx
│   │   │   │   ├── PageLayout.tsx
│   │   │   │   └── ActivityRow.tsx
│   │   │   ├── services/
│   │   │   │   └── api.ts          # apiClient with idToken()
│   │   │   ├── hooks/
│   │   │   │   ├── useDashboard.ts
│   │   │   │   ├── useRituals.ts
│   │   │   │   └── useActivity.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shopify.app.toml            # Shopify CLI app config
│
├── docker-compose.yml              # MySQL 8 local
├── .env.example
├── .gitignore
├── package.json                    # root workspace
├── README.md
└── APP_DECISIONS.md
```

---

## 2. Tech Stack & Tooling

| Layer | Technology | Version |
|-------|-----------|---------|
| Theme | Shopify Liquid + CSS + vanilla JS | Shopify OS 2.0 |
| App Frontend | Vite + React + TypeScript | Vite 5, React 19 |
| App UI | Shopify Polaris + App Bridge 4 | polaris-react 13, app-bridge CDN |
| App Backend | Node.js + Express + TypeScript | Node 20 |
| ORM | Drizzle ORM | drizzle-orm 0.36+ |
| DB Driver | mysql2 | latest |
| Database | MySQL 8 (Docker local) | 8.0 |
| Validation | Zod | 3.x |
| Auth | jsonwebtoken + @shopify/shopify-api | latest |
| Routing (FE) | React Router v6 | 6.x |
| Dev tunnel | Shopify CLI (built-in) | latest |
| Testing | Vitest + Supertest | latest |
| Linting | ESLint + Prettier | latest |

---

## Phase 0 — Prerequisites & Accounts

> **Status:** DONE

### What to do

1. Create a **Shopify Partner account** at [partners.shopify.com](https://partners.shopify.com)
2. Create a **Development store** from the Partner Dashboard
3. Create a **Partner app** in the Dashboard → note `SHOPIFY_API_KEY` + `SHOPIFY_API_SECRET`
4. Install **Shopify CLI** globally:
   ```bash
   npm install -g @shopify/cli@latest
   ```
5. Verify:
   ```bash
   shopify version
   ```
6. Install **Docker Desktop** for MySQL

### Skills used
- `shopify-onboarding-dev` — partner setup, dev store, CLI

### Done when
- `shopify version` returns a version
- Dev store URL is noted
- App credentials are in `.env.example`

---

**End of Phase 0 — DONE**

---

## Phase 1 — Project Scaffold & Tooling

> **Status:** DONE

### Goal
A working monorepo skeleton with Docker MySQL, npm workspaces, TypeScript, linting, and a health-check endpoint.

### Files to create

**Root**
```
package.json           # workspaces: ["app/server", "app/web"]
.gitignore
.env.example           # SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL, DATABASE_URL
docker-compose.yml
```

**`docker-compose.yml`**
```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ritual_score
      MYSQL_USER: ritual
      MYSQL_PASSWORD: ritual
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
volumes:
  mysql_data:
```

**`app/server/package.json`**
```json
{
  "name": "ritualscore-server",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "test": "vitest"
  },
  "dependencies": {
    "express": "^4",
    "drizzle-orm": "^0.36",
    "mysql2": "^3",
    "zod": "^3",
    "jsonwebtoken": "^9",
    "@shopify/shopify-api": "latest",
    "dotenv": "^16",
    "cors": "^2"
  },
  "devDependencies": {
    "tsx": "^4",
    "typescript": "^5",
    "drizzle-kit": "^0.27",
    "vitest": "^2",
    "supertest": "^7",
    "@types/express": "*",
    "@types/jsonwebtoken": "*",
    "@types/cors": "*",
    "eslint": "^9"
  }
}
```

**`app/web/package.json`**
```json
{
  "name": "ritualscore-web",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "^6",
    "@shopify/polaris": "^13",
    "@shopify/app-bridge-react": "latest"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "typescript": "^5"
  }
}
```

**`app/server/src/index.ts`**
```typescript
import express from 'express'
import { config } from 'dotenv'
config()

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(process.env.PORT ?? 3000, () => {
  console.log('Server ready')
})
```

**`app/server/drizzle.config.ts`**
```typescript
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: './src/db/schema/*.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

**`app/web/vite.config.ts`**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, host: 'localhost' },
  build: { outDir: '../server/public' },
})
```

**`app/shopify.app.toml`**
```toml
name = "RitualScore"
client_id = "<SHOPIFY_API_KEY>"
application_url = "https://<tunnel-url>"
embedded = true

[access_scopes]
scopes = "read_products,read_inventory"

[webhooks]
api_version = "2025-01"

  [[webhooks.subscriptions]]
  topics = ["app/uninstalled"]
  uri = "/webhooks/app/uninstalled"
```

### Commands
```bash
npm install                    # root
docker compose up -d           # start MySQL
cd app/server && npm run dev   # server health check
curl http://localhost:3000/health
```

### Done when
- `GET /health` returns `{ ok: true }`
- MySQL container is healthy
- TypeScript compiles with no errors
- ESLint passes

---

**End of Phase 1 — DONE**

---

## Phase 2 — Database Schema & Migrations

> **Status:** DONE

### Goal
8 MySQL tables defined in Drizzle schema, first migration SQL committed.

### Files to create

**`app/server/src/db/schema/shops.ts`**
```typescript
import { mysqlTable, varchar, datetime, text } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const shops = mysqlTable('shops', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  shopDomain: varchar('shop_domain', { length: 255 }).notNull().unique(),
  accessToken: text('access_token').notNull(),
  scope: varchar('scope', { length: 500 }),
  installedAt: datetime('installed_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  uninstalledAt: datetime('uninstalled_at'),
})
```

**`app/server/src/db/schema/sessions.ts`**
```typescript
import { mysqlTable, varchar, boolean, datetime, text } from 'drizzle-orm/mysql-core'

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  shop: varchar('shop', { length: 255 }).notNull(),
  state: varchar('state', { length: 255 }),
  isOnline: boolean('is_online').notNull().default(false),
  scope: varchar('scope', { length: 500 }),
  expires: datetime('expires'),
  accessToken: text('access_token'),
  userId: varchar('user_id', { length: 255 }),
})
```

**`app/server/src/db/schema/shopSettings.ts`**
```typescript
import { mysqlTable, varchar, int } from 'drizzle-orm/mysql-core'
import { shops } from './shops'

export const shopSettings = mysqlTable('shop_settings', {
  shopId: varchar('shop_id', { length: 36 }).primaryKey().references(() => shops.id),
  defaultThreshold: int('default_threshold').notNull().default(70),
})
```

**`app/server/src/db/schema/rituals.ts`**
```typescript
import { mysqlTable, varchar, text, mysqlEnum, int, decimal, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { shops } from './shops'

export const rituals = mysqlTable('rituals', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  shopId: varchar('shop_id', { length: 36 }).notNull().references(() => shops.id),
  title: varchar('title', { length: 120 }).notNull(),
  description: text('description'),
  status: mysqlEnum('status', ['active', 'archived']).notNull().default('active'),
  scoreThreshold: int('score_threshold').notNull().default(70),
  lastScore: int('last_score'),
  lastScoredAt: datetime('last_scored_at'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
})
```

**`app/server/src/db/schema/ritualComponents.ts`**
```typescript
import { mysqlTable, varchar, mysqlEnum, int, decimal, text } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { rituals } from './rituals'

export const ritualComponents = mysqlTable('ritual_components', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  ritualId: varchar('ritual_id', { length: 36 }).notNull().references(() => rituals.id, { onDelete: 'cascade' }),
  shopifyProductId: varchar('shopify_product_id', { length: 100 }).notNull(),
  shopifyVariantId: varchar('shopify_variant_id', { length: 100 }),
  productTitleCache: varchar('product_title_cache', { length: 255 }),
  role: mysqlEnum('role', ['cleanse', 'treat', 'seal', 'scent']).notNull(),
  quantity: int('quantity').notNull().default(1),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  sortOrder: int('sort_order').notNull().default(0),
})
```

**`app/server/src/db/schema/scoreSnapshots.ts`**
```typescript
import { mysqlTable, varchar, int, json, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { rituals } from './rituals'

export const scoreSnapshots = mysqlTable('score_snapshots', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  ritualId: varchar('ritual_id', { length: 36 }).notNull().references(() => rituals.id),
  score: int('score').notNull(),
  breakdownJson: json('breakdown_json').notNull(),
  computedAt: datetime('computed_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})
```

**`app/server/src/db/schema/alerts.ts`**
```typescript
import { mysqlTable, varchar, text, mysqlEnum, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { shops } from './shops'
import { rituals } from './rituals'

export const alerts = mysqlTable('alerts', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  shopId: varchar('shop_id', { length: 36 }).notNull().references(() => shops.id),
  ritualId: varchar('ritual_id', { length: 36 }).notNull().references(() => rituals.id),
  type: mysqlEnum('type', ['low_score', 'component_unavailable']).notNull(),
  severity: mysqlEnum('severity', ['warning', 'critical']).notNull().default('warning'),
  message: text('message').notNull(),
  status: mysqlEnum('status', ['open', 'resolved']).notNull().default('open'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: datetime('resolved_at'),
})
```

**`app/server/src/db/schema/activityLogs.ts`**
```typescript
import { mysqlTable, varchar, mysqlEnum, text, json, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { shops } from './shops'

export const activityLogs = mysqlTable('activity_logs', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  shopId: varchar('shop_id', { length: 36 }).notNull().references(() => shops.id),
  actorType: mysqlEnum('actor_type', ['merchant', 'system']).notNull().default('merchant'),
  actorId: varchar('actor_id', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 36 }),
  summary: text('summary').notNull(),
  beforeJson: json('before_json'),
  afterJson: json('after_json'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})
```

**`app/server/src/db/client.ts`**
```typescript
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const pool = mysql.createPool({ uri: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema, mode: 'default' })
```

**`app/server/src/db/migrate.ts`** — run at startup
```typescript
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { db } from './client'
async function main() {
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migrations applied')
  process.exit(0)
}
main()
```

### Re-export all schema
**`app/server/src/db/schema/index.ts`**
```typescript
export * from './shops'
export * from './sessions'
export * from './shopSettings'
export * from './rituals'
export * from './ritualComponents'
export * from './scoreSnapshots'
export * from './alerts'
export * from './activityLogs'
```

### Commands
```bash
cd app/server
npm run db:generate    # creates drizzle/0001_initial.sql
npm run db:migrate     # applies to Docker MySQL
```

### Skills used
- `shopify-admin` (schema awareness for Shopify product IDs)
- Drizzle docs at `orm.drizzle.team`

### Done when
- `drizzle/0001_initial.sql` exists and is committed
- All 8 tables exist in MySQL: `SHOW TABLES;`
- FK constraints confirmed: `SHOW CREATE TABLE ritual_components;`

---

**End of Phase 2 — DONE**

---

## Phase 3 — Shopify OAuth & Embedded Auth

> **Status:** DONE

### Goal
App installs on dev store; every API request is guarded by a verified Shopify session token.

### How it works
1. Shopify managed install reads `shopify.app.toml` scopes — no manual `/auth/begin` redirect for standard case
2. App Bridge (CDN script) mints a session JWT for every admin page load
3. Frontend attaches JWT as `Authorization: Bearer <token>` on every API call
4. Backend verifies JWT → token exchange → offline access token → stored in `shops.access_token`

### Files to create / modify

**`app/server/src/config.ts`**
```typescript
export const config = {
  shopifyApiKey: process.env.SHOPIFY_API_KEY!,
  shopifyApiSecret: process.env.SHOPIFY_API_SECRET!,
  shopifyAppUrl: process.env.SHOPIFY_APP_URL!,
  databaseUrl: process.env.DATABASE_URL!,
  port: Number(process.env.PORT ?? 3000),
}
```

**`app/server/src/shopify/auth.ts`**
```typescript
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { db } from '../db/client'
import { shops } from '../db/schema'
import { eq } from 'drizzle-orm'

export interface ShopContext {
  shopDomain: string
  shopId: string
  userId: string | null
}

export async function verifySessionToken(token: string): Promise<ShopContext> {
  const payload = jwt.verify(token, config.shopifyApiSecret, {
    algorithms: ['HS256'],
    audience: config.shopifyApiKey,
  }) as Record<string, unknown>

  const dest = payload.dest as string            // e.g. "https://mystore.myshopify.com"
  const shopDomain = new URL(dest).hostname       // "mystore.myshopify.com"

  const [shop] = await db
    .select({ id: shops.id })
    .from(shops)
    .where(eq(shops.shopDomain, shopDomain))
    .limit(1)

  if (!shop) {
    // First load after install — exchange token and store
    const { shopId } = await exchangeAndUpsertShop(shopDomain, token)
    return { shopDomain, shopId, userId: (payload.sub as string) ?? null }
  }

  return { shopDomain, shopId: shop.id, userId: (payload.sub as string) ?? null }
}

async function exchangeAndUpsertShop(shopDomain: string, sessionToken: string) {
  const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.shopifyApiKey,
      client_secret: config.shopifyApiSecret,
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: sessionToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
      requested_token_type: 'urn:shopify:params:oauth:token-type:offline-access-token',
    }),
  })
  if (!res.ok) throw new Error('Token exchange failed')
  const { access_token } = await res.json() as { access_token: string }

  await db
    .insert(shops)
    .values({ shopDomain, accessToken: access_token, scope: 'read_products,read_inventory' })
    .onDuplicateKeyUpdate({ set: { accessToken: access_token, uninstalledAt: null } })

  const [shop] = await db.select({ id: shops.id }).from(shops).where(eq(shops.shopDomain, shopDomain)).limit(1)
  // seed default settings
  await db.insert(shopSettings).values({ shopId: shop.id }).ignore()
  return { shopId: shop.id }
}
```

**`app/server/src/middleware/requireAuth.ts`**
```typescript
import { Request, Response, NextFunction } from 'express'
import { verifySessionToken, ShopContext } from '../shopify/auth'

declare global {
  namespace Express {
    interface Request { shop: ShopContext }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? ''
  const token = header.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    req.shop = await verifySessionToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid session token' })
  }
}
```

**`app/web/src/services/api.ts`**
```typescript
declare const shopify: { idToken: () => Promise<string> }

const BASE = import.meta.env.VITE_API_BASE ?? ''

async function getToken(): Promise<string> {
  return shopify.idToken()
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw Object.assign(new Error(error.error ?? 'Request failed'), { status: res.status })
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
}
```

**`app/web/src/App.tsx`**
```tsx
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from '@shopify/polaris'
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react'
import enTranslations from '@shopify/polaris/locales/en.json'
import { AppRoutes } from './routes'

export default function App() {
  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY

  return (
    <BrowserRouter>
      <AppBridgeProvider config={{ apiKey, host: new URLSearchParams(window.location.search).get('host') ?? '' }}>
        <AppProvider i18n={enTranslations}>
          <AppRoutes />
        </AppProvider>
      </AppBridgeProvider>
    </BrowserRouter>
  )
}
```

**`app/web/index.html`** — load App Bridge CDN script
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script
      src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
      data-api-key="%VITE_SHOPIFY_API_KEY%"
    ></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Commands
```bash
cd app
shopify app dev              # starts CLI + tunnel + opens in dev store
```

### Skills used
- `shopify-polaris-app-home`
- `shopify-use-shopify-cli`

### Done when
- App opens inside Shopify Admin without blank iframe
- `GET /api/ping` (auth-guarded) returns `{ shop: "..." }` with valid token
- Invalid/missing token returns `401`
- Shop row exists in `shops` table after install

---

**End of Phase 3 — DONE**

---

## Phase 4 — Backend API Core

> **Status:** DONE

### Goal
All route modules wired, error handling central, Zod validation on all inputs.

### Files to create / modify

**`app/server/src/middleware/errorHandler.ts`**
```typescript
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', issues: err.flatten() })
  }
  if (err instanceof Error && 'status' in err) {
    return res.status((err as { status: number }).status).json({ error: err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
```

**`app/server/src/index.ts`** — register all routes
```typescript
import express from 'express'
import cors from 'cors'
import { config as dotenv } from 'dotenv'
dotenv()

import { requireAuth } from './middleware/requireAuth'
import { errorHandler } from './middleware/errorHandler'
import dashboardRouter from './routes/dashboard'
import ritualsRouter from './routes/rituals'
import scoresRouter from './routes/scores'
import alertsRouter from './routes/alerts'
import activityRouter from './routes/activity'
import settingsRouter from './routes/settings'
import webhooksRouter from './routes/webhooks'

const app = express()
app.use(cors())
app.use('/webhooks', express.raw({ type: '*/*' }), webhooksRouter)
app.use(express.json())
app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api', requireAuth)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/rituals', ritualsRouter)
app.use('/api/scores', scoresRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/activity', activityRouter)
app.use('/api/settings', settingsRouter)
app.use(errorHandler)

app.listen(process.env.PORT ?? 3000)
```

**`app/server/src/routes/rituals.ts`** (pattern — all routes follow this)
```typescript
import { Router } from 'express'
import { z } from 'zod'
import * as ritualsService from '../services/rituals'

const router = Router()

const componentSchema = z.object({
  shopifyProductId: z.string().min(1),
  shopifyVariantId: z.string().optional(),
  role: z.enum(['cleanse', 'treat', 'seal', 'scent']),
  quantity: z.number().int().min(1).default(1),
  unitCost: z.number().nonnegative().optional(),
  sortOrder: z.number().int().default(0),
})

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  scoreThreshold: z.number().int().min(0).max(100).optional(),
  components: z.array(componentSchema).min(1),
})

router.get('/', async (req, res, next) => {
  try {
    const rituals = await ritualsService.listRituals(req.shop.shopId, req.query.status as string)
    res.json(rituals)
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    const result = await ritualsService.createRitual(req.shop, body)
    res.status(201).json(result)
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const ritual = await ritualsService.getRitual(req.shop.shopId, req.params.id)
    res.json(ritual)
  } catch (e) { next(e) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    const result = await ritualsService.updateRitual(req.shop, req.params.id, body)
    res.json(result)
  } catch (e) { next(e) }
})

router.post('/:id/archive', async (req, res, next) => {
  try {
    await ritualsService.archiveRitual(req.shop, req.params.id)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.post('/:id/recalculate', async (req, res, next) => {
  try {
    const result = await ritualsService.recalculateRitual(req.shop, req.params.id)
    res.json(result)
  } catch (e) { next(e) }
})

export default router
```

### Done when
- All 13 API routes return correct status codes with mock data
- Zod validation rejects malformed bodies with `400`
- `requireAuth` blocks all `/api/*` without token
- `errorHandler` catches all unhandled errors cleanly

---

**End of Phase 4 — DONE**

---

## Phase 5 — Frontend Shell (Vite + Polaris)

> **Status:** NOT STARTED

### Goal
Polaris-native admin shell with Nav, TitleBar, and all 5 route placeholders showing inside Admin.

### Files to create / modify

**`app/web/src/routes.tsx`**
```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { NavMenu } from '@shopify/app-bridge-react'
import DashboardPage from './pages/Dashboard'
import RitualsPage from './pages/Rituals'
import RitualFormPage from './pages/Rituals/RitualForm'
import ActivityPage from './pages/Activity'
import SettingsPage from './pages/Settings'

export function AppRoutes() {
  return (
    <>
      <NavMenu>
        <a href="/" rel="home">Dashboard</a>
        <a href="/rituals">Routines</a>
        <a href="/activity">Activity</a>
        <a href="/settings">Settings</a>
      </NavMenu>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/rituals" element={<RitualsPage />} />
        <Route path="/rituals/new" element={<RitualFormPage />} />
        <Route path="/rituals/:id/edit" element={<RitualFormPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}
```

**`app/web/src/components/PageLayout.tsx`**
```tsx
import { Frame, Page } from '@shopify/polaris'

interface Props {
  title: string
  primaryAction?: React.ReactNode
  children: React.ReactNode
}

export function PageLayout({ title, primaryAction, children }: Props) {
  return (
    <Frame>
      <Page title={title} primaryAction={primaryAction}>
        {children}
      </Page>
    </Frame>
  )
}
```

**`app/web/src/components/ScoreBadge.tsx`**
```tsx
import { Badge } from '@shopify/polaris'

interface Props { score: number | null; threshold: number }

export function ScoreBadge({ score, threshold }: Props) {
  if (score === null) return <Badge>Not scored</Badge>
  if (score >= threshold && score >= 80) return <Badge tone="success">Healthy · {score}</Badge>
  if (score >= threshold) return <Badge tone="attention">At risk · {score}</Badge>
  return <Badge tone="critical">Broken · {score}</Badge>
}
```

**`app/web/src/components/ScoreBreakdown.tsx`**
```tsx
import { BlockStack, Box, ProgressBar, Text } from '@shopify/polaris'

interface BreakdownItem { label: string; value: number; max: number; description: string }
interface Props { breakdown: BreakdownItem[] }

export function ScoreBreakdown({ breakdown }: Props) {
  return (
    <BlockStack gap="300">
      {breakdown.map(({ label, value, max, description }) => (
        <Box key={label}>
          <Text as="p" variant="bodyMd" fontWeight="semibold">{label} — {value}/{max}</Text>
          <ProgressBar progress={(value / max) * 100} size="small" />
          <Text as="p" variant="bodySm" tone="subdued">{description}</Text>
        </Box>
      ))}
    </BlockStack>
  )
}
```

**`app/web/src/components/EmptyState.tsx`**
```tsx
import { EmptyState as PolarisEmpty } from '@shopify/polaris'

interface Props {
  heading: string
  description: string
  action?: { content: string; url?: string; onAction?: () => void }
  image?: string
}

export function EmptyState({ heading, description, action, image }: Props) {
  return (
    <PolarisEmpty
      heading={heading}
      image={image ?? 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'}
      action={action}
    >
      <p>{description}</p>
    </PolarisEmpty>
  )
}
```

### Done when
- App loads with Polaris Frame + NavMenu in Admin
- Navigating to `/rituals`, `/activity`, `/settings` renders placeholder pages without errors
- No browser console CORS or CSP errors

---

**End of Phase 5 — NOT STARTED**

---

## Phase 6 — Dashboard Page & KPIs

> **Status:** NOT STARTED

### Goal
Dashboard loads KPI cards + ranked ritual table + recent activity in ≤ 30 seconds.

### Backend: `app/server/src/services/dashboard.ts`
```typescript
import { db } from '../db/client'
import { rituals, alerts, activityLogs } from '../db/schema'
import { eq, and, count, desc } from 'drizzle-orm'

export async function getDashboardData(shopId: string) {
  const allRituals = await db.select().from(rituals).where(
    and(eq(rituals.shopId, shopId), eq(rituals.status, 'active'))
  )
  const openAlerts = await db.select({ count: count() }).from(alerts).where(
    and(eq(alerts.shopId, shopId), eq(alerts.status, 'open'))
  )
  const recentActivity = await db.select().from(activityLogs)
    .where(eq(activityLogs.shopId, shopId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(5)

  const healthy = allRituals.filter(r => r.lastScore !== null && r.lastScore >= r.scoreThreshold).length
  const broken = allRituals.filter(r => r.lastScore !== null && r.lastScore < r.scoreThreshold).length
  const unscored = allRituals.filter(r => r.lastScore === null).length
  const worst5 = allRituals
    .filter(r => r.lastScore !== null)
    .sort((a, b) => (a.lastScore ?? 0) - (b.lastScore ?? 0))
    .slice(0, 5)

  return {
    counts: { total: allRituals.length, healthy, broken, unscored, openAlerts: openAlerts[0]?.count ?? 0 },
    worst5,
    recentActivity,
  }
}
```

### Frontend: `app/web/src/pages/Dashboard/index.tsx`
```tsx
import { useEffect, useState } from 'react'
import { BlockStack, Grid, Card, Text, Spinner, Banner, Button } from '@shopify/polaris'
import { useNavigate } from 'react-router-dom'
import { TitleBar } from '@shopify/app-bridge-react'
import { PageLayout } from '../../components/PageLayout'
import { EmptyState } from '../../components/EmptyState'
import { KpiCards } from './KpiCards'
import { RitualHealthTable } from './RitualHealthTable'
import { RecentActivity } from './RecentActivity'
import { api } from '../../services/api'
import type { DashboardData } from '../../types'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<DashboardData>('/api/dashboard')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLayout title="Dashboard"><Spinner /></PageLayout>

  if (error) return (
    <PageLayout title="Dashboard">
      <Banner tone="critical">{error}<Button onClick={() => window.location.reload()}>Retry</Button></Banner>
    </PageLayout>
  )

  if (!data || data.counts.total === 0) return (
    <PageLayout title="Dashboard">
      <TitleBar title="RitualScore" primaryAction={{ label: 'Create routine', url: '/rituals/new' }} />
      <EmptyState
        heading="Start tracking your beauty routines"
        description="Create your first routine kit and see its health score instantly."
        action={{ content: 'Create routine', onAction: () => navigate('/rituals/new') }}
      />
    </PageLayout>
  )

  return (
    <PageLayout title="Dashboard">
      <TitleBar title="RitualScore" primaryAction={{ label: 'Create routine', url: '/rituals/new' }} />
      <BlockStack gap="500">
        <KpiCards counts={data.counts} />
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, lg: 8 }}>
            <RitualHealthTable rituals={data.worst5} />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, lg: 4 }}>
            <RecentActivity entries={data.recentActivity} />
          </Grid.Cell>
        </Grid>
      </BlockStack>
    </PageLayout>
  )
}
```

**`app/web/src/pages/Dashboard/KpiCards.tsx`**
```tsx
import { BlockStack, Card, Text, Badge } from '@shopify/polaris'
import type { DashboardCounts } from '../../types'

export function KpiCards({ counts }: { counts: DashboardCounts }) {
  return (
    <BlockStack gap="300">
      <Text as="h2" variant="headingMd">Store routine health</Text>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <KpiCard label="Total routines" value={counts.total} />
        <KpiCard label="Healthy" value={counts.healthy} tone="success" />
        <KpiCard label="At risk / Broken" value={counts.broken} tone="critical" />
        <KpiCard label="Open alerts" value={counts.openAlerts} tone="caution" />
      </div>
    </BlockStack>
  )
}

function KpiCard({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'critical' | 'caution' }) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="p" variant="bodySm" tone="subdued">{label}</Text>
        <Text as="p" variant="headingLg" tone={tone}>{value}</Text>
      </BlockStack>
    </Card>
  )
}
```

### Done when
- Dashboard shows 4 KPI cards, ranked ritual table, recent activity
- Empty state renders correctly with CTA when no rituals
- Loading skeleton shows during fetch
- Error banner + retry button on network failure

---

**End of Phase 6 — NOT STARTED**

---

## Phase 7 — Ritual CRUD (Create / Update / Archive)

> **Status:** NOT STARTED

### Goal
Merchant can create, edit, archive a ritual with components via Resource Picker; score triggers on save.

### Key component: `app/web/src/pages/Rituals/RitualForm/ComponentList.tsx`
```tsx
import { BlockStack, Button, Card, Text } from '@shopify/polaris'
import { ResourcePicker } from '@shopify/app-bridge-react'
import { useState } from 'react'
import { ComponentRow } from './ComponentRow'
import type { Component } from '../../../types'

interface Props {
  components: Component[]
  onChange: (components: Component[]) => void
}

export function ComponentList({ components, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)

  function handlePickerSelect(resources: { selection: Array<{ id: string; title: string; variants: Array<{ id: string }> }> }) {
    const newComponents: Component[] = resources.selection.map(p => ({
      shopifyProductId: p.id,
      shopifyVariantId: p.variants[0]?.id ?? null,
      productTitleCache: p.title,
      role: 'cleanse' as const,
      quantity: 1,
      sortOrder: components.length,
    }))
    onChange([...components, ...newComponents])
    setPickerOpen(false)
  }

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h3" variant="headingMd">Routine products</Text>
        {components.map((c, i) => (
          <ComponentRow
            key={i}
            component={c}
            onChange={updated => {
              const next = [...components]
              next[i] = updated
              onChange(next)
            }}
            onRemove={() => onChange(components.filter((_, idx) => idx !== i))}
          />
        ))}
        <Button onClick={() => setPickerOpen(true)}>Add product</Button>
        {pickerOpen && (
          <ResourcePicker
            resourceType="Product"
            open
            onCancel={() => setPickerOpen(false)}
            onSelection={handlePickerSelect}
          />
        )}
      </BlockStack>
    </Card>
  )
}
```

**`app/web/src/pages/Rituals/RitualForm/ComponentRow.tsx`**
```tsx
import { InlineStack, Select, TextField, Button, Text } from '@shopify/polaris'
import type { Component } from '../../../types'

const ROLE_OPTIONS = [
  { label: 'Cleanse', value: 'cleanse' },
  { label: 'Treat', value: 'treat' },
  { label: 'Seal / Moisturize', value: 'seal' },
  { label: 'Scent / Mist', value: 'scent' },
]

interface Props {
  component: Component
  onChange: (c: Component) => void
  onRemove: () => void
}

export function ComponentRow({ component, onChange, onRemove }: Props) {
  return (
    <InlineStack gap="300" align="start" blockAlign="center" wrap={false}>
      <div style={{ flex: 2 }}>
        <Text as="p" variant="bodyMd">{component.productTitleCache ?? component.shopifyProductId}</Text>
      </div>
      <div style={{ flex: 1 }}>
        <Select
          label=""
          labelHidden
          options={ROLE_OPTIONS}
          value={component.role}
          onChange={role => onChange({ ...component, role: role as Component['role'] })}
        />
      </div>
      <div style={{ width: 60 }}>
        <TextField
          label=""
          labelHidden
          type="number"
          value={String(component.quantity)}
          min={1}
          onChange={v => onChange({ ...component, quantity: Number(v) })}
          autoComplete="off"
        />
      </div>
      <Button tone="critical" variant="plain" onClick={onRemove}>Remove</Button>
    </InlineStack>
  )
}
```

### Service: `app/server/src/services/rituals.ts`
```typescript
import { db } from '../db/client'
import { rituals, ritualComponents, shopSettings } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import type { ShopContext } from '../shopify/auth'
import { calculateHealthScore } from './scoring'
import { upsertAlerts } from './alerts'
import { logActivity } from './activity'
import { fetchInventory } from '../shopify/graphql'

export async function createRitual(shop: ShopContext, input: CreateRitualInput) {
  // Get default threshold
  const [settings] = await db.select().from(shopSettings).where(eq(shopSettings.shopId, shop.shopId)).limit(1)
  const threshold = input.scoreThreshold ?? settings?.defaultThreshold ?? 70

  return db.transaction(async (tx) => {
    // 1. Insert ritual
    const id = crypto.randomUUID()
    await tx.insert(rituals).values({ id, shopId: shop.shopId, title: input.title, description: input.description, scoreThreshold: threshold })

    // 2. Insert components
    const componentRows = input.components.map((c, i) => ({ ...c, id: crypto.randomUUID(), ritualId: id, sortOrder: c.sortOrder ?? i }))
    await tx.insert(ritualComponents).values(componentRows)

    // 3. Fetch inventory + score
    const inventory = await fetchInventory(shop, input.components.map(c => c.shopifyProductId))
    const { score, breakdown } = calculateHealthScore(componentRows, inventory)

    // 4. Update ritual with score
    await tx.update(rituals).set({ lastScore: score, lastScoredAt: new Date() }).where(eq(rituals.id, id))

    // 5. Log
    await logActivity(tx, { shopId: shop.shopId, actorType: 'merchant', actorId: shop.userId ?? undefined, action: 'ritual.created', entityType: 'ritual', entityId: id, summary: `Created ritual "${input.title}"`, afterJson: { score, threshold } })

    return { id, score, breakdown, threshold }
  })
}
```

### Done when
- Create form validates and submits; ritual appears in list
- Zod 400 on missing title or empty components
- Edit form pre-fills all fields
- Archive changes status; archived rituals filtered from dashboard
- Score appears immediately after save

---

**End of Phase 7 — NOT STARTED**

---

## Phase 8 — Activity Log

> **Status:** NOT STARTED

### Goal
Every mutation is logged; Activity page shows filterable history.

### Service: `app/server/src/services/activity.ts`
```typescript
import { activityLogs } from '../db/schema'

interface ActivityInput {
  shopId: string
  actorType: 'merchant' | 'system'
  actorId?: string
  action: string
  entityType: string
  entityId?: string
  summary: string
  beforeJson?: unknown
  afterJson?: unknown
}

export async function logActivity(tx: typeof import('../db/client').db, input: ActivityInput) {
  await tx.insert(activityLogs).values({
    id: crypto.randomUUID(),
    ...input,
    beforeJson: input.beforeJson ?? null,
    afterJson: input.afterJson ?? null,
  })
}
```

### Frontend: `app/web/src/pages/Activity/index.tsx`
```tsx
import { useEffect, useState } from 'react'
import { IndexTable, Text, Badge, Collapsible, Card, Filters, Select, Spinner } from '@shopify/polaris'
import { TitleBar } from '@shopify/app-bridge-react'
import { PageLayout } from '../../components/PageLayout'
import { api } from '../../services/api'
import type { ActivityLog } from '../../types'

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    api.get<ActivityLog[]>('/api/activity').then(setLogs).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLayout title="Activity"><Spinner /></PageLayout>

  return (
    <PageLayout title="Activity">
      <TitleBar title="Activity log" />
      <Card>
        <IndexTable
          resourceName={{ singular: 'event', plural: 'events' }}
          itemCount={logs.length}
          headings={[{ title: 'Action' }, { title: 'Entity' }, { title: 'Who' }, { title: 'When' }]}
          selectable={false}
        >
          {logs.map(log => (
            <>
              <IndexTable.Row id={log.id} key={log.id} position={0} onClick={() => setExpandedId(log.id === expandedId ? null : log.id)}>
                <IndexTable.Cell><Text as="span">{log.summary}</Text></IndexTable.Cell>
                <IndexTable.Cell><Badge>{log.entityType}</Badge></IndexTable.Cell>
                <IndexTable.Cell><Text as="span" tone="subdued">{log.actorType}</Text></IndexTable.Cell>
                <IndexTable.Cell><Text as="span" tone="subdued">{new Date(log.createdAt).toLocaleString()}</Text></IndexTable.Cell>
              </IndexTable.Row>
              {expandedId === log.id && log.afterJson && (
                <IndexTable.Row id={`${log.id}-detail`} key={`${log.id}-detail`} position={1}>
                  <IndexTable.Cell colSpan={4}>
                    <pre style={{ fontSize: 12, background: '#f4f6f8', padding: 8, borderRadius: 4 }}>
                      {JSON.stringify(log.afterJson, null, 2)}
                    </pre>
                  </IndexTable.Cell>
                </IndexTable.Row>
              )}
            </>
          ))}
        </IndexTable>
      </Card>
    </PageLayout>
  )
}
```

### Done when
- Every create/update/archive/recalculate appears in Activity
- Row expands to show `after_json` diff
- Activity page loads in < 500ms for ≤ 100 entries

---

**End of Phase 8 — NOT STARTED**

---

## Phase 9 — Health Score Engine + Alerts

> **Status:** NOT STARTED

### Goal
Pure scoring function with full unit test coverage; alerts open/resolve automatically.

### Service: `app/server/src/services/scoring.ts`
```typescript
export interface ComponentInput {
  role: 'cleanse' | 'treat' | 'seal' | 'scent'
  shopifyProductId: string
  shopifyVariantId?: string | null
  unitCost?: number | null
}

export interface InventoryInfo {
  productId: string
  variantId?: string
  available: number
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  price: string
}

export interface ScoreBreakdown {
  availability: number
  availabilityMax: number
  completeness: number
  completenessMax: number
  margin: number
  marginMax: number
  total: number
  factors: Array<{ productId: string; available: boolean; reason: string }>
}

const REQUIRED_ROLES = ['cleanse', 'treat', 'seal'] as const

export function calculateHealthScore(
  components: ComponentInput[],
  inventory: InventoryInfo[],
): { score: number; breakdown: ScoreBreakdown } {
  if (components.length === 0) {
    return { score: 0, breakdown: { availability: 0, availabilityMax: 50, completeness: 0, completenessMax: 20, margin: 0, marginMax: 30, total: 0, factors: [] } }
  }

  const inventoryMap = new Map(inventory.map(i => [i.productId, i]))
  const factors: ScoreBreakdown['factors'] = []

  // Availability: 0–50
  let availableCount = 0
  components.forEach(c => {
    const inv = inventoryMap.get(c.shopifyProductId)
    const available = !!inv && inv.available > 0 && inv.status === 'ACTIVE'
    availableCount += available ? 1 : 0
    factors.push({
      productId: c.shopifyProductId,
      available,
      reason: !inv ? 'Product not found' : inv.status !== 'ACTIVE' ? `Product is ${inv.status}` : inv.available === 0 ? 'Out of stock' : 'In stock',
    })
  })
  const availability = Math.round((availableCount / components.length) * 50)

  // Completeness: 0–20
  const presentRoles = new Set(components.map(c => c.role))
  const requiredPresent = REQUIRED_ROLES.filter(r => presentRoles.has(r)).length
  const completeness = Math.round((requiredPresent / REQUIRED_ROLES.length) * 20)

  // Margin proxy: 0–30
  const withCosts = components.filter(c => c.unitCost != null && c.unitCost > 0)
  let margin = 15 // default mid if no costs provided
  if (withCosts.length > 0) {
    const avgMargin = withCosts.reduce((sum, c) => {
      const inv = inventoryMap.get(c.shopifyProductId)
      const price = inv ? parseFloat(inv.price) : 0
      const cost = c.unitCost!
      return sum + (price > 0 ? Math.max(0, Math.min(1, (price - cost) / price)) : 0)
    }, 0) / withCosts.length
    margin = Math.round(avgMargin * 30)
  }

  const total = availability + completeness + margin

  return {
    score: total,
    breakdown: { availability, availabilityMax: 50, completeness, completenessMax: 20, margin, marginMax: 30, total, factors },
  }
}
```

### Alert upsert: `app/server/src/services/alerts.ts`
```typescript
import { db } from '../db/client'
import { alerts, rituals } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import type { ScoreBreakdown } from './scoring'
import { logActivity } from './activity'

export async function upsertAlerts(shopId: string, ritualId: string, score: number, threshold: number, breakdown: ScoreBreakdown) {
  const issues: Array<{ type: 'low_score' | 'component_unavailable'; message: string; severity: 'warning' | 'critical' }> = []

  if (score < threshold) {
    issues.push({ type: 'low_score', message: `Routine score ${score} is below threshold ${threshold}`, severity: score < threshold * 0.5 ? 'critical' : 'warning' })
  }

  const unavailable = breakdown.factors.filter(f => !f.available)
  unavailable.forEach(f => {
    issues.push({ type: 'component_unavailable', message: `Product ${f.productId}: ${f.reason}`, severity: 'critical' })
  })

  // Resolve old alerts that no longer apply
  const existing = await db.select().from(alerts).where(and(eq(alerts.ritualId, ritualId), eq(alerts.status, 'open')))

  for (const existing_alert of existing) {
    const stillNeeded = issues.some(i => i.type === existing_alert.type)
    if (!stillNeeded) {
      await db.update(alerts).set({ status: 'resolved', resolvedAt: new Date() }).where(eq(alerts.id, existing_alert.id))
      await logActivity(db, { shopId, actorType: 'system', action: 'alert.resolved', entityType: 'alert', entityId: existing_alert.id, summary: `Alert resolved: ${existing_alert.message}` })
    }
  }

  // Open new alerts
  for (const issue of issues) {
    const alreadyOpen = existing.find(a => a.type === issue.type && a.status === 'open')
    if (!alreadyOpen) {
      const id = crypto.randomUUID()
      await db.insert(alerts).values({ id, shopId, ritualId, ...issue })
      await logActivity(db, { shopId, actorType: 'system', action: 'alert.opened', entityType: 'alert', entityId: id, summary: issue.message })
    }
  }
}
```

### Test: `app/server/src/services/scoring.test.ts`
```typescript
import { describe, it, expect } from 'vitest'
import { calculateHealthScore } from './scoring'

const makeInv = (productId: string, available = 10, status: 'ACTIVE' | 'DRAFT' = 'ACTIVE', price = '25.00') =>
  ({ productId, available, status, price })

const components = [
  { role: 'cleanse' as const, shopifyProductId: 'p1' },
  { role: 'treat' as const, shopifyProductId: 'p2' },
  { role: 'seal' as const, shopifyProductId: 'p3' },
]

describe('calculateHealthScore', () => {
  it('returns 100 max for fully stocked kit with costs', () => {
    const inv = [makeInv('p1'), makeInv('p2'), makeInv('p3')]
    const compsWithCost = components.map(c => ({ ...c, unitCost: 8 }))
    const { score } = calculateHealthScore(compsWithCost, inv)
    expect(score).toBeGreaterThanOrEqual(80)
  })

  it('returns 0 for empty components', () => {
    const { score } = calculateHealthScore([], [])
    expect(score).toBe(0)
  })

  it('penalises OOS product', () => {
    const inv = [makeInv('p1', 0), makeInv('p2'), makeInv('p3')]
    const { score, breakdown } = calculateHealthScore(components, inv)
    expect(breakdown.availability).toBeLessThan(50)
    expect(breakdown.factors.find(f => f.productId === 'p1')?.available).toBe(false)
  })

  it('penalises missing required role', () => {
    const partial = [{ role: 'cleanse' as const, shopifyProductId: 'p1' }]
    const inv = [makeInv('p1')]
    const { breakdown } = calculateHealthScore(partial, inv)
    expect(breakdown.completeness).toBeLessThan(20)
  })

  it('awards mid margin when no costs set', () => {
    const inv = [makeInv('p1'), makeInv('p2'), makeInv('p3')]
    const { breakdown } = calculateHealthScore(components, inv)
    expect(breakdown.margin).toBe(15)
  })
})
```

### Done when
- All 5 score tests pass: `npm test`
- Recalculate endpoint triggers alert when `p2` set to OOS in Admin
- Alert resolves when component is re-stocked and recalculated
- Score breakdown renders in UI as 3 labelled factor bars

---

**End of Phase 9 — NOT STARTED**

---

## Phase 10 — Settings Page

> **Status:** NOT STARTED

### Goal
Merchant can set default threshold; "Recalculate all" rescores every active ritual.

### Files
**`app/server/src/routes/settings.ts`**
```typescript
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client'
import { shopSettings } from '../db/schema'
import { eq } from 'drizzle-orm'
import { logActivity } from '../services/activity'

const router = Router()
const schema = z.object({ defaultThreshold: z.number().int().min(0).max(100) })

router.get('/', async (req, res, next) => {
  try {
    const [s] = await db.select().from(shopSettings).where(eq(shopSettings.shopId, req.shop.shopId)).limit(1)
    res.json(s ?? { defaultThreshold: 70 })
  } catch (e) { next(e) }
})

router.put('/', async (req, res, next) => {
  try {
    const body = schema.parse(req.body)
    await db.update(shopSettings).set(body).where(eq(shopSettings.shopId, req.shop.shopId))
    await logActivity(db, { shopId: req.shop.shopId, actorType: 'merchant', action: 'settings.updated', entityType: 'shop_settings', summary: `Default threshold set to ${body.defaultThreshold}`, afterJson: body })
    res.json(body)
  } catch (e) { next(e) }
})

export default router
```

**`app/web/src/pages/Settings/index.tsx`**
```tsx
import { useState, useEffect } from 'react'
import { Card, RangeSlider, Button, BlockStack, Text, Toast } from '@shopify/polaris'
import { TitleBar } from '@shopify/app-bridge-react'
import { PageLayout } from '../../components/PageLayout'
import { api } from '../../services/api'

export default function SettingsPage() {
  const [threshold, setThreshold] = useState(70)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get<{ defaultThreshold: number }>('/api/settings').then(s => setThreshold(s.defaultThreshold))
  }, [])

  async function save() {
    await api.put('/api/settings', { defaultThreshold: threshold })
    setSaved(true)
  }

  return (
    <PageLayout title="Settings">
      <TitleBar title="Settings" />
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Default health threshold</Text>
          <Text as="p" tone="subdued">Routines scoring below this will trigger an alert.</Text>
          <RangeSlider label={`Threshold: ${threshold}`} value={threshold} min={0} max={100} step={5} onChange={v => setThreshold(v as number)} output />
          <Button variant="primary" onClick={save}>Save settings</Button>
        </BlockStack>
      </Card>
      {saved && <Toast content="Settings saved" onDismiss={() => setSaved(false)} />}
    </PageLayout>
  )
}
```

### Done when
- Threshold saves and persists across page reload
- New rituals created after threshold change use new default
- Activity log shows `settings.updated`

---

**End of Phase 10 — NOT STARTED**

---

## Phase 11 — Shopify Theme (Elora)

> **Status:** NOT STARTED

### Goal
4 Liquid templates, Elora brand tokens and copy, editorial hero, 3+ custom sections, functional cart.

**Copy lock (use everywhere customer-facing):**
- Wordmark: Elora
- Tagline: Your everyday beauty ritual.
- Voice: Soft, elegant, distinctly feminine — never literal, never cute, never clinical.

### Files to create

**`theme/locales/en.default.json`**
```json
{
  "general": {
    "brand": "Elora",
    "tagline": "Your everyday beauty ritual."
  },
  "header": {
    "home": "Home"
  },
  "cart": {
    "empty": "Your bag is empty — start your everyday ritual.",
    "ritual_property": "Elora Ritual"
  }
}
```

**`theme/snippets/brand-lockup.liquid`** — header / footer wordmark
```liquid
<a href="{{ routes.root_url }}" class="brand-lockup" aria-label="Elora — Your everyday beauty ritual.">
  <span class="brand-lockup__name">Elora</span>
  <span class="brand-lockup__tagline">Your everyday beauty ritual.</span>
</a>
```

**`theme/assets/brand.css`**
```css
:root {
  --color-porcelain: #F6EFE8;
  --color-sand: #E8CFC4;
  --color-ink: #2A2420;
  --color-sage: #6F7F72;
  --color-surface: #FFFFFF;
  --color-muted: #8A7E78;

  --font-display: 'DM Serif Display', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, sans-serif;

  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 32px;
  --spacing-xl: 64px;

  --radius-sm: 4px;
  --radius-md: 12px;

  --transition-base: 200ms ease;
}

body {
  font-family: var(--font-body);
  color: var(--color-ink);
  background-color: var(--color-porcelain);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 { font-family: var(--font-display); font-weight: 400; }
```

**`theme/layout/theme.liquid`** — Load brand fonts + App Bridge (for optional integration)
```liquid
<!DOCTYPE html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ page_title }} | {{ shop.name }}</title>
    {{ content_for_header }}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
    {{ 'brand.css' | asset_url | stylesheet_tag }}
    {{ 'base.css' | asset_url | stylesheet_tag }}
  </head>
  <body>
    {% sections 'header-group' %}
    <main id="MainContent" role="main">
      {{ content_for_layout }}
    </main>
    {% sections 'footer-group' %}
    {{ 'theme.js' | asset_url | script_tag }}
  </body>
</html>
```

**`theme/sections/hero-editorial.liquid`**
```liquid
<section class="hero" style="background-color: {{ section.settings.bg_color }}">
  <div class="hero__inner">
    <div class="hero__text">
      <p class="hero__eyebrow">{{ section.settings.eyebrow }}</p>
      <h1 class="hero__heading">{{ section.settings.heading }}</h1>
      <p class="hero__body">{{ section.settings.body }}</p>
      {% if section.settings.cta_label != blank %}
        <a href="{{ section.settings.cta_url }}" class="btn btn--primary">{{ section.settings.cta_label }}</a>
      {% endif %}
    </div>
    {% if section.settings.image %}
      <div class="hero__image">
        {{ section.settings.image | image_url: width: 900 | image_tag: loading: 'eager', class: 'hero__img' }}
      </div>
    {% endif %}
  </div>
</section>

{% schema %}
{
  "name": "Hero editorial",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Elora" },
    { "type": "richtext", "id": "heading", "label": "Heading", "default": "<p>Your everyday beauty ritual.</p>" },
    { "type": "richtext", "id": "body", "label": "Body" },
    { "type": "text", "id": "cta_label", "label": "CTA label" },
    { "type": "url", "id": "cta_url", "label": "CTA URL" },
    { "type": "image_picker", "id": "image", "label": "Image" },
    { "type": "color", "id": "bg_color", "label": "Background", "default": "#F6EFE8" }
  ],
  "presets": [{ "name": "Hero editorial" }]
}
{% endschema %}
```

**`theme/sections/ingredient-honesty.liquid`** — Custom Section 2
```liquid
<section class="ingredient-honesty">
  <div class="container">
    <h2>{{ section.settings.heading }}</h2>
    <div class="ingredient-honesty__grid">
      {% for block in section.blocks %}
        <div class="ingredient-honesty__item ingredient-honesty__item--{{ block.settings.type }}" {{ block.shopify_attributes }}>
          <span class="ingredient-honesty__label">{{ block.settings.type == 'in' ? '✓ In' : '✕ Never' }}</span>
          <p>{{ block.settings.ingredient }}</p>
          {% if block.settings.note != blank %}<small>{{ block.settings.note }}</small>{% endif %}
        </div>
      {% endfor %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Ingredient honesty",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "What's in. What's never in." }
  ],
  "blocks": [
    {
      "type": "ingredient",
      "name": "Ingredient",
      "settings": [
        { "type": "select", "id": "type", "label": "Type", "options": [{ "value": "in", "label": "In" }, { "value": "never", "label": "Never" }] },
        { "type": "text", "id": "ingredient", "label": "Ingredient name" },
        { "type": "text", "id": "note", "label": "Note" }
      ]
    }
  ],
  "presets": [{ "name": "Ingredient honesty" }]
}
{% endschema %}
```

**`theme/sections/routine-editorial.liquid`** — Custom Section 3
```liquid
<section class="routine-editorial">
  {% for block in section.blocks %}
    <article class="routine-editorial__step" {{ block.shopify_attributes }}>
      <div class="routine-editorial__text">
        <span class="routine-editorial__moment">{{ block.settings.moment }}</span>
        <h3>{{ block.settings.heading }}</h3>
        <p>{{ block.settings.body }}</p>
        {% if block.settings.product != blank %}
          {% assign product = all_products[block.settings.product] %}
          {% render 'product-card', product: product %}
        {% endif %}
      </div>
      {% if block.settings.image %}
        <div class="routine-editorial__image">
          {{ block.settings.image | image_url: width: 600 | image_tag: class: 'routine-editorial__img' }}
        </div>
      {% endif %}
    </article>
  {% endfor %}
</section>

{% schema %}
{
  "name": "Routine editorial",
  "blocks": [
    {
      "type": "step",
      "name": "Step",
      "settings": [
        { "type": "text", "id": "moment", "label": "Moment", "placeholder": "AM · Face" },
        { "type": "text", "id": "heading", "label": "Heading" },
        { "type": "richtext", "id": "body", "label": "Body" },
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "product", "id": "product", "label": "Featured product" }
      ]
    }
  ],
  "presets": [{ "name": "Routine editorial" }]
}
{% endschema %}
```

**`theme/templates/index.json`**
```json
{
  "sections": {
    "hero": { "type": "hero-editorial", "settings": { "eyebrow": "Elora", "heading": "<p>Your everyday beauty ritual.</p>" } },
    "builder": { "type": "soft-ritual-builder" },
    "editorial": { "type": "routine-editorial" },
    "ingredients": { "type": "ingredient-honesty" }
  },
  "order": ["hero", "builder", "editorial", "ingredients"]
}
```

### Commands
```bash
cd theme
shopify theme dev --store <your-dev-store>.myshopify.com
```

### Done when
- Home, Collection, Product, Cart all load without Liquid errors
- Header wordmark reads **Elora**; hero shows tagline **Your everyday beauty ritual.**
- Brand tokens apply (porcelain background, display font hero)
- 3+ custom sections appear in theme editor as draggable sections
- Cart accepts line items with Elora Ritual properties

---

**End of Phase 11 — NOT STARTED**

---

## Phase 12 — Soft Ritual Builder (Interactive Feature)

> **Status:** NOT STARTED

### Goal
Step-by-step quiz (concern → moment → scent mood) recommends 3-product routine and adds to cart via Ajax with ritual line-item properties.

### Files to create

**`theme/sections/soft-ritual-builder.liquid`**
```liquid
{%- assign all_builder_products = collections[section.settings.collection].products -%}
<section class="ritual-builder" id="ritual-builder" data-section-id="{{ section.id }}">
  <div class="ritual-builder__header">
    <h2>{{ section.settings.heading | default: 'Build your soft ritual' }}</h2>
    <p>{{ section.settings.subheading }}</p>
  </div>

  <div class="ritual-builder__steps" data-steps>
    <!-- Step 1: Concern -->
    <div class="ritual-builder__step" data-step="1">
      <p class="ritual-builder__step-label">What does your skin need?</p>
      <div class="ritual-builder__choices">
        <button class="ritual-builder__choice" data-filter="concern:glow">Glow</button>
        <button class="ritual-builder__choice" data-filter="concern:hydrate">Hydrate</button>
        <button class="ritual-builder__choice" data-filter="concern:calm">Calm</button>
        <button class="ritual-builder__choice" data-filter="concern:barrier">Barrier repair</button>
      </div>
    </div>

    <!-- Step 2: Moment -->
    <div class="ritual-builder__step" data-step="2" hidden>
      <p class="ritual-builder__step-label">When is your ritual?</p>
      <div class="ritual-builder__choices">
        <button class="ritual-builder__choice" data-filter="moment:am">Morning</button>
        <button class="ritual-builder__choice" data-filter="moment:pm">Evening</button>
        <button class="ritual-builder__choice" data-filter="moment:body">After shower</button>
      </div>
    </div>

    <!-- Step 3: Scent -->
    <div class="ritual-builder__step" data-step="3" hidden>
      <p class="ritual-builder__step-label">Choose a scent mood</p>
      <div class="ritual-builder__choices">
        <button class="ritual-builder__choice" data-filter="scent:clean">Clean</button>
        <button class="ritual-builder__choice" data-filter="scent:warm">Warm</button>
        <button class="ritual-builder__choice" data-filter="scent:floral">Floral</button>
        <button class="ritual-builder__choice" data-filter="scent:unscented">Unscented</button>
      </div>
    </div>

    <!-- Result -->
    <div class="ritual-builder__result" data-result hidden>
      <p class="ritual-builder__step-label">Your soft ritual</p>
      <div class="ritual-builder__result-products" data-result-products>
        <!-- JS injects product cards here -->
      </div>
      <button class="btn btn--primary ritual-builder__add" data-add-ritual>
        Add ritual to bag
      </button>
      <button class="ritual-builder__restart" data-restart>Start over</button>
    </div>
  </div>

  <!-- Product data for JS -->
  <script type="application/json" id="builder-products">
    [
      {% for product in all_builder_products %}
        {
          "id": {{ product.id | json }},
          "title": {{ product.title | json }},
          "handle": {{ product.handle | json }},
          "image": {{ product.featured_image | image_url: width: 300 | json }},
          "price": {{ product.price | money | json }},
          "variantId": {{ product.first_available_variant.id | json }},
          "tags": {{ product.tags | json }}
        }{% unless forloop.last %},{% endunless %}
      {% endfor %}
    ]
  </script>
</section>

{% schema %}
{
  "name": "Soft Ritual Builder",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Build your soft ritual" },
    { "type": "text", "id": "subheading", "label": "Subheading" },
    { "type": "collection", "id": "collection", "label": "Builder product collection" }
  ],
  "presets": [{ "name": "Soft Ritual Builder" }]
}
{% endschema %}
```

**`theme/assets/ritual-builder.js`**
```javascript
(function () {
  const section = document.getElementById('ritual-builder')
  if (!section) return

  const productsData = JSON.parse(document.getElementById('builder-products').textContent)
  let selectedFilters = []
  let currentStep = 1
  let matchedProducts = []

  section.addEventListener('click', e => {
    const choice = e.target.closest('[data-filter]')
    const addBtn = e.target.closest('[data-add-ritual]')
    const restart = e.target.closest('[data-restart]')

    if (choice) {
      selectedFilters.push(choice.dataset.filter)
      choice.classList.add('is-selected')
      nextStep()
    }
    if (addBtn) addRitualToCart()
    if (restart) resetBuilder()
  })

  function nextStep() {
    currentStep++
    const steps = section.querySelectorAll('[data-step]')
    steps.forEach(s => { s.hidden = parseInt(s.dataset.step) !== currentStep })

    if (currentStep > steps.length) {
      showResult()
    }
  }

  function filterProducts() {
    return productsData.filter(p => {
      return selectedFilters.every(filter => {
        const [key, val] = filter.split(':')
        return p.tags.includes(`${key}:${val}`)
      })
    }).slice(0, 3)
  }

  function showResult() {
    matchedProducts = filterProducts()
    if (matchedProducts.length === 0) {
      matchedProducts = productsData.slice(0, 3) // fallback: first 3
    }
    const resultEl = section.querySelector('[data-result]')
    const productsEl = section.querySelector('[data-result-products]')
    productsEl.innerHTML = matchedProducts.map(p => `
      <div class="ritual-builder__product-card">
        <img src="${p.image}" alt="${p.title}" loading="lazy" />
        <p>${p.title}</p>
        <small>${p.price}</small>
      </div>
    `).join('')
    section.querySelectorAll('[data-step]').forEach(s => s.hidden = true)
    resultEl.hidden = false
  }

  async function addRitualToCart() {
    const ritualName = selectedFilters.map(f => f.split(':')[1]).join(' · ')
    const items = matchedProducts.map(p => ({
      id: p.variantId,
      quantity: 1,
      properties: { 'Elora Ritual': ritualName }
    }))

    const btn = section.querySelector('[data-add-ritual]')
    btn.disabled = true
    btn.textContent = 'Adding...'

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })
      if (!res.ok) throw new Error()
      btn.textContent = 'Added!'
      setTimeout(() => { window.location.href = '/cart' }, 800)
    } catch {
      btn.textContent = 'Error — try again'
      btn.disabled = false
    }
  }

  function resetBuilder() {
    selectedFilters = []
    currentStep = 1
    matchedProducts = []
    section.querySelectorAll('[data-step]').forEach(s => { s.hidden = parseInt(s.dataset.step) !== 1 })
    section.querySelector('[data-result]').hidden = true
    section.querySelectorAll('.is-selected').forEach(el => el.classList.remove('is-selected'))
  }
})()
```

### Done when
- Builder renders 3 steps with selections
- Result shows 3 relevant products (or fallback 3)
- "Add ritual to bag" adds all 3 with `properties: { Elora Ritual: "..." }`
- Cart page displays ritual property label on line items
- Works on mobile (stacked layout)

---

**End of Phase 12 — NOT STARTED**

---

## Phase 13 — Seed Data & Demo Script

> **Status:** NOT STARTED

### Goal
A seed script populates demo beauty products + 3 sample rituals so the app demos without manual setup.

### File: `app/server/src/db/seed.ts`
```typescript
// Creates 3 sample rituals in the first installed shop's DB for demo purposes
import { db } from './client'
import { shops, rituals, ritualComponents, shopSettings } from './schema'

async function seed() {
  const [shop] = await db.select().from(shops).limit(1)
  if (!shop) { console.log('Install app first'); return }

  // Ensure settings
  await db.insert(shopSettings).values({ shopId: shop.id }).ignore()

  // Sample rituals (use Shopify Admin product IDs from dev store)
  const SAMPLE_RITUALS = [
    {
      title: 'AM Glow Ritual',
      description: 'Morning face routine for radiant skin',
      scoreThreshold: 75,
      components: [
        { shopifyProductId: 'REPLACE_WITH_CLEANSER_ID', role: 'cleanse', productTitleCache: 'Gentle Foaming Cleanser' },
        { shopifyProductId: 'REPLACE_WITH_SERUM_ID', role: 'treat', productTitleCache: 'Vitamin C Glow Serum' },
        { shopifyProductId: 'REPLACE_WITH_MOISTURIZER_ID', role: 'seal', productTitleCache: 'Hydra Barrier Moisturizer SPF' },
      ],
    },
    {
      title: 'Body Ritual',
      description: 'After-shower body ritual with matching mist',
      scoreThreshold: 70,
      components: [
        { shopifyProductId: 'REPLACE_WITH_BODYWASH_ID', role: 'cleanse', productTitleCache: 'Creamy Body Wash' },
        { shopifyProductId: 'REPLACE_WITH_LOTION_ID', role: 'seal', productTitleCache: 'Shea Body Lotion' },
        { shopifyProductId: 'REPLACE_WITH_MIST_ID', role: 'scent', productTitleCache: 'Warm Vanilla Body Mist' },
      ],
    },
    {
      title: 'Night Barrier',
      description: 'PM skin recovery and barrier support',
      scoreThreshold: 70,
      components: [
        { shopifyProductId: 'REPLACE_WITH_CLEANSER_ID', role: 'cleanse', productTitleCache: 'Gentle Foaming Cleanser' },
        { shopifyProductId: 'REPLACE_WITH_RETINOL_ID', role: 'treat', productTitleCache: 'Retinal Night Serum' },
        { shopifyProductId: 'REPLACE_WITH_NIGHTCREAM_ID', role: 'seal', productTitleCache: 'Barrier Recovery Night Cream' },
      ],
    },
  ]

  for (const r of SAMPLE_RITUALS) {
    const id = crypto.randomUUID()
    await db.insert(rituals).values({ id, shopId: shop.id, title: r.title, description: r.description, scoreThreshold: r.scoreThreshold })
    await db.insert(ritualComponents).values(
      r.components.map((c, i) => ({ ...c, id: crypto.randomUUID(), ritualId: id, sortOrder: i, quantity: 1 }))
    )
  }
  console.log('Seeded 3 rituals')
}

seed()
```

### `README.md` demo section
```markdown
## 5-minute demo script

1. Open app in Admin — see Dashboard with 3 sample rituals
2. Note "AM Glow Ritual" score and breakdown
3. In Shopify Admin → Products, set the Vitamin C Serum inventory to 0
4. Back in RitualScore → AM Glow Ritual → click Recalculate
5. Score drops — Critical alert appears: "Out of stock"
6. Open Activity log — see score.recalculated + alert.opened events
7. On storefront Home, click "Build your soft ritual" → complete steps → Add ritual to bag
8. Cart shows all 3 items with "Elora Ritual: glow · am · clean" property
```

---

**End of Phase 13 — NOT STARTED**

---

## Phase 14 — Testing

> **Status:** NOT STARTED

### Unit tests

| File | Tests |
|------|-------|
| `services/scoring.test.ts` | Full stock, OOS, missing role, null cost, threshold edge cases |
| `services/alerts.test.ts` | Opens alert, resolves when fixed, no duplicate alerts |
| `services/rituals.test.ts` | Validates inputs, transaction rollback on error |

### Integration tests (Supertest)

| Route | Scenarios |
|-------|-----------|
| `GET /api/dashboard` | Auth required, returns counts |
| `POST /api/rituals` | 201 with valid body, 400 on missing component |
| `PUT /api/rituals/:id` | 404 for wrong shop (isolation) |
| `POST /api/rituals/:id/recalculate` | Returns score object |
| `GET /api/activity` | Returns recent logs |

### Manual QA checklist

- [ ] App installs fresh on dev store
- [ ] Re-install (already installed) doesn't error
- [ ] App Bridge session token 401 on tampered token
- [ ] Ritual create → score → alert visible on dashboard
- [ ] Set product OOS in Admin → recalculate → alert opens
- [ ] Resolve alert → goes to resolved state in activity
- [ ] Theme: Ritual Builder completes 3 steps and adds to cart
- [ ] Cart shows ritual property on line items
- [ ] README setup from scratch takes < 30 minutes

### Commands
```bash
cd app/server && npm test          # unit + integration
cd app/server && npm run test:coverage
```

---

**End of Phase 14 — NOT STARTED**

---

## Phase 15 — Security & Polish

> **Status:** NOT STARTED

### Security checklist

| Item | Implementation |
|------|---------------|
| JWT verify every request | `requireAuth` middleware — algorithm HS256, audience check |
| Shop isolation | Every DB query uses `WHERE shop_id = req.shop.shopId` |
| No Admin API from browser | Shopify GraphQL called only from server |
| Zod validation | All POST/PUT bodies validated before DB write |
| Drizzle parameterized queries | No raw string SQL |
| HMAC webhook verify | `rawBody` middleware + `@shopify/shopify-api` verify |
| CSP frame-ancestors | Response header in Express: `frame-ancestors https://admin.shopify.com` |
| Secrets in env | `.env` in `.gitignore`; `.env.example` with placeholders |
| Uninstall webhook | Soft-delete shop row; tokens nulled |

### Polish checklist

| Item | Where |
|------|-------|
| Toast on every mutation | After create/update/archive/resolve |
| Skeleton loaders | Dashboard, Rituals list, Activity |
| Error Banner + retry | Every data-fetching page |
| Empty state with CTA | Dashboard (no rituals), Activity (no logs) |
| Contextual Save Bar | Ritual form when dirty |
| Confirm modal | Archive ritual action |
| Score factor bars | ScoreBreakdown component on Ritual detail |
| Responsive theme | CSS media queries; mobile ritual builder stacked |
| Console-clean build | No warnings in `npm run build` |

---

**End of Phase 15 — NOT STARTED**

---

## Phase 16 — Documentation & Deliverables

> **Status:** NOT STARTED

### `README.md` structure
```markdown
# Elora + RitualScore

## Prerequisites
- Node.js 20+
- Docker Desktop
- Shopify Partner account + dev store
- Shopify CLI

## Setup (< 30 minutes)

### 1. Clone & install
npm install

### 2. Configure environment
cp .env.example .env
# Fill: SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL, DATABASE_URL

### 3. Start database
docker compose up -d

### 4. Run migrations
cd app/server && npm run db:migrate

### 5. Start app
cd app && shopify app dev

### 6. Start frontend (separate terminal)
cd app/web && npm run dev

### 7. Push theme
cd theme && shopify theme dev --store <your-store>

### 8. Seed demo data (optional)
cd app/server && npx tsx src/db/seed.ts

## Architecture
[See APP_DECISIONS.md]

## Tech Stack
[See plan section 2]
```

### `APP_DECISIONS.md` sections required

1. **Store Concept** — Elora ("Your everyday beauty ritual."), target customer, why beauty routines, branding direction (soft, elegant, feminine without being literal)
2. **App Idea** — RitualScore problem, merchant workflow, why this beats CRUD
3. **Architecture/Schema** — Express + Vite + Drizzle/MySQL choice, 8-table schema rationale, scoring formula
4. **Tradeoffs** — Vite vs Remix, rules vs ML, recalculate vs webhooks, local state vs Redux
5. **What I'd Improve With More Time** — inventory webhooks, margin cost sync, theme metafield integration, multi-store testing, App Store billing, AI-assisted routine recommendations

---

**End of Phase 16 — NOT STARTED**

---

## Verification Checklist

Use this before submission.

### Theme
- [ ] Home page loads with hero, builder, editorial, ingredient sections
- [ ] Header wordmark is **Elora**; hero tagline is **Your everyday beauty ritual.**
- [ ] Collection page renders products with filters
- [ ] Product page has "Add to ritual" CTA
- [ ] Cart shows line-item **Elora Ritual** property
- [ ] Soft Ritual Builder: all 3 steps work, adds to cart
- [ ] Mobile responsive (375px+)
- [ ] No Liquid render errors in Shopify preview

### App
- [ ] Installs on dev store via Shopify managed install
- [ ] App Bridge loads in iframe without blank screen
- [ ] Dashboard shows KPI cards, ranked table, activity
- [ ] Create ritual: form validates, score calculated, activity logged
- [ ] Edit ritual: pre-fills, recalculates on save
- [ ] Archive: confirms, removes from active list
- [ ] Recalculate: updates score + opens alert if below threshold
- [ ] Activity: all actions listed in reverse-chron order
- [ ] Settings: threshold saves, persists across reload
- [ ] Alerts: open on broken kit, resolve on fix
- [ ] Uninstall webhook: shop soft-deleted

### Database
- [ ] 8 tables present in MySQL
- [ ] `npm run db:migrate` runs clean on fresh DB
- [ ] Migration SQL committed to `drizzle/`
- [ ] FK cascade: deleting ritual removes components

### Code quality
- [ ] TypeScript compiles with 0 errors (`tsc --noEmit`)
- [ ] ESLint passes
- [ ] All unit tests pass
- [ ] No `console.log` left in production paths
- [ ] No hardcoded secrets

### Documentation
- [ ] `README.md` enables fresh setup in < 30 min
- [ ] `APP_DECISIONS.md` covers all 5 sections
- [ ] `APP_DECISIONS.md` includes Health Score formula

---

## Shopify Cursor Skills Reference

| Phase | Skill to invoke |
|-------|----------------|
| 0 — Partner setup | `shopify-onboarding-dev` |
| 3 — Auth / OAuth | `shopify-admin`, `shopify-use-shopify-cli` |
| 5–9 — Embedded app UI | `shopify-polaris-app-home` |
| 11–12 — Theme | `shopify-liquid` |
| 11–12 — Theme sections | `shopify-polaris-admin-extensions` (for schema patterns) |
| Admin GraphQL calls | `shopify-admin` |
| CLI commands | `shopify-use-shopify-cli` |
| Pre-submission review | `shopify-app-store-review` |

---

> **Next step:** Phase 0–4 are **DONE**. Continue at **Phase 5 — Frontend Shell (Vite + Polaris)**.
> Update the Phase progress table and each phase **Status** / **End of Phase** line as work completes.
