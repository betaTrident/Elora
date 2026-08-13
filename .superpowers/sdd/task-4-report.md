# Task 4 Report — Phase 4 Backend API Core

**Status:** DONE  
**Date:** 2026-08-13  
**Commits:** none (per instructions)

## Summary

Implemented all 13 authenticated API routes with mock/stub services, central `errorHandler`, Zod validation, webhook HMAC verification, and merged `index.ts` wiring. Followed TDD: wrote `api.test.ts` first (RED — module load failures), then implemented routes/services (GREEN — 26/26 tests pass).

## TDD Workflow

| Phase | Result |
|-------|--------|
| RED | `api.test.ts` added; vitest failed — `../services/rituals` missing; ping tests still passed (4/4) |
| GREEN | All route modules, services, errorHandler, index merge implemented; 26/26 tests pass |

## Files Created

| File | Purpose |
|------|---------|
| `app/server/src/middleware/errorHandler.ts` | Zod → 400, `.status` errors → matching status, else 500 |
| `app/server/src/routes/dashboard.ts` | GET `/` mock counts + arrays |
| `app/server/src/routes/rituals.ts` | 6 handlers with Zod `createSchema` (verbatim from plan) |
| `app/server/src/routes/scores.ts` | GET `/:id` mock score |
| `app/server/src/routes/alerts.ts` | GET `/`, POST `/:id/resolve` |
| `app/server/src/routes/activity.ts` | GET `/` mock array |
| `app/server/src/routes/settings.ts` | GET/PUT with Zod threshold schema |
| `app/server/src/routes/webhooks.ts` | POST `/app/uninstalled` HMAC verify |
| `app/server/src/services/rituals.ts` | Stub CRUD + recalculate; 404 when `id === 'missing'` |
| `app/server/src/services/settings.ts` | In-memory per-shop threshold store |
| `app/server/src/__tests__/api.test.ts` | Phase 4 test coverage |

## Files Modified

| File | Changes |
|------|---------|
| `app/server/src/index.ts` | Merged Phase 3 + 4: cors, CSP, webhooks raw body before json, all routers, errorHandler last, kept ping/health/export/conditional listen; removed duplicate `dotenv()` call (relies on `config.ts`) |

## Route Coverage (13 + extras)

| # | Method | Path | Status | Mock behavior |
|---|--------|------|--------|---------------|
| — | GET | `/api/ping` | 200 | Phase 3 preserved |
| — | GET | `/health` | 200 | Public, unchanged |
| 1 | GET | `/api/dashboard` | 200 | Zero counts, empty arrays |
| 2 | GET | `/api/rituals` | 200 | One mock ritual |
| 3 | POST | `/api/rituals` | 201 | `{ id, score, breakdown, threshold }` |
| 4 | GET | `/api/rituals/:id` | 200/404 | 404 when id=`missing` |
| 5 | PUT | `/api/rituals/:id` | 200/404 | Same Zod + 404 rule |
| 6 | POST | `/api/rituals/:id/archive` | 200 | `{ ok: true }` |
| 7 | POST | `/api/rituals/:id/recalculate` | 200 | Mock score + breakdown |
| 8 | GET | `/api/scores/:id` | 200 | Mock score object |
| 9 | GET | `/api/alerts` | 200 | Empty array |
| 10 | POST | `/api/alerts/:id/resolve` | 200 | `{ ok: true }` |
| 11 | GET | `/api/activity` | 200 | Empty array |
| 12 | GET | `/api/settings` | 200 | `{ defaultThreshold: 70 }` |
| 13 | PUT | `/api/settings` | 200/400 | Zod 0–100; in-memory update |
| — | POST | `/webhooks/app/uninstalled` | 200/401 | HMAC-SHA256 base64, no auth |

## Test Coverage

`api.test.ts` covers all brief requirements:

1. ✅ Ping + health (existing `ping.test.ts`, 4 tests)
2. ✅ All 13 routes return 401 without token (parameterized, 13 cases)
3. ✅ POST `/api/rituals` `{}` → 400 Validation failed
4. ✅ POST `/api/rituals` valid body → 201
5. ✅ GET `/api/rituals/missing` → 404
6. ✅ PUT `/api/settings` `{ defaultThreshold: 200 }` → 400
7. ✅ PUT `/api/settings` `{ defaultThreshold: 75 }` → 200
8. ✅ GET `/api/dashboard` with token → 200
9. ✅ POST webhook bad HMAC → 401
10. ✅ POST webhook good HMAC → 200
11. ✅ Service throw → 500 Internal server error (`vi.spyOn` on `listRituals`)

## Verification Commands

```
cd app/server
npx vitest run     → 26 passed (2 files)
npx tsc --noEmit   → exit 0
npm run lint       → exit 0
```

## Self-Review

### Strengths

- **index.ts merge** preserves Phase 3 behaviors: CSP header, `/api/ping`, `export const app`, conditional listen, dotenv via `config.ts` only.
- **Middleware order** correct: cors → CSP → webhooks (raw) → json → routes → errorHandler.
- **Rituals route** matches plan verbatim including GID-string `shopifyProductId` in component schema.
- **Webhook HMAC** uses raw body, `crypto.timingSafeEqual`, length check, try/catch for malformed base64.
- **errorHandler** registered last; all route handlers use `catch (e) { next(e) }`.
- **No real DB/scoring** — all services return mocks as specified.

### Minor Notes (non-blocking)

- `listRituals` accepts optional `status` query param but does not filter (stub); sufficient for Phase 4 mocks.
- Settings stored in process-memory `Map`; resets on server restart (expected for stub).
- `errorHandler` 500 test logs expected stderr from `console.error` — intentional.

### Out of Scope (correctly deferred)

- Real Drizzle CRUD, scoring engine, GraphQL inventory, shop soft-delete on uninstall webhook.

## Concerns

None blocking. Phase 4 acceptance criteria met.

---

## Fix report

**Date:** 2026-08-13  
**Finding addressed:** Important — PUT 404 untested (`PUT /api/rituals/missing` → 404)

### What changed

| File | Lines | Change |
|------|-------|--------|
| `app/server/src/__tests__/api.test.ts` | 142–148 | Added `describe('PUT /api/rituals/:id')` with authenticated test: `PUT /api/rituals/missing` + `validRitualBody` → 404 `{ error: 'Not found' }` |

### Commands run

```
Set-Location k:\Elora\app\server
npx vitest run src/__tests__/api.test.ts src/__tests__/ping.test.ts
npx tsc --noEmit
npm run lint
```

### Test output

```
 RUN  v2.1.9 K:/Elora/app/server

 ✓ src/__tests__/ping.test.ts (4 tests) 1084ms
 ✓ src/__tests__/api.test.ts (23 tests) 1143ms

 Test Files  2 passed (2)
      Tests  27 passed (27)
   Duration  2.13s
```

### tsc / lint

- `npx tsc --noEmit` → exit 0
- `npm run lint` → exit 0 (eslint `src` clean; Node MODULE_TYPELESS_PACKAGE_JSON warning only)
