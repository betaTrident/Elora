# Task 4: Phase 4 — Backend API Core

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 4.

## Where this fits

Phases 0–3 are done. `requireAuth`, `/health`, `/api/ping`, and Express `app` export already exist. This task wires **all route modules**, **Zod validation**, and **errorHandler**, returning **mock data** (not Phase 6–9 real Drizzle/scoring/GraphQL).

Do **not** implement `calculateHealthScore`, `fetchInventory`, or real CRUD persistence. Stub service functions.

Work from `k:\Elora`. Do not commit. Do not edit `IMPLEMENTATION_PLAN.md`.

## Skills already applied (controller)

- **shopify-admin:** `app/uninstalled` is a Shop resource webhook. Product IDs in ritual bodies are Admin GIDs (`gid://shopify/Product/...`) stored as strings. Docs: https://shopify.dev/docs/api/admin-rest/2026-07/resources/webhook
- **api-design:** nouns/plural paths, 201 on create, 400 on Zod, 401 without token, 404 on missing resource, 500 via errorHandler
- **tdd-workflow:** tests first

## Goal

13 authenticated API routes return correct status codes with mocks; Zod 400; requireAuth 401; errorHandler 500.

## The 13 API routes

Keep `GET /api/ping` (Phase 3). Add:

| # | Method | Path | Success | Notes |
|---|--------|------|---------|--------|
| 1 | GET | `/api/dashboard` | 200 | mock counts + arrays |
| 2 | GET | `/api/rituals` | 200 | mock list (optional `?status=`) |
| 3 | POST | `/api/rituals` | 201 | Zod `createSchema` from plan |
| 4 | GET | `/api/rituals/:id` | 200; 404 if id `missing` | |
| 5 | PUT | `/api/rituals/:id` | 200; 404 if `missing` | same Zod as create |
| 6 | POST | `/api/rituals/:id/archive` | 200 `{ ok: true }` | |
| 7 | POST | `/api/rituals/:id/recalculate` | 200 | mock `{ score, breakdown }` |
| 8 | GET | `/api/scores/:id` | 200 | mock score object |
| 9 | GET | `/api/alerts` | 200 | mock array |
| 10 | POST | `/api/alerts/:id/resolve` | 200 `{ ok: true }` | |
| 11 | GET | `/api/activity` | 200 | mock array |
| 12 | GET | `/api/settings` | 200 | `{ defaultThreshold: 70 }` |
| 13 | PUT | `/api/settings` | 200 | Zod `{ defaultThreshold: 0–100 }` |

Plus (not in the 13, still required):

- `POST /webhooks/app/uninstalled` — **no** `requireAuth`; raw body; HMAC; 401 invalid, 200 valid
- Keep `GET /health` public

## Files

### `app/server/src/middleware/errorHandler.ts`

Use the plan snippet. Must be registered last. Routes `catch (e) { next(e) }` so ZodError becomes 400 `{ error: 'Validation failed', issues }`.

Errors with `.status` (e.g. `Object.assign(new Error('Not found'), { status: 404 })`) return that status.

### `app/server/src/index.ts`

**Merge** Phase 3 + Phase 4. Do not drop ping, CSP, `export const app`, or conditional `listen`.

Order:

1. cors
2. CSP header (keep Phase 3)
3. `app.use('/webhooks', express.raw({ type: '*/*' }), webhooksRouter)` **before** `express.json()`
4. `express.json()`
5. `GET /health`
6. `app.use('/api', requireAuth)`
7. `GET /api/ping`
8. mount dashboard, rituals, scores, alerts, activity, settings
9. `errorHandler`
10. export `app`; listen only when not Vitest/test
11. Keep `import 'dotenv/config'` via `./config` (do not put dotenv after config import)

Plan’s `dotenv()` after other imports is wrong (Phase 3 lesson). Keep `config.ts` first-line `import 'dotenv/config'`.

### `app/server/src/routes/rituals.ts`

Verbatim from the plan (Zod schemas + six handlers). Implement stub `app/server/src/services/rituals.ts`:

- `listRituals(shopId, status?)` → `[]` or one mock ritual
- `createRitual(shop, body)` → `{ id: 'mock-ritual-id', score: 80, breakdown: {}, threshold: body.scoreThreshold ?? 70 }`
- `getRitual(shopId, id)` → throw 404 if `id === 'missing'`, else mock ritual including `shopifyProductId` strings
- `updateRitual` → same 404 rule
- `archiveRitual` → void; 404 if missing
- `recalculateRitual` → `{ score: 80, breakdown: { availability: 40, completeness: 20, margin: 15 } }`

### Other routers (same try/catch next pattern)

- `routes/dashboard.ts` → `GET /` mock `{ counts: { total: 0, healthy: 0, broken: 0, unscored: 0, openAlerts: 0 }, worst5: [], recentActivity: [] }`
- `routes/scores.ts` → `GET /:id` mock score
- `routes/alerts.ts` → `GET /`, `POST /:id/resolve`
- `routes/activity.ts` → `GET /`
- `routes/settings.ts` → plan’s Zod for PUT; GET/PUT return mock `{ defaultThreshold }` (in-memory is fine)
- `routes/webhooks.ts` → `POST /app/uninstalled` (router mounted at `/webhooks`)

### Webhook HMAC

Header `X-Shopify-Hmac-Sha256`. Compute HMAC-SHA256 of **raw body** with `SHOPIFY_API_SECRET`, base64, `crypto.timingSafeEqual`. Invalid/missing → 401. Valid → 200 `{ ok: true }`. Do not implement full shop soft-delete (stub comment ok). Tests can sign with the test secret.

## Tests (TDD — write failing tests first)

Reuse ping test JWT helper (sign HS256 with test key/secret, mock `db/client` so verifySessionToken finds a shop).

Cover at least:

1. Existing ping + health tests still pass
2. Each of the 13 routes: no token → 401
3. POST `/api/rituals` `{}` → 400 Validation failed
4. POST `/api/rituals` valid body → 201
5. GET `/api/rituals/missing` → 404
6. PUT `/api/settings` `{ defaultThreshold: 200 }` → 400
7. PUT `/api/settings` `{ defaultThreshold: 75 }` → 200
8. GET `/api/dashboard` with token → 200
9. POST `/webhooks/app/uninstalled` bad HMAC → 401
10. POST `/webhooks/app/uninstalled` good HMAC → 200
11. A thrown Error without status → 500 `{ error: 'Internal server error' }` (can stub one handler or a test-only route; prefer triggering via a service stub `vi.spyOn` once)

Do not hit Docker/Shopify.

## Commands

```
cd app/server
npx vitest run
npx tsc --noEmit
npm run lint
```

## Done when

- 13 API routes return correct status codes with mocks
- Zod 400 on malformed bodies
- requireAuth 401 on `/api/*` without token
- errorHandler 400/404/500 as specified
- ping/health still work
- tsc + eslint pass

## Constraints

- No Phase 5+ React pages
- No real scoring engine
- No git commit
- No secrets in report
- Windows PowerShell: no `&&`

## Report

`k:\Elora\.superpowers\sdd\task-4-report.md`
