# Task 3 Report — Phase 3: Shopify OAuth & Embedded Auth

## Summary

Implemented HS256 session-token verification, token-exchange shop upsert, `requireAuth` middleware, `GET /api/ping`, and a minimal Vite/Polaris/App Bridge CDN web shell. All four Vitest+Supertest cases pass; server and web TypeScript compile; server ESLint passes.

## What Was Implemented

### Server

| File | Purpose |
|------|---------|
| `app/server/src/config.ts` | Centralized env config (API key, secret, app URL, DB, port) |
| `app/server/src/shopify/auth.ts` | `verifySessionToken` (HS256 JWT), `exchangeAndUpsertShop` (REST token exchange + shops/shop_settings upsert) |
| `app/server/src/middleware/requireAuth.ts` | Bearer token guard; attaches `ShopContext` to `req.shop` |
| `app/server/src/index.ts` | Exported `app`; CSP header; public `/health`; `/api` guarded; `GET /api/ping`; conditional `listen` (skipped under Vitest/test) |
| `app/server/src/__tests__/ping.test.ts` | TDD tests for 401/200 ping and public health |

### Web

| File | Purpose |
|------|---------|
| `app/web/src/services/api.ts` | `apiFetch` / `api` helpers using `shopify.idToken()` |
| `app/web/src/App.tsx` | `BrowserRouter` + Polaris `AppProvider` (no AppBridgeProvider — v4 has no Provider) |
| `app/web/src/main.tsx` | React root mount |
| `app/web/src/routes.tsx` | Placeholder RitualScore page |
| `app/web/src/vite-env.d.ts` | Vite client types + `shopify` global |
| `app/web/index.html` | App Bridge CDN script with `%VITE_SHOPIFY_API_KEY%` placeholder |
| `app/web/vite.config.ts` | `transformIndexHtml` plugin replaces API key from env |

### Config / Env

- `.env.example` — added `VITE_SHOPIFY_API_KEY=` placeholder
- `app/web/.env` — created (gitignored) with `VITE_SHOPIFY_API_KEY` copied from root `SHOPIFY_API_KEY`
- `app/shopify.app.toml` — `client_id` set to public API key from env
- `app/server/tsconfig.json` — exclude `__tests__` from build output

## TDD Evidence

### RED (tests written before implementation)

Tests were authored in `ping.test.ts` targeting routes/middleware that did not yet exist. Initial `npx vitest run` would fail on missing modules (`config`, `shopify/auth`, `requireAuth`, `/api/ping`).

### GREEN (after implementation)

```
 RUN  v2.1.9 K:/Elora/app/server

 ✓ src/__tests__/ping.test.ts (4 tests) 644ms

 Test Files  1 passed (1)
      Tests  4 passed (4)
```

| Case | Expected | Result |
|------|----------|--------|
| `GET /api/ping` no `Authorization` | 401 `{ error: 'Missing token' }` | PASS |
| `GET /api/ping` `Bearer not-a-jwt` | 401 `{ error: 'Invalid session token' }` | PASS |
| `GET /api/ping` valid HS256 JWT + mocked shop | 200 `{ shop: "test-shop.myshopify.com" }` | PASS |
| `GET /health` no token | 200 `{ ok: true }` | PASS |

Tests mock `db/client` (Drizzle chain) so no Docker/Shopify calls are required. Valid-token test signs a real HS256 JWT with test secret/key.

## Commands and Outputs

### `cd app/server && npx vitest run`

4/4 tests passed (see above).

### `cd app/server && npx tsc --noEmit`

Exit 0 (no errors).

### `cd app/web && npx tsc --noEmit`

Exit 0 (no errors).

### `cd app/server && npm run lint`

Exit 0. One pre-existing Node warning about `eslint.config.js` module type (not introduced by this task).

## Resolutions Applied

1. **No `shopify app dev`** — skipped per brief (Partner login required).
2. **No AppBridgeProvider** — `@shopify/app-bridge-react` v4 has no Provider; App Bridge loaded via CDN in `index.html`.
3. **`shopSettings` import** — added in `auth.ts`.
4. **`dest` parsing** — supports `https://shop.myshopify.com` and bare hostname via `parseShopDomain`.
5. **Exported Express `app`** — Supertest imports `app`; `listen` gated on `VITEST` / `NODE_ENV=test`.
6. **`.ignore()` unavailable** — Drizzle ORM 0.36 MySQL insert has no `.ignore()` (tsc TS2339). Used `onDuplicateKeyUpdate({ set: { shopId } })` as idempotent seed instead.
7. **Shop missing after upsert** — throws clear error instead of crashing on `shop.id`.
8. **ESLint `no-namespace`** — suppressed for required Express `Request` augmentation.

## Self-Review

### Strengths

- Matches plan snippets for config, auth flow, requireAuth, api.ts, index.html.
- Auth boundary is complete: every `/api/*` route goes through `requireAuth`.
- Tests cover all done-when criteria without live Shopify or MySQL.
- No access tokens logged.
- Phase 4 routers/errorHandler not added (scope respected).

### Concerns / Out of Band

- **Live Admin iframe** not verified — requires human `shopify app dev` after Partner login.
- **Token exchange** not integration-tested — mocked at DB layer; live exchange needs dev store.
- **`shopify.app.toml` `application_url`** remains placeholder until tunnel/dev run.
- **`.ignore()`** from plan not available in installed Drizzle; noop `onDuplicateKeyUpdate` used for `shop_settings` seed.

## Files Changed (no commit)

**Created:** `config.ts`, `shopify/auth.ts`, `middleware/requireAuth.ts`, `__tests__/ping.test.ts`, `web/src/*` (App, main, routes, api, vite-env.d.ts), `web/index.html`, `web/.env`

**Modified:** `index.ts`, `vite.config.ts`, `tsconfig.json` (server + web), `.env.example`, `shopify.app.toml`

## Commits

None (per task constraints).

## Fix pass

**Issue:** `config.ts` read `process.env` before `dotenv.config()` ran in `index.ts` (ES module import hoisting).

**Change:** Added `import 'dotenv/config'` as first line of `app/server/src/config.ts` so env vars load before config evaluation. Left `config()` in `index.ts` (harmless duplicate).

### Verification

#### `cd app/server; npx vitest run`

```
 ✓ src/__tests__/ping.test.ts (4 tests)

 Test Files  1 passed (1)
      Tests  4 passed (4)
```

#### `cd app/server; npx tsc --noEmit`

Exit 0 (no errors).

#### `cd app/server; npm run lint`

Exit 0 (pre-existing Node module-type warning only).
