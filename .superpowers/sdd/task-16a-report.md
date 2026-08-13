# Task 16A Report — Phase 16 README.md

## Status

**DONE**

## Commits

none (per task instructions)

## Files changed

- `README.md` — expanded from 5-minute demo script only to full Phase 16 developer onboarding doc

## Work completed

Expanded `README.md` per `task-16a-brief.md` with all required headings:

1. Title + intro (Elora theme + RitualScore app)
2. Prerequisites (Node 20+, Docker, Partner account, Shopify CLI install command)
3. Setup (< 30 minutes) — steps 1–8 with accurate commands
4. Architecture — short paragraph + link to `APP_DECISIONS.md` (no essay duplication)
5. Tech Stack — table aligned with IMPLEMENTATION_PLAN section 2 / brief list
6. 5-minute demo script — all 8 original steps retained; seed command formatted as fenced block

## Self-review (accuracy vs repo)

| Source | Verified |
|--------|----------|
| Root `package.json` | Workspaces `app/server`, `app/web`; `npm install` from root |
| `.env.example` | All six variables + defaults match verbatim |
| `docker-compose.yml` | MySQL 8.0, `ritual_score`, user/pass `ritual`, port 3306 |
| `app/server/package.json` | `db:migrate`, `db:seed`, `dev` scripts used correctly |
| `app/server/shopify.web.toml` | `dev = "npm run dev"`, role backend |
| `app/web/shopify.web.toml` | `dev = "npm run dev"`, role frontend |
| `app/web/vite.config.ts` | Port 5173 default; proxies `/api`, `/health` → 3000 |
| `app/server/src/db/seed.ts` | "Install app first" and `write_products` messages referenced accurately |

## Concerns

- `APP_DECISIONS.md` is linked but not yet created (Task 16B owns it); link will 404 until 16B lands.
- Brief specifies `.env` at repo root and `app/server/.env` only; Vite loads env from `app/web` cwd when run standalone — acceptable per brief; `shopify app dev` is the primary path.

## Report path

`k:\Elora\.superpowers\sdd\task-16a-report.md`

---

## Post-review fix (2026-08-14)

### Status

**DONE**

### Changes

- README seed sentence: **9** → **12** Elora SKUs (matches `ELORA_PRODUCTS` catalog).
- Added one-line note before step 4: steps 4–8 assume repo root (new shell or `cd` back after `cd app/server`).

### Appendix — catalog count evidence

- `app/server/src/db/elora-catalog.test.ts` line 33: `expect(ELORA_PRODUCTS).toHaveLength(12)`
- `app/server/src/db/elora-catalog.ts`: `ELORA_PRODUCTS` array contains 12 product objects (lines 43–164)
