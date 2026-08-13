### Spec Compliance

- ✅ Spec compliant
- ⚠️ Cannot verify from diff: five `scoring.test.ts` cases still pass (`scoring.ts` / `scoring.test.ts` not in diff; implementer GREEN run accepted per review instructions)
- ⚠️ Cannot verify from diff: full `npx vitest run` / `tsc` / `lint` pass (implementer report only; not re-run per review instructions)

**Requirement checklist (verified against diff + one focused order check on `recalculateRitual`):**

| Requirement | Verdict | Evidence |
|---|---|---|
| `upsertAlerts(shopId, ritualId, score, threshold, breakdown)` | ✅ | `alerts.ts:31-78` |
| `low_score` when `score < threshold`; message `Routine score ${score} is below threshold ${threshold}` | ✅ | `alerts.ts:20-25`, test `alerts.test.ts:83-108` |
| Severity `critical` if `score < threshold * 0.5`, else `warning` | ✅ (logic) | `alerts.ts:24` — branch not exercised in tests |
| `component_unavailable` / `critical` / `Product ${productId}: ${reason}` per unavailable factor | ✅ | `alerts.ts:28-35`, test `alerts.test.ts:110-125` |
| Dedupe by **type only** (max one open `low_score`, one open `component_unavailable`) | ✅ | `alerts.ts:40-49`, `alerts.ts:63-77`, test `alerts.test.ts:161-187` |
| Resolve open alerts whose type no longer needed + `logActivity` `alert.resolved` / `actorType: 'system'` | ✅ | `alerts.ts:45-60`, test `alerts.test.ts:127-159` |
| Open new types + `logActivity` `alert.opened` / `actorType: 'system'` | ✅ | `alerts.ts:63-76`, test `alerts.test.ts:98-107` |
| No second open row of same type | ✅ | `alerts.ts:64-65`, test `alerts.test.ts:161-187` |
| No unused `rituals` schema import in alerts service | ✅ | `alerts.ts:2-3` imports only `alerts` |
| `listOpenAlerts` shop-scoped, open only, newest first, required fields | ✅ | `alerts.ts:80-94`, test `alerts.test.ts:190-217` |
| `resolveAlert` shop-scoped; `status: 'resolved'`, `resolvedAt`; 404 pattern | ✅ | `alerts.ts:96-111`, tests `alerts.test.ts:219-246` |
| `createRitual` / `updateRitual`: `upsertAlerts` **after** transaction | ✅ | `rituals.ts:178-179`, `rituals.ts:227-228` |
| `recalculateRitual`: after score UPDATE + `ritual.recalculated` log; threshold `ritual.scoreThreshold ?? 70` | ✅ | `rituals.ts:287-303` (order verified outside diff) |
| `GET /api/alerts` → `listOpenAlerts(req.shop.shopId)` | ✅ | `routes/alerts.ts:6-11` |
| `POST /api/alerts/:id/resolve` → `resolveAlert` then `{ ok: true }` | ✅ | `routes/alerts.ts:15-20` |
| Routes use try/catch `next(e)` | ✅ | `routes/alerts.ts:7-11`, `15-20` |
| Scoring not rewritten | ✅ | absent from diff |
| No Phase 10 / scoreSnapshots / `GET /api/scores/:id` changes | ✅ | absent from diff |
| `alerts.test.ts` cases (7) | ✅ | `alerts.test.ts` |
| `rituals.test.ts` mocks `upsertAlerts`; asserts create + recalculate | ✅ | `rituals.test.ts:22-24`, `107-113`, `215-221` |
| `api.test.ts` `GET /api/alerts` 200 with spy | ✅ | `api.test.ts:226-244` |
| 401 sweep kept for alerts routes | ✅ | `api.test.ts:99-100` in `protectedRoutes` (verified outside diff) |

**Focused risk check run:** `recalculateRitual` ordering — confirmed `db.update(rituals)` (score persist) → `logActivity(ritual.recalculated)` → `upsertAlerts` at `rituals.ts:287-303`.

**Focused risk check run:** insert without explicit `status` — `alerts` schema default `'open'` at `db/schema/alerts.ts:13`; safe.

### Strengths

- `upsertAlerts` is cleanly factored (`collectIssues` → `uniqueByType` → resolve stale → open missing) with immutable issue building (`alerts.ts:13-49`).
- Transaction boundary respected: create/update commit first, then alert side effects (`rituals.ts:158-179`, `207-228`).
- `recalculateRitual` wiring order matches spec exactly (score write → activity log → alerts).
- Alert messages use merchant-facing **Routine** copy as required.
- Type-only matching correctly prevents duplicate open rows even when multiple products are OOS (`alerts.ts:40-49`, `64-65`).
- Shop scoping is consistent on list, resolve, and upsert queries.
- Test coverage hits all brief-mandated alert behaviors plus create/recalculate integration assertions.
- Routes follow existing service-delegation + `next(e)` pattern.

### Issues

#### Critical (Must Fix)

_None._

#### Important (Should Fix)

_None blocking task approval._

#### Minor (Nice to Have)

1. **`alerts.test.ts` — no `critical` `low_score` case** (`alerts.ts:24`): Tests only cover warning (`50` vs threshold `70`). The `score < threshold * 0.5` branch is implemented but unexercised. Add one case (e.g. score `30`, threshold `70` → `severity: 'critical'`).

2. **`alerts.ts` / `resolveAlert` — manual resolve does not `logActivity`** (`alerts.ts:96-111`): `POST /api/alerts/:id/resolve` resolves silently. Not required by this task's backend brief, but Phase 14 QA may expect activity entries for merchant resolves. Consider logging in a follow-up.

3. **`alerts.test.ts` — `listOpenAlerts` shop filter is shallow** (`alerts.test.ts:212-213`): Asserts `where`/`orderBy` were called, not that `shopId` is in the predicate. Acceptable given mock style elsewhere, but a stronger assertion would catch shop-scoping regressions.

4. **`alerts.ts` — open alert content is not refreshed** (`alerts.ts:63-77`): By plan, type-only matching means an existing `low_score` row keeps its original message if score changes but stays below threshold (e.g. 50 → 60). Documented plan behavior, not a defect; worth knowing for support/QA.

5. **No HTTP-level test for `POST /api/alerts/:id/resolve`**: Brief did not require it; service-level 404 is covered (`alerts.test.ts:242-246`).

### Assessment

**Task quality:** Approved

**Reasoning:** The implementation matches all backend task requirements: correct alert open/resolve semantics, type-only deduplication, shop-scoped list/resolve APIs, and proper ritual wiring after transactions and recalculate. Tests cover every brief-mandated case plus create/recalculate `upsertAlerts` integration. Remaining notes are test-depth and forward-looking activity-log gaps, not spec violations.
