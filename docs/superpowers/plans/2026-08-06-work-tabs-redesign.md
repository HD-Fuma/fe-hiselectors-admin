# Work Tabs Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raised gray administrator work tabs with a cleaner flat white rail while preserving all tab behavior.

**Architecture:** Preserve `WorkTabs` routing and close behavior, use rail and active-element refs to adjust only the rail's horizontal offset, and express the visual redesign in its focused CSS block. Lock the contract with real-browser Playwright cases covering desktop, keyboard, overflow, document-position stability, and touch input.

**Tech Stack:** React 19, React Router, CSS, Playwright, Vitest

---

## Chunk 1: Flat Work Tab Rail

### Task 1: Lock and implement the visual contract

**Files:**
- Modify: `tests/visual/login-shell.spec.ts`
- Modify: `src/components/shell/WorkTabs.tsx`
- Modify: `src/styles/admin.css`

- [ ] **Step 1: Write the failing browser test**

Add a test titled exactly `renders a flat work tab rail with contextual close controls` that visits `/creators`, follows the `캠페인 관리` sidebar link, and uses the existing `.hsas-work-tabs*` selectors to assert:

- rail: `background-color: rgb(255, 255, 255)`, `overflow-x: auto`, `overflow-y: hidden`, a 41px box height, and a solid 1px bottom divider;
- native scrollbar: hidden with `scrollbar-width: none` and the scoped WebKit scrollbar pseudo-element so classic scrollbars cannot clip the fixed-height tabs;
- active tab: `background-color: rgb(247, 250, 249)`, `color: rgb(36, 40, 43)`, and `aria-current="page"` on its named link;
- inactive tab: transparent background, `color: rgb(102, 113, 109)`, zero border width, and zero top-corner radius so the previous raised-tab silhouette cannot remain;
- active tab `::after`: `position: absolute`, `height: 2px`, and `background-color: rgb(22, 143, 120)` through `getComputedStyle(element, "::after")`;
- inactive close control: `opacity: 0` and `pointer-events: none` initially, then `opacity: 1` and `pointer-events: auto` after its parent tab is hovered;
- active close control: `opacity: 1`;
- inactive-tab hover background: `rgb(242, 247, 245)`;
- unchanged accessible names for the work-tab navigation, links, and close buttons.

In the same desktop test, focus the inactive tab link as a known predecessor, press `Tab`, assert the inactive close button now owns focus, and then assert `opacity: 1`, `pointer-events: auto`, a solid 2px outline, and the existing teal-dark outline color. This proves the visually hidden control stays in keyboard order and becomes visible at focus.

Add a second test titled `keeps overflowing work tabs inside the flat work tab rail`. At a 1310px viewport, visit the remaining sidebar destinations to create enough tabs to overflow. Assert `scrollWidth > clientWidth`, every tab has the same top coordinate, the final active tab lies within the rail bounds after its active-ref effect, and `document.documentElement.scrollWidth` remains within the viewport width.

Add a regression test titled `keeps the document position while revealing the active work tab`. Give the test document temporary vertical height, scroll to a known Y position, activate another screen from the sticky sidebar, and assert the window scroll position stays fixed while the active tab is brought inside the rail.

Add a touch-context describe using `test.use({ hasTouch: true })` and a test titled `shows every work tab close control when hover is unavailable`. Open two tabs and assert both close buttons have `opacity: 1` and `pointer-events: auto`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx playwright test tests/visual/login-shell.spec.ts --grep "flat work tab rail"`

Expected: FAIL on the CSS assertions because the current rail is gray, has a raised active tab, always shows every close control, and does not contain horizontal overflow.

- [ ] **Step 3: Implement the minimal CSS**

In `WorkTabs.tsx`, attach refs to the rail and active tab. Whenever the active ID or tab collection changes, compare their bounding rectangles and adjust only `rail.scrollLeft` by the left or right overflow delta. Guard missing elements and browser geometry APIs for JSDOM; do not call `scrollIntoView`, which can move the document.

Update only the `.hsas-work-tabs*` rules in `src/styles/admin.css`: use a 41px white scrollable rail with a visually hidden native scrollbar; 40px non-shrinking, non-wrapping flat tabs; the specified active/inactive/hover colors; an active `::after` baseline; contextual close-button opacity and pointer events; a `(hover: none)` fallback; and the existing focus rings.

- [ ] **Step 4: Verify GREEN**

Run: `npx playwright test tests/visual/login-shell.spec.ts --grep "flat work tab rail"`

Expected: PASS.

Run: `npx playwright test tests/visual/login-shell.spec.ts --grep "overflowing work tabs|hover is unavailable"`

Expected: PASS.

- [ ] **Step 5: Verify regressions and production output**

Run:

- `npm test -- --run src/components/shell/AppShell.test.tsx`
- `npm test -- --run`
- `npm run lint`
- `npm run build`
- `npx playwright test tests/visual/login-shell.spec.ts tests/visual/admin.spec.ts`

Expected: all commands exit `0` with no failed tests.

- [ ] **Step 6: Inspect the rendered result**

Capture `test-results/visual/work-tabs-two-tabs.png` with the two-tab desktop state and inspect it at original resolution. If inspection finds a spacing or contrast defect, add a failing Playwright assertion for that exact contract before changing CSS, rerun the focused test to GREEN, and then rerun Step 5.
