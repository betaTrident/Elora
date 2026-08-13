### Spec Compliance

- ✅ Spec compliant
- ⚠️ Cannot verify from diff: claimed `npx vitest run` 23/23 (6 files) and `tsc --noEmit`, plus RED-then-GREEN evidence (suite not re-run per review rules)

Frontend Done-when and controller resolutions that apply to the web slice are present in the uncommitted diff. Settings is a named `Settings` export with `PageLayout title="Settings"` only (no second App Bridge `TitleBar`). GET `/api/settings` drives a Polariss `RangeSlider` 0–100 step 5 labeled `Threshold: ${threshold}`; heading and help copy match the spec; primary Save PUTs `/api/settings` `{ defaultThreshold }`; secondary Recalculate all POSTs `/api/scores/recalculate-all` `{}`. Loading uses `SkeletonPage` + `SkeletonBodyText`; GET failure is a critical Banner with Retry refetch; save/recalculate failures also Banner + Retry. Toasts are Polariss `<Toast>` under `PageLayout` (existing `Frame`): `Settings saved` and `Recalculated N routines` / singular. Activity `ACTION_OPTIONS` includes `{ label: 'Settings', value: 'settings.updated' }`. Polariss React 13 only (no `s-*`). Merchant copy on this page says **routine**. Required tests appear in the diff. Recalculate all is Settings-only (Dashboard / ritual list unchanged). No Phase 11 theme, scoreSnapshots, scoring-math edits, `IMPLEMENTATION_PLAN.md` edits, or commits in this slice. Phase 9 types in `types/index.ts` were not judged; the only additions are `ShopSettings` and `RecalculateAllResponse`.

Report claims checked against the diff: named export, no extra TitleBar, RangeSlider bounds/step/label, exact heading/help strings, PUT/POST paths and bodies, skeleton + GET Banner retry, save/recalculate toasts (including singular helper), Activity filter option, Settings-only recalculate-all, Polariss-only imports, and the listed test cases are all in the diff. Claimed vitest/tsc totals and the RED log are report-only.

### Strengths

- Controller overrides the plan snippet correctly: named `export function Settings` (matches `routes.tsx`), no second `TitleBar`, Recalculate all on Settings only, Toast inside `PageLayout` children rather than the plan’s extra App Bridge bar and `export default function SettingsPage`.
- Loading/error match Activity, not spinner-only: `SkeletonPage` + `SkeletonBodyText` while GET runs; GET failure Banner **Settings failed to load** retries via `fetchSettings()` (refetch, not `window.location.reload`). Save and recalculate each have their own critical Banner + Retry.
- RangeSlider and copy are exact: `min={0}` `max={100}` `step={5}` `label={\`Threshold: ${threshold}\`}` `output`; heading **Default health threshold**; help **Routines scoring below this will trigger an alert.**
- API contracts are wired as specified: `PUT /api/settings` `{ defaultThreshold: threshold }`; `POST /api/scores/recalculate-all` `{}` (required because `api.post` JSON.stringifies the body). Buttons `loading`/`disabled` so save and recalculate cannot run together.
- Recalculate toast pluralization is implemented (`Recalculated 1 routine` vs `Recalculated ${count} routines`), not a hardcoded plural.
- Activity filter is the required `{ label: 'Settings', value: 'settings.updated' }`, with a unit test for the option (brief allowed skipping that test).
- Required web tests are in the diff: RangeSlider from GET 75 (label + heading + help); Save PUT `{ defaultThreshold: 75 }` + **Settings saved**; Recalculate POST `{}` + **Recalculated 3 routines**; Banner when GET rejects. Extra: PUT-failure Banner. No `ritual` in Settings merchant copy. State updates are immutable (`useState` setters only). Focused grep: `recalculate-all` / **Recalculate all** exist only under Settings (RitualForm’s single **Recalculate** is unchanged and out of this diff).

### Issues

#### Critical (Must Fix)

None.

#### Important (Should Fix)

None.

#### Minor (Nice to Have)

1. **Help copy is not `RangeSlider` `helpText`** (`Settings/index.tsx`)
   - The spec/plan snippet uses a subdued `<Text as="p">` sibling, which this implements, so it is not a spec miss.
   - Screen readers may not associate “Routines scoring below this will trigger an alert.” with the slider (`aria-describedby` / Polariss `helpText` would).

2. **Recalculate-all failure and GET Retry click are not unit-tested** (`Settings.test.tsx`)
   - PUT-failure Banner is covered; recalculate-all failure Banner + Retry is implemented but untested.
   - GET Retry presence is asserted; the refetch click is not.
   - Brief required tests are still present.

3. **Singular toast path is untested** (`recalculateToastContent`)
   - Implementation branches on `count === 1`; the suite only asserts **Recalculated 3 routines**.
   - Optional pin: `{ recalculated: 1 }` → **Recalculated 1 routine**.

4. **Malformed `recalculated` is not guarded**
   - `recalculateToastContent(result.recalculated)` will interpolate `undefined` if the payload is missing the field.
   - Backend contract is `{ recalculated: number }`; this is defense-in-depth, not a spec gap.

5. **Toast may not remount when the message changes**
   - `{toast && <Toast content={toast} onDismiss={...} />}` reuses the same instance if save then recalculate fire before dismiss. `key={toast}` would force a fresh Polariss announcement. Unlikely in normal use.

### Assessment

**Task quality:** Approved

**Reasoning:** The Settings page and Activity filter match the frontend controller and required tests: Polariss 13 RangeSlider, PUT/POST contracts, skeleton/Banner, toasts, named export, no second TitleBar, Recalculate all Settings-only, routine copy. Remaining notes are a11y polish and extra test pins, not spec gaps.
