# Task 7: Phase 7 — Ritual CRUD

Source: `k:\Elora\IMPLEMENTATION_PLAN.md` Phase 7.

## Where this fits

Phases 0–6 are done. Rituals API is **stub/mock**. Dashboard already filters `status = 'active'`. This task: real Drizzle CRUD, score-on-save, list + create/edit form, Resource Picker.

Work from `k:\Elora`. Do not commit. Do not edit `IMPLEMENTATION_PLAN.md`.

## Skills

- **shopify-polaris-app-home:** Resource Picker is App Bridge `shopify.resourcePicker({ type: 'product', multiple: true })` — **not** the old `<ResourcePicker>` React component (v4 + CDN). Docs: https://shopify.dev/docs/api/app-home/apis/user-interface-and-interactions/resource-picker-api
- **shopify-admin:** Admin GraphQL for inventory on save. Search `scripts/search_docs.mjs` then `validate.mjs` before shipping the query. API version **2025-01** (matches `shopify.app.toml` webhooks). Scopes already `read_products,read_inventory`.
- **tdd-workflow, backend-patterns, frontend-patterns, api-design, accessibility**
- Polariss React 13 only — no `s-*` web components
- Copy: “routine” in UI, not “ritual”

## Controller resolutions (do not re-ask)

1. **Do not implement Phase 8 Activity page or Phase 9 alerts.** Do implement:
   - `calculateHealthScore` in `app/server/src/services/scoring.ts` (Phase 9 snippet — required so score appears on save)
   - `logActivity` insert-only in `app/server/src/services/activity.ts` (Phase 8 snippet — create/update/archive call it)
   - `fetchInventory` in `app/server/src/shopify/graphql.ts`
   - **Skip `upsertAlerts`**
2. **Resource Picker:** `await shopify.resourcePicker({ type: 'product', multiple: true, action: 'add' })`. Cancel → `undefined`. Selection is `Product[]` with `id`, `title`, `variants`. Extend `vite-env.d.ts` `shopify` type. Do not import `ResourcePicker` from `@shopify/app-bridge-react` unless the installed package actually exports it (v4.2 typically does not).
3. **404:** any missing id (DB empty), not only the string `'missing'`.
4. **`api.test.ts`:** keep 400 Zod, 401 sweep, 500 spy. Update 201 so it does **not** require `id: 'mock-ritual-id'` (uuid string is fine). Mock `getDashboardData` stays. Mock `fetchInventory` / db in **service** tests; HTTP tests may mock `../services/rituals` for 201/404 if that is cleaner than a full db mock.
5. **Zod:** keep createSchema; add optional `productTitleCache: z.string().max(255).optional()` and allow `shopifyVariantId` null.
6. **listRituals:** honor `?status=`; default **active** for the list page. Dashboard already excludes archived.
7. **Score on save:** after insert/update, fetchInventory → calculateHealthScore → set `lastScore` + `lastScoredAt`. If GraphQL fails, still persist the ritual and score with **empty inventory** (do not abort the write); log the error server-side.
8. **Immutability:** no in-place row mutation; new arrays/objects.
9. **Do not** build scoring UI breakdown page beyond showing the returned score (ScoreBadge on list; toast or banner with score after save is enough).

## API shapes

**GET `/api/rituals`** → array of `{ id, title, lastScore, scoreThreshold, lastScoredAt, status, description }`

**GET `/api/rituals/:id`** → that plus `components: [{ id, shopifyProductId, shopifyVariantId, productTitleCache, role, quantity, unitCost, sortOrder }]`

**POST `/api/rituals`** 201 `{ id, score, breakdown, threshold }`

**PUT `/api/rituals/:id`** 200 same

**POST `/api/rituals/:id/archive`** 200 `{ ok: true }` — set `status: 'archived'`

## Backend files

### `services/scoring.ts`
Copy Phase 9 `calculateHealthScore` + types. Include the 5 unit tests from the plan (`scoring.test.ts`).

### `shopify/graphql.ts`
`fetchInventory(shop: ShopContext, productIds: string[]): Promise<InventoryInfo[]>`

- Load `shops.accessToken` for `shop.shopId`
- POST `https://{shop.shopDomain}/admin/api/2025-01/graphql.json` with `X-Shopify-Access-Token`
- Query `nodes(ids:)` → Product `id`, `status`, first variant `id`, `price`, `inventoryQuantity`
- Map to `{ productId, variantId?, available, status, price }`
- Validate the GraphQL with shopify-admin `validate.mjs`

### `services/activity.ts`
`logActivity(tx, input)` insert into `activityLogs` as Phase 8 snippet.

### `services/rituals.ts`
Replace mocks with Drizzle:

- `createRitual` as plan (transaction: ritual, components, inventory, score, log `ritual.created`)
- `updateRitual`: 404 if missing/wrong shop; replace components (delete+insert or equivalent); rescore; log `ritual.updated`
- `archiveRitual`: 404 if missing; set archived; log `ritual.archived`
- `getRitual` / `listRituals` as above
- `recalculateRitual` may call the same score path (useful); keep endpoint working

MySQL: generate UUIDs in app (`crypto.randomUUID()`). `unitCost` is decimal — stringify if Drizzle requires.

## Frontend files

### Types
Add `Component` to `app/web/src/types/index.ts`:
```
role: 'cleanse' | 'treat' | 'seal' | 'scent'
shopifyProductId, shopifyVariantId?, productTitleCache?, quantity, unitCost?, sortOrder?
```

### List `pages/Rituals/index.tsx`
Fetch GET `/api/rituals`. IndexTable: title (link edit), ScoreBadge, threshold, archive action with Polariss Modal confirm. EmptyState + Create routine CTA. Loading skeleton. Error banner.

### Form `pages/Rituals/RitualForm/index.tsx`
Create vs edit via `useParams`. Fields: title, description, scoreThreshold. `ComponentList`. Submit POST or PUT. On success navigate to `/rituals` (or stay on edit). Show Banner with score after save. Client-side: block submit with 0 components (server still Zod 400).

### `ComponentList.tsx` / `ComponentRow.tsx`
Plan UX (roles, qty, remove) but picker via `shopify.resourcePicker`. Map selection:
```
shopifyProductId: p.id
shopifyVariantId: p.variants?.[0]?.id ?? null
productTitleCache: p.title
role: 'cleanse'
quantity: 1
sortOrder: components.length + i
```
Do not mutate `components` in place.

## Tests (TDD)

**Server**
- scoring.test.ts — 5 plan cases
- rituals.test.ts — create inserts + scores; get 404; archive sets archived; list defaults active; update 404
- api.test.ts — POST `{}` 400; POST valid 201 with score; GET/PUT missing 404; 401s still pass

**Web**
- Rituals list empty heading when `api.get` returns `[]`
- RitualForm: submit without components does not POST (or shows validation)
- ComponentList/row: changing role calls onChange with new object (optional)

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

- Create form validates and submits; ritual appears in list
- Zod 400 on missing title or empty components
- Edit form pre-fills all fields
- Archive changes status; archived filtered from dashboard (existing dashboard query)
- Score appears immediately after save

## Constraints

- No git commit, no secrets in reports
- No Phase 8 activity UI, no Phase 9 alert upsert, no theme work

## Reports

If you implement **backend only**, write `k:\Elora\.superpowers\sdd\task-7-backend-report.md`
If you implement **frontend only**, write `k:\Elora\.superpowers\sdd\task-7-frontend-report.md`
If you implement **both**, write `k:\Elora\.superpowers\sdd\task-7-report.md`
