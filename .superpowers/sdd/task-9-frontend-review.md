### Spec Compliance

- ✅ Spec compliant
- ⚠️ Cannot verify from diff: `npx vitest run` / `tsc --noEmit` pass (implementer GREEN: 17 tests / 0 tsc errors; not re-run per review instructions)
- ⚠️ Cannot verify from diff: RED-before-GREEN sequence (report-only; four named failing tests match the later implementation)

**Requirement checklist (frontend items 9–11 + UI Tests / Done when):**

| Requirement | Verdict | Evidence |
|---|---|---|
| Three labelled factor bars: Availability, Completeness, Margin | ✅ | `mapScoreBreakdown.ts:12-29`; RitualForm test `RitualForm.test.tsx:121-123` |
| Reuse existing `ScoreBreakdown` (`BreakdownItem[]`: label, value, max, description) | ✅ | `RitualForm/index.tsx:197-199`; mapper `mapScoreBreakdown.ts:5-30`; component API `ScoreBreakdown.tsx:3-8,14-31` (focused check) |
| Show breakdown after save (`saveResult.breakdown`) | ✅ | `RitualForm/index.tsx:96-100,187-199`; test `RitualForm.test.tsx:96-124` (edit PUT) |
| Show breakdown after Recalculate on edit form | ✅ | `RitualForm/index.tsx:113-127,187-199`; test `RitualForm.test.tsx:155` |
| Recalculate is secondary action on **edit** RitualForm only | ✅ | `RitualForm/index.tsx:173-183`; create path `isEdit` false → `secondaryActions` undefined |
| `POST /api/rituals/:id/recalculate` | ✅ | `RitualForm/index.tsx:119-122`; test `RitualForm.test.tsx:154` |
| Recalculate **not** on the list page | ✅ | absent from diff; focused grep of `pages/Rituals/index.tsx` — no Recalculate |
| `AlertBanner`: Polaris `Banner`; `critical` → `tone="critical"`, else `warning` | ✅ | `AlertBanner.tsx:14-19` |
| Empty alerts render nothing extra | ✅ | `AlertBanner.tsx:8-11` returns `null` |
| Dashboard fetches `GET /api/alerts` in addition to dashboard | ✅ | `Dashboard/index.tsx:21-28,43-46` |
| `AlertBanner` above KPIs on populated view (`counts.total > 0`) | ✅ | empty-state early return `Dashboard/index.tsx:83-97`; banners then KPIs `Dashboard/index.tsx:107-119` |
| Alerts failure does not block empty-state; Banner + retry if dashboard succeeded | ✅ | empty-state ignores `alertsError` (`Dashboard/index.tsx:83-97`); populated retry Banner `Dashboard/index.tsx:107-115` |
| Path-aware Dashboard tests (`/api/dashboard` vs `/api/alerts`) | ✅ (mandated cases) | `Dashboard.test.tsx:57-60,75-78,89-103,110-113` |
| Merchant UI says **routine**, not ritual | ✅ | form titles/errors `RitualForm/index.tsx:34,71,106,156-157,204`; Dashboard `Create routine` / empty-state copy unchanged |
| Polaris React 13 only — no `s-*` web components | ✅ | `Banner`/`BlockStack`/`Page` from `@shopify/polaris`; focused grep — no `s-*` |
| Immutability — no in-place mutation | ✅ | mapper returns a new array of new objects; state setters replace objects/arrays |
| RitualForm test: three labels after save | ✅ | `RitualForm.test.tsx:96-124` |
| RitualForm test: edit Recalculate POSTs recalculate | ✅ | `RitualForm.test.tsx:126-156` |
| Dashboard test: alert message when `/api/alerts` returns one | ✅ | `Dashboard.test.tsx:87-107` |
| Dashboard test: no alert message when `[]` | ✅ | `Dashboard.test.tsx:109-118` |

**Focused risk check run:** empty-state vs alerts failure — `Dashboard/index.tsx:31-41` loading/error only wrap the dashboard fetch; `Dashboard/index.tsx:83-97` returns `EmptyState` without reading `alerts`/`alertsError`.

**Focused risk check run:** `ScoreBreakdown` contract — `ScoreBreakdown.tsx:3-8` matches mapper fields; bars are Polaris `ProgressBar` at `ScoreBreakdown.tsx:23`.

**Focused risk check run:** Recalculate not on list — `app/web/src/pages/Rituals/index.tsx` has create/archive only; routes keep create vs edit split (`routes.tsx`: `/rituals/new` vs `/rituals/:id/edit`).

### Strengths

- Breakdown mapping is a small pure helper (`mapScoreBreakdown.ts`) that feeds the existing `ScoreBreakdown` instead of a one-off UI.
- Recalculate is correctly scoped: `PageLayout` `secondaryActions` only when `isEdit` (`RitualForm/index.tsx:173-183`).
- Dashboard dual-fetch is split so alerts cannot own the page loading/error path (`fetchDashboard` vs `fetchAlerts`).
- Alert empty state is a real `null` render (`AlertBanner.tsx:8-11`), not a hidden Banner.
- Severity mapping is a single explicit ternary (`AlertBanner.tsx:17`).
- Mandated tests exist and assert visible labels, the recalculate URL, and path-aware `api.get`.
- Merchant-facing strings in the changed UI use “routine”.
- `ResizeObserver` mock in `test-setup.ts` is a justified harness fix for Polaris secondary actions.

### Issues

#### Critical (Must Fix)

_None._

#### Important (Should Fix)

_None blocking task approval._

#### Minor (Nice to Have)

1. **`Dashboard.test.tsx:67-72` — error case is not path-aware.** `mockRejectedValueOnce` still depends on `fetchDashboard()` calling `api.get` first (`Dashboard/index.tsx:44-45`). The second call (`/api/alerts`) resolves to `undefined` and `setAlerts(undefined)`. Today the dashboard `if (error)` branch returns first (`Dashboard/index.tsx:65-80`), so the test passes, but swapping fetch order would break it and could reach `AlertBanner` with a non-array. Make this mock path-aware: reject `/api/dashboard`, resolve `/api/alerts` to `[]`.

2. **`RitualForm/index.tsx:203-206` — Recalculate errors reuse the save Banner title.** `handleRecalculate` sets `validationError` (`RitualForm/index.tsx:128-131`) under `title="Could not save routine"`. Copy is wrong for a secondary action. Use a distinct title (e.g. “Could not recalculate score”) or a separate error field.

3. **`RitualForm/index.tsx:101-103` — create save never shows the new breakdown.** `setScoreDisplay` then `navigate` remounts the edit form with `scoreDisplay === null`. Edit save and Recalculate are covered; first-create is not. Pre-existing navigate-on-create, but the new bars are the point of this task. Pass breakdown via `navigate` state, or keep the create form mounted until the merchant continues.

4. **`RitualForm.test.tsx:151-152` — Recalculate click uses `findAllByRole` and index `[0]`.** Polariss `ActionMenu` measurement clones extra buttons (noted in the implementer report). Prefer a more stable selector (visible button / `hidden: false`) so layout changes do not click the measurer node.

5. **`AlertBanner` critical tone is untested.** Dashboard alert test uses `severity: 'warning'` only (`Dashboard.test.tsx:97`). The `critical` → `tone="critical"` branch (`AlertBanner.tsx:17`) is unexercised. Optional AlertBanner unit test from the brief would cover it.

6. **`RitualForm/index.tsx:121` — Recalculate POST body is `undefined`.** List archive already posts `{}`. `api.post` always `JSON.stringify`s the body (`services/api.ts:31-32`); `JSON.stringify(undefined)` is `undefined` (no body), which is fine, but `{}` would match existing POST style.

### Assessment

**Task quality:** Approved

**Reasoning:** The web changes match the frontend brief: existing `ScoreBreakdown` with three labelled factors after save and Recalculate, Recalculate only on the edit form against `POST /api/rituals/:id/recalculate`, and Dashboard `GET /api/alerts` with AlertBanner above KPIs on the populated view without blocking empty-state. Remaining items are copy, test robustness, and create-save navigation, not missing requirements.
