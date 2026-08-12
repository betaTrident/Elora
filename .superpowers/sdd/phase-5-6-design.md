# RitualScore Admin — Phase 5–6 Design Notes

## 1. One-line design read

Polaris-native merchant dashboard: clean KPI row, worst-routine triage table, and live activity feed — no brand chrome, no custom CSS, Built-for-Shopify compliant.

---

## 2. Phase 5 — Placeholder pages

| Route | TitleBar `title` | `<Page>` heading | 1–2 sentence placeholder copy |
|---|---|---|---|
| `/` | `RitualScore` | `Dashboard` | Overview of your store's routine health. KPIs and alerts load here once you've created routines. |
| `/rituals` | `Routines` | `Routines` | All active routine kits appear here. Create, edit, or archive kits from this list. |
| `/rituals/new` | `Create routine` | `Create routine` | Define a new kit — name, products, and scoring threshold. Changes are saved automatically. |
| `/rituals/:id/edit` | `Edit routine` | `Edit routine` | Update an existing kit's products or scoring rules. |
| `/activity` | `Activity` | `Activity` | A chronological log of score changes, alerts, and kit events across your store. |
| `/settings` | `Settings` | `Settings` | Configure scoring thresholds and notification preferences for your store. |

Each placeholder renders a `<Page title={…}>` wrapped in `<Frame>`, with `<TitleBar title={…} />` from `@shopify/app-bridge-react`. No additional content until the feature phase ships.

---

## 3. ScoreBadge language — confirmed

| Condition | `<Badge>` tone | Display text |
|---|---|---|
| `score === null` | (default) | `Not scored` |
| `score >= threshold && score >= 80` | `success` | `Healthy · {score}` |
| `score >= threshold && score < 80` | `attention` | `At risk · {score}` |
| `score < threshold` | `critical` | `Broken · {score}` |

The `·` separator (U+00B7) keeps label and number together without a colon. Do not use colour alone to convey status — the text label carries semantic meaning for screen readers.

---

## 4. Dashboard — populated layout

### KPI row (`KpiCards`)

Four `<Card>` tiles in a CSS `auto-fit` grid (min 160 px), `gap="300"` between tiles via `BlockStack`:

| Label | Value | `tone` on number |
|---|---|---|
| Total routines | `counts.total` | — |
| Healthy | `counts.healthy` | `success` |
| At risk / Broken | `counts.broken` | `critical` |
| Open alerts | `counts.openAlerts` | `caution` |

Section heading: `<Text as="h2" variant="headingMd">Store routine health</Text>` above the grid.

### Worst-5 table (`RitualHealthTable`)

`<IndexTable>` — 8/12 columns on large screens (`Grid.Cell columnSpan={{ xs: 6, lg: 8 }}`).

| Column | Source | Notes |
|---|---|---|
| Routine name | `ritual.name` | Link to `/rituals/:id/edit` |
| Score | `ritual.lastScore` | Rendered via `<ScoreBadge>` |
| Threshold | `ritual.scoreThreshold` | Plain number |
| Last checked | `ritual.updatedAt` | Relative time (e.g. "3 h ago") |

Heading: `<Text as="h2" variant="headingMd">Routines needing attention</Text>` above the table.

### Recent activity (`RecentActivity`)

`<Card>` — 4/12 columns on large screens (`Grid.Cell columnSpan={{ xs: 6, lg: 4 }}`).

`<ResourceList>` or simple `<BlockStack gap="300">` of `<Text>` lines, max 5 entries:

- Icon-free: timestamp (relative) + event description string
- Heading: `<Text as="h2" variant="headingMd">Recent activity</Text>`

---

## 5. Empty state

Shown when `data.counts.total === 0` (no routines created yet).

```
heading:     "Start tracking your beauty routines"
description: "Create your first routine kit and see its health score instantly."
CTA:         <Button variant="primary" url="/rituals/new">Create routine</Button>
image:       Shopify CDN generic empty-state illustration
             https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png
```

TitleBar primary action mirrors CTA: `{ label: 'Create routine', url: '/rituals/new' }`.

---

## 6. Loading skeleton vs error banner

### Loading (`loading === true`)

Replace the entire page body with Polaris skeleton components — do NOT use a centred `<Spinner>` in production layouts.

```
<SkeletonPage primaryAction>
  <Layout>
    <Layout.Section>
      <SkeletonBodyText lines={4} />   {/* KPI row approximation */}
    </Layout.Section>
    <Layout.Section>
      <SkeletonBodyText lines={8} />   {/* table approximation */}
    </Layout.Section>
  </Layout>
</SkeletonPage>
```

`<SkeletonPage>` sets `aria-busy` implicitly; add `aria-live="polite"` wrapper (see §7).

### Error (`error !== null`)

```
<Banner tone="critical" title="Dashboard failed to load">
  {error.message}
  <Button onClick={() => window.location.reload()}>Retry</Button>
</Banner>
```

Render inside `<PageLayout title="Dashboard">` so the chrome remains stable. Do not mask the error with another skeleton.

---

## 7. Accessibility notes

- **Heading hierarchy:** `<Page title="Dashboard">` renders an `<h1>`. KPI section and table section headings use `<Text as="h2" variant="headingMd">`. No `<h3>` or deeper on this page.
- **Table:** `<IndexTable>` emits a `<table>` with proper `<th scope="col">` headers — do not replace with a `<div>` grid.
- **Live region for loading:** Wrap the page content area in `<div aria-live="polite" aria-atomic="true">` so screen readers announce when data replaces the skeleton.
- **`<Badge>` colour + text:** Polaris `Badge` already pairs colour with visible text. Never strip the text label for a "clean" icon-only badge.
- **Focus management:** After "Create routine" CTA navigates to `/rituals/new`, React Router handles scroll-to-top; no manual `focus()` call needed on route change (App Bridge handles frame context).
- **Contrast:** All tones (`success`, `critical`, `attention`, `caution`) in Polaris 13 meet WCAG 2.2 AA at default scale. Do not override with custom colours.

---

## 8. What NOT to do

- **No `s-*` web components** (`s-badge`, `s-page`, `s-button`, etc.) — those belong to the Polaris App Home extension surface, not to embedded Polaris React 13 apps.
- **No custom CSS framework** (Tailwind, Bootstrap, UnoCSS). Use Polaris `gap` tokens (`300`, `400`, `500`) and layout primitives (`BlockStack`, `InlineStack`, `Grid`, `Card`) exclusively.
- **No purple/pink brand gradients** on admin chrome. Brand colour stays in the storefront theme (Phase 11). Admin is Polaris-default grey/white.
- **No extra nav items.** Nav is exactly: Dashboard · Routines · Activity · Settings. Do not add "Analytics", "Reports", "Alerts", or any other item.
- **No inline `style={{ color: '…' }}`** overrides on text for status colours — use `<Badge>` with `tone` instead.
- **No `<Spinner>` as the sole loading state** for a full page — use `<SkeletonPage>` + `<SkeletonBodyText>` so layout shift is minimised.
- **Do not show** the Elora storefront logo or brand wordmark inside the admin app frame.
