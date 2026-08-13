# SDD Progress Ledger — Elora / RitualScore

## Phase 1 — Project Scaffold & Tooling

- Task 1: complete (no commits — user forbade commits; review approved after fix pass)
  - Implementer: scaffold + Docker MySQL + /health + tsc + eslint
  - Fix pass: `.npmrc` (`legacy-peer-deps=true`), gitignored `app/server/.env`
  - Review: Approved
  - Minor (deferred): MODULE_TYPELESS_PACKAGE_JSON on `eslint.config.js`; copy `.env` to `app/server/.env` as well as repo root for dotenv cwd

## Phase 2 — Database Schema & Migrations

- Task 2: complete (no commits; review approved)
  - 8 Drizzle tables + client + migrate + `drizzle/0001_initial.sql` applied to Docker MySQL
  - FK: `ritual_components.ritual_id` → `rituals.id` ON DELETE CASCADE
  - Minor (deferred): SQL trailing newline; journal idx 0 vs tag `0001_initial`

## Phase 3 — Shopify OAuth & Embedded Auth

- Task 3: complete (no commits; review approved after dotenv fix)
  - HS256 session token, requireAuth, GET /api/ping, App Bridge CDN + Polaris shell
  - Vitest 4/4: missing token 401, invalid JWT 401, valid ping 200, public /health
  - Live Admin install confirmed: shop row + ping in Admin iframe

## Phase 4 — Backend API Core

- Task 4: complete (no commits; review approved after PUT 404 test)
  - 13 mock API routes + webhook HMAC stub, Zod, errorHandler
  - Vitest 27/27 (ping 4 + api 23); tsc + eslint pass
  - Review: Approved (Important PUT `/api/rituals/missing` 404 test added)
  - Minor (deferred): errorHandler 500 missing `return`; `void next`; thin success-path coverage; `listRituals` ignores `?status=`

## Phase 5 — Frontend Shell (Vite + Polaris)

- Task 5: complete (no commits; review approved after ScoreBreakdown/TitleBar/EmptyState fixes)
  - NavMenu, PageLayout, placeholders, ScoreBadge, ScoreBreakdown ProgressBar, EmptyState wrapper
  - Vitest 4/4 getScoreStatus; tsc pass
  - Minor (deferred): unused user-event; Badge copy not asserted in tests

## Phase 6 — Dashboard Page & KPIs

- Task 6: complete (no commits; review approved)
  - Backend: Drizzle `getDashboardData`; 31/31 server tests
  - Frontend: KPI cards, IndexTable, activity, skeleton/empty/error; 7/7 web tests
  - Minor (deferred): KPI grid 1-up on xs; Create routine on Page not TitleBar; aria-live not on empty/error; formatRelativeTime untested

## Phase 7 — Ritual CRUD

- Task 7: complete (no commits; review approved after Important fixes)
  - Drizzle CRUD, score-on-save, GraphQL inventory, Resource Picker form
  - Server 43/43 tests; web 9/9; tsc pass
  - Minor (deferred): GraphQL inside DB transaction; archive error UX; activity log copy uses “ritual”

## Phase 8 — Activity Log

- Task 8: complete (no commits; review approved after empty-state filter fix)
  - listActivity cap 100 + filters; recalculate logs; Activity page IndexTable expand
  - Server 50/50 tests; web 13/13; tsc pass
  - Minor (deferred): filter SQL assertions; blank expand on archive rows; full-page skeleton on filter refetch

## Phase 9 — Health Score Engine + Alerts

- Task 9: complete (no commits; backend + frontend reviews Approved; whole-phase review Ready to merge)
  - Backend: `upsertAlerts` by type, `listOpenAlerts` / `resolveAlert`, wired after create/update/recalculate
  - Frontend: 3-bar ScoreBreakdown after save + Recalculate; edit-only Recalculate; AlertBanner on Dashboard
  - Server 58/58 tests; web 17/17; tsc pass
  - Minor (deferred): critical low_score test; resolveAlert no activity log (do before Phase 14); shallow listOpenAlerts shop assert; alert message not refreshed on same type; no HTTP POST resolve test; Dashboard error mock not path-aware; Recalculate error banner reuses save title; create-save navigates before breakdown paints; Recalculate test uses findAllByRole[0]; AlertBanner critical tone untested; Recalculate POST body undefined vs {}; archived rituals keep open alerts; Recalculate badge vs persisted threshold mismatch

## Phase 10 — Settings Page

- Task 10: complete (no commits; backend + frontend reviews Approved; whole-phase review Ready to merge)
  - Backend: Drizzle `shop_settings` upsert (Map removed); `settings.updated` activity; sequential `POST /api/scores/recalculate-all` for active rituals
  - Frontend: Settings RangeSlider + save + Recalculate all; Activity filter for `settings.updated`
  - Server 67 tests; web 23 tests; tsc pass
  - Minor (deferred): recalculate-all not atomic; active-only not locked by spy; settings tests skip where(shopId); help copy not RangeSlider helpText; recalculate failure / GET Retry click untested; singular toast untested; malformed recalculated unguarded; Toast may not remount on message change

## Phase 11 — Shopify Theme (Elora)

- Task 11: complete (no commits; 11A + 11B reviews Approved; whole-phase review Ready to merge)
  - 11A: OS 2.0 skeleton — layout, 4 templates, header Elora lockup, brand tokens, cart property rendering
  - 11B: hero-editorial, ingredient-honesty, routine-editorial, scent-wardrobe; index.json order without builder (Phase 12)
  - validate.mjs: leftover RemoteAsset on mandated Google Fonts; theme check exit 0
  - Minor (deferred): featured collection empty until merchant assigns; variant price/media not live; empty main-menu still outputs nav; mobile cart price grid; image alt fallbacks; prefers-reduced-motion; hero h1 wraps richtext p; routine products empty until picked; heading skip in routine editorial; fonts.gstatic preconnect

## Phase 12 — Soft Ritual Builder

- In progress on `feat/p11-shopify-elora-theme` (in-place; Phase 11 already committed)
- Task 12A: complete (no commits, review Approved after hidden/display fix)
  - Liquid section + schema + locales + index.json order `hero, builder, editorial, ingredients, scent, featured`
  - Fix: `.ritual-builder__result:not([hidden])` so `hidden` is not overridden
  - ⚠️ resolved by controller: cart still renders `Elora Ritual` in `main-cart.liquid` (unchanged)
  - Minor (deferred): incomplete prefers-reduced-motion on restart hover; heading typography duplicated; theme-check Google Fonts noise (pre-existing)
- Task 12B: complete (no commits, review Approved)
  - `theme/assets/ritual-builder.js` + defer load in `theme.liquid`
  - Multi-instance init, tag AND-filter + fallback 3, DOM-safe cards, `/cart/add.js` with `Elora Ritual`
  - ⚠️ Ajax not live-tested in this environment (controller: code matches `/cart/add.js` contract; cart property rendering confirmed in 11A)
  - Minor (deferred): in-flight add still redirects after Restart; `shopify:section:load` not bound; `showResult` assumes 12A nodes
- Whole-phase review: Approved after two JS guards
  - Click-through: 400ms `advancing` lock + current-step membership
  - Restart-during-add: generation token + AbortController + cleared redirect timeout
  - Ready to merge: Yes (work still uncommitted; user forbade commits unless asked)

## Phase 13 — Seed Data & Demo Script

- In progress on `feat/p11-shopify-elora-theme` (in-place)
- Task 13A: complete (no commits, review Approved)
  - 9 `theme/assets/product-*.png` + `product-asset.liquid` handle map
  - product-card / main-product featured_image fallback; featured-collection empty = 9-card lineup
  - ⚠️ ChatGPT (1)–(9) → SKU mapping claimed in report; binaries not byte-compared
  - Minor (deferred): 9th card widow in 4-col grid; dead `featured_collection.empty`; `product-asset` prefers ambient `product` over passed `handle`; large unresized PNGs
- Task 13B: complete (no commits, review Approved after process.exit fix)
  - Catalog 9 SKUs + 3 rituals; GraphQL find-or-create; createRitual; README demo (Glow Drops Serum)
  - `write_products` on toml + auth; `npm run db:seed`
  - Fix: process.exit(0/1) so CLI does not hang on mysql2 pool
  - Minor (deferred): GraphQL 401 message mentions write_products; unpublished/unstocked catalog; archived title skip; unordered first shop
- Whole-phase review: Approved after demo-path fixes
  - Untracked inventory (null qty) scores in-stock; 0 stays OOS
  - Builder falls back to `collections['all']`; README seeds before the 8 steps; AM Glow tagged `scent:clean`
  - Ready to merge: Yes (work still uncommitted; user forbade commits unless asked)
  - Catalog tests 11/11; graphql tests 4/4; tsc clean

## Phase 14 — Testing

- Task 14A: complete (no commits during implementer; included in storefront commit)
  - Implementer: Composer 2.5 ([14A unit tests](87e62f09-5de4-41a4-9ad8-737dd78ac758))
  - scoring/alerts/rituals edge cases + `test:coverage`; 28 targeted / 96 full suite passing
  - Coverage all-files ~45.79%; services much higher
- Task 14B: complete (Composer/Grok 4.6 high fast ([14B API tests](780e6092-2e78-481f-8d72-15d1a27699b9)))
  - api.test.ts 35 passing including dashboard auth/counts, omitted components 400, PUT isolation 404, recalculate score object
  - DONE_WITH_CONCERNS: spy shape matches real `{ score, breakdown }`; isolation is service 404 not a second JWT
- Manual QA: token 401, builder→cart, ritual line property verified; Admin click-through + README 30 min deferred to Phase 16
- Ready to merge: storefront templates also shipped this session (search, 404, list-collections, customers, CMS pages, live theme push)

## Phase 15 — Security & Polish

- Task 15A: complete (no commits; review Approved)
  - Implementer: Composer 2.5 ([15A security](83998ffb-d48c-4233-a287-127ba171225c))
  - Reviewer: Grok 4.6 high fast ([15A review](c5dcbe48-bdba-4abd-83ab-acf283d6d2f5))
  - `softDeleteShop` on uninstall; re-exchange when `uninstalledAt` set; CSP test on `/health`
  - ⚠️ resolved by controller: dual-host CSP still in `index.ts` (`admin.shopify.com` + `*.myshopify.com`)
  - Minor (deferred): header `string | string[]`; no-domain uninstall skip; header-first path untested
- Task 15B: complete (no commits; review Approved)
  - Implementer: Grok 4.6 high fast ([15B polish](cd725a93-9824-4ac8-81d1-567290295118))
  - Reviewer: Composer 2.5 ([15B review](8285b93f-13dd-40b1-9ad3-324db0a53352))
  - Toasts (saved/archived/resolved), SaveBar dirty/discard, Dashboard Resolve, form Retry, builder 1-col ≤479px
  - Web 29/29; `npm run build` succeeded
  - ⚠️ Vite CJS / chunk-size / outDir notices pre-exist; global “no warnings” not fully met
  - Minor (deferred): create→edit skeleton flash; duplicate Save when dirty; JSON.stringify dirty check
- Whole-phase: both task reviews Approved, no Critical/Important. Ready to merge Phase 15 (uncommitted).
- Next: Phase 16 — README + APP_DECISIONS.md

## Phase 16 — Documentation & Deliverables

- Task 16A: complete (no commits; review Approved after SKU-count fix)
  - Implementer: Composer 2.5 ([16A README](c2722588-3210-44c3-a586-52886b0da5b9))
  - Reviewer: Grok 4.6 high fast ([16A review](5dd19fca-3f47-4d9e-aa11-08d3721dd708) → re-review [16A re-review](57973dd4-5b3a-4edd-9110-c82fc05e3cfd))
  - Full README: setup 1–8, dual `.env`, `shopify app dev` runs both processes, seed `npm run db:seed`, demo script kept
  - Important fix: seed catalog **12** SKUs (not 9); repo-root note for steps 4–8
- Task 16B: complete (no commits; review Approved)
  - Implementer: Grok 4.6 high fast ([16B APP_DECISIONS](76cb6d17-ca9d-4162-9e1c-7c2a14a2bb39))
  - Reviewer: Composer 2.5 ([16B review](93a117bf-857c-4504-8705-8ad82f37c8f2))
  - Five sections + formula matching `calculateHealthScore`; all four tradeoffs; all six future items
  - Minor (deferred): `sessions` table exists in schema but is unused in current auth (JWT + `shops`); doc describes intended role
- Whole-phase: both Approved. Ready to merge Phase 16 (uncommitted).
- Plan: Phases 0–16 DONE. Remaining work is the live Verification Checklist, not a new phase.
