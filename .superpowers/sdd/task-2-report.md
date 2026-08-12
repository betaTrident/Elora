# Task 2 Report — Phase 2: Database Schema & Migrations

## What Was Implemented

- Created 8 Drizzle schema table files under `app/server/src/db/schema/`:
  - `shops.ts`, `sessions.ts`, `shopSettings.ts`, `rituals.ts`, `ritualComponents.ts`, `scoreSnapshots.ts`, `alerts.ts`, `activityLogs.ts`
- Created `schema/index.ts` barrel export for all tables
- Created `app/server/src/db/client.ts` — mysql2 connection pool + Drizzle client with schema (uses `mode: 'default'`; no adaptation needed)
- Created `app/server/src/db/migrate.ts` — migration runner with `.catch` for non-zero exit on failure
- Updated `app/server/drizzle.config.ts` to load dotenv before reading `DATABASE_URL`
- Generated initial migration SQL and renamed to `drizzle/0001_initial.sql`
- Updated `drizzle/meta/_journal.json` tag to `0001_initial`
- Renamed snapshot `drizzle/meta/0000_snapshot.json` → `drizzle/meta/0001_snapshot.json`
- Applied migration to Docker MySQL (`elora-mysql-1`, database `ritual_score`)

### ESLint fixes (unused imports from plan snippets)

- `rituals.ts`: removed unused `decimal` import
- `ritualComponents.ts`: removed unused `text` import

Column definitions and table names remain exactly as specified in the plan.

## Commands and Outputs

### `npm run db:generate`

```
8 tables
activity_logs 11 columns 0 indexes 1 fks
alerts 9 columns 0 indexes 2 fks
shops 6 columns 0 indexes 0 fks
sessions 8 columns 0 indexes 0 fks
shop_settings 2 columns 0 indexes 1 fks
rituals 10 columns 0 indexes 1 fks
ritual_components 9 columns 0 indexes 1 fks
score_snapshots 5 columns 0 indexes 1 fks

[✓] Your SQL migration file ➜ drizzle\0000_military_valkyrie.sql
```

Renamed to `drizzle/0001_initial.sql` and journal updated.

### `npm run db:migrate`

```
Migrations applied
```

### `SHOW TABLES` (via `docker exec elora-mysql-1 mysql -u ritual -p*** ritual_score`)

```
Tables_in_ritual_score
__drizzle_migrations
activity_logs
alerts
ritual_components
rituals
score_snapshots
sessions
shop_settings
shops
```

All 8 application tables present (plus `__drizzle_migrations` tracking table).

### `SHOW CREATE TABLE ritual_components`

```
CREATE TABLE `ritual_components` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `ritual_id` varchar(36) NOT NULL,
  `shopify_product_id` varchar(100) NOT NULL,
  `shopify_variant_id` varchar(100) DEFAULT NULL,
  `product_title_cache` varchar(255) DEFAULT NULL,
  `role` enum('cleanse','treat','seal','scent') NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `ritual_components_ritual_id_rituals_id_fk` (`ritual_id`),
  CONSTRAINT `ritual_components_ritual_id_rituals_id_fk` FOREIGN KEY (`ritual_id`) REFERENCES `rituals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

FK on `ritual_id` → `rituals.id` with `ON DELETE CASCADE` confirmed.

### `npx tsc --noEmit`

Exit code: 0 (no errors)

### `npm run lint`

Exit code: 0 (no errors; Node emits a pre-existing `MODULE_TYPELESS_PACKAGE_JSON` warning for `eslint.config.js`)

## Files Changed

| Path | Action |
|------|--------|
| `app/server/src/db/schema/shops.ts` | Created |
| `app/server/src/db/schema/sessions.ts` | Created |
| `app/server/src/db/schema/shopSettings.ts` | Created |
| `app/server/src/db/schema/rituals.ts` | Created |
| `app/server/src/db/schema/ritualComponents.ts` | Created |
| `app/server/src/db/schema/scoreSnapshots.ts` | Created |
| `app/server/src/db/schema/alerts.ts` | Created |
| `app/server/src/db/schema/activityLogs.ts` | Created |
| `app/server/src/db/schema/index.ts` | Created |
| `app/server/src/db/client.ts` | Created |
| `app/server/src/db/migrate.ts` | Created |
| `app/server/drizzle.config.ts` | Modified (dotenv load) |
| `app/server/drizzle/0001_initial.sql` | Created (renamed from `0000_military_valkyrie.sql`) |
| `app/server/drizzle/meta/_journal.json` | Created/updated |
| `app/server/drizzle/meta/0001_snapshot.json` | Created (renamed from `0000_snapshot.json`) |

## Self-Review

- All 8 tables match the plan's column names, types, defaults, and FK relationships
- `shopify_product_id` / `shopify_variant_id` remain `varchar(100)` for Shopify GID caches
- `ritual_components.ritual_id` FK uses `onDelete: 'cascade'` in schema and `ON DELETE CASCADE` in MySQL
- Dotenv loaded in `client.ts` (via import before pool) and `drizzle.config.ts` for generate/migrate
- `drizzle-orm` 0.36 accepts `{ schema, mode: 'default' }` without constructor adaptation
- Migration file named `0001_initial.sql` per done-when gate
- No secrets in schema or SQL; `DATABASE_URL` loaded from gitignored `.env`
- No Phase 3 auth files created
- No git commit made

## Concerns

- **Snapshot index mismatch**: drizzle-kit generated `0000_snapshot.json` but journal `idx` remains `0` with tag `0001_initial`. Migration applied successfully; future `db:generate` runs should be watched to ensure drizzle-kit journal/snapshot numbering stays consistent.
- **Pre-existing ESLint warning**: `package.json` lacks `"type": "module"` causing a Node warning when running ESLint (not introduced by this task).

## Done-When Checklist

- [x] `app/server/drizzle/0001_initial.sql` exists
- [x] All 8 tables exist in MySQL
- [x] FK cascade on `ritual_components.ritual_id` confirmed
- [x] `tsc --noEmit` passes
- [x] `npm run lint` passes
- [x] No commit made
