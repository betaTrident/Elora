# Task 16A — Phase 16 README

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 16 `README.md` structure (lines 2468–2509).

Work from `k:\Elora`. **Do not commit.** Do not edit `IMPLEMENTATION_PLAN.md`. Do not create or edit `APP_DECISIONS.md` (Task 16B owns it). Do not change app/theme source.

## Where this fits

Phases 0–15 are implemented. Root `README.md` today is only a 5-minute demo script. Expand it into the Phase 16 README so a new developer can set up in under 30 minutes.

## Required sections (use these headings)

Follow the plan skeleton, then keep the existing demo:

```
# Elora + RitualScore
## Prerequisites
## Setup (< 30 minutes)
### 1. Clone & install
### 2. Configure environment
### 3. Start database
### 4. Run migrations
### 5. Start app
### 6. Start frontend (separate terminal)
### 7. Push theme
### 8. Seed demo data (optional)
## Architecture
## Tech Stack
## 5-minute demo script
```

## Facts to use (do not invent)

**Prerequisites:** Node.js 20+, Docker Desktop, Shopify Partner account + development store, Shopify CLI (`npm install -g @shopify/cli@latest`).

**Install:** from repo root `npm install` (workspaces: `app/server`, `app/web`).

**Env:** copy `.env.example` → `.env` at repo root **and** `app/server/.env` (server `dotenv/config` loads from process cwd). Placeholders:

- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_APP_URL`
- `VITE_SHOPIFY_API_KEY` (same value as API key)
- `DATABASE_URL` default `mysql://ritual:ritual@localhost:3306/ritual_score`
- `PORT=3000`

Never paste real secrets or the live `client_id` from `shopify.app.toml`.

**Database:** `docker compose up -d` — MySQL 8, db `ritual_score`, user `ritual` / `ritual`, port 3306.

**Migrations:** `cd app/server` then `npm run db:migrate` (not a raw SQL file by hand).

**Start app:** `cd app` then `shopify app dev`. `app/shopify.app.toml` + `app/server/shopify.web.toml` + `app/web/shopify.web.toml` mean CLI starts **backend and frontend**. Note that `--use-localhost` skips a public tunnel (webhooks that need a public URI will not subscribe). Default `shopify app dev` uses the CLI tunnel.

**Step 6:** Keep the heading. Say it is **optional** when using `shopify app dev` from `app/`, because that already runs `app/web` (`npm run dev`, Vite 5173, proxies `/api` and `/health` to port 3000). Use a separate `cd app/web` + `npm run dev` only if you are running the Express server yourself (`cd app/server` + `npm run dev`).

**Theme:** `cd theme` then `shopify theme dev --store <your-store>.myshopify.com`. Theme is Elora (OS 2.0 Liquid).

**Seed:** `cd app/server` then `npm run db:seed` (not `npx tsx src/db/seed.ts`). Requires the app already installed on a shop (`Install app first` otherwise) and `write_products` (reinstall if seed prints that). Seeds 9 Elora SKUs + 3 sample rituals (including AM Glow Ritual / Glow Drops Serum).

**Architecture section:** one short paragraph + `See [APP_DECISIONS.md](./APP_DECISIONS.md)`. Do not duplicate the five APP_DECISIONS essays.

**Tech Stack:** table matching plan section 2 (Liquid OS 2.0; Vite 5 + React 19; Polaris 13 + App Bridge; Express + Node 20; Drizzle 0.36 + mysql2 + MySQL 8; Zod; JWT; React Router 6; Shopify CLI; Vitest + Supertest; ESLint).

**5-minute demo script:** keep the current README steps (reinstall for `write_products`, seed, Dashboard 3 rituals, AM Glow, set Glow Drops Serum inventory to 0, Recalculate, Critical OOS alert, Activity log, storefront builder, cart `Elora Ritual` property). You may tighten wording; do not drop steps.

## Constraints

- Accurate to this repo. If a plan command differs from `package.json`, prefer the real script name.
- No screenshots required.
- No new npm scripts, no code changes outside `README.md`.

## Report

Write full report to `k:\Elora\.superpowers\sdd\task-16a-report.md`.

Return only: Status, files, concerns, report path.
