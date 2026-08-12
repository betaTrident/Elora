# SDD Progress Ledger — Elora / RitualScore

## Phase 1 — Project Scaffold & Tooling

- Task 1: complete (no commits — user forbade commits; review approved after fix pass)
  - Implementer: scaffold + Docker MySQL + /health + tsc + eslint
  - Fix pass: `.npmrc` (`legacy-peer-deps=true`), gitignored `app/server/.env`
  - Review: Approved
  - Minor (deferred): MODULE_TYPELESS_PACKAGE_JSON on `eslint.config.js`; copy `.env` to `app/server/.env` as well as repo root for dotenv cwd

## Phase 2 — Database Schema & Migrations

- Task 2: complete (no commits; review approved)
  - 8 Drizzle tables + client + migrate + `drizzle/0001_initial.sql` applied to Docker MySQL
  - FK: `ritual_components.ritual_id` → `rituals.id` ON DELETE CASCADE
  - Minor (deferred): SQL trailing newline; journal idx 0 vs tag `0001_initial`
