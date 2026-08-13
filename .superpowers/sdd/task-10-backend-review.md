### Spec Compliance

- ✅ Spec compliant
- ⚠️ Cannot verify from diff: claimed `npx vitest run` 67/67, `tsc --noEmit`, and `npm run lint`, plus RED-then-GREEN evidence (suite not re-run per review rules)

Backend Done-when and controller resolutions are present in the uncommitted diff. The in-memory `Map` is gone; settings persist with Drizzle `insert` + `onDuplicateKeyUpdate` on `shop_settings`; GET missing-row is `{ defaultThreshold: 70 }`; PUT stays Zod 0–100 int with a thin route; `updateSettings` takes `ShopContext` and logs `settings.updated` with the required fields; existing rituals’ `scoreThreshold` is not written; `POST /api/scores/recalculate-all` sequentially rescores **active** rituals via `recalculateRitual` and returns `{ recalculated: number }`; `GET /api/scores/:id` stub is unchanged; required tests appear in the diff. No Phase 11 theme, scoreSnapshots usage, scoring-math edits, `IMPLEMENTATION_PLAN.md` edits, or commits. Frontend was correctly omitted from this slice.

Report claims checked against the diff: Map → Drizzle upsert, `ShopContext` + `logActivity` payload, POST registered before `GET /:id`, sequential `for...of` + `await`, namespace spies in `api.test.ts`, and the listed test cases are all in the diff. Optional `createRitual` default-80 test was skipped as the brief allows.

### Strengths

- Persistence matches the controller, not the plan snippet: `updateSettings` uses `insert` + `onDuplicateKeyUpdate` on `shopSettings` (`app/server/src/services/settings.ts:21-24`), so a missing row is created instead of a no-op `update`. `shop_settings.shop_id` is already the primary key, so duplicate-key upsert is valid.
- GET projects a safe payload and treats `0` as a real threshold: `{ defaultThreshold: row?.defaultThreshold ?? 70 }` (`settings.ts:14`), not `|| 70` and not the raw row (the plan’s `res.json(s ?? …)` would have leaked extra columns).
- Routes stay thin: settings is Zod + service + `next(e)` (`routes/settings.ts:6-22`); scores POST is service + `next(e)` (`routes/scores.ts:6-13`). Drizzle did not move into the route.
- `logActivity` matches the resolution exactly: `actorType: 'merchant'`, `actorId: shop.userId ?? undefined`, `action: 'settings.updated'`, `entityType: 'shop_settings'`, summary ``Default threshold set to ${defaultThreshold}``, `afterJson: { defaultThreshold }` (`settings.ts:26-34`). `logActivity` itself was not rewritten.
- Recalculate-all is shop-scoped and active-only: `listRituals(shop.shopId, 'active')` (`rituals.ts:308-314`). `listRituals` already `AND`s `shopId` + `status` and defaults to `'active'`, so archived rituals are not rescored. Sequential `await recalculateRitual` reuses scoring, `ritual.recalculated` logs, and `upsertAlerts`.
- `POST /recalculate-all` is registered before `GET /:id` (`routes/scores.ts:6-26`), so `"recalculate-all"` is not captured as an id. The stub body is unchanged.
- Default-threshold change does not rewrite ritual rows: `updateSettings` only writes `shop_settings`. `createRitual` already reads `shop_settings.defaultThreshold` (`rituals.ts:149-154`), so new rituals pick up the stored default without this task touching scoring math.
- Tests cover the brief: missing GET → 70; PUT upsert + `onDuplicateKeyUpdate` args; `settings.updated` log; empty recalculate → `{ recalculated: 0 }`; two actives → two `upsertAlerts`; PUT 400 kept; GET/PUT 200 spies (`req.shop` + threshold); POST 200 spy + 401 sweep. Namespace imports keep vitest spies bound to the same module the routes use.

### Issues

#### Critical (Must Fix)

None.

#### Important (Should Fix)

None.

#### Minor (Nice to Have)

1. **Recalculate-all is not atomic** (`rituals.ts:308-314`)
   - If `recalculateRitual` throws mid-loop, earlier rituals stay rescored and the handler returns 500 with no `{ recalculated }` count.
   - Spec requires sequential reuse of `recalculateRitual` and does not ask for a wrapping transaction; this is inherent, and the implementer already flagged it.
   - Optional later: continue-on-error with per-id results, or return a partial count. Not required for this task.

2. **Active-only filter is not locked by a spy** (`rituals.test.ts` new cases)
   - The empty/two-ritual tests stub `select` and infer work via `upsertAlerts`, rather than asserting `listRituals(shopId, 'active')`.
   - Implementation still passes `'active'` (and `listRituals` defaults to active anyway), so this is a test pin, not a behavior bug.

3. **GET/PUT settings tests do not assert the `where(shopId)` clause** (`settings.test.ts:52-80`)
   - They check return values and upsert `values` / `onDuplicateKeyUpdate` payloads. Shop-scoping is in the implementation (`settings.ts:11`) but not asserted.

### Assessment

**Task quality:** Approved

**Reasoning:** Backend Phase 10 matches the controller resolutions and test list: MySQL upsert, thin routes, correct activity log, sequential active-only rescore, stub left alone. Remaining notes are v1 operational limits and extra test pins, not spec gaps.
