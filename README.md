# Elora + RitualScore

Two products in one repo for a Shopify take-home:

| | **Elora** | **RitualScore** |
|---|---|---|
| Who uses it | Shoppers | The merchant (you) |
| Where it lives | The online store | Shopify **Admin → Apps** |
| Code | `theme/` | `app/` |
| Job | Sell a beauty **ritual**, not a pile of SKUs | Score those kits and alert when stock or completeness breaks |

**Elora** tagline: *Your everyday beauty ritual.*  
**RitualScore** answers: *which kits are broken today?*

They share a catalog and a story. They do **not** share a UI. The storefront never calls the RitualScore API. Stock is edited in Shopify Products; RitualScore **reads** inventory when you save or Recalculate.

Setup and architecture decisions: this file vs [APP_DECISIONS.md](./APP_DECISIONS.md).

---

## Contents

1. [What you are running](#what-you-are-running)
2. [Repository layout](#repository-layout)
3. [Prerequisites](#prerequisites)
4. [Setup (under 30 minutes)](#setup-under-30-minutes)
5. [How to open each surface](#how-to-open-each-surface)
6. [Demo script](#demo-script)
7. [Useful commands](#useful-commands)
8. [Tests](#tests)
9. [Troubleshooting](#troubleshooting)

---

## What you are running

After setup, three processes work together:

```text
Shopify Admin (iframe)
        │  App Bridge session token
        ▼
  Vite UI  :5173   (Polaris — RitualScore)
        │  /api  proxied
        ▼
  Express  :3000   (JWT, Drizzle, Admin GraphQL)
        │
        ├── MySQL  :3306   (rituals, scores, alerts)
        └── Shopify Admin API  (product inventory)

Elora theme  (shopify theme dev)
        └── Storefront  (Liquid — cart, builder, PDP)
```

`shopify app dev` started from `app/` launches **both** the Express API and the Vite UI (`app/server/shopify.web.toml` + `app/web/shopify.web.toml`). You still start MySQL and the theme yourself.

**Do not** open the Vite URL in a normal browser tab. App Bridge only works inside Admin. A bare `localhost` tab gets `401 Missing token`.

---

## Repository layout

```text
elora/
├── theme/                 Elora storefront (Liquid, CSS, vanilla JS)
├── app/
│   ├── shopify.app.toml   RitualScore app config (embedded, scopes)
│   ├── server/            Express + Drizzle + Admin GraphQL
│   │   ├── src/           API, scoring, auth
│   │   └── drizzle/       SQL migrations
│   └── web/               Vite + React + Polaris (Admin iframe)
├── docker-compose.yml     MySQL 8
├── .env.example           Keys and database URL (no secrets)
├── README.md              This file
└── APP_DECISIONS.md       Why the product and stack look like this
```

npm workspaces: `app/server` (`ritualscore-server`) and `app/web` (`ritualscore-web`). Install once from the **repo root**.

---

## Prerequisites

| Tool | Why |
|------|-----|
| **Node.js 20+** | App server, Vite, Shopify CLI scripts |
| **Docker Desktop** | MySQL 8 on port `3306` |
| **Shopify Partner account** | Create the RitualScore app and API keys |
| **Development store** | Install the app and preview the theme |
| **Shopify CLI** | `shopify app dev` and `shopify theme dev` |

```bash
npm install -g @shopify/cli@latest
shopify version
```

Create the Partner app (Dashboard → Apps → Create app). You need:

- **API key** → `SHOPIFY_API_KEY` and `VITE_SHOPIFY_API_KEY`
- **API secret** → `SHOPIFY_API_SECRET`

Never commit real secrets. Do not copy `client_id` from `app/shopify.app.toml` into git or this README.

App scopes in `app/shopify.app.toml`: `read_products`, `read_inventory`, `write_products`.

---

## Setup (under 30 minutes)

Use a **new terminal** (or `cd` back to the repo root) before each numbered step that starts with `cd`. Commands below are bash. PowerShell equivalents sit under each block when they differ.

### 1. Clone and install

```bash
git clone <repo-url> elora
cd elora
npm install
```

**Check:** `app/server/node_modules` and `app/web/node_modules` exist (workspaces hoist; install must succeed without peer-dep failure).

### 2. Environment files

The Express server loads `.env` from **its working directory** (`dotenv/config`). Copy the example to **both** the repo root and `app/server`.

```bash
cp .env.example .env
cp .env.example app/server/.env
```

```powershell
Copy-Item .env.example .env
Copy-Item .env.example app/server/.env
```

Edit **both** files with the same values:

| Variable | What to put |
|----------|-------------|
| `SHOPIFY_API_KEY` | Partner app API key |
| `SHOPIFY_API_SECRET` | Partner app API secret |
| `SHOPIFY_APP_URL` | App URL. During `shopify app dev`, the CLI can rewrite this (`automatically_update_urls_on_dev`). |
| `VITE_SHOPIFY_API_KEY` | **Same string as** `SHOPIFY_API_KEY` (public; injected into `index.html` for App Bridge) |
| `DATABASE_URL` | Leave default unless you changed Docker: `mysql://ritual:ritual@localhost:3306/ritual_score` |
| `PORT` | Leave `3000` unless that port is taken |

If you run Vite **by itself** (`cd app/web && npm run dev`), also put `VITE_SHOPIFY_API_KEY` in `app/web/.env`. `shopify app dev` is the path this README assumes.

### 3. Start MySQL

From the **repo root**:

```bash
docker compose up -d
```

**Check:** container healthy, port `3306` listening. Database name `ritual_score`, user `ritual`, password `ritual`.

### 4. Migrate

```bash
cd app/server
npm run db:migrate
```

Applies `app/server/drizzle/` (eight tables). You should see `Migrations applied`.

### 5. Start RitualScore (API + Admin UI)

From the **repo root** (new terminal):

```bash
cd app
shopify app dev
```

Useful flags:

| Flag | Effect |
|------|--------|
| *(none)* | CLI cloud tunnel. Needed if you want Shopify to call webhooks on your machine. |
| `--use-localhost` | No tunnel. Faster local iframe. `app/uninstalled` will **not** subscribe (Shopify rejects localhost webhook URIs). |
| `--skip-dependencies-installation` | Skip npm inside the CLI if you already ran `npm install`. |

The CLI starts:

- backend → `npm run dev` in `app/server` (Express, port **3000**)
- frontend → `npm run dev` in `app/web` (Vite, often **5173**, proxied `/api` and `/health` → 3000)

**Check:** terminal shows backend `Server ready` and a preview on your `.myshopify.com` store. Open the app from **Admin**, not from the raw Vite URL.

### 6. Optional: run API and UI without the CLI

Only if you are not using `shopify app dev`. Two terminals, repo root each time:

```bash
cd app/server && npm run dev
```

```bash
cd app/web && npm run dev
```

You still need a valid App Bridge session (Admin iframe) for `/api/*`.

### 7. Start the Elora theme

New terminal, repo root:

```bash
cd theme
shopify theme dev --store <your-store>.myshopify.com
```

**Check:** CLI prints a preview URL (often `http://127.0.0.1:9292/`). Home should show the hero, ritual builder, and Elora wordmark.

This is a **live preview**, not a production publish. To push to the live theme later: `shopify theme push --store <store> --live` (only when you mean it).

### 8. Seed demo catalog and rituals (optional)

Install RitualScore on the store **once** from the CLI preview / Admin, then:

```bash
cd app/server
npm run db:seed
```

| Message | Meaning |
|---------|---------|
| `Install app first` | Open RitualScore in Admin so a `shops` row exists, then seed again |
| `write_products is required (reinstall app)` | Uninstall/reinstall so Shopify grants `write_products` |
| `Products: … created/reused` and `Rituals: …` | Success |

Seed creates or reuses **12** Elora products and **3** routines in MySQL:

- **AM Glow Ritual** — cleanser, Glow Drops Serum, SPF (threshold 75)
- **Body Ritual** — cleanser, body lotion, body oil
- **Night Barrier** — cleanser, toner, night cream

Catalog products are often created with **inventory not tracked**. RitualScore treats untracked as in-stock. To give every Elora SKU a real quantity at Shop location (25 units):

```bash
cd app/server
node scripts/set-inventory.mjs
```

That uses `shopify store execute` against the logged-in store. Refresh **Admin → Products**; you should see **25 in stock** instead of “Inventory not tracked.”

---

## How to open each surface

Replace `elora-lg1vomev` with your store handle.

| Surface | URL / path | What you should see |
|---------|------------|---------------------|
| **RitualScore** | Admin → **Apps → RitualScore** | Polaris: Dashboard, Routines, Activity, Settings |
| **Elora storefront** | Theme preview URL from `theme dev` | Home, collections, PDP, cart, ritual builder |
| **Products / stock** | Admin → **Products** | Catalog; change **On hand** here, then Recalculate in RitualScore |
| **API health** | `GET http://127.0.0.1:3000/health` | `{ "ok": true }` (no auth) |

Admin app URL pattern:

`https://admin.shopify.com/store/<handle>/apps/ritualscore`

---

## Demo script

Inventory must be **tracked** with a quantity (see step 8). Untracked SKUs never go “out of stock” in RitualScore.

1. Admin → **Apps → RitualScore**. Dashboard shows three sample routines if you seeded.
2. Open **AM Glow Ritual**. Note the score and the three bars (availability / completeness / margin).
3. Admin → **Products → Glow Drops Serum**. Set **On hand** to **0**. Save.
4. RitualScore → AM Glow Ritual → **Recalculate**.
5. Score drops. A **critical** alert should mention out of stock.
6. **Activity** shows `score.recalculated` and `alert.opened` (newest first). **Resolve** on the dashboard toast-clears the alert.
7. Storefront Home → **Build your ritual** → three steps → add to bag.
8. Cart line items show an **Elora Ritual** property.

Create your own routine: **Routines → Create routine**, add three products, set roles **Cleanse / Treat / Seal**, Save. Toast: **Routine saved**.

---

## Useful commands

Run from the directory in the **Where** column.

| Where | Command | What it does |
|-------|---------|--------------|
| repo root | `npm install` | Install workspaces |
| repo root | `docker compose up -d` | MySQL |
| `app/server` | `npm run db:migrate` | Apply Drizzle SQL |
| `app/server` | `npm run db:seed` | 12 SKUs + 3 rituals |
| `app/server` | `node scripts/set-inventory.mjs` | Track + qty 25 at Shop location |
| `app` | `shopify app dev` | API + Admin UI |
| `theme` | `shopify theme dev --store …` | Elora preview |
| `app/server` | `npx vitest run` | API / scoring tests |
| `app/web` | `npx vitest run` | Polaris UI tests |
| `app/web` | `npm run build` | `tsc` + Vite → `app/server/public` |

---

## Tests

```bash
cd app/server && npx vitest run
cd app/web && npx vitest run
```

Server suite covers scoring, alerts, rituals, HMAC webhooks, and session 401s. Web suite covers dashboard, form, archive, and settings.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank iframe / 401 on `/api` | Open the app from **Admin**, not `localhost`. Restart `shopify app dev`. Confirm `VITE_SHOPIFY_API_KEY` matches the API key. |
| `Install app first` on seed | Click RitualScore in Admin once, then seed. |
| Seed cannot create products | Reinstall the app so `write_products` is granted. |
| Recalculate never goes OOS | Product is **Inventory not tracked**, or quantity is not 0, or that SKU is not on the routine. Run `set-inventory.mjs`, then set one SKU to 0. |
| “Inventory is not stocked at Shop location” | Enable the Shop location on the variant, or run `set-inventory.mjs`. |
| `cd app` fails after migrate | You are still in `app/server`. Go back to the repo root. |
| MySQL connection refused | `docker compose up -d` from repo root; `DATABASE_URL` host `localhost` port `3306`. |
| Theme 404 on footer pages | CMS pages (About, FAQ, …) are created by `app/server/scripts/ensure-pages.mjs` if missing. |

Architecture, scoring formula, and tradeoffs: **[APP_DECISIONS.md](./APP_DECISIONS.md)**.
