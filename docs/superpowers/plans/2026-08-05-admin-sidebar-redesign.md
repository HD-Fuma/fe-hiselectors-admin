# FUMA Admin Sidebar Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy icon rail, current-group menu, and full-menu overlay with one fixed modern sidebar that exposes every administrator menu and removes all favorite UI.

**Architecture:** Keep `navigation.ts` as the single source of truth and render its eight groups through a new `AdminSidebar`. Simplify `AppShell` to a two-column shell with a dedicated `AdminTopbar`, preserve existing routes and workspace content, and replace the legacy shell CSS and visual contracts without changing login or feature-page behavior.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Lucide React, CSS custom properties, Vitest/Testing Library, Playwright

**Design spec:** `docs/superpowers/specs/2026-08-05-admin-sidebar-redesign-design.md`

---

## Chunk 1: Navigation structure and behavior

### Task 1: Replace legacy navigation with the single sidebar

**Files:**
- Create: `src/components/shell/AdminSidebar.tsx`
- Create: `src/components/shell/AdminTopbar.tsx`
- Modify: `src/components/shell/AppShell.tsx`
- Modify: `src/components/shell/PageHeader.tsx`
- Modify: `src/components/shell/AppShell.test.tsx`
- Modify: `src/app/routeCoverage.test.tsx`
- Delete: `src/components/shell/IconRail.tsx`
- Delete: `src/components/shell/MyMenu.tsx`
- Delete: `src/components/shell/MegaMenu.tsx`

- [ ] **Step 1: Write failing sidebar and route-activation tests**

Update `AppShell.test.tsx` before production code. Require a `sidebar` shell part. Scope every first-cycle query with `within(shell.querySelector('[data-shell-part="sidebar"]')!)`; inside that sidebar, assert one `navigation[name="관리자 메뉴"]`, exactly 14 links, and headings for 크리에이터, 셀렉터스, 지원자, 캠페인, 콘텐츠, 성과, 정산, 시스템. Require the brand (`FUMA`, `ADMIN CONSOLE`). It is acceptable for legacy navigation to coexist temporarily during this first cycle.

Rename the route table's `menuIsCurrentPage` field to `routeIsExact`. For every route require `hsas-admin-sidebar__link--active`, `data-section-selected="true"`, and `aria-current="page"`. Require `data-route-exact="true"` for direct menu routes and require that attribute to be absent for detail, new, and edit routes.

Representative assertion:

```tsx
const sidebar = shell.querySelector('[data-shell-part="sidebar"]') as HTMLElement;
const navigation = within(sidebar).getByRole("navigation", { name: "관리자 메뉴" });
expect(within(navigation).getAllByRole("link")).toHaveLength(14);
```

- [ ] **Step 2: Run sidebar tests and verify RED**

Run `npm test -- --run src/components/shell/AppShell.test.tsx src/app/routeCoverage.test.tsx`.

Expected: FAIL because `AdminSidebar`, its 14 links, and its route-activation contract do not exist.

- [ ] **Step 3: Implement `AdminSidebar`**

Use this exact icon map, with every rendered icon marked `aria-hidden="true"`:

```tsx
const GROUP_ICONS: Record<NavGroup, LucideIcon> = {
  creators: UsersRound,
  selectors: BadgeCheck,
  applicants: ClipboardList,
  campaigns: Megaphone,
  content: FileSearch,
  performance: BarChart3,
  settlements: WalletCards,
  system: Settings2,
};
```

The component accepts `activeRoute: AdminRouteMeta` and `currentPath: string`. Render an aside with `data-shell-part="sidebar"`, a non-interactive brand, and one `nav` labelled `관리자 메뉴`. Iterate `NAV_GROUPS`, label each section with its heading, and render `getGroupMenuItems(group.id)`.

Set `hsas-admin-sidebar__link--active`, `data-section-selected="true"`, and `aria-current="page"` when both group and menu label match `activeRoute`. Set `data-route-exact="true"` only when `item.path === currentPath`.

Mount `AdminSidebar` in `AppShell` for this first GREEN cycle without removing the legacy rail/menu yet; the next RED/GREEN cycle owns the shell simplification.

- [ ] **Step 4: Run sidebar tests and verify GREEN**

Run `npm test -- --run src/components/shell/AppShell.test.tsx`.

Expected: the sidebar, menu count, and route-activation cases pass even though legacy navigation still temporarily renders.

- [ ] **Step 5: Write failing topbar and shell-simplification tests**

Require `sidebar`, `topbar`, `work-tabs`, and `content` shell parts and require `rail` to be absent. Assert the exact context text `${group.label} / ${activeRoute.title}` for `/creators` (`크리에이터 / 크리에이터 풀`) and `/campaigns/new` (`캠페인 / 캠페인 등록`). Scope `관리자`, `FUMA 운영자`, 설정, and 로그아웃 assertions to `data-shell-part="topbar"`, and assert settings and logout each occur exactly once in the shell.

Require `즐겨찾기`, `전체메뉴`, and `메뉴 편집` icon-rail controls to be absent. Delete full-menu fixture, focus-trap, Escape, and query-removal tests, and remove the mega-menu fixture case from `routeCoverage.test.tsx`.

- [ ] **Step 6: Run topbar/shell tests and verify RED**

Run `npm test -- --run src/components/shell/AppShell.test.tsx src/app/routeCoverage.test.tsx`.

Expected: FAIL because the legacy rail and topbar remain and the new context/account controls do not exist.

- [ ] **Step 7: Implement `AdminTopbar` and simplify `AppShell`**

`AdminTopbar` accepts the active route, resolves its group label, and renders the `업무군 / 화면명` context plus static `관리자`, `FUMA 운영자`, settings, and logout controls. Use Lucide `Settings` and `LogOut`; add no dropdown or click behavior.

In `AppShell`, remove all mega-menu state, query handling, callbacks, portals, and legacy component imports. Render `AdminSidebar` beside a workspace containing `AdminTopbar`, `WorkTabs`, and `Outlet`.

- [ ] **Step 8: Remove legacy navigation components and verify GREEN**

Delete `IconRail.tsx`, `MyMenu.tsx`, and `MegaMenu.tsx` using `apply_patch` after confirming no imports remain.

Run `npm test -- --run src/components/shell/AppShell.test.tsx src/app/routeCoverage.test.tsx`.

Expected: the topbar context, unique account controls, simplified shell, and route coverage tests pass.

- [ ] **Step 9: Write a failing page-header favorite-removal test**

Add an assertion on a rendered administrator page that `screen.queryByRole("button", { name: "현재 화면 즐겨찾기" })` is absent.

Run `npm test -- --run src/components/shell/AppShell.test.tsx`.

Expected: FAIL because `PageHeader` still renders the favorite button.

- [ ] **Step 10: Remove page-header favorite UI**

Remove `Star` and the favorite button from `PageHeader`.

- [ ] **Step 11: Run focused tests and verify final GREEN**

Run `npm test -- --run src/components/shell/AppShell.test.tsx src/app/routeCoverage.test.tsx`.

Expected: both test files pass with no warnings or unhandled errors.

- [ ] **Step 12: Commit the structural change**

```bash
git add src/components/shell src/app/routeCoverage.test.tsx
git commit -m "feat: unify admin navigation sidebar"
```

---

## Chunk 2: Design tokens, shell styling, and geometry

### Task 2: Apply the modern fixed-sidebar visual system

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/admin.css`
- Modify: `tests/visual/login-shell.spec.ts`
- Modify: `tests/visual/admin.spec.ts`

- [ ] **Step 1: Write failing Playwright geometry and scroll contracts first**

Replace legacy rail/menu assertions with `sidebar`, `topbar`, and workspace assertions. Make the shared `expectAdminGeometry` read `page.viewportSize()!.height` so the sidebar height is checked against the current viewport at 735, 741, 742, and 900px. Require sidebar width `248 ± 3`, topbar height `44 ± 2`, topbar x equal to the sidebar's right edge, and workspace width equal to root width minus sidebar width.

Add a dedicated 1310×741 navigation-scroll test. Require the brand, 14 nav links, computed sidebar `position: sticky` and `top: 0px`, computed nav `overflow-y: auto`, and `scrollHeight > clientHeight`. Record brand y and window scroll, set the nav's `scrollTop`, assert it becomes positive, assert window scroll and brand y remain unchanged, then assert the final `공지사항` link is visible.

At 1440×900 assert the active link's background is `#116f60`, font weight is bold, and its `::before` marker is 3px wide. Use Playwright `hover()` and keyboard focus to assert hover background and a visible focus outline, then run `expectKeyTextBounds` for all sidebar group/menu labels.

Add a narrow 762px viewport test proving root/document width remains at least 1280 and horizontal scrolling is available. Remove the mega-menu checkpoint while preserving all feature-page assertions.

Update the campaign product modal checkpoint before CSS. Measure the actual sidebar and workspace boxes; assert the backdrop covers the full viewport, has computed left padding near `264px`, uses a z-index above the sidebar/topbar, and the modal center is within 16px of the measured workspace center.

- [ ] **Step 2: Run the focused visual contracts and verify RED**

Run:

```bash
FUMA_VISUAL_PORT=4174 npm run test:visual -- tests/visual/login-shell.spec.ts tests/visual/admin.spec.ts --grep "administrator shell|sidebar navigation scroll|creators visual checkpoint at the legacy viewport|creators visual checkpoint at 1440|campaign product modal|narrow administrator shell"
```

Expected: FAIL because the new structure is not yet styled to the 248px/44px/sticky/scroll/modal contract.

- [ ] **Step 3: Define sidebar tokens**

Replace legacy rail/menu aliases in `tokens.css` with:

```css
--hsas-sidebar-width: 248px;
--hsas-topbar-height: 44px;
--hsas-sidebar-background: #202826;
--hsas-sidebar-surface: #27312f;
--hsas-sidebar-text: #c9d2cf;
--hsas-sidebar-heading: #82918d;
--hsas-sidebar-active: #116f60;
--hsas-sidebar-hover: #2c3835;
--hsas-sidebar-border: rgb(255 255 255 / 8%);
--hsas-sidebar-row-height: 34px;
--hsas-sidebar-radius: 6px;
```

Remove `--hsas-rail-width`, `--hsas-menu-width`, `--hsas-top-bar-height`, `--rail-width`, `--menu-width`, and `--topbar-height` after references are migrated.

- [ ] **Step 4: Replace legacy shell CSS**

Use a two-column root grid and a sticky viewport-height sidebar:

```css
.hsas-admin-shell {
  display: grid;
  min-width: 1280px;
  min-height: 100vh;
  grid-template-columns: var(--hsas-sidebar-width) minmax(0, 1fr);
}

.hsas-admin-sidebar {
  position: sticky;
  top: 0;
  display: grid;
  width: var(--hsas-sidebar-width);
  height: 100dvh;
  grid-template-rows: 68px minmax(0, 1fr);
  overflow: hidden;
}

.hsas-admin-sidebar__navigation {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

Style the brand, group icon/title, 34px links, hover, active teal fill, 3px left marker, focus ring, and restrained scrollbar. Use no gradients. Style the topbar at 44px with a white surface, bottom border, breadcrumb context, and compact account controls.

Remove all icon-rail, my-menu, and mega-menu selectors. Remove the page-header favorite from shared selectors.

- [ ] **Step 5: Update modal centering**

Use `calc(var(--hsas-sidebar-width) + var(--hsas-space-16))` for the modal backdrop's left padding and keep `z-index: 1000` so the backdrop covers the whole viewport above the sticky shell.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --run src/components/shell/AppShell.test.tsx src/app/routeCoverage.test.tsx
FUMA_VISUAL_PORT=4174 npm run test:visual -- tests/visual/login-shell.spec.ts tests/visual/admin.spec.ts --grep "administrator shell|sidebar navigation scroll|creators visual checkpoint at the legacy viewport|creators visual checkpoint at 1440|campaign product modal|narrow administrator shell"
```

Expected: unit tests and focused geometry, scroll, state, narrow-width, and modal checkpoints pass.

- [ ] **Step 7: Commit the visual system**

```bash
git add src/styles/tokens.css src/styles/admin.css tests/visual/login-shell.spec.ts tests/visual/admin.spec.ts
git commit -m "style: modernize admin navigation shell"
```

---

## Chunk 3: Documentation and full verification

### Task 3: Lock the new contract and verify the whole application

**Files:**
- Modify: `docs/superpowers/specs/2026-08-03-fuma-admin-ui-design.md`
- Modify: `docs/superpowers/verification/2026-08-03-fuma-admin-ui.md`
- Create: `docs/superpowers/verification/2026-08-05-admin-sidebar-redesign.md`
- Modify: `tests/visual/login-shell.spec.ts`
- Modify if required by failures: files already touched in Tasks 1–2

- [ ] **Step 1: Mark the legacy shell section as superseded**

Update the original spec's administrator-shell section, visual-token table, common component list, verification criteria, fixture list, visual checkpoint list, and completion criteria. Mark the legacy 40px rail, 205px MyMenu, MegaMenu, 38px topbar, and favorite UI as superseded, and link to `2026-08-05-admin-sidebar-redesign-design.md` as authoritative. Add a superseded notice to the 2026-08-03 verification record rather than rewriting its historical results.

Create `2026-08-05-admin-sidebar-redesign.md` after fresh verification and record the exact commands, pass counts, viewport checks, and any intentionally historical legacy references.

- [ ] **Step 2: Add browser diagnostics to login-shell tests**

Before running the full suite, add console-error, page-error, failed-request, and external-request collection to `login-shell.spec.ts`, matching the existing `admin.spec.ts` contract. The allowed origin is the current Playwright base URL; data/blob resources remain allowed. Add an `afterEach` assertion that all four collections are empty.

- [ ] **Step 3: Run static and unit checks**

Run:

```bash
! rg -n "IconRail|MyMenu|MegaMenu|hsas-icon-rail|hsas-my-menu|hsas-mega-menu|fixture=mega-menu|현재 화면 즐겨찾기|메뉴 편집|hsas-rail-width|hsas-menu-width|hsas-top-bar-height|--rail-width|--menu-width|--topbar-height" src --glob '!**/*.test.ts' --glob '!**/*.test.tsx'
! rg -n "IconRail|MyMenu|MegaMenu|hsas-icon-rail|hsas-my-menu|hsas-mega-menu|fixture=mega-menu|hsas-rail-width|hsas-menu-width|hsas-top-bar-height|--rail-width|--menu-width|--topbar-height" tests
npm run lint
npm test -- --run
npm run build
```

Expected: both inverted `rg` guards exit 0 with no matches; lint, the complete Vitest suite, and production build exit 0. Negative UI-label assertions may remain in tests.

- [ ] **Step 4: Run the complete visual suite**

Run `FUMA_VISUAL_PORT=4174 npm run test:visual`.

Expected: all Playwright tests pass. Both visual files enforce no console errors, page errors, external requests, or request failures. The suite includes explicit 1440px active/hover/focus/text-bound checks and full-viewport modal backdrop/stacking/workspace-centering checks.

- [ ] **Step 5: Inspect the rendered desktop UI**

Run `curl -I http://127.0.0.1:5173/creators` and `curl -I http://127.0.0.1:5173/login` as a preflight. If either is unavailable, start `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` in a persistent session; do not stop a healthy existing server.

Inspect `/creators` at 1310×741 and 1440×900 and `/login` at 1869×942. Confirm the fixed charcoal sidebar, white topbar, all groups and links, scroll access to 공지사항, clear active/hover/focus state, absence of favorites/full-menu controls, unchanged feature content, and unchanged login geometry.

- [ ] **Step 6: Commit documentation and verification fixes**

```bash
git add docs/superpowers/specs/2026-08-03-fuma-admin-ui-design.md docs/superpowers/verification/2026-08-03-fuma-admin-ui.md docs/superpowers/verification/2026-08-05-admin-sidebar-redesign.md tests/visual/login-shell.spec.ts
git commit -m "test: verify unified admin sidebar"
```

If verification fixes change any other file, inspect `git status --short` and stage only each named in-scope file rather than staging whole directories.

- [ ] **Step 7: Review final diff and branch state**

Run:

```bash
git diff --check origin/main...HEAD
git diff --name-status origin/main...HEAD
git diff --stat origin/main...HEAD
git status --short
git log --oneline --decorate -8
```

Expected: no whitespace errors, a clean worktree, and separate commits for design documentation, structure, styling, and verification documentation.
