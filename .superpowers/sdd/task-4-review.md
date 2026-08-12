# Task 4 Review — Phase 4 Backend API Core (Re-review)

**Reviewer:** task-scoped gate  
**Base:** af1ca7bc8e187935127b75ed2a54d7d68ca2f4  
**Head:** WORKING_TREE (uncommitted)  
**Re-review:** after Important fix — PUT `/api/rituals/missing` → 404 test

---

### Spec Compliance

**Verdict:** Requirements met in code and tests.

- ✅ `index.ts`: cors → CSP `frame-ancestors` → `/webhooks` + `express.raw({ type: '*/*' })` before `express.json()` → `/health` → `app.use('/api', requireAuth)` → `GET /api/ping` → six API routers → `errorHandler` last (`index.ts:23-48`)
- ✅ Phase 3 preserved: `export const app`, conditional listen when `VITEST`/`NODE_ENV=test`, removed erroneous `dotenv()` call (`index.ts:50-54`)
- ✅ Dotenv via `config.ts` first-line `import 'dotenv/config'` — **focused check:** `config.ts:1` (not in diff; required global constraint satisfied per prior gate)
- ✅ All 13 authenticated routes mounted with stub handlers: dashboard, rituals (6), scores, alerts (2), activity, settings (2)
- ✅ Stub services only — no Drizzle CRUD, scoring engine, or GraphQL (`services/rituals.ts`, inline mocks in other routers)
- ✅ `shopifyProductId` stored/validated as strings; mocks use Admin GID form `gid://shopify/Product/...` (`routes/rituals.ts:346-347`, `services/rituals.ts:632-633`)
- ✅ Rituals `createSchema` matches plan verbatim: title, description, scoreThreshold 0–100, components with role enum cleanse/treat/seal/scent (`routes/rituals.ts:346-360`)
- ✅ `GET /api/rituals/:id` and `PUT /api/rituals/:id` → 404 when `id === 'missing'` via `notFound()` + `.status: 404` (`services/rituals.ts:615-618`, `661-663`)
- ✅ **PUT 404 tested:** `describe('PUT /api/rituals/:id')` sends authenticated `PUT /api/rituals/missing` with `validRitualBody`, asserts `res.status === 404` and `res.body === { error: 'Not found' }` (`api.test.ts:225-230`)
- ✅ `POST /api/rituals` → 201 with mock `{ id, score, breakdown, threshold }` (`services/rituals.ts:647-653`, `routes/rituals.ts:371-375`, `api.test.ts:206-214`)
- ✅ `PUT /api/settings` Zod `{ defaultThreshold: 0–100 }`; GET default `{ defaultThreshold: 70 }` (`routes/settings.ts:516`, `services/settings.ts:689-690`)
- ✅ Zod failures → 400 `{ error: 'Validation failed', issues }` via `errorHandler` + `err.flatten()` (`errorHandler.ts:294-295`, `api.test.ts:199-203`)
- ✅ `requireAuth` 401 without token — parameterized over all 13 routes (`api.test.ts:162-183`)
- ✅ `errorHandler`: ZodError → 400; Error with `.status` → that status + `{ error: message }`; else 500 `{ error: 'Internal server error' }` (`errorHandler.ts:292-301`, `api.test.ts:271-277`)
- ✅ `POST /webhooks/app/uninstalled`: no auth; raw body HMAC-SHA256 with secret, base64, `timingSafeEqual`, length guard; invalid/missing → 401; valid → 200 `{ ok: true }` (`webhooks.ts:552-580`, `index.ts:52`, `api.test.ts:247-268`)
- ✅ Dashboard mock shape matches brief (`routes/dashboard.ts:319-322`)
- ✅ No git commit (per instructions)
- ✅ No Phase 5+ UI in diff
- ⚠️ Cannot verify from diff: existing ping + health tests still pass (`ping.test.ts` not in diff; fixer claims 27/27)
- ⚠️ Cannot verify from diff: `npx tsc --noEmit` and `npm run lint` pass (fixer claims only; not re-run per instructions)

### Strengths

- Clean feature-based layout: thin routers, stub services, centralized `errorHandler`.
- Consistent `try/catch → next(e)` pattern on every handler; errors flow to one middleware.
- `index.ts` merge correctly preserves Phase 3 CSP, ping, app export, and test-safe listen guard while adding Phase 4 wiring.
- Webhook verification is solid: raw body, base64 decode guard, length check before `timingSafeEqual`.
- Rituals route/schemas are plan-verbatim; mock service honors the `missing` id contract across get/update/archive/recalculate.
- Tests reuse JWT + mocked `db/client` pattern; parameterized 401 sweep covers all 13 new routes; HMAC and 500 paths exercise real middleware behavior.
- **Fix is correct:** PUT 404 test mirrors GET 404 test structure, uses authenticated request with valid body, and asserts both status and response body — not a placeholder or comment-only change.

### Issues

#### Critical (Must Fix)

*(none)*

#### Important (Should Fix)

*(none — prior PUT 404 gap resolved in `api.test.ts:225-230`)*

#### Minor (Nice to Have)

- `errorHandler.ts:301`: 500 branch omits `return` before `res.status(500).json(...)` (plan snippet uses `return`; harmless today but inconsistent).
- `errorHandler.ts:293`: `void next` is unnecessary noise; plan uses `_next` parameter naming instead.
- Success-path coverage is thin beyond brief minimums (e.g. no authenticated tests for scores, alerts, activity, archive, recalculate, PUT rituals 200) — acceptable for Phase 4 stubs but leaves regressions undetected.
- `listRituals` accepts `status` query but ignores it (`services/rituals.ts:642-644`) — acceptable stub; document or filter later.

### Assessment

**Task quality:** Approved

**Reasoning:** The diff implements the full Phase 4 route surface, middleware order, validation, auth gate, webhook HMAC, and stub services as specified, with Phase 3 constraints preserved. The prior Important finding is resolved: PUT `/api/rituals/missing` → 404 is now covered by an authenticated test asserting real status and body.
