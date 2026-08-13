# Task 8 Review — Activity Log (re-review)

## Spec Compliance

**Verdict: Compliant** — Phase 8 controller resolutions and brief deliverables are implemented. The prior Important gap (filters unmounted on empty results) is fixed: after load, Who/Action Selects stay mounted when `logs.length === 0`; EmptyState is only in the results area; unfiltered empty uses “No activity yet”; filtered empty uses “No matching events”. `listActivity` is shop-scoped, `orderBy desc createdAt`, hard-capped at 100, with optional exact-match `action` / `entityType` / `actorType` (empty string unset via `present()`; unknown query keys ignored). Recalculate logs `ritual.recalculated` with summary `Recalculated routine "…"` and `afterJson: { score }`. `logActivity` insert contract is unchanged. No Phase 9 alerts UI or `upsertAlerts`. Activity page uses TitleBar `Activity log`, Page title `Activity`, SkeletonPage (not spinner), IndexTable with keyed rows (not anonymous fragments), `selectable={false}`, expand of `afterJson`/`beforeJson`. Polaris React 13 tokens only — no `s-*`. `ActivityLog` gained `action`, `entityId?`, `beforeJson?`; dashboard still receives `id` / `summary` / `createdAt` from `getDashboardData` (limit 5, untouched).

| Requirement | Status |
|-------------|--------|
| `listActivity` shop-scoped, newest first, `Math.min(limit ?? 100, 100)` | ✓ |
| Optional filters `action` / `entityType` / `actorType`; empty string = unset | ✓ |
| Recalculate → `ritual.recalculated`, routine summary, `afterJson: { score }` | ✓ |
| Keep `logActivity`; no Phase 9 alerts / `upsertAlerts` | ✓ |
| TitleBar `Activity log`; Page `Activity` (`titleBarTitle`) | ✓ |
| SkeletonPage / SkeletonBodyText, not spinner-only | ✓ |
| IndexTable rows (flatMap), `selectable={false}`, expand JSON | ✓ |
| Filters stay mounted when empty; EmptyState only in results area | ✓ |
| Unfiltered empty “No activity yet”; filtered empty distinct copy | ✓ |
| Polaris React 13; no `s-*` | ✓ |
| `ActivityLog` extended; dashboard shape preserved | ✓ |
| Tests: empty shop, cap 100, actorType/action filters, recalculate insert, GET 200 + existing 401 | ✓ |
| Web: empty heading + filters, filtered empty, summary row, expand `afterJson` | ✓ |
| Optional: create/update/archive summaries say “routine” | ✓ |
| Recalculate score UPDATE includes `shopId` | ✓ |

Important #1 from the first review is resolved in `Activity/index.tsx` and locked by `Activity.test.tsx` (unfiltered empty still shows Who/Action; selecting Recalculated with `[]` shows “No matching events” with Selects still in the document). Reports match the tree. Frontend report’s original “GET still returns `[]`” concern is stale — the route is wired.

## Strengths

- **Empty-state layout matches the filterable Goal.** PageLayout + Selects always render after a successful load; EmptyState replaces only the IndexTable. `hasActiveFilters` splits copy so a filter miss is not labeled “no activity yet.”
- **`listActivity` is a small additive API** on the existing insert helper: shop `eq`, optional `and` filters, `desc(createdAt)`, hard cap. Route stays try/catch `next` with no extra Zod.
- **Recalculate logging matches the stable action key** and merchant-facing “routine” copy; create/update/archive summaries were updated in the same pass.
- **Activity UI follows Phase 6 patterns:** PageLayout TitleBar, skeleton loading, critical Banner + Retry, shared EmptyState wrapper, IndexTable columns Action / Entity (Badge) / Who / When (`formatRelativeTime`).
- **IndexTable children are real rows** via `flatMap` + keys, avoiding the plan snippet’s anonymous fragments.
- **TDD evidence is real:** RED then GREEN for list/recalculate/GET; web cases now include the filtered-empty regression.

## Issues

### Critical

None.

### Important

None. Prior Important #1 (filtered empty dropping Selects / always “No activity yet”) is fixed.

### Minor

1. **Filter unit tests do not lock filter predicates.** `activity.test.ts` only asserts `where` was called — true for shop-only queries too. Cap/`limit(100)` is actually asserted. Mock-level SQL is noted in the backend report; asserting `eq` arguments (or a query-param GET case) would pin the contract.

2. **Archive (and other logs without JSON) expand to a blank row.** Expand always appends a details row; `beforeJson`/`afterJson` are omitted when null, so archive events show an empty cell. Plan snippet gated the detail row on `log.afterJson`.

3. **Filter refetch uses full-page SkeletonPage.** Changing a Select sets `loading` true and unmounts TitleBar + filters for the duration of the request. Matches the skeleton-not-spinner rule for first load; a quieter refetch would be better. Not a regression of Important #1 — after the fetch completes, filters remain.

4. **Expand detail row reuses `position={index}`.** Harmless with `selectable={false}`; Polaris IndexTable uses `position` for row identity.

5. **`createdAt as string`** — type is `string | Date`; `new Date(...)` already accepts both.

6. **Review package mixes Task 7 uncommitted files** (`rituals.ts` mock→CRUD, ritual types, extra api.test spies). Task 7 was already approved; Task 8 slice is activity list + recalculate log + Activity page.

## Assessment

**Task quality:** Approved

**Reasoning:** List, recalculate logging, GET `/api/activity`, Polaris Activity UI, types, and required tests meet the brief. The empty-state early return that hid required filters is gone, with distinct filtered copy and tests covering both empty paths. Remaining notes are Minor and do not block the task gate.
