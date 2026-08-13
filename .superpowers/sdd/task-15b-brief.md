# Task 15B — Phase 15 polish (Admin UI + mobile builder)

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 15 polish checklist (lines 2442–2454).

Work from `k:\Elora`. **Do not commit.** Do not edit `IMPLEMENTATION_PLAN.md`. Do not edit `app/server/**` (Task 15A owns uninstall/CSP/auth).

## Where this fits

Most polish already exists from Phases 5–10. Fill the **named gaps** only. Do not restyle the Admin or invent new pages.

## Already implemented (keep)

| Item | Where |
|------|--------|
| Skeleton loaders | Dashboard, Rituals list, Activity, RitualForm, Settings |
| Error Banner + retry | Rituals, Activity, Settings, Dashboard (alerts). Dashboard main error uses `window.location.reload()` — leave it or switch to `fetchDashboard` if that is a one-line fix |
| Empty state + CTA | Dashboard (no rituals), Rituals, Activity |
| Confirm modal | Rituals archive `Modal` |
| Score factor bars | `ScoreBreakdown` ProgressBar on RitualForm after save/recalculate |
| Settings Toast | Settings save / recalculate-all |

## Required work

### 1. Toast on every mutation

Polaris `Toast` inside the existing `PageLayout` `Frame` (same pattern as Settings). Messages:

- RitualForm **create** and **update** success: `"Routine saved"` (keep the score Banner + breakdown; add toast)
- Rituals **archive** success: `"Routine archived"`
- Alert **resolve** success: `"Alert resolved"`

Create currently `navigate`s to edit — show toast on the form **before** navigate, or keep the user on the new edit URL and show toast there. Do not drop the score Banner.

### 2. Contextual Save Bar — Ritual form when dirty

Use App Bridge `SaveBar` from `@shopify/app-bridge-react` (already a dependency). Show when the form is dirty vs the last loaded/saved snapshot (title, description, threshold, components).

- Save action → existing `handleSubmit`
- Discard → restore snapshot
- After successful save, mark clean
- Tests: mock `SaveBar` like `TitleBar` is already mocked in `RitualForm.test.tsx`

Before writing, search App Bridge SaveBar via the shopify-polaris-app-home skill:

```
node "C:\Users\Dennis\.cursor\plugins\cache\cursor-public\shopify-plugin\c164cf45c4bc1d17bbc105168d99a4f744cfaac2\skills\shopify-polaris-app-home\scripts\search_docs.mjs" "SaveBar"
```

If the React `SaveBar` API is awkward in tests, a documented `shopify.saveBar.show/hide` fallback is acceptable; prefer the React component.

### 3. Resolve alerts from Dashboard

`POST /api/alerts/:id/resolve` already exists. `AlertBanner` currently has no action.

- Add a **Resolve** banner action per alert
- Call `api.post(\`/api/alerts/${id}/resolve\`, {})`
- On success: remove that alert from the list + toast `"Alert resolved"`
- Keep existing Dashboard alert tests passing; add a resolve click test

`api.post` may need mocking in Dashboard tests (check current mock).

### 4. RitualForm load error retry

Load-error Banner currently only has “Back to routines”. Add **Retry** that re-fetches `GET /api/rituals/:id`.

### 5. Mobile ritual builder stacked

In `theme/sections/soft-ritual-builder.liquid`, `.ritual-builder__result-products` is still 3 columns at `max-width: 699px`. Change small screens so the result cards **stack** (1 column) at `max-width: 479px` (or 480px). Leave tablet 3-col if it already fits. Steps/choices are already column-first — do not restyle the whole builder.

**Shopify Liquid skill is mandatory** for this Liquid/CSS edit:

1. `node "...\shopify-liquid\scripts\search_docs.mjs" "<query>"` before writing
2. After edit, `node "...\shopify-liquid\scripts\validate.mjs"` with `--code`, `--model`, `--client-name cursor`, `--client-version`, `--artifact-id`, `--revision` (start at 1)

Skill path: `C:\Users\Dennis\.cursor\plugins\cache\cursor-public\shopify-plugin\c164cf45c4bc1d17bbc105168d99a4f744cfaac2\skills\shopify-liquid\`

User-facing copy stays in `{{ 'key' | t }}` if you add any (max 3 locale levels). Prefer CSS-only.

### 6. Console-clean build

From `k:\Elora\app\web` (PowerShell — no `&&`):

```
Set-Location k:\Elora\app\web
npm run build
```

Fix TypeScript/Vite **warnings and errors** you introduce or that are trivial. Do not change server `console.log('Server ready')`. Do not add eslint config churn.

## Tests

TDD for new UI behavior. Commands:

```
Set-Location k:\Elora\app\web
npx vitest run
npm run build
```

Keep existing RitualForm / Rituals / Dashboard / Settings tests green.

## Report

Write full report to `k:\Elora\.superpowers\sdd\task-15b-report.md`.

Return only: Status, test summary, build result, concerns, report path.
