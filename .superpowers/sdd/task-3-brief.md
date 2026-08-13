# Task 3: Phase 3 — Shopify OAuth & Embedded Auth

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 3.

## Where this fits

Phases 0–2 are done. Workspace: `k:\Elora`. Docker MySQL has 8 tables. This task adds session-token auth, `/api/ping`, and a minimal embedded App Bridge + Polaris shell.

Do **not** start Phase 4 (no dashboard/rituals/webhooks routers, no errorHandler unless needed for ping tests).

## Skills already applied (controller)

- **shopify-use-shopify-cli:** `shopify app config validate --json --path k:\Elora\app` started Partner device-login (`CWTF-XGSV`) and was stopped — unattended CLI auth is not possible. Do **not** run `shopify app dev` (interactive). Do **not** wait on Partner login.
- **shopify-admin:** searched session token / token exchange. Session tokens are **HS256 JWTs signed with the app secret** (`aud` = client ID, `dest` = shop). Token exchange is REST `POST https://{shop}/admin/oauth/access_token` (not Admin GraphQL). Docs: https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens
- **shopify-polaris-app-home:** `shopify.idToken()` returns the JWT; App Bridge CDN is `https://cdn.shopify.com/shopifycloud/app-bridge.js`. Fetch interceptor can attach the token; the plan still uses explicit `Authorization: Bearer`. Docs: https://shopify.dev/docs/api/app-home/apis/authentication-and-data/id-token-api

## Goal

Every `/api/*` request is guarded by a verified Shopify session token. `/api/ping` proves it.

## Files (follow plan snippets; apply the resolutions below)

### `app/server/src/config.ts`

Verbatim from the plan.

### `app/server/src/shopify/auth.ts`

Use the plan’s `verifySessionToken` + `exchangeAndUpsertShop`.

**Required fixes the plan snippet omitted:**

1. Import `shopSettings` from `../db/schema` (used but not imported).
2. `dest` may be `https://shop.myshopify.com` (example payload) or a bare hostname. Parse safely: if `dest` includes `://`, use `new URL(dest).hostname`, else use `dest` as the hostname.
3. `.ignore()` exists on Drizzle MySQL insert (`insert().values(...).ignore()` or `insert().ignore().values(...)` — use whichever typechecks).
4. `.onDuplicateKeyUpdate` exists on MySQL insert — keep it for shops upsert.
5. After insert, `shop` from the follow-up select may be undefined — throw a clear error if missing instead of crashing on `shop.id`.

Do not log access tokens.

### `app/server/src/middleware/requireAuth.ts`

Verbatim from the plan.

### `app/server/src/index.ts`

Keep `/health` public. Add:

- `express.json()`
- Optional CSP header for Admin iframe: `frame-ancestors https://admin.shopify.com https://*.myshopify.com;`
- `app.use('/api', requireAuth)` then `GET /api/ping` returning `{ shop: req.shop.shopDomain }`
- Keep `app.listen`

**Tests need the Express app.** Export `app` (and still call `listen` only when not under Vitest, e.g. `if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test')`). Do not add Phase 4 routers.

### `app/web/src/services/api.ts`

Verbatim from the plan (`shopify.idToken()`).

### `app/web/index.html`

Verbatim App Bridge CDN script with `data-api-key="%VITE_SHOPIFY_API_KEY%"`. Vite does not replace `%VITE_*%` in HTML by default — add a small Vite `transformIndexHtml` plugin **or** document that `index.html` should use the env. Preferred: a 5-line plugin in `vite.config.ts` that replaces `%VITE_SHOPIFY_API_KEY%` from `process.env` / `.env`. Do not put the secret in HTML — only the public API key.

### `app/web/src/App.tsx`

Plan imports `Provider as AppBridgeProvider` from `@shopify/app-bridge-react`. **Installed v4.2.12 does not export `Provider`** (CDN App Bridge + `useAppBridge` only). Resolution: **do not use AppBridgeProvider**. Keep `BrowserRouter` + Polaris `AppProvider` + `AppRoutes`. App Bridge comes from the CDN script in `index.html` (matches polaris-app-home). Import Polaris CSS.

This is plan-vs-package: package wins for the missing Provider; keep the rest of the plan’s shell.

### Minimal web files so Vite/tsc work (Phase 5 will expand)

- `app/web/src/main.tsx` — `createRoot` render `<App />`
- `app/web/src/routes.tsx` — `AppRoutes` with a single placeholder page (e.g. “RitualScore”) so App compiles. No dashboard/CRUD.
- `app/web/src/vite-env.d.ts` — `/// <reference types="vite/client" />` plus `declare const shopify: { idToken: () => Promise<string> }` if needed
- Add `"types": ["vite/client"]` in web tsconfig if needed

### Env

- Add `VITE_SHOPIFY_API_KEY=` to root `.env.example` (placeholder only).
- Copy public `SHOPIFY_API_KEY` into `app/web/.env` as `VITE_SHOPIFY_API_KEY` (gitignored via `.env`). Do not commit it.
- `app/shopify.app.toml`: set `client_id` to the public API key from env (not the secret). Leave `application_url` as the tunnel placeholder — `shopify app dev` will rewrite it later.

## Tests (required for Done-when 401 / ping)

Use Vitest + Supertest on the server. Mock `jsonwebtoken` verify **or** sign a real HS256 JWT with a test secret and set `SHOPIFY_API_SECRET` / `SHOPIFY_API_KEY` in the test env.

Mock `db` / token-exchange `fetch` so tests do not hit Shopify or require Docker.

Cases:

1. `GET /api/ping` with no `Authorization` → **401** `{ error: 'Missing token' }`
2. `GET /api/ping` with `Bearer not-a-jwt` → **401** `{ error: 'Invalid session token' }`
3. `GET /api/ping` with a valid HS256 JWT (`aud` = test api key, `dest` = `https://test-shop.myshopify.com`, signed with test secret) and mocked shop row → **200** `{ shop: "test-shop.myshopify.com" }`
4. `GET /health` still **200** `{ ok: true }` without a token

TDD: write the failing tests first, then implement.

## Commands

```
cd app/server
npx vitest run
npx tsc --noEmit
npm run lint
```

Web: `cd app/web && npx tsc --noEmit` (may need the new src files).

Do **not** run `shopify app dev`.

## Done when (this task)

- `GET /api/ping` with valid token returns `{ shop: "..." }` (test)
- Missing/invalid token returns 401 (tests)
- `/health` remains public
- Server + web TypeScript compile
- ESLint passes on server
- Shop upsert + token exchange code exists (install row is proven in tests via mocks; live Admin iframe is **out of band** until the human runs `shopify app dev` after Partner login)

## Constraints

- Work from `k:\Elora`
- Do not commit / git init / change git config
- Do not edit `IMPLEMENTATION_PLAN.md`
- Do not print secrets in the report
- Do not add Phase 4+ routes
- Windows PowerShell: no `&&`

## Report

Write full report to `k:\Elora\.superpowers\sdd\task-3-report.md`.
