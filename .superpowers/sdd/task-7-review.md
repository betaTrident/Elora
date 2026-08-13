# Task 7 Review — Ritual CRUD (Re-review)

## Spec Compliance

**Verdict: Compliant** — all controller resolutions and Phase 7 deliverables are implemented. Mock rituals service replaced with real Drizzle CRUD; score-on-save via `fetchInventory` → `calculateHealthScore`; insert-only `logActivity` on create/update/archive; no `upsertAlerts` or Phase 8 Activity UI. Resource Picker uses App Bridge `shopify.resourcePicker({ type: 'product', multiple: true, action: 'add' })` with types in `vite-env.d.ts`. Zod enforces title + `components.min(1)`; 404 fires for any missing id (not only `'missing'`). `listRituals` defaults to `active`; archive sets `status: 'archived'`. GraphQL failures are caught in `fetchInventorySafe`, logged, and scored with empty inventory while the write succeeds. Frontend uses Polaris React 13, "routine" copy, immutable component updates, list + form flows, client-side zero-component guard, and score display after save.

| Requirement | Status |
|-------------|--------|
| Drizzle CRUD (create/get/list/update/archive/recalculate) | ✓ |
| Score-on-save + persist on GraphQL fail | ✓ |
| `logActivity` insert-only; no `upsertAlerts` | ✓ |
| App Bridge resource picker (not legacy React picker) | ✓ |
| Zod 400 (title + empty components) | ✓ |
| 404 any missing id | ✓ |
| List default `active`; archive → `archived` | ✓ |
| Immutable updates | ✓ |
| Tests: scoring (5), rituals service (6), api (400/201/404/401), web (2) | ✓ |
| Optional ComponentList role onChange test | — (skipped per brief) |

### Prior Important findings — resolution

| # | Finding | Status |
|---|---------|--------|
| 1 | `RitualSaveResponse.breakdown` typed as `ScoreBreakdown`, not `BreakdownItem[]` | **Fixed** — `ScoreBreakdown` interface added; `RitualSaveResponse.breakdown` uses it |
| 2 | HTTP test for `POST { title, components: [] }` → 400 | **Fixed** — `api.test.ts` asserts 400 + `Validation failed` |
| 3 | `archiveRitual` UPDATE includes `shopId` in WHERE | **Fixed** — `.where(and(eq(rituals.shopId, shop.shopId), eq(rituals.id, id)))` |
| 4 | GraphQL failure path tested (persist + empty inventory) | **Fixed** — `rituals.test.ts` mocks `fetchInventory` rejection; asserts write succeeds, `console.error` logged, factors show `available: false` |

## Strengths

- **Clean service layering:** `scoring.ts`, `graphql.ts`, and `activity.ts` are focused modules; `rituals.ts` orchestrates transactions, scoring, and logging without reintroducing mocks or Phase 9 alert logic.
- **Resilient score path:** `fetchInventorySafe` correctly implements the spec’s “persist anyway, score with empty inventory” contract and keeps create/update transactions from aborting on Shopify outages; now covered by a dedicated service test.
- **404 semantics fixed:** `notFound()` no longer special-cases the literal `'missing'`; service tests assert 404 for arbitrary missing ids.
- **Frontend matches brief patterns:** IndexTable list with archive modal, SkeletonPage loading, EmptyState, edit prefill via GET, resource picker mapping (`id`, `variants[0].id`, `title`, default role/qty/sortOrder), and spread-based immutable component edits.
- **Type accuracy restored:** `RitualSaveResponse.breakdown` now matches the API `ScoreBreakdown` shape used in `api.test.ts` mocks and `scoring.ts`.
- **Test discipline:** TDD evidence in reports; explicit empty-components HTTP test; tenant-scoped archive UPDATE; GraphQL-failure regression test added.

## Issues

### Critical

None.

### Important

None — all four prior Important findings are addressed in the diff and fix reports.

### Minor

1. **`fetchInventory` inside DB transaction** — create/update hold the transaction open across the Shopify HTTP call (noted in backend report). Acceptable for v1; consider moving fetch outside the transaction later.

2. **Archive error UX** — archive failures set the page-level error Banner and close the modal, which can feel disconnected from the confirm action (frontend report).

3. **Activity log copy uses “ritual”** — summaries like `Created ritual "…"` are server-side strings; UI correctly says “routine.” Cosmetic only unless activity UI is built later.

4. **No `unitCost` field in `ComponentRow`** — optional in schema/types; plan UX listed roles, qty, remove only. Acceptable omission.

5. **`updateRitual` / `scoreRitual` / `recalculateRitual` UPDATEs omit `shopId` in WHERE** — existence is guarded by shop-scoped SELECT, but only `archiveRitual` was tightened to defense-in-depth; other UPDATE paths still filter by `id` alone. Low practical risk after the guard.

6. **Optional ComponentList role onChange test** — not added; brief marked optional.

## Assessment

**Task quality:** Approved

**Reasoning:** All four Important findings from the prior review are fixed with targeted code and test changes. The implementation satisfies the Phase 7 contract end-to-end—real persistence, score-on-save, correct API shapes and types, resource picker, validation, archive filtering, and required test suites. Remaining items are minor UX, copy, and incremental hardening—not blockers for this task gate.
