# Phase 10 Review — Settings Page

Scope: uncommitted Phase 10 working tree (`review-p10-uncommitted.diff`). Tests were not re-run; implementer GREEN (server 67/67 + tsc + lint; web 23/23 + tsc) is accepted. Task-level backend and frontend reviews already Approved with Minors only; those Minors are triaged below rather than re-litigated as blockers. Phase 11 theme work is out of scope for this review.

### Spec Compliance

- ✅ Spec compliant against `task-10-brief.md` and Phase 10 Done when (plus Recalculate all from the Phase Goal)
- ⚠️ Full vitest/tsc/lint: implementer report only (not re-run)
- ⚠️ Optional `createRitual` default-80 test: skipped as the brief allows; persistence + existing `createRitual` settings read is the Done-when

Controller deviations from the plan snippet are **justified**, not misses: service-layer Drizzle upsert (not route-level `db.update`), named `export function Settings` (not `SettingsPage` + second TitleBar), Recalculate all on Settings only.

| Done when / requirement | Verdict | Evidence |
|---|---|---|
| Threshold saves and persists (Drizzle `shop_settings`, not a Map) | ✅ | `settings.ts` Map removed; `insert` + `onDuplicateKeyUpdate`; GET missing-row `{ defaultThreshold: 70 }` |
| New rituals created after threshold change use new default | ✅ | `updateSettings` writes `shop_settings` only; existing `createRitual` reads `settings?.defaultThreshold ?? 70` (`rituals.ts:149-154`) |
| Activity log shows `settings.updated` | ✅ | `logActivity` payload in `settings.ts:26-34`; Activity filter `{ label: 'Settings', value: 'settings.updated' }` |
| Recalculate all rescores every **active** ritual | ✅ | `recalculateAllRituals` → `listRituals(shop.shopId, 'active')` sequential `recalculateRitual`; POST `/api/scores/recalculate-all` |
| Settings UI: RangeSlider 0–100 step 5, Save PUT, Recalculate POST `{}` | ✅ | `Settings/index.tsx`; tests for GET 75, PUT body, POST `{}` |
| Loading/error: Skeleton + Banner retry; Toast under `PageLayout` Frame | ✅ | Matches Dashboard/Activity skeleton; Polariss `<Toast>` inside `PageLayout` |
| No Phase 11 theme / scoreSnapshots / scoring-math / plan-file edits | ✅ | absent from diff |

**Focused checks (one per named risk):**

- Recalculate-all atomicity: sequential `for...of` + `await` (`rituals.ts:308-314`); mid-loop throw → 500, earlier rows stay rescored. Spec-mandated sequential reuse; not a wrapping transaction.
- Active-only: implementation passes `'active'`; `listRituals` already `AND`s `shopId` + status (`rituals.ts:101-106`). Tests infer via `upsertAlerts`, not a `listRituals` spy.
- GET/PUT `where(shopId)`: present on GET (`settings.ts:11`) and upsert `values.shopId` (`settings.ts:23`). Tests assert payloads/returns, not the GET `where` clause.
- Help copy: subdued `<Text as="p">` sibling, matching the plan snippet — not `RangeSlider` `helpText`.
- Recalculate-all failure / GET Retry click: Banners + Retry implemented (`Settings/index.tsx:108-117`, `135-142`); GET Retry presence asserted; click/refetch and POST-failure Banner untested.
- Singular toast: `recalculateToastContent` branches on `count === 1`; suite asserts **Recalculated 3 routines** only.
- Malformed `recalculated`: frontend interpolates `result.recalculated` with no guard; backend contract is `{ recalculated: number }`.
- Toast remount: `{toast && <Toast content={toast} />}` with no `key={toast}`; save then recalculate before dismiss can reuse the instance.

---

### Strengths

- Persistence follows the controller, not the plan’s no-op `update`: MySQL upsert on `shop_settings.shop_id` PK, GET projects `{ defaultThreshold }` (no extra columns) and treats `0` as a real value (`?? 70`, not `|| 70`).
- Routes stay thin: settings is Zod 0–100 int + service + `next(e)`; scores POST is service + `next(e)`. `POST /recalculate-all` is registered before `GET /:id`, so the path is not captured as an id. The score stub is unchanged.
- `logActivity` matches the resolution exactly (`merchant`, `shop.userId`, `settings.updated`, `shop_settings`, summary + `afterJson`). Existing rituals’ `scoreThreshold` is not rewritten when the default changes.
- Recalculate-all is shop-scoped and active-only, and reuses scoring, `ritual.recalculated` logs, and `upsertAlerts` instead of duplicating math.
- Frontend honors Polariss React 13, named `Settings` export, no second TitleBar, Recalculate all Settings-only, merchant **routine** copy, skeleton/Banner parity with Dashboard/Activity, and pluralization (`Recalculated 1 routine` vs `N routines`).
- Required tests are in the diff: settings GET/PUT + activity log; empty/two-ritual recalculate; PUT 400 kept; GET/PUT/POST 200 spies + 401 sweep; RangeSlider/Save/Recalculate/GET Banner; Activity Settings option.

---

### Issues

#### Critical (Must Fix)

_None._

#### Important (Should Fix)

_None blocking Phase 11 or later planned work._ The deferred Minors do not break persistence, new-ritual defaults, `settings.updated`, or active-only rescore. None need to be promoted.

#### Minor (Nice to Have)

Triage key: **Defer** = not needed before Phase 11 (theme) or later planned phases. None of these must be fixed first.

**Already logged (backend)**

1. **Recalculate-all is not atomic** (`rituals.ts:308-314`)
   - If `recalculateRitual` throws mid-loop, earlier rituals stay rescored and the handler returns 500 with no `{ recalculated }` count.
   - **Triage: Defer.** Sequential reuse was required; a wrapping transaction was not. Optional later: continue-on-error with per-id results, or return a partial count.

2. **Active-only filter is not locked by a spy** (`rituals.test.ts` new cases)
   - Empty/two-ritual tests stub `select` and infer work via `upsertAlerts`.
   - **Triage: Defer.** Behavior is `'active'` in implementation; this is a test pin, not a filter bug.

3. **GET/PUT settings tests do not assert the `where(shopId)` clause** (`settings.test.ts:52-80`)
   - They check return values and upsert `values` / `onDuplicateKeyUpdate`. Shop-scoping is in the implementation.
   - **Triage: Defer.** Same mock depth as nearby service tests. Optional pin when `settings.test.ts` is next touched.

**Already logged (frontend)**

4. **Help copy is not `RangeSlider` `helpText`** (`Settings/index.tsx:149-151`)
   - Plan snippet uses a subdued `<Text as="p">` sibling; this matches the spec.
   - **Triage: Defer.** a11y polish (`helpText` / `aria-describedby`) only. Does not cascade.

5. **Recalculate-all failure and GET Retry click are not unit-tested** (`Settings.test.tsx`)
   - PUT-failure Banner is covered; POST-failure Banner + GET Retry refetch click are implemented but untested.
   - **Triage: Defer.** Brief-required tests are present. Add if Settings tests are next edited.

6. **Singular toast path is untested** (`recalculateToastContent`)
   - Suite only asserts **Recalculated 3 routines**.
   - **Triage: Defer.** Optional pin: `{ recalculated: 1 }` → **Recalculated 1 routine**.

7. **Malformed `recalculated` is not guarded**
   - `recalculateToastContent(result.recalculated)` will interpolate `undefined` if the field is missing.
   - **Triage: Defer.** Backend contract is `{ recalculated: number }`. Defense-in-depth only.

8. **Toast may not remount when the message changes** (`Settings/index.tsx:182`)
   - Same Polariss instance if save then recalculate fire before dismiss. `key={toast}` would force a fresh announcement.
   - **Triage: Defer.** Unlikely in normal use (buttons disable each other). Does not cascade.

**New (not in the prior task reviews; still not blocking)**

_None._ Focused checks did not find a new behavioral gap. `createRitual` still reads `shop_settings` directly rather than `getSettings()` — pre-existing, same table and `?? 70` fallback; consolidating the read path is optional DRY, not a Phase 10 miss.

---

### Recommendations

- Proceed to Phase 11 without waiting on the Minors above. Do not treat Recalculate-all atomicity, helpText, or extra toast tests as theme blockers.
- If a later phase adds more `shop_settings` columns, keep GET projection explicit (`{ defaultThreshold, … }`) so extra columns never leak, and extend the upsert `set` the same way.
- Optional later: route `createRitual`’s default through `getSettings()` so the 70 fallback lives in one place. Not required for Done when.
- Recalculate-all is sequential N+1 (list + per-ritual GraphQL/score/alerts). That matches the brief. If shop catalogs grow large, add progress/timeouts then — not now.
- When committing, this is still an uncommitted working tree; do not include `.superpowers/sdd/*` review artifacts unless that is intentional.

---

### Assessment

**Ready to merge?** Yes

**Reasoning:** Phase 10 Done when is met: the default threshold persists in `shop_settings`, new rituals already pick up that row, Activity can filter `settings.updated`, and Recalculate all sequentially rescores active rituals. Remaining items are test pins, a11y polish, and inherent sequential-loop limits — none should block theme or later phases.
