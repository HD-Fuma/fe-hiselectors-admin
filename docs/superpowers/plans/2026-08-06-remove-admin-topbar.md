# Admin Topbar Removal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the empty-value administrator topbar so work tabs start at the top of the workspace.

**Architecture:** Remove the stateless `AdminTopbar` unit from `AppShell`, then delete its private styles and height token. Replace unit and browser geometry contracts that require the topbar with contracts for the work-tabs-first shell.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Playwright, CSS

---

## Chunk 1: Shell Structure and Geometry

### Task 1: Lock the topbar-free shell contract

**Files:**
- Modify: `src/components/shell/AppShell.test.tsx`
- Modify: `tests/visual/admin.spec.ts`
- Modify: `tests/visual/login-shell.spec.ts`

- [ ] **Step 1: Write the failing shell contract**

Change the unified-shell assertion to require only `sidebar`, `work-tabs`, and `content`, and add:

```tsx
expect(shell.querySelector('[data-shell-part="topbar"]')).not.toBeInTheDocument();
expect(within(shell).queryByText("더현대Hi 셀렉터스 운영")).not.toBeInTheDocument();
```

Remove the old test that requires the global product label. Rewrite the administrator-controls test to query the whole shell and keep its single-button assertions without dereferencing a topbar.

- [ ] **Step 2: Write failing browser geometry contracts**

In both visual specs, replace the topbar locator with:

```ts
const workTabs = page.locator('[data-shell-part="work-tabs"]');
```

Collect `workTabs.boundingBox()` and assert that the tabs start at the workspace top-left and the content begins directly below the tabs. In `admin.spec.ts` use:

```ts
expectApprox(workTabsBox!.x, workspaceBox!.x, 1);
expectApprox(workTabsBox!.y, workspaceBox!.y, 1);
expectApprox(contentBox!.y, workTabsBox!.y + workTabsBox!.height, 1);
```

In `login-shell.spec.ts` use its existing absolute-difference style:

```ts
expect(Math.abs(workTabsBox!.x - workspaceBox!.x)).toBeLessThanOrEqual(1);
expect(Math.abs(workTabsBox!.y - workspaceBox!.y)).toBeLessThanOrEqual(1);
expect(
  Math.abs(contentBox!.y - (workTabsBox!.y + workTabsBox!.height)),
).toBeLessThanOrEqual(1);
```

Remove the topbar from the modal z-index comparison and keep the backdrop-above-sidebar assertion.

- [ ] **Step 3: Run unit and browser tests to verify RED**

Run: `npm test -- --run src/components/shell/AppShell.test.tsx`

Expected: FAIL because `AppShell` still renders `[data-shell-part="topbar"]` and the product label.

Run: `npx playwright test tests/visual/login-shell.spec.ts tests/visual/admin.spec.ts --grep "locks the administrator shell geometry|creators visual checkpoint at the legacy viewport|campaign product modal"`

Expected: FAIL because work tabs still begin 44px below the workspace top.

### Task 2: Remove the topbar implementation and dead styles

**Files:**
- Modify: `src/components/shell/AppShell.tsx`
- Delete: `src/components/shell/AdminTopbar.tsx`
- Modify: `src/styles/admin.css`
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Remove the component from the shell**

Delete the `AdminTopbar` import and `<AdminTopbar />` call from `AppShell.tsx`, then delete `AdminTopbar.tsx`.

- [ ] **Step 2: Remove dead CSS**

Delete `.hsas-admin-topbar`, `.hsas-admin-topbar__context`, `.hsas-admin-topbar__utilities`, `.hsas-admin-topbar__utility-button`, and their hover/SVG rules from `admin.css`. Delete `--hsas-topbar-height` from `tokens.css`.

- [ ] **Step 3: Run focused unit and visual tests**

Run: `npm test -- --run src/components/shell/AppShell.test.tsx`

Expected: PASS.

Run: `npx playwright test tests/visual/login-shell.spec.ts tests/visual/admin.spec.ts --grep "administrator shell geometry|creators visual checkpoint at the legacy viewport|campaign product modal"`

Expected: 4 selected Playwright tests PASS with no missing topbar locator, gap, or geometry failures.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: PASS with no removed-import or stylesheet compilation error.

- [ ] **Step 5: Commit the topbar removal**

```bash
git add src/components/shell/AppShell.test.tsx src/components/shell/AppShell.tsx src/components/shell/AdminTopbar.tsx src/styles/admin.css src/styles/tokens.css tests/visual/admin.spec.ts tests/visual/login-shell.spec.ts
git commit -m "refactor: remove admin topbar"
```
