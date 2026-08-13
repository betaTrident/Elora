# Task 7 — Frontend Report

## Status: Complete

Routine list, create/edit form, and Resource Picker implemented in `app/web`. No server changes.

## Files touched

| Area | Path |
|------|------|
| Types | `src/types/index.ts` — `Component`, `RitualListItem`, `RitualDetail`, `RitualSaveResponse` |
| List | `src/pages/Rituals/index.tsx` |
| Form | `src/pages/Rituals/RitualForm/index.tsx` |
| Components | `ComponentList.tsx`, `ComponentRow.tsx` |
| App Bridge types | `src/vite-env.d.ts` — `shopify.resourcePicker` |
| Tests | `Rituals/__tests__/Rituals.test.tsx`, `RitualForm/__tests__/RitualForm.test.tsx` |

## TDD

| Test | RED (expected fail) | GREEN |
|------|---------------------|-------|
| Rituals empty state | `findByText('No routines yet')` before list impl | Pass |
| RitualForm validation | `mockPost` not called; `/add at least one product/i` banner | Pass |

## Verification

```
Set-Location k:\Elora\app\web
npx vitest run   → 4 files, 9 tests passed
npx tsc --noEmit → exit 0
```

## Behaviour summary

- **List:** `GET /api/rituals`, IndexTable (title link, ScoreBadge, threshold, last checked, archive), Modal confirm, EmptyState + CTA, SkeletonPage loading, error Banner with retry.
- **Form:** Create (`/rituals/new`) vs edit (`/rituals/:id/edit`); prefill on edit; title, description, scoreThreshold; ComponentList with App Bridge `shopify.resourcePicker({ type: 'product', multiple: true, action: 'add' })`; client blocks 0 components; POST/PUT; success Banner with ScoreBadge; create navigates to edit URL.
- **Immutability:** ComponentList/Row spread/new arrays on add, update, remove.
- **Copy:** UI uses "routine" not "ritual"; Polaris React 13 only.

## Concerns

- Create success navigates to `/rituals/:id/edit` rather than list — acceptable per brief ("or stay on edit").
- `api.ts` still declares minimal `shopify` globally; full picker type lives in `vite-env.d.ts`.
- Archive errors surface on list page error Banner (not inline on Modal) — minor UX edge case.
- End-to-end against live API not run in this pass (backend stub/real CRUD may be separate task).

## Commits

None (per instructions).

---

## Review Fix Report (Important)

**Status:** Complete

### Changes

| File | Fix |
|------|-----|
| `src/types/index.ts` | Added `ScoreBreakdown` interface matching API shape; `RitualSaveResponse.breakdown` typed as `ScoreBreakdown` (not `BreakdownItem[]`). `BreakdownItem` retained for `ScoreBreakdown` UI component. |

### Test commands + results

```
Set-Location k:\Elora\app\web
npx vitest run   → 4 files, 9 passed
npx tsc --noEmit → exit 0
```

### Concerns

- `ScoreBreakdown` component still uses `BreakdownItem[]` for display UI; no runtime change needed until breakdown UI is wired to API response.
