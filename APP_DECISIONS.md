# App decisions

How **Elora** (storefront) and **RitualScore** (embedded Admin app) were designed. Commands and install steps live in [README.md](./README.md).

This document covers:

1. [Store concept](#store-concept)
2. [App idea](#app-idea)
3. [Architecture / schema](#architecture--schema)
4. [Tradeoffs](#tradeoffs)
5. [What I’d improve with more time](#what-id-improve-with-more-time)

---

## Store concept

**Elora** is a fictional beauty brand. The store is not a clinical lab catalog and not a joke shop. It sells a **daily ritual**: a short, repeatable lineup a shopper can actually finish.

| | |
|---|---|
| Brand | Elora |
| Tagline | **Your everyday beauty ritual.** |
| Voice | Soft, elegant, distinctly feminine — not literal. No cute slang, no lab-speak. |
| Shopper | Someone building cleanse → treat → seal, plus optional scent. |
| Promise | The homepage and cart talk in *routines*, not SKU dumps. |

### Why beauty routines

A kit is only as good as its weakest SKU. If Glow Drops Serum hits zero, the “AM Glow” story on the homepage is still pretty — and the shopper still adds a broken set to the bag. Elora’s merchandising (builder, editorial, “Add to ritual”) assumes kits stay complete. That is a **merchant operations** problem, which is why RitualScore exists beside the theme, not inside it.

### What the shopper sees

The Online Store 2.0 theme (`theme/`) is Elora:

- Home: hero, **Soft Ritual Builder** (concern → moment → scent), editorial, ingredients, scent wardrobe, featured collection
- Collection / product / cart, plus search, 404, account, and CMS pages
- Builder and PDP **Add to ritual** write an `Elora Ritual` **line-item property** on cart lines — Shopify checkout, not RitualScore

The theme does not display health scores. Scores are an Admin concern.

---

## App idea

**RitualScore** is the embedded Shopify Admin app (Polaris + App Bridge). The merchant does not get another product spreadsheet. They get **kit health**.

### The problem

Shopify Admin is excellent at “this product has 0 units.” It is silent on “AM Glow is a three-product ritual and the treat step is gone.” A merchant who sells routines needs that second sentence.

### Merchant workflow

1. **Create a routine** — pick products (Resource Picker), assign roles: cleanse / treat / seal / scent.
2. **Save** — server pulls live inventory via Admin GraphQL, runs `calculateHealthScore`, stores a snapshot, writes activity.
3. **Alerts** — if score is below the routine threshold, or a component is unavailable, an open alert appears on the dashboard.
4. **Recalculate** — one routine or Settings → recalculate all, after inventory changes in Shopify Products.
5. **Activity** — reverse-chronological log (`ritual.created`, `score.recalculated`, `alert.opened`, `settings.updated`, …).
6. **Settings** — per-shop default threshold (default **70**).

### Why this is not CRUD

CRUD would be “list routines, edit title, delete.” RitualScore always answers a **ranked operational question**: which kits are healthy, which are below threshold, what broke, and when. The score bars are explainable (stock, roles, optional margin) so a merchant can act without a data export.

### What it is not

RitualScore is not a product CMS. Title, price, images, and **on-hand quantity** stay in **Admin → Products**. The app reads inventory; it does not replace Shopify’s inventory UI. Hard-deleting products from the app would strand the Elora catalog — archive in Shopify if a SKU must go away.

---

## Architecture / schema

### Two surfaces, one catalog

```text
Shopper                         Merchant
   │                                │
   ▼                                ▼
Elora theme                    RitualScore iframe
(Liquid / theme.js)            (Vite + Polaris)
   │                                │
   │  cart / checkout               │  session token
   ▼                                ▼
Shopify Online Store           Express /api
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                       MySQL    Admin GraphQL   (optional)
                     rituals,     inventory     uninstall
                     scores,      at score      webhook
                     alerts       time
```

Shared fact: product GIDs (`gid://shopify/Product/…`) on `ritual_components`. Elora merchandises those products; RitualScore scores the same IDs.

### Stack (and why)

| Layer | Choice | Why for this MVP |
|-------|--------|------------------|
| Admin UI | Vite 5 + React 19 + Polaris 13 + App Bridge | Fast embed; Polaris matches Admin; CLI already runs a frontend process |
| Admin API | Express + TypeScript on Node 20 | Small REST surface; JWT middleware; no Remix nested-routing tax |
| Data | Drizzle 0.36 + mysql2 + MySQL 8 (Docker) | Migrations are real SQL in `app/server/drizzle/`; compose file already in repo |
| Validation | Zod on POST/PUT | Fail before writes |
| Auth | App Bridge `idToken` → `jwt.verify` HS256 + audience | Embedded apps do not send a shop query param the client can spoof |

Shopify’s Remix app template would have been a fine default. This assignment asked for **Vite + Node + Drizzle**; the split `shopify.web.toml` files match that literally.

### Request path (Admin)

1. Merchant opens **Apps → RitualScore**. `index.html` loads App Bridge with `VITE_SHOPIFY_API_KEY`.
2. `api.ts` attaches `Authorization: Bearer` from `shopify.idToken()`.
3. `requireAuth` verifies the JWT (`algorithms: ['HS256']`, `audience` = API key), resolves `shop_id` from `dest`.
4. Every query is scoped with `shop_id`. A missing ritual in another shop is **404**, not 403.
5. Scoring calls `fetchInventory` on the server only. The browser never holds the Admin API token.

Uninstall: HMAC-verified `POST /webhooks/app/uninstalled` sets `uninstalled_at` and clears the access token (empty string; column is NOT NULL). Reopen after reinstall re-runs token exchange. The subscription is commented in `shopify.app.toml` while using `--use-localhost`.

### Eight tables

All rows that belong to a merchant hang off `shops.id`.

```text
shops 1───* rituals 1───* ritual_components
  │              │
  │              ├──* score_snapshots
  │              └──* alerts
  ├──1 shop_settings
  ├──* activity_logs
  └──* sessions
```

| Table | What it stores | Why it exists |
|-------|----------------|---------------|
| `shops` | `shop_domain`, offline `access_token`, `uninstalled_at` | Tenant root. Soft-delete on uninstall; reinstall clears `uninstalled_at`. |
| `sessions` | Shopify session-shaped columns (shop, token, expiry) | Schema from the OAuth/session model. Live Admin auth uses the JWT + `shops` token, not this table, today. |
| `shop_settings` | `default_threshold` (default 70) | One settings row per shop. |
| `rituals` | Title, description, `active` / `archived`, per-kit `score_threshold`, last score | Kit header. Archive hides from the active list; history stays. |
| `ritual_components` | Product/variant GIDs, role, qty, optional `unit_cost` | Line items. `ritual_id` **ON DELETE CASCADE**. |
| `score_snapshots` | Integer score + JSON breakdown | History of each compute (save / recalculate). |
| `alerts` | `low_score` / `component_unavailable`, `warning` / `critical`, open or resolved | Dashboard banners; resolve is explicit. |
| `activity_logs` | Actor, action, entity, summary, before/after JSON | Audit trail, newest first, capped on list. |

### Health Score formula

Implemented in `app/server/src/services/scoring.ts` (`calculateHealthScore`). Inventory comes from Admin GraphQL (`inventoryQuantity`, product `status`). **Untracked** inventory (`null` quantity) is treated as **in stock**. **0** is out of stock.

Empty kit (`components.length === 0`) → **total 0** (all bars 0, including margin — not the mid default).

Otherwise:

**Availability (0–50)** — share of components that are in stock and `ACTIVE`:

```text
availability = round( (inStockCount / componentCount) * 50 )
```

In stock means `available > 0` and `status === 'ACTIVE'`. Draft, archived, missing product, or quantity 0 → not in stock.

**Completeness (0–20)** — required roles `cleanse`, `treat`, `seal`. `scent` is extra and does **not** fill this bar.

```text
completeness = round( (requiredRolesPresent / 3) * 20 )
```

Examples: all three roles → **20**; only scent → **0**; two of three → **13**.

**Margin (0–30)** — optional economics. If any line has `unitCost != null` and `unitCost > 0`, average of `(price − cost) / price` clamped to `[0, 1]`, times 30, rounded. Missing product or `price <= 0` contributes **0** to that average. If **no** positive costs exist, margin is **15** (mid default).

```text
margin = costsExist
  ? round( average( clamp((price - cost) / price, 0, 1) ) * 30 )
  : 15
```

**Total** = availability + completeness + margin. Ceiling in practice: **100** (50 + 20 + 30).

Worked example — AM Glow, three ACTIVE SKUs, all in stock, no costs:

| Bar | Value |
|-----|-------|
| Availability | 50 |
| Completeness | 20 |
| Margin | 15 |
| **Total** | **85** |

Same kit, Glow Drops at quantity 0: availability → `round(2/3 * 50) = 33`, total **68**. If the routine threshold is **75**, `low_score` and `component_unavailable` can open.

Scores are **not** pushed from inventory webhooks. They refresh on save, Recalculate, or Settings → recalculate all.

---

## Tradeoffs

| Decision | We chose | Alternative | Why |
|----------|----------|-------------|-----|
| App framework | Vite + Express | Remix Shopify template | Assignment asked for Vite + Node; two `shopify.web.toml` processes; Polaris embed without Remix routing |
| Scoring | Deterministic rules | ML / recommendations as the score | Bars are explainable and unit-tested; no training data |
| Inventory freshness | Recalculate on save / button / recalculate-all | Inventory webhooks | Webhooks need a public HTTPS URL. `shopify app dev --use-localhost` cannot subscribe `app/uninstalled` either |
| Admin state | React local state | Redux / TanStack Query as a global cache | Four pages, Polaris forms; no shared client cache that paid for Redux |
| Product edits | Shopify Products Admin | In-app product CRUD | Avoid duplicating Shopify’s catalog. RitualScore’s job is kits + scores |
| Untracked inventory | Treat as in-stock | Treat as OOS | Matches Shopify “don’t track quantity” (always sellable). Demo OOS requires **Track quantity** and a real **0** |
| Token on uninstall | Empty string, not SQL NULL | Nullable `access_token` | Column is `NOT NULL`; no extra migration |

Live webhook in code: **`app/uninstalled`** only (HMAC, then soft-delete). No billing, no ML, no inventory webhook subscription in this repo.

---

## What I’d improve with more time

- **Inventory webhooks** — rescore when stock or product status changes, without a Recalculate click. Needs a public URL Shopify will call (tunnel or hosted app), which localhost dev does not give.
- **Margin cost sync** — `unit_cost` is typed on the ritual line. Pulling Shopify variant cost (or a cost metafield) would keep the 0–30 bar honest.
- **Theme metafields** — publish kit health onto the storefront so the builder or PDP can show “this ritual is incomplete,” not only Admin.
- **Multi-store testing** — a second development shop to prove `shop_id` isolation beyond service-level 404 tests.
- **App Store billing** — Shopify Billing (trial, plan) before a public listing. Out of scope for the MVP.
- **In-app stock adjust** — +/- on a routine row, then auto-recalculate. Convenient for demos; still needs `write_inventory` and must not become a second Products admin.
- **AI-assisted routine suggestions** — propose cleanse / treat / seal from catalog + inventory. The score would stay rule-based; a recommender would sit beside it.

---

See [README.md](./README.md) for clone, Docker, migrate, `shopify app dev`, theme preview, seed, and the Glow Drops out-of-stock walkthrough.
