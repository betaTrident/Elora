# Design brief — RitualScore Admin (Phases 5–6)

You are the design/UX lead. Write design notes only. Do not implement app code. Do not commit.

## Product

Embedded Shopify Admin app **RitualScore** (not the Elora storefront). Merchants track beauty **routine kits** and health scores.

Brand lock for the **storefront** is soft/elegant/feminine — that is Phase 11 theme. **This admin UI must be Polaris-native**, Built-for-Shopify, not a custom marketing aesthetic. taste-skill explicitly does not apply to dashboards.

## Constraints

- Polaris React 13 + App Bridge CDN (already in repo)
- Nav: Dashboard, Routines, Activity, Settings
- Copy: “routine” in UI, not “ritual”
- WCAG 2.2 AA via Polariss components
- Empty / loading / error states required on Dashboard
- Do not invent extra nav items or settings chrome

## Deliverable

Write `k:\Elora\.superpowers\sdd\phase-5-6-design.md` with:

1. One-line design read
2. Phase 5 placeholder pages: heading, 1–2 sentence copy, TitleBar title per route
3. ScoreBadge language (Healthy / At risk / Broken / Not scored) — already specified; confirm
4. Dashboard populated layout: KPI row, worst-5 table columns, recent activity list
5. Empty state heading + description + CTA (plan has copy — keep it)
6. Loading skeleton vs error banner
7. Accessibility notes (headings, table, live region for loading)
8. What NOT to do (no custom purple gradients, no extra CSS framework, no s- web components)

Keep it under ~120 lines. Polariss tokens only (gap 300/400/500, Card, IndexTable, Banner, Skeleton*).
