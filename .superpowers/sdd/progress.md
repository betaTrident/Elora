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
