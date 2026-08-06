# Performance Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild all three performance pages as visual dashboards with KPI cards and accessible charts while preserving the existing filters, values, and tables.

**Architecture:** Add focused, reusable performance visualization components driven entirely by the existing performance fixtures. Keep page orchestration and existing table definitions in `PerformancePages.tsx`, place chart rendering in `PerformanceCharts.tsx`, and place dashboard-specific styles in `performance-dashboard.css` to avoid expanding the shared stylesheet further.

**Tech Stack:** React 19, TypeScript, semantic HTML, inline SVG, CSS Grid/Flexbox, Vite.

---

## Chunk 1: Data and visualization components

### Task 1: Add selected-period trend data

**Files:**
- Modify: `src/features/performance/fixtures.ts`
- Modify: `src/features/performance/PerformancePages.test.tsx`

- [ ] Add a failing test that daily click and conversion totals equal the existing dashboard totals.
- [ ] Add a `PerformanceTrendPoint` interface with date, label, clicks, and conversions.
- [ ] Export three daily points for 2026-08-01 through 2026-08-03.
- [ ] Ensure daily click and conversion totals equal the dashboard KPI totals.
- [ ] Run `npm test -- src/features/performance/PerformancePages.test.tsx`; expect success.
- [ ] Commit fixture and test changes as `test: define performance trend data`.

### Task 2: Build reusable accessible charts

**Files:**
- Create: `src/features/performance/PerformanceCharts.tsx`
- Create: `src/features/performance/PerformanceCharts.test.tsx`

- [ ] Write failing component tests requiring `figure`, `figcaption`, `aria-labelledby`, accessible data lists, top-five truncation, conversion-based sorting with ID-ascending ties, KPI no-result `-`, KPI all-zero `0`, and chart/ranking empty states.
- [ ] Run `npm test -- src/features/performance/PerformanceCharts.test.tsx`; expect FAIL because the visualization components do not exist.
- [ ] Implement `PerformanceKpiGrid` with semantic `dl` markup.
- [ ] Implement `PerformanceTrendChart` with dual zero-based SVG axes, solid click line, dashed conversion line, legend, visible point values, and a screen-reader data list.
- [ ] Implement `PerformanceBarChart` with `items: { id; label; sortValue; primaryValue; secondaryValue?; primaryText; secondaryText? }[]`, `mode: "single" | "bar-dot"`, and accessible title props. The component sorts `sortValue` descending then ID ascending, limits to five, uses primary bars, and independently normalizes optional secondary dots.
- [ ] Implement `PerformanceRanking` with explicit rank and conversion value.
- [ ] Keep SVG decorative to screen readers and expose all plotted values in adjacent hidden text.
- [ ] Show a common empty state when items are empty or every primary value is zero; preserve visible zero text where rows exist. Ranking uses the same empty state. KPI values are supplied as `-` for no rows and `0` for all-zero rows.
- [ ] Truncate visible labels with CSS while putting the full label in `title` and accessible data text.
- [ ] Run `npm test -- src/features/performance/PerformanceCharts.test.tsx`; expect success.
- [ ] Commit chart components and tests as `feat: add accessible performance charts`.

## Chunk 2: Page composition

### Task 3: Recompose the dashboard page

**Files:**
- Modify: `src/features/performance/PerformancePages.tsx`
- Modify: `src/features/performance/PerformancePages.test.tsx`

- [ ] Extend page tests to require exact KPI values, named charts, accessible plotted data, sorting, no-result/all-zero behavior, and unchanged filters/tables.
- [ ] Run `npm test -- src/features/performance/PerformancePages.test.tsx`; expect FAIL because the dashboard charts and KPI cards are not rendered.
- [ ] Replace the legacy metric strip with `PerformanceKpiGrid` while retaining the `성과 요약` group name and exact values.
- [ ] Add the selected-period trend chart.
- [ ] Add campaign conversion-rate bars sorted descending with ID-ascending ties, maximum five rows, and `0.00%` when clicks are zero.
- [ ] Add selector conversion ranking sorted by conversions descending with ID-ascending ties and a defined empty state.
- [ ] Keep both existing result tables below the visual summaries.
- [ ] Run `npm test -- src/features/performance/PerformancePages.test.tsx`; expect PASS, then commit as `feat: redesign performance overview`.

### Task 4: Add creator and content visual summaries

**Files:**
- Modify: `src/features/performance/PerformancePages.tsx`
- Modify: `src/features/performance/PerformancePages.test.tsx`

- [ ] Write failing assertions for creator/content KPI totals, chart names, plotted labels, and existing table preservation.
- [ ] Run `npm test -- src/features/performance/PerformancePages.test.tsx`; expect FAIL because creator/content KPI and charts are absent.
- [ ] Calculate creator KPI totals and add a `bar-dot` comparison where view bars and conversion dots are independently normalized before the existing table.
- [ ] Calculate content KPI totals and add single view bars with conversion-rate text before the existing table.
- [ ] Define content 반응 as likes + comments and use the same formula in the KPI and tests.
- [ ] Limit both charts to five items, sort conversions descending then ID ascending, and preserve full long labels for accessible text.
- [ ] Show chart empty states for no rows and all-zero values.
- [ ] Preserve existing page headers, filters, table region names, column labels, and values.
- [ ] Run `npm test -- src/features/performance/PerformancePages.test.tsx`; expect PASS, then commit as `feat: visualize creator and content performance`.

## Chunk 3: Visual system and verification

### Task 5: Add dashboard-specific styling

**Files:**
- Create: `src/styles/performance-dashboard.css`
- Modify: `src/features/performance/PerformancePages.tsx`

- [ ] Import the dedicated stylesheet from the performance page module.
- [ ] Define spacious dashboard layout, KPI cards, chart panels, axes, bars, legends, and ranking cards.
- [ ] Add responsive rules for 1024px and 768px widths.
- [ ] Ensure chart colors and text meet the contrast rules in the design spec.
- [ ] Add `prefers-reduced-motion` handling for any hover transitions.
- [ ] Run `npm test -- src/features/performance/PerformancePages.test.tsx src/features/performance/PerformanceCharts.test.tsx`; expect PASS, then commit as `style: polish performance dashboards`.

### Task 6: Verify and commit

**Files:**
- Verify: `src/features/performance/PerformancePages.tsx`
- Verify: `src/features/performance/PerformanceCharts.tsx`
- Verify: `src/features/performance/fixtures.ts`
- Verify: `src/styles/performance-dashboard.css`

- [ ] Run `git diff --check`; expect no whitespace errors.
- [ ] Run `npm test -- src/features/performance/PerformancePages.test.tsx src/features/performance/PerformanceCharts.test.tsx`; expect success.
- [ ] Run `npm run lint`; expect success or document pre-existing unrelated failures.
- [ ] Run `npm run build`; expect success or document pre-existing unrelated failures; also run `npx vite build` to verify the production client bundle.
- [ ] Open `/performance`, `/performance/creators`, and `/performance/contents` at 1440px, 1024px, and 768px.
- [ ] Verify chart/table overflow, single-column reflow, long labels, keyboard focus, hidden accessible data, and WCAG contrast at each width.
- [ ] Confirm unrelated working-tree files remain unstaged.
- [ ] Commit only remaining performance redesign and design/plan documents as `docs: document performance dashboard redesign`.
