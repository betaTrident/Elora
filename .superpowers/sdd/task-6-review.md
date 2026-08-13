The Phase 6 dashboard matches the Task 6 brief and Phase 5–6 design notes. Backend `getDashboardData` and the Dashboard UI (skeleton, empty, error, 4 KPIs, IndexTable, activity) are in place. Phase 5 shell is used correctly and was not re-reviewed.

### Spec Compliance

**Matches the Task 6 brief + Phase 5–6 design notes.**

Verified against `review-p6-uncommitted.diff` plus current Task 6 files. Implementer reports were not trusted. Tests/`tsc` were not re-run (review instructions). Phase 5 shell (PageLayout / NavMenu / ScoreBadge / placeholders) was not re-litigated except where Dashboard consumes them.

| Requirement | Verdict |
|---|---|
| `getDashboardData` via Drizzle; import `{ rituals, alerts, activityLogs }` from `../db/schema` | Met (`dashboard.ts`) |
| Shop scope = `req.shop.shopId`; active rituals; open alerts; last 5 activity logs | Met (`routes/dashboard.ts:8`, service `where` clauses) |
| healthy / broken / unscored / worst5 (scored, ascending `lastScore`, slice 5) | Met; unit test covers threshold equality as healthy and unscored excluded from worst5 |
| Do not break ping `select().from().where().limit()` db mock | Met — `api.test.ts` mocks `getDashboardData`, leaves db chain unchanged |
| Dashboard 200 zeros via mock; 401 still covered | Met (`api.test.ts` mock + existing parameterized 401) |
| Loading skeleton (`SkeletonPage` / `SkeletonBodyText`); not spinner-only | Met (`Dashboard/index.tsx:34-48`); `aria-live` wrapper present |
| Empty when `!data \|\| counts.total === 0`; CTA “Create routine” → `/rituals/new` | Met; heading/description/CDN image match design §5 |
| Error banner `tone="critical"` + Retry (`reload` OK) inside PageLayout | Met (`title="Dashboard failed to load"`, Banner `action` Retry → `window.location.reload`) |
| 4 KPI cards: Total, Healthy, At risk / Broken, Open alerts (no 5th unscored card) | Met; tones success / critical / caution |
| `RitualHealthTable` `IndexTable` `selectable={false}`; title, ScoreBadge, threshold, last checked | Met; fields are `title` / `lastScore` / `scoreThreshold` / `lastScoredAt` (not `name` / `updatedAt`) |
| `RecentActivity`: summary + relative time; max 5 | Met (`formatRelativeTime`, `slice(0, 5)`) |
| Polaris React 13; no `s-*` | Met |
| TitleBar `RitualScore`; Page `Dashboard` | Met via `PageLayout` `title` + `titleBarTitle` |
| No Phase 7 Resource Picker / real create form | Met — `RitualForm` still placeholder copy |
| Web tests: empty heading + error banner required; KPI labels optional | Met (3 Dashboard tests) |
| Server unit tests for empty / mixed / alerts / activity limit | Met (4 tests in `dashboard.test.ts`) |
| No commit | Met (uncommitted working tree) |

**Justified deviations (not failures):**

- Plan snippet used `<Spinner />`; brief/design “Done when” requires skeleton — implementation follows the brief.
- Plan KPI grid used inline CSS `auto-fit`; design §8 forbids custom CSS and asks for Polaris primitives — `Grid` is the right resolution. Cards still render 4-up on `md+`.
- Retry is Polaris `Banner.action` rather than a nested `<Button>` — same behavior, valid Polaris 13.
- `RecentActivity` prop is `activity` rather than plan `entries` — design did not freeze the name.

### Strengths

- Service is plan-verbatim in spirit: thin route, Drizzle `and`/`eq`/`count`/`desc`/`limit`, KPI math and worst5 ranking match the spec, including `lastScore === scoreThreshold` as healthy.
- `api.test.ts` mock is the safer of the two allowed options: ping’s thenable `limit()` chain is untouched, and the dashboard 200 contract stays zeros.
- `dashboard.test.ts` is a real unit test of ranking (worst5 ids `4,7,8,2,5`), not a tautology on mocks; activity asserts `.orderBy()` and `.limit(5)`.
- Dashboard state machine is complete: skeleton → error+retry → empty+CTA → populated KPIs + 8/12 table + 4/12 activity.
- Field names follow the controller resolution (`title`, `lastScoredAt`) instead of the outdated design table (`name`, `updatedAt`).
- ScoreBadge is used with the approved props (`score`, `threshold`); EmptyState is used as the Phase 5 wrapper (heading / description / action / default CDN image), not rewritten.
- No duplicate App Bridge `TitleBar` (plan snippet would have stacked one on top of PageLayout’s). Loading uses the design §6 `SkeletonPage` snippet, not a spinner.
- No `s-*` components, no Phase 7 form logic, no scoring engine / GraphQL.

### Issues

#### Critical

None.

#### Important

None.

#### Minor

1. **KPI grid is 1-up on extra-small/small, not auto-fit 160px**
   - File: `app/web/src/pages/Dashboard/KpiCards.tsx:21`
   - Polaris `Grid` is 6 columns on xs/sm; `columnSpan` 6 is full width, so four cards stack. Design §4 asked for `auto-fit` / `minmax(160px)` (typically 2-up on a phone). Four cards still exist; layout only.
   - Also uses `headingXl` / `bodyMd` vs the plan snippet’s `headingLg` / `bodySm`.

2. **Create-routine action is on Polaris `Page`, not App Bridge `TitleBar`**
   - File: `app/web/src/pages/Dashboard/index.tsx:11,53-56` (via approved `PageLayout`)
   - Brief asked for TitleBar `primaryAction` Create routine. Dashboard correctly uses `PageLayout.primaryAction`; that API still only forwards to `<Page>`, not `<TitleBar>`. CTA is visible on the page and on EmptyState. Do not treat this as a PageLayout re-review — it is the known Phase 5 API. Optional later: forward `primaryAction` to TitleBar.

3. **`aria-live` missing on empty and error**
   - File: `app/web/src/pages/Dashboard/index.tsx:51-82` vs `34-36` and `91`
   - Design §7 asked to wrap the page content area. Loading and populated layouts have `aria-live="polite"`; empty and error do not, so the transition off the skeleton may not be announced.

4. **`getDashboardData` tests do not lock shop/status filters**
   - File: `app/server/src/__tests__/dashboard.test.ts:29-36,59-84`
   - Stubs are order-dependent (`rituals` then `alerts` then `activity`) and never assert `where()` arguments. An archived ritual leaking into counts, or a missing `shopId` predicate, would not fail these tests. Implementation has the filters; coverage does not prove them.

5. **`formatRelativeTime` is untested**
   - File: `app/web/src/utils/formatRelativeTime.ts`
   - Used for table “Last checked” and activity timestamps (design example “3 h ago”). No unit tests; invalid dates fall through to `"Invalid Date"`.

### Assessment

**Task quality:** Approved

**Reasoning:** Backend query/KPI/worst5 behavior and the Dashboard UI states (skeleton, empty+CTA, error+retry, four KPIs, IndexTable, activity) match the brief and design, including schema field names and the ping-mock constraint. Remaining notes are layout/a11y/test-depth nits and do not block Phase 7.
