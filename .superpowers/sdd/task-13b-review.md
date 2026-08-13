### Spec Compliance

- ✅ hang fixed

`app/server/src/db/seed.ts` now calls `process.exit` on every CLI terminal path, matching `migrate.ts:7` / `:12`. The mysql2 pool imported via `./client` (`seed.ts:2`) can no longer keep the event loop alive after seed finishes.

| Path | File:line | Exit |
|---|---|---|
| No shop | `seed.ts:51-53` | `Install app first` then `process.exit(0)` |
| Unresolved products (`resolveRituals` → `[]`) | `seed.ts:79-85` | skip message, `Rituals: 0 created, ${SAMPLE_RITUALS.length} skipped`, `process.exit(0)` |
| Success (creates and/or existing-title skips) | `seed.ts:115-116` | `Rituals: N created, M skipped` then `process.exit(0)` |
| Thrown error | `seed.ts:119-121` | `console.error` then `process.exit(1)` |

No fall-through after the products count log (`seed.ts:76`): empty `resolveRituals` takes the early exit; otherwise the ritual loop (`:97-111`) always reaches `:115-116`. Per-SKU lookup/create failures return `null` and `continue` (`:69-70`); they are not process terminals. Throws from `seed()` (settings upsert, GraphQL lookup, `createRitual`) hit `.catch`.

The unresolved-products path now prints the rituals count line (`:83`), so both spec count lines always appear.

### Issues (new regressions only)

#### Critical (Must Fix)

- None.

#### Important (Should Fix)

- None.

#### Minor (Nice to Have)

- None new. Prior deferred Minors not re-litigated.

### Assessment

**Task quality:** Approved

**Reasoning:** The Important hang was missing `process.exit(0)` after successful work and after the no-IDs skip. Both are present; the no-shop and catch exits were already correct. The seed.ts-only fix does not introduce a new terminal that leaves the pool open.
