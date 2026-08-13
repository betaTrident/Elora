# Phase 9 Review — Health Score Engine + Alerts

Scope: uncommitted Phase 9 working tree (`review-p9-uncommitted.diff`). Scoring was not rewritten. Tests were not re-run; implementer GREEN (server 58/58 + tsc + lint; web 17/17 + tsc) is accepted. Task-level backend and frontend reviews already Approved with Minors only; those Minors are triaged below rather than re-litigated as blockers.

### Spec Compliance

- ✅ Spec compliant against `task-9-brief.md` and Phase 9 Done when
- ⚠️ Five `scoring.test.ts` cases: not in the diff; implementer GREEN run accepted
- ⚠️ Full vitest/tsc/lint: implementer report only (not re-run)

| Done when / requirement | Verdict | Evidence |
|---|---|---|
| All 5 score tests still pass; scoring not rewritten | ✅ | `scoring.ts` / `scoring.test.ts` absent from diff; GREEN lists 5 passing |
| `upsertAlerts` opens/keeps `low_score` and `component_unavailable` by **type** | ✅ | `alerts.ts:17-52`, `alerts.ts:54-100`; `alerts.test.ts` open / OOS / dedupe / resolve |
| Recalculate triggers alert path (OOS → `component_unavailable`) | ✅ | `rituals.ts:287-303` then `upsertAlerts`; unit test opens `component_unavailable` on unavailable factors |
| Alert resolves when restocked + recalculated | ✅ | `alerts.ts:67-83`; `alerts.test.ts` “resolves when the issue is gone” |
| Score breakdown: 3 labelled bars (Availability, Completeness, Margin) | ✅ | `mapScoreBreakdown.ts:12-29`; RitualForm after edit save + Recalculate |
| Recalculate secondary action on **edit** form only | ✅ | `RitualForm/index.tsx:173-183`; list page archive modal only |
| `GET /api/alerts` shop-scoped open rows; `POST /:id/resolve` | ✅ | `routes/alerts.ts`; `listOpenAlerts` / `resolveAlert` |
| `AlertBanner` on Dashboard from `GET /api/alerts` | ✅ | `Dashboard/index.tsx:21-46,107-119`; `AlertBanner.tsx` |
| No Phase 10 settings / scoreSnapshots / `GET /api/scores/:id` | ✅ | absent from diff |

**Focused checks (one per named risk, plus wiring):**

- Recalculate order: score persist → `ritual.recalculated` → `upsertAlerts` (`rituals.ts:287-303`).
- Insert without `status`: schema default `'open'` (`db/schema/alerts.ts:13`).
- `ScoreBreakdown` contract: label + `value/max` + `ProgressBar` (`ScoreBreakdown.tsx:3-26`); mapper fields match.
- 401 sweep still includes `GET /api/alerts` and `POST /api/alerts/:id/resolve` (`api.test.ts:99-100`).
- Recalculate not on list: Rituals index secondary action is archive Cancel, not Recalculate.
- Create-save navigation: `setScoreDisplay` then `navigate` remounts edit with `scoreDisplay === null` (`RitualForm/index.tsx:96-103`).
- Manual resolve: `resolveAlert` updates row only — no `logActivity` (`alerts.ts:118-133`).

---

### Strengths

- `upsertAlerts` is a clear pipeline (`collectIssues` → `uniqueByType` → resolve stale → insert missing) and does not mutate `breakdown.factors`.
- Type-only matching matches the controller mandate: one open `low_score` and one open `component_unavailable` per ritual even when several products are OOS.
- Create/update call `upsertAlerts` **after** the transaction commits (`rituals.ts:186-187`, `rituals.ts:235-236`), avoiding global `db` inside an open transaction.
- Recalculate wiring order matches the brief exactly; threshold is `ritual.scoreThreshold ?? 70`.
- Shop scoping is consistent on list, resolve, and the existing-open query (implementation adds `shopId` vs the plan snippet’s ritual-only filter — a justified hardening).
- Frontend reuses existing `ScoreBreakdown` via a small pure mapper instead of a one-off UI.
- Dashboard splits `fetchDashboard` / `fetchAlerts` so an alerts failure cannot own page loading or empty-state; Retry is scoped to alerts.
- Merchant copy uses **routine** in new UI strings; Polaris React 13 only (no `s-*`).
- Brief-mandated tests exist: alert open/resolve/dedupe/list/404, create + recalculate `upsertAlerts` calls, GET alerts 200, three factor labels, Recalculate POST, Dashboard alert message vs empty.

---

### Issues

#### Critical (Must Fix)

_None._

#### Important (Should Fix)

_None blocking Phase 10 or later planned work._ The deferred Minors do not break the alert contract, Recalculate path, or three-bar breakdown. None need to be promoted.

#### Minor (Nice to Have)

Triage key: **Defer** = not needed before Phase 10 (settings / snapshots / theme). **Before Phase 14** = cheap to do now, but only required when the QA checklist runs.

**Already logged (backend)**

1. **No test for `low_score` `critical` severity** (`alerts.ts:24`, tests use score `50` vs threshold `70`).
   - Why it matters: `score < threshold * 0.5` is unexercised.
   - **Triage: Defer.** One-line branch; add a case (e.g. 30/70) whenever `alerts.test.ts` is next touched.

2. **`resolveAlert` does not `logActivity`** (`alerts.ts:118-133`).
   - Why it matters: Phase 14 manual QA is “Resolve alert → goes to resolved state in activity”. Auto resolve via `upsertAlerts` already logs `alert.resolved`; merchant POST will not.
   - **Triage: Before Phase 14** (or whenever resolve UI is added). Not needed for Phase 10. There is still no Dashboard dismiss control in this phase — that was out of scope.

3. **`listOpenAlerts` shop-filter assertion is shallow** (`alerts.test.ts` only checks `where`/`orderBy` were called).
   - **Triage: Defer.** Same mock style as activity/dashboard tests.

4. **Open alert message (and severity) not refreshed** when the type stays (`alerts.ts:85-99`).
   - Why it matters: score 50→60 keeps the original message; 50→30 keeps `warning` instead of becoming `critical`. Plan-mandated type-only keep, not a defect.
   - **Triage: Defer** unless a later phase wants live message/severity updates. If so, `UPDATE` the existing open row instead of skipping it.

5. **No HTTP test for `POST /api/alerts/:id/resolve`.**
   - **Triage: Defer.** Service-level 404 is covered; 401 sweep includes the route. Add next to the GET alerts 200 spy if integration tests are expanded in Phase 14.

**Already logged (frontend)**

6. **Dashboard error mock is not path-aware** (`Dashboard.test.tsx:67-72` uses `mockRejectedValueOnce`).
   - Why it matters: relies on `fetchDashboard` being the first `api.get`. A swap could call `setAlerts(undefined)` and crash `AlertBanner`.
   - **Triage: Defer** as a test-only footgun. Production `GET /api/alerts` returns an array. Fix the mock when Dashboard tests are next edited.

7. **Recalculate errors reuse “Could not save routine”** (`RitualForm/index.tsx:203-206` vs `handleRecalculate` at 128-131).
   - **Triage: Defer.** Copy-only; does not affect later phases. Distinct title (e.g. “Could not recalculate score”) is a one-line fix.

8. **Create save navigates away before breakdown paints** (`RitualForm/index.tsx:96-103`).
   - Why it matters: `setScoreDisplay` then `navigate` remounts edit with `scoreDisplay === null`. Edit save and Recalculate do show the three bars; first-create does not. GET ritual has no breakdown payload.
   - **Triage: Defer.** Phase 13 demo uses an existing ritual + Recalculate; Phase 14 create check is “alert visible on dashboard”, which create `upsertAlerts` already feeds. Optional: `navigate(..., { state: { scoreDisplay } })` and hydrate on edit mount.

9. **Recalculate click uses `findAllByRole(...)[0]`** (`RitualForm.test.tsx:151-152`).
   - **Triage: Defer.** Polariss ActionMenu measurer clones buttons; production shows one control. Prefer a visible-button query if this test flakes.

10. **`AlertBanner` `critical` tone untested** (Dashboard fixture is `severity: 'warning'`).
    - **Triage: Defer.** Ternary at `AlertBanner.tsx:17` is straightforward. Optional unit test as the brief allowed.

11. **Recalculate POST body is `undefined` vs `{}`** (`RitualForm/index.tsx:119-122`).
    - **Triage: Defer.** `JSON.stringify(undefined)` omits the body; recalculate ignores body. `{}` would only match list-archive style.

**New (not in the prior task reviews; still not blocking)**

12. **Archived routines can keep open banners.** `archiveRitual` does not resolve alerts (`rituals.ts:239-264`); `listOpenAlerts` is all open rows for the shop; dashboard KPI `openAlerts` also ignores ritual status (`dashboard.ts:9-10`).
    - Why it matters: archiving a broken routine leaves Dashboard banners in place.
    - **Triage: Defer** unless archive UX is revisited. Not in the Phase 9 brief. Resolve-or-filter-by-active in a later cleanup.

13. **Recalculate badge threshold can disagree with alert threshold.** Form uses `Number(scoreThreshold)` (`RitualForm/index.tsx:123-126`); server `upsertAlerts` uses persisted `ritual.scoreThreshold ?? 70` (`rituals.ts:303`).
    - **Triage: Defer.** Only if the merchant edits threshold and Recalculates without saving. Prefer returning threshold from recalculate, or passing the persisted value.

---

### Recommendations

- Proceed to Phase 10 without waiting on the Minors above.
- Before Phase 14 QA, add `logActivity(..., action: 'alert.resolved')` inside `resolveAlert` so a future dismiss control (or a raw POST) matches the checklist. Optionally add the HTTP 200/404 spy next to the existing GET test.
- Consider `try/catch` around post-commit `upsertAlerts` on create/update: if alerts fail today the ritual is already committed but the HTTP handler still 500s, which invites a duplicate create on retry. Log and still return the ritual payload. Intentional per the “after transaction” rule — not a Phase 9 miss.
- If a later phase needs click-through, include `ritualId` (already returned) plus title on `GET /api/alerts` or join on the client from dashboard `worst5`. Out of Phase 9 scope.
- Do not rewrite `calculateHealthScore` in Phase 10+ unless a score test fails; Phase 9 correctly left it alone.

---

### Assessment

**Ready to merge?** Yes

**Reasoning:** Phase 9 Done when is met: scoring stays as Phase 7 left it, Recalculate opens/resolves alerts by type after the score write, and the UI shows three labelled factor bars plus Dashboard banners. Remaining items are test depth, copy, create-navigation UX, and Phase 14 activity-log completeness — none of them should block settings, snapshots, or theme work.
