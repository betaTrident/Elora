# Task 16B — Phase 16 APP_DECISIONS.md

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 16 `APP_DECISIONS.md` sections (lines 2512–2518) plus brand lock (lines 8–15) and scoring in `app/server/src/services/scoring.ts`.

Work from `k:\Elora`. **Do not commit.** Do not edit `IMPLEMENTATION_PLAN.md`. Do not edit `README.md` (Task 16A owns it). Do not change app/theme source.

## Where this fits

This is the architecture/decision write-up a reviewer reads after the README. Create **new** root file `k:\Elora\APP_DECISIONS.md` with exactly these five sections (use these headings).

## Required sections

1. **Store Concept**
2. **App Idea**
3. **Architecture/Schema**
4. **Tradeoffs**
5. **What I'd Improve With More Time**

## Content requirements (verbatim intent from the plan)

### 1. Store Concept

- Brand **Elora**, tagline **Your everyday beauty ritual.**
- Target customer: beauty shopper building a simple daily routine (cleanse / treat / seal + optional scent), not a clinical lab catalog.
- Why beauty routines: kits break when one SKU goes OOS; the storefront sells a ritual, not a pile of SKUs.
- Voice: soft, elegant, distinctly feminine — not literal. No cute slang, no clinical lab-speak.

### 2. App Idea

- **RitualScore** is the embedded Admin app: merchant tracks kit **health**, not just a product list.
- Workflow: create a routine (products + roles) → score on save → alerts when stock/completeness/score fails → activity log → threshold in Settings → Recalculate.
- Why this beats CRUD: a score + alert + activity trail answers “which kits are broken today?” without exporting inventory.

### 3. Architecture/Schema

- **Stack choice:** Express API + Vite/React Admin UI + Drizzle/MySQL (not Remix, not Prisma/Postgres). One sentence each on why that fit an MVP (Vite speed + Polaris, Drizzle SQL you can read, MySQL via Docker compose already in repo).
- **8 tables** (from `app/server/src/db/schema/`): `shops`, `sessions`, `shop_settings`, `rituals`, `ritual_components`, `score_snapshots`, `alerts`, `activity_logs`. One short rationale each (shop isolation, JWT sessions, per-shop threshold, kit header, line items + role, historical scores, open/resolved issues, audit trail). `ritual_components.ritual_id` cascades on delete.
- **Health Score formula** — copy behavior from `calculateHealthScore` (must match code, not the plan if they drift):
  - Empty kit → total 0
  - Availability 0–50: share of components in-stock (`available > 0` and `status === 'ACTIVE'`)
  - Completeness 0–20: share of required roles `cleanse`, `treat`, `seal` present (`scent` optional)
  - Margin 0–30: if any `unitCost > 0`, average of `(price - cost) / price` clamped 0–1, times 30; **else 15** (mid default)
  - Total = availability + completeness + margin (does not exceed 100 in practice: 50+20+30)
  - Include this formula in the doc (verification checklist requires it)

### 4. Tradeoffs

Cover all four named pairs, as decisions this repo actually made:

| Decision | What we chose | Alternative | Why |
|----------|---------------|-------------|-----|
| App framework | Vite + Express (not Remix Shopify template) | Remix | Faster Polaris embed; CLI `shopify.web.toml` already runs both processes |
| Scoring | Deterministic rules | ML | Explainable bars in Admin; unit-testable; no training data |
| Inventory freshness | Recalculate on save / button / settings “recalculate all” | Inventory webhooks | Webhooks need a public URL; localhost `shopify app dev --use-localhost` cannot subscribe `app/uninstalled` either |
| Admin state | React local state | Redux | Four pages, Polaris forms; no shared cache that justified Redux |

### 5. What I'd Improve With More Time

Include **all** of: inventory webhooks, margin cost sync, theme metafield integration, multi-store testing, App Store billing, AI-assisted routine recommendations. One short paragraph or bullet each — plausible next steps, not fake timelines.

## Constraints

- Prose, not a second implementation plan. No command dumps (those live in README).
- Do not invent features that are not in the repo (no billing, no ML, no inventory webhooks live).
- Do not paste secrets.
- File length: enough to cover the five sections; skip filler.

## Report

Write full report to `k:\Elora\.superpowers\sdd\task-16b-report.md`.

Return only: Status, files, concerns, report path.
