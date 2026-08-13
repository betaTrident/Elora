# Task 2: Phase 2 — Database Schema & Migrations

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` section **Phase 2 — Database Schema & Migrations**.

## Where this fits

Phase 1 scaffold is done at `k:\Elora`. Docker MySQL 8 (`ritual_score`, user `ritual`) is running. `app/server/drizzle.config.ts` and `db:generate` / `db:migrate` scripts already exist. This task adds 8 Drizzle schema files, a client, a migrator, generates SQL, and applies it.

Do **not** start Phase 3 (OAuth, config.ts, auth.ts).

## Goal

8 MySQL tables defined in Drizzle schema, first migration SQL present at `app/server/drizzle/0001_initial.sql`.

## Shopify ID note (schema awareness only — no GraphQL in this task)

`shopify_product_id` / `shopify_variant_id` are `varchar` caches of Admin GraphQL IDs, e.g. `gid://shopify/Product/123` and `gid://shopify/ProductVariant/456`. Keep the plan’s column types; do not change lengths.

## Files to create (table definitions verbatim from the plan)

Create these under `k:\Elora\app\server\src\db\`:

### `schema/shops.ts`

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

### `schema/sessions.ts`

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

### `schema/shopSettings.ts`

```typescript
import { mysqlTable, varchar, int } from 'drizzle-orm/mysql-core'
import { shops } from './shops'

export const shopSettings = mysqlTable('shop_settings', {
  shopId: varchar('shop_id', { length: 36 }).primaryKey().references(() => shops.id),
  defaultThreshold: int('default_threshold').notNull().default(70),
})
```

### `schema/rituals.ts`

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

### `schema/ritualComponents.ts`

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

### `schema/scoreSnapshots.ts`

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

### `schema/alerts.ts`

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

### `schema/activityLogs.ts`

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

### `schema/index.ts`

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

### `client.ts`

```typescript
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const pool = mysql.createPool({ uri: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema, mode: 'default' })
```

If the installed `drizzle-orm` version rejects `{ schema, mode: 'default' }`, adapt the **client constructor only** to the installed API (keep a mysql2 pool + schema). Note the adaptation in the report. Do not change table files for this.

### `migrate.ts`

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

You **must** load dotenv before creating the pool (in `migrate.ts` and/or `client.ts`) so `DATABASE_URL` is set when running `npm run db:migrate` from `app/server`. `app/server/.env` already exists and is gitignored. Adding `import { config } from 'dotenv'; config()` (or `import 'dotenv/config'`) is required implied work. You may add `.catch` on `main()` so failures exit non-zero.

If the migrator fails against a pool, use a single `mysql.createConnection` for migrate only; keep `client.ts` as the app pool.

## Implied config tweaks (allowed)

- `drizzle.config.ts`: load dotenv so `db:generate` sees `DATABASE_URL`. Do not change dialect/schema/out.
- Strip **unused imports only** from plan snippets if ESLint fails (e.g. unused `decimal` / `text` on a table file). Keep every column and table name exact.
- `client.ts`: `process.env.DATABASE_URL!` if `tsc` requires it.

## Commands (must run from `k:\Elora\app\server`)

```bash
npm run db:generate    # creates drizzle SQL
npm run db:migrate     # applies to Docker MySQL
```

**Migration filename:** Done-when requires `drizzle/0001_initial.sql`. drizzle-kit may emit `0000_*.sql`. After generate, rename the SQL file to `0001_initial.sql` and update `drizzle/meta/_journal.json` (and any snapshot filenames the journal references) so migrate still finds it. Keep the generated `meta/` snapshots; they are required.

Then verify:

```sql
SHOW TABLES;
SHOW CREATE TABLE ritual_components;
```

Expected 8 tables: `shops`, `sessions`, `shop_settings`, `rituals`, `ritual_components`, `score_snapshots`, `alerts`, `activity_logs`.

`ritual_components.ritual_id` must FK to `rituals.id` with `ON DELETE CASCADE`.

Also run `npx tsc --noEmit` and `npm run lint` in `app/server`.

Use Docker exec against `elora-mysql-1` (user `ritual`, database `ritual_score`, password `ritual`). Do not print `.env` secrets in the report.

## Done when

- `app/server/drizzle/0001_initial.sql` exists
- All 8 tables exist in MySQL (`SHOW TABLES`)
- FK confirmed: `SHOW CREATE TABLE ritual_components` includes cascade on `ritual_id`

Do **not** git commit (controller owns git). Creating the SQL file is enough for this task; “committed” in the plan means the file is in the working tree and ready to commit.

## Constraints

- Work from `k:\Elora`
- Do not edit `IMPLEMENTATION_PLAN.md`
- Do not commit, force-push, or change git config
- Do not put secrets in schema or SQL
- Do not create Phase 3 auth files
- Windows PowerShell: no `&&`; use `Set-Location` / `;`

## Report

Write the full report to `k:\Elora\.superpowers\sdd\task-2-report.md`.
