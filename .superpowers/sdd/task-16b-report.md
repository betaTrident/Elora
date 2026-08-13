# Task 16B Report — Phase 16 APP_DECISIONS.md

**Status:** DONE  
**Commits:** none  
**Work from:** `k:\Elora`  
**Did not edit:** `IMPLEMENTATION_PLAN.md`, `README.md`, app/theme source

## What landed

Created new root file `k:\Elora\APP_DECISIONS.md` with the five required headings:

1. Store Concept
2. App Idea
3. Architecture/Schema
4. Tradeoffs
5. What I'd Improve With More Time

No command dumps (those stay in README). Prose only.

## Source of truth for formula and schema

Read before writing:

- `app/server/src/services/scoring.ts` — `calculateHealthScore`
- `app/server/src/db/schema/*.ts` — eight tables
- Cross-checked: `docker-compose.yml` (MySQL), `app/web/shopify.web.toml` + `app/server/shopify.web.toml` (Vite + Express processes), `app/web/package.json` (no Redux), `app/server/src/routes/webhooks.ts` (only `app/uninstalled`), `app/server/src/services/rituals.ts` (score on save / recalculate / recalculate-all)

## Health Score (matches `calculateHealthScore`)

| Case | Behavior in code | In doc |
|------|------------------|--------|
| Empty kit (`components.length === 0`) | `total` 0; availability 0, completeness 0, **margin 0** (not the mid default) | Yes |
| Availability 0–50 | `round((inStock / n) * 50)` where in-stock is `available > 0` and `status === 'ACTIVE'` | Yes |
| Completeness 0–20 | Required roles `cleanse`, `treat`, `seal`; `scent` optional; `round((present / 3) * 20)` | Yes |
| Margin 0–30 | If any `unitCost != null && unitCost > 0`, average of clamped `(price - cost) / price` × 30, rounded; **else 15** | Yes |
| Missing / zero price | That costed line contributes 0 to the average | Yes |
| Total | availability + completeness + margin (50+20+30 in practice) | Yes |

## Eight tables (SQL names from schema)

`shops`, `sessions`, `shop_settings`, `rituals`, `ritual_components`, `score_snapshots`, `alerts`, `activity_logs`.

`ritual_components.ritual_id` → `rituals.id` with `onDelete: 'cascade'` (documented).

## Tradeoffs

All four named pairs, as this repo actually chose:

- Vite + Express vs Remix
- Deterministic rules vs ML
- Recalculate on save / button / settings “recalculate all” vs inventory webhooks
- React local state vs Redux

Explicitly stated as **not live:** billing, ML, inventory webhooks. Live webhook: `app/uninstalled` only.

## What I'd Improve With More Time

All six items, as next steps (no fake dates): inventory webhooks, margin cost sync, theme metafield integration, multi-store testing, App Store billing, AI-assisted routine recommendations.

## Files changed

| File | Change |
|------|--------|
| `APP_DECISIONS.md` | **Created** — five sections, formula, schema, tradeoffs, future work |
| `.superpowers/sdd/task-16b-report.md` | This report |

## Tests

None. Documentation-only task. Did not change app or theme source.

## Self-review

- Headings match the brief verbatim
- Brand lock: Elora / **Your everyday beauty ritual.** / RitualScore
- Formula copied from `calculateHealthScore`, not from the plan
- Table names match `mysqlTable(...)` identifiers
- No invented live features (no billing, no ML, no inventory webhooks, no theme metafields as shipped)
- No secrets (no tokens, no Compose passwords)
- Did not edit `README.md` or `IMPLEMENTATION_PLAN.md`
- Did not commit

## Concerns

None blocking.
