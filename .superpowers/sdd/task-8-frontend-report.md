# Task 8 — Frontend Report

## Status

**Complete.** Activity page replaces placeholder; tests and typecheck pass.

## Changes

| File | Change |
|------|--------|
| `app/web/src/types/index.ts` | Extended `ActivityLog` with `action`, `entityId?`, `beforeJson?` |
| `app/web/src/pages/Activity/index.tsx` | Full page: fetch, skeleton, error banner, filters, IndexTable, expand |
| `app/web/src/pages/Activity/__tests__/Activity.test.tsx` | TDD: empty state, summary row, expand afterJson |

## Behaviour

- **TitleBar:** `Activity log` via `titleBarTitle`; **Page** title `Activity`
- **Loading:** `SkeletonPage` + `SkeletonBodyText` (no spinner-only)
- **Error:** critical `Banner` with Retry → refetch
- **Empty:** `EmptyState` heading “No activity yet”
- **Table:** `IndexTable` `selectable={false}`; columns Action, Entity (Badge), Who, When (`formatRelativeTime`)
- **Expand:** row click toggles `beforeJson` / `afterJson` in `<pre>`; rows via `flatMap` (no anonymous fragment child)
- **Filters:** `Select` for actorType (`all` / `merchant` / `system`) and action; refetch `GET /api/activity` with query params

## Tests (TDD)

| Phase | Result |
|-------|--------|
| RED | 3 failed — placeholder had no empty state / table / expand |
| GREEN | 3 passed (`Activity.test.tsx`) |
| Full suite | 12 passed (`npx vitest run`) |
| Types | `npx tsc --noEmit` exit 0 |

## Commands run

```powershell
Set-Location k:\Elora\app\web
npx vitest run src/pages/Activity/__tests__/Activity.test.tsx
npx vitest run
npx tsc --noEmit
```

## Concerns

- Backend `GET /api/activity` still returns `[]` until Task 8 backend ships; UI is ready for real data.
- Filter refetch resets expanded row (intentional).
- No commit per brief.

## Commits

None.

---

## Fix — Filtered empty state (review Important #1)

### Status

**Fixed.** Filters stay mounted when the activity list is empty; empty copy distinguishes unfiltered vs filtered zero results.

### Files changed

| File | Change |
|------|--------|
| `app/web/src/pages/Activity/index.tsx` | Removed `logs.length === 0` early return; always render PageLayout + filter Selects after load; show `EmptyState` in results area only; `hasActiveFilters` switches heading/description |
| `app/web/src/pages/Activity/__tests__/Activity.test.tsx` | Assert filters present on unfiltered empty; new test for filtered empty (“No matching events”) with filters still in document; `cleanup()` in `beforeEach` |

### Behaviour after fix

- **Unfiltered empty:** heading “No activity yet”; Who + Action selects visible
- **Filtered empty:** heading “No matching events”; description prompts clearing/changing filters; selects remain usable
- **With rows:** unchanged IndexTable + expand

### Tests

| Command | Result |
|---------|--------|
| `npx vitest run` | 13 passed |
| `npx tsc --noEmit` | exit 0 |

### Concerns

- Filter refetch still shows full-page skeleton (review Minor #3 — out of scope).
- No commit per brief.
