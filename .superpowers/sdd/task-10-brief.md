# Task 10: Phase 10 — Settings Page

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 10 (lines 1743–1827). Goal also requires Recalculate all.

## Where this fits

Phases 0–9 are done. `GET/PUT /api/settings` exist but use an **in-memory Map** (`services/settings.ts`). Settings UI is a placeholder. `createRitual` already reads `shopSettings.defaultThreshold`. Auth already inserts a `shop_settings` row on first shop upsert.

Work from `k:\Elora`. **Do not commit.** Do not edit `IMPLEMENTATION_PLAN.md`.

## Skills

- **tdd-workflow:** tests first (RED then GREEN). Record RED/GREEN evidence in the report.
- **backend-patterns, api-design:** shop-scoped queries, try/catch `next(e)`, no secrets.
- **frontend-patterns, accessibility:** Polaris React 13 only — **not** `s-*` web components. Merchant copy says **routine**, not ritual.
- **shopify-polaris-app-home:** Card, RangeSlider, Button, Banner, Skeleton, Toast (Toast must live under existing `PageLayout` `Frame`).

## Controller resolutions (do not re-ask)

1. **Keep the service layer.** Do not move Drizzle into the route as the plan snippet does. `routes/settings.ts` stays thin (Zod + `settingsService` + `next(e)`). Make `getSettings` / `updateSettings` **async** and persist with Drizzle.
2. **Upsert, do not update-only.** Plan `db.update` is a no-op if the row is missing. Use `insert` + `onDuplicateKeyUpdate` on `shopSettings` (same pattern as `auth.ts`). GET still returns `{ defaultThreshold: 70 }` when no row.
3. **`logActivity` already exists.** On successful PUT: `actorType: 'merchant'`, `actorId: shop.userId ?? undefined`, `action: 'settings.updated'`, `entityType: 'shop_settings'`, `summary: \`Default threshold set to ${defaultThreshold}\``, `afterJson: { defaultThreshold }`. Do not rewrite `logActivity`.
4. **Do not change existing rituals’ `scoreThreshold` when the default changes.** Done when: **new** rituals created after the change use the new default (`createRitual` already does this).
5. **Recalculate all is in scope** (Phase Goal). `POST /api/scores/recalculate-all` (product plan). Implement `recalculateAllRituals(shop)` in `services/rituals.ts`: list **active** rituals for the shop, call existing `recalculateRitual` **sequentially** for each, return `{ recalculated: number }`. Do **not** change `GET /api/scores/:id` stub. Add the POST to the `api.test.ts` 401 sweep.
6. **No second TitleBar.** `PageLayout` already renders TitleBar. Settings page: `PageLayout title="Settings"` only.
7. **Toast** inside `PageLayout` children (Frame already wraps Page). Polariss `<Toast content="Settings saved" onDismiss={...} />` after save. Separate toast for recalculate-all success (`Recalculated N routines` / singular).
8. **Loading / error:** SkeletonPage / SkeletonBodyText while GET settings loads; Banner + retry on load/save failure. Match Dashboard/Activity, not spinner-only.
9. **Named export `Settings`** — keep `export function Settings` to match `routes.tsx`. Do not switch to `export default function SettingsPage`.
10. **Activity filter:** add `{ label: 'Settings', value: 'settings.updated' }` to `ACTION_OPTIONS` in Activity so the new log line is filterable.
11. **Do not** implement Phase 11 theme, scoreSnapshots, or change scoring math.
12. **Immutability:** no in-place mutation. PowerShell: **no `&&`**.

## Backend

### `app/server/src/services/settings.ts`

Replace the Map.

```ts
getSettings(shopId: string): Promise<{ defaultThreshold: number }>
updateSettings(shop: ShopContext, defaultThreshold: number): Promise<{ defaultThreshold: number }>
```

(`ShopContext` so `logActivity` can set `actorId`. Route currently passes `shopId` only — update the route to pass `req.shop`.)

### `app/server/src/routes/settings.ts`

- GET: `await getSettings(req.shop.shopId)`
- PUT: parse Zod, `await updateSettings(req.shop, body.defaultThreshold)`, return `{ defaultThreshold }`

### `app/server/src/services/rituals.ts`

```ts
recalculateAllRituals(shop: ShopContext): Promise<{ recalculated: number }>
```

Active only (`status = 'active'`). Reuse `recalculateRitual` (already scores + logs + `upsertAlerts`).

### `app/server/src/routes/scores.ts`

`POST /recalculate-all` → `recalculateAllRituals(req.shop)` then JSON `{ recalculated }`. Keep `GET /:id` stub.

## Frontend

Replace `app/web/src/pages/Settings/index.tsx` placeholder.

- Fetch `/api/settings`, RangeSlider 0–100 step 5, label `Threshold: ${threshold}`
- Copy: heading **Default health threshold**; help: **Routines scoring below this will trigger an alert.**
- Primary **Save settings** → `PUT /api/settings` `{ defaultThreshold: threshold }`
- Secondary **Recalculate all routines** → `POST /api/scores/recalculate-all` `{}` (api.post requires a body; use `{}`)
- Do not add Recalculate all to the Dashboard or ritual list (Settings only)

## Tests (TDD)

**Server — `services/settings.test.ts` (new)**

- GET missing row → `{ defaultThreshold: 70 }`
- PUT upserts and returns the new threshold
- PUT calls `logActivity` with `settings.updated` and the summary above

**Server — `rituals.test.ts`**

- `recalculateAllRituals` calls `recalculateRitual` once per active ritual (spy or stub list); empty → `{ recalculated: 0 }`
- Optional: `createRitual` without `scoreThreshold` uses settings row `defaultThreshold: 80` → `result.threshold === 80` (mock the settings select). Skip if too invasive; GET/PUT persistence is the main Done when.

**Server — `api.test.ts`**

- Keep PUT 400 out-of-range
- PUT 200: spy `updateSettings` (now async) so the in-memory Map is gone
- GET `/api/settings` 200 with spy
- POST `/api/scores/recalculate-all` 200 `{ recalculated }` with spy; 401 without token

**Web — `pages/Settings/__tests__/Settings.test.tsx` (new)**

- Renders RangeSlider from GET `{ defaultThreshold: 75 }` (label includes 75)
- Save clicks PUT `/api/settings` with `{ defaultThreshold: 75 }` (or the loaded value)
- Recalculate all clicks POST `/api/scores/recalculate-all`
- Empty/error: Banner when GET rejects

**Web — Activity:** assert Settings option exists **or** skip if you only add the option without a new test (acceptable).

## Commands (PowerShell: no `&&`)

```
Set-Location k:\Elora\app\server
npx vitest run
npx tsc --noEmit
npm run lint

Set-Location k:\Elora\app\web
npx vitest run
npx tsc --noEmit
```

## Done when

- Threshold saves and persists (Drizzle `shop_settings`, not a Map)
- New rituals created after threshold change use the new default
- Activity log shows `settings.updated`
- Recalculate all rescores every **active** ritual
- Tests + tsc pass (server + web)

## Constraints

- No git commit, no secrets, no `IMPLEMENTATION_PLAN.md` edits
- No Phase 11 theme
- No scoreSnapshots

## Reports

Backend only → `k:\Elora\.superpowers\sdd\task-10-backend-report.md`  
Frontend only → `k:\Elora\.superpowers\sdd\task-10-frontend-report.md`
