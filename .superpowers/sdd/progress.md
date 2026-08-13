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
