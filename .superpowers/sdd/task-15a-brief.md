# Task 15A — Phase 15 security (uninstall + audit)

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 15 security checklist (lines 2428–2440).

Work from `k:\Elora`. **Do not commit.** Do not edit `IMPLEMENTATION_PLAN.md`. Do not edit `app/web/**` or `theme/**` (Task 15B owns those). Do not uncomment the `app/uninstalled` subscription in `app/shopify.app.toml` (localhost `shopify app dev` rejects webhook URIs).

## Where this fits

Phases 0–14 are done. Most security rows already exist. This task implements the **only remaining production gap** (uninstall soft-delete) and **proves** the rest with tests, without rewriting working code.

## Already implemented (keep; do not rewrite)

| Item | Where |
|------|--------|
| JWT HS256 + audience | `app/server/src/shopify/auth.ts` `jwt.verify(..., { algorithms: ['HS256'], audience: config.shopifyApiKey })` |
| Shop isolation | Services use `eq(..., shopId)` / `req.shop.shopId` |
| No Admin API from browser | GraphQL only in `app/server/src/shopify/graphql.ts` |
| Zod on POST/PUT | Ritual/settings routes |
| Drizzle parameterized | No raw SQL strings |
| HMAC webhook | `app/server/src/routes/webhooks.ts` `verifyHmac` + `timingSafeEqual` |
| CSP | `app/server/src/index.ts` already sets `frame-ancestors https://admin.shopify.com https://*.myshopify.com;` — **keep both hosts** (Admin iframe needs `*.myshopify.com`; do not shrink to admin.shopify.com only) |
| Secrets | `.env` gitignored; `.env.example` placeholders |

## Required implementation

### 1. Soft-delete on `POST /webhooks/app/uninstalled`

After HMAC succeeds:

1. Resolve shop domain from `X-Shopify-Shop-Domain` header if present, else JSON body `myshopify_domain`, `domain`, or `shop_domain` (existing tests send `{ shop_domain: 'test.myshopify.com' }`).
2. Update the matching `shops` row:
   - `uninstalledAt` = now (SQL `CURRENT_TIMESTAMP` or a `Date`)
   - **tokens nulled:** `accessToken` = `''` (empty string). Column is `text('access_token').notNull()` — do **not** set SQL NULL and do **not** add a migration.
3. Still return **200** `{ ok: true }` even if no row matches (idempotent).
4. Remove the stub comment.

Put the DB update in a small helper (e.g. `softDeleteShop(shopDomain)` in `app/server/src/services/shops.ts` or next to webhooks) so `api.test.ts` can spy it **or** assert via mocked `db.update`. Prefer a dedicated service function + spy — current `api.test.ts` db mock only has `select`/`insert`.

Existing tests must still pass:

- invalid HMAC → 401
- valid HMAC → 200 `{ ok: true }`

Add:

- valid HMAC **calls** the soft-delete with `test.myshopify.com`
- valid HMAC with unknown shop still 200

### 2. Reinstall after uninstall

`verifySessionToken` currently selects only `id` and skips token exchange if the row exists. After uninstall the row remains with an empty token.

Change: if the shop row is missing **or** `uninstalledAt` is not null, run `exchangeAndUpsertShop` (which already sets `uninstalledAt: null` and a new `accessToken`).

Keep ping tests green. If `ping.test.ts` mocks `db.select`, extend the mock so existing tokens still work.

### 3. Prove remaining checklist with tests (no extra features)

In `api.test.ts` (or a focused existing file):

- CSP: `GET /health` (or `/api/ping` with token) includes `Content-Security-Policy` containing `frame-ancestors` and `https://admin.shopify.com`.
- Do **not** add browser GraphQL, new Zod schemas, or CSP middleware rewrites.

## TDD

RED: failing uninstall-calls-soft-delete (and reinstall-if-uninstalled if you touch auth) → GREEN → keep full `api.test.ts` + `ping.test.ts` passing.

## Commands (PowerShell — no `&&`)

```
Set-Location k:\Elora\app\server
npx vitest run src/__tests__/api.test.ts src/__tests__/ping.test.ts
npx tsc --noEmit
```

## Report

Write full report to `k:\Elora\.superpowers\sdd\task-15a-report.md`.

Return only: Status, test summary, concerns, report path.
