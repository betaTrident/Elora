### Spec Compliance (the two Important items)

- ✅ both fixed

**#1 Double-click / click-through skipping a quiz step — fixed.** `theme/assets/ritual-builder.js:39`, `:64–85`, `:230–238`

`nextStep()` sets `advancing = true` (`:66`) before swapping `hidden` on `[data-step]` (`:71–73`) and before `showResult()` (`:75–77`). Unlock is a `setTimeout` of **400ms** (`:82–85`), not `requestAnimationFrame`. No `rAF` remains in the file. While the lock is held, `if (advancing) return` (`:39`) exits the `[data-filter]` branch before membership or `push`, so a second click on the newly visible step (Morning under Glow’s slot, `theme/sections/soft-ritual-builder.liquid:22–35`, `:119–123`) cannot advance. Sequence: Glow → lock true → step 2 shown → lock still true for 400ms → stray click dropped → timeout clears `advancing` and `advancingTimeout` (`:82–84`). Current-step membership is unchanged (`:41–48`: `closest('[data-step]')`, not `hidden`, `dataset.step === String(currentStep)`). `resetBuilder()` `clearTimeout(advancingTimeout)` and nulls it (`:230–232`), then `advancing = false` (`:238`), so a pending unlock cannot fire after Start over and release a later lock early. Restart is `[data-restart]`, not `[data-filter]`, so the lock does not strand Start over.

**#2 Restart during in-flight add still redirects to `/cart` — still fixed.** `theme/assets/ritual-builder.js:178–227`

`addGeneration` / `requestGeneration` (`:178–179`, `:201`, `:205`, `:210`) drops stale `then` / `catch` / redirect work. `AbortController` is the fetch `signal` (`:181–184`, `:198`) and is aborted on a newer add and in `resetBuilder()` (`:220–222`). `addRedirectTimeout` is cleared before a new add (`:186–188`) and on restart (`:225–227`). `AbortError` does not show error UI (`:211`). Restart still bumps generation first (`:218`), then re-enables Add (`:251–253`). Redirect cannot run after Start over.

**Unchanged contract (no regression):** AND-tag `every` + `slice(0, 3)` (`:88–96`); zero-match fallback `productsData.slice(0, 3)` (`:131–133`); `properties: { 'Elora Ritual': ritualName }` (`:168`); `ritualName` suffixes joined with ` · ` (`:154–158`); cards via `createElement` / `textContent` / `img.src`, no `innerHTML`, falsy image omitted (`:105–125`); each `[data-ritual-builder]` inits with section-scoped clicks (`:2–7`, `:38`, `:55`, `:59`); script load stays in `theme/layout/theme.liquid:22`. Diff-file `┬╖` / `ΓÇö` is packaging mojibake; on disk the strings are ` · ` and `—`.

### Issues (new regressions only)

#### Critical (Must Fix)

_None._

#### Important (Should Fix)

_None._

#### Minor (Nice to Have)

_None new._ Prior deferred Minors not re-litigated.

### Assessment

**Ready to merge?** Yes

**Reasoning:** The 400ms `setTimeout` lock is acquired before the next step is shown and still held afterward, `if (advancing) return` blocks click-through onto the replacement choice, and `resetBuilder()` clears the timeout so Start over cannot leave a stale unlock. Restart-during-add is unchanged (generation token, abort, cleared redirect). Filter, `Elora Ritual`, and DOM cards did not regress.
