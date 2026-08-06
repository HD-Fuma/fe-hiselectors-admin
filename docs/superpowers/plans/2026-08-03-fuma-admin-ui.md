# FUMA Admin UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static React + TypeScript FUMA administrator prototype that covers all 35 complete admin requirements and visually reproduces the supplied Hyundai Home Shopping HSAS references.

**Architecture:** A Vite single-page app uses React Router route objects, domain fixture modules, and plain CSS design tokens. Shared shell and dense-workflow components reproduce the legacy HSAS layout; domain pages compose those components without API calls or mutable business state. Query parameters select deterministic visual variants for empty, pending, modal, and overlay states.

**Tech Stack:** React, TypeScript, Vite, React Router, Lucide React, Vitest, Testing Library, Playwright, plain CSS

**Design source:** `docs/superpowers/specs/2026-08-03-fuma-admin-ui-design.md`

---

## File Map

### Tooling and entrypoints

- `package.json`: scripts and runtime/dev dependencies.
- `package-lock.json`: reproducible dependency resolution.
- `index.html`: Vite mount point and Korean page metadata.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: strict TypeScript setup.
- `vite.config.ts`: React and Vitest configuration.
- `eslint.config.js`: flat ESLint configuration for TypeScript and React.
- `playwright.config.ts`: desktop visual-check viewports and local web server.
- `src/main.tsx`: browser bootstrap.
- `src/app/App.tsx`: router provider boundary.
- `src/app/router.tsx`: browser and memory router factories plus all routes.
- `src/app/navigation.ts`: typed navigation and work-tab metadata.
- `src/test/setup.ts`: Testing Library matchers and DOM cleanup.
- `src/test/renderRoute.tsx`: memory-router render helper.

### Visual system and shared UI

- `src/styles/tokens.css`: colors, typography, dimensions, borders, spacing, z-index tokens.
- `src/styles/global.css`: reset and application-wide legacy desktop behavior.
- `src/styles/admin.css`: admin shell, dense forms, tables, pages, and modal styling.
- `src/styles/login.css`: latest login-reference styling.
- `src/components/ui/Controls.tsx`: buttons, inputs, selects, checkboxes, segmented controls.
- `src/components/ui/FormRow.tsx`: compact label/control form row.
- `src/components/ui/SearchPanel.tsx`: compact query-panel layout.
- `src/components/ui/DenseTable.tsx`: typed dense table with empty state and pagination slot.
- `src/components/ui/StatusPill.tsx`: semantic status label.
- `src/components/ui/Modal.tsx`: legacy teal-title modal frame.
- `src/components/ui/EmptyState.tsx`: deterministic empty and missing-data panel.
- `src/components/ui/SectionTabs.tsx`: compact active/inactive section tabs.
- `src/components/ui/Pagination.tsx`: static page and page-size presentation.
- `src/components/ui/ImageTile.tsx`: one legacy media/upload tile with static actions.
- `src/components/shell/AppShell.tsx`: rail/sidebar/top bar/work tabs/content composition.
- `src/components/shell/IconRail.tsx`: 40px icon rail.
- `src/components/shell/MyMenu.tsx`: 205px current-work menu.
- `src/components/shell/WorkTabs.tsx`: open-task tab strip.
- `src/components/shell/PageHeader.tsx`: title, screen code, and right actions.
- `src/components/shell/MegaMenu.tsx`: deterministic full-menu overlay.
- `src/components/shell/PlaceholderPage.tsx`: temporary route target removed as domains are implemented.
- `src/components/content/AiSummaryPanel.tsx`: AI summary and evidence presentation.
- `src/components/content/MetricStrip.tsx`: flat performance summary band.
- `src/components/content/EditorFrame.tsx`: static editor/source frame.
- `src/components/content/MediaTiles.tsx`: legacy upload-tile presentation.

### Domain fixtures and pages

- `src/features/auth/LoginPage.tsx`, `LoginPage.test.tsx`: current login reference.
- `src/features/creators/fixtures.ts`, `CreatorPages.tsx`, `CreatorPages.test.tsx`: creator pool, detail, proposals.
- `src/features/selectors/fixtures.ts`, `SelectorPages.tsx`, `SelectorPages.test.tsx`: cohorts, members, qualifications.
- `src/features/applicants/fixtures.ts`, `ApplicantPages.tsx`, `ApplicantPages.test.tsx`: applicant list, detail, auto-rejection and send status.
- `src/features/campaigns/fixtures.ts`, `CampaignPages.tsx`, `CampaignPages.test.tsx`: list, form, delete eligibility, product modal.
- `src/features/content/fixtures.ts`, `ContentPages.tsx`, `ContentPages.test.tsx`: three review types and violations.
- `src/features/performance/fixtures.ts`, `PerformancePages.tsx`, `PerformancePages.test.tsx`: summary, creator, content analytics.
- `src/features/operations/fixtures.ts`, `OperationsPages.tsx`, `OperationsPages.test.tsx`: settlements and notices.
- `src/app/routeCoverage.test.tsx`: route-to-requirement smoke coverage.
- `tests/visual/admin.spec.ts`: deterministic Playwright screenshots.

## Chunk 1: Foundation, design system, shell, and login

### Task 1: Bootstrap the tested React application

**Files:**
- Create: `package.json`, `package-lock.json`, `index.html`
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`
- Create: `src/test/setup.ts`, `src/app/App.test.tsx`
- Create after RED: `src/main.tsx`, `src/app/App.tsx`, `src/app/router.tsx`

- [ ] **Step 1: Initialize dependencies without creating production components**

Run:

```bash
npm init -y
npm install react react-dom react-router-dom lucide-react
npm install -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom @types/node eslint @eslint/js globals typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
```

Expected: `package.json` and `package-lock.json` exist and npm exits 0.

- [ ] **Step 2: Configure scripts and the test environment**

Set scripts to:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "test": "vitest",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

Create these exact configuration contracts:

```html
<!-- index.html -->
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FUMA 관리자 시스템</title>
  </head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```

```json
// tsconfig.json
{ "files": [], "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }] }
```

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "target": "ES2022", "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext", "skipLibCheck": true,
    "moduleResolution": "Bundler", "allowImportingTsExtensions": true,
    "isolatedModules": true, "moduleDetection": "force", "noEmit": true,
    "jsx": "react-jsx", "strict": true, "types": ["vitest/globals"],
    "noUnusedLocals": true, "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "target": "ES2023", "lib": ["ES2023"], "module": "ESNext",
    "skipLibCheck": true, "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true, "isolatedModules": true,
    "moduleDetection": "force", "noEmit": true, "strict": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "playwright.config.ts"]
}
```

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./src/test/setup.ts"], globals: true, css: true },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(() => cleanup());
```

```js
// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "playwright-report", "test-results"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
);
```

- [ ] **Step 3: Write the failing application smoke test**

```tsx
import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("renders the FUMA application root", () => {
  render(<App initialEntries={["/login"]} />);
  expect(screen.getByRole("main")).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the test and verify RED**

Run: `npm test -- --run src/app/App.test.tsx`

Expected: FAIL because `./App` does not exist.

- [ ] **Step 5: Implement the minimal router-aware app root**

`App` accepts optional `initialEntries`; tests use `createMemoryRouter`, while production uses `createBrowserRouter`. Add only `/login` with a temporary `<main>FUMA</main>` route and mount it from `src/main.tsx`.

- [ ] **Step 6: Verify GREEN and build**

Run: `npm test -- --run src/app/App.test.tsx && npm run build && npm run lint`

Expected: one passing test, a successful Vite build, and zero lint errors.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json index.html tsconfig*.json vite.config.ts eslint.config.js src
git commit -m "build: bootstrap FUMA admin frontend"
```

### Task 2: Implement design tokens and reusable dense controls

**Files:**
- Test: `src/components/ui/controls.test.tsx`, `src/components/ui/layout.test.tsx`
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/admin.css`
- Create: `src/components/ui/Controls.tsx`, `FormRow.tsx`, `SearchPanel.tsx`, `DenseTable.tsx`, `StatusPill.tsx`, `Modal.tsx`, `EmptyState.tsx`, `SectionTabs.tsx`, `Pagination.tsx`, `ImageTile.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write failing tests for controls and status semantics**

Test that:

```tsx
render(
  <>
    <Button variant="primary">조회</Button>
    <StatusPill tone="approved">승인</StatusPill>
    <TextInput aria-label="검색어" />
    <Select aria-label="상태" options={[{ value: "all", label: "전체" }]} />
    <Checkbox label="선택" />
    <SegmentedControl value="yes" options={[{ value: "yes", label: "설정" }]} />
  </>,
);
expect(screen.getByRole("button", { name: "조회" })).toHaveClass("ui-button--primary");
expect(screen.getByText("승인")).toHaveClass("status-pill--approved");
expect(screen.getByRole("textbox", { name: "검색어" })).toHaveClass("ui-input");
expect(screen.getByRole("combobox", { name: "상태" })).toBeInTheDocument();
expect(screen.getByRole("checkbox", { name: "선택" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "설정" })).toHaveAttribute("aria-pressed", "true");
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- --run src/components/ui/controls.test.tsx`

Expected: FAIL because controls and status modules do not exist.

- [ ] **Step 3: Add exact legacy tokens and minimal components**

Define tokens from the design spec, including `--hsas-teal: #168f78`, `--rail-width: 40px`, `--menu-width: 205px`, `--topbar-height: 38px`, `--control-height: 27px`, `--font-body: 12px`, square 1–2px radii, and gray borders. Implement the tested controls. Import `tokens.css` and `global.css` from `src/main.tsx`; `AppShell.tsx` will own the `admin.css` import and `LoginPage.tsx` will own the `login.css` import in their tasks.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --run src/components/ui/controls.test.tsx`

Expected: all control/status tests pass.

- [ ] **Step 5: Write failing tests for layout and data primitives**

Public contracts:

```ts
interface FormRowProps { label: string; required?: boolean; help?: string; children: React.ReactNode }
interface SearchPanelProps { children: React.ReactNode; actions?: React.ReactNode }
interface SectionTabsProps { items: { id: string; label: string }[]; activeId: string }
interface PaginationProps { page: number; totalPages: number; pageSize: number }
interface ImageTileProps { alt: string; src?: string; empty?: boolean; actions?: string[] }
interface EmptyStateProps { title: string; description?: string }
interface ModalProps { open: boolean; title: string; children: React.ReactNode; actions?: React.ReactNode }
```

Render every component plus an empty `DenseTable`. Assert label/required/help text, `search` landmark, active tab state, page text, image alt or upload placeholder, modal dialog/title/actions, empty-state heading, and `조회 결과가 없습니다.`.

- [ ] **Step 6: Run the second test and verify RED**

Run: `npm test -- --run src/components/ui/layout.test.tsx`

Expected: FAIL because form, search, tab, pagination, image, modal, empty-state, and table components do not exist.

- [ ] **Step 7: Implement the layout/data primitives**

`DenseTable` accepts typed `{ key, header, width?, align?, render? }` columns, `rows`, `rowKey`, optional `emptyMessage`, and optional `footer`. `ImageTile` is the single-tile contract used later by `MediaTiles`; it is not duplicated in the content feature. Keep optional callbacks inert by default.

- [ ] **Step 8: Verify the complete design-system GREEN state**

Run: `npm test -- --run src/components/ui/controls.test.tsx src/components/ui/layout.test.tsx`

Expected: both suites pass and `src/main.tsx` imports tokens/global CSS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui src/styles src/main.tsx
git commit -m "feat: add HSAS design system primitives"
```

### Task 3: Build the administrator shell and route metadata

**Files:**
- Test: `src/components/shell/AppShell.test.tsx`
- Create: `src/app/navigation.ts`, `src/test/renderRoute.tsx`
- Create: `src/components/shell/AppShell.tsx`, `IconRail.tsx`, `MyMenu.tsx`, `WorkTabs.tsx`, `PageHeader.tsx`, `MegaMenu.tsx`, `PlaceholderPage.tsx`
- Modify: `src/app/router.tsx`, `src/styles/admin.css`

- [ ] **Step 1: Create test-only route rendering infrastructure**

Implement `renderRoute(path)` in `src/test/renderRoute.tsx` by constructing the exported memory router and rendering `RouterProvider`. This is test infrastructure, not production behavior; verify it can render the existing `/login` route before beginning the shell RED cycle.

- [ ] **Step 2: Write failing shell tests**

```tsx
renderRoute("/creators");
expect(screen.getByText("FUMA 관리자 시스템")).toBeInTheDocument();
expect(screen.getByText("마이메뉴")).toBeInTheDocument();
expect(screen.getByRole("navigation", { name: "관리자 메뉴" })).toBeInTheDocument();

renderRoute("/?fixture=mega-menu");
expect(screen.getByRole("dialog", { name: "전체메뉴" })).toBeInTheDocument();
```

- [ ] **Step 3: Run and verify RED**

Run: `npm test -- --run src/components/shell/AppShell.test.tsx`

Expected: FAIL because shell routes and components do not exist.

- [ ] **Step 4: Lock the navigation contract and placeholder matrix**

```ts
type NavGroup = "creators" | "selectors" | "applicants" | "campaigns" | "content" | "performance" | "settlements" | "system";

interface AdminRouteMeta {
  path: string;
  group: NavGroup;
  menuLabel: string;
  title: string;
  screenCode: string;
  workTabLabel: string;
}
```

Define these exact entries; dynamic detail paths share their parent menu selection:

| Path | Group | Menu label | Page title | Code | Work tab |
| --- | --- | --- | --- | --- | --- |
| `/creators` | creators | 크리에이터 목록 | 크리에이터 풀 | CR101 | 크리에이터 풀 |
| `/creators/:creatorId` | creators | 크리에이터 목록 | 크리에이터 상세 | CR102 | 크리에이터 상세 |
| `/proposals` | creators | 제안 이력 | 제안 이력 관리 | CR201 | 제안 이력 |
| `/cohorts` | selectors | 기수 관리 | 셀렉터스 기수 관리 | SL101 | 기수 관리 |
| `/selectors` | selectors | 셀렉터스 현황 | 기수별 셀렉터스 현황 | SL201 | 셀렉터스 현황 |
| `/selectors/qualifications` | selectors | 자격 관리 | 셀렉터스 자격 관리 | SL301 | 자격 관리 |
| `/applicants` | applicants | 지원자 승인 | 지원자 심사 | AP101 | 지원자 심사 |
| `/applicants/:applicantId` | applicants | 지원자 승인 | 지원자 상세 심사 | AP102 | 지원자 상세 |
| `/campaigns` | campaigns | 캠페인 관리 | 캠페인 관리 | CP101 | 캠페인 관리 |
| `/campaigns/new` | campaigns | 캠페인 관리 | 캠페인 등록 | CP102 | 캠페인 등록 |
| `/campaigns/:campaignId/edit` | campaigns | 캠페인 관리 | 캠페인 수정 | CP103 | 캠페인 수정 |
| `/content/reviews` | content | 콘텐츠 검수 | 콘텐츠 검수 | CT101 | 콘텐츠 검수 |
| `/content/reviews/:contentId` | content | 콘텐츠 검수 | 콘텐츠 검수 상세 | CT102 | 검수 상세 |
| `/performance` | performance | 성과 대시보드 | 관리자 성과 대시보드 | PF101 | 성과 대시보드 |
| `/performance/creators` | performance | 크리에이터 분석 | 크리에이터 영향력 분석 | PF201 | 크리에이터 분석 |
| `/performance/contents` | performance | 콘텐츠 분석 | 콘텐츠 영향력 분석 | PF202 | 콘텐츠 분석 |
| `/settlements` | settlements | 정산 관리 | 정산 지급 관리 | ST101 | 정산 관리 |
| `/system/notices` | system | 공지사항 | 공지사항 관리 | SY101 | 공지사항 |

`/login` is a top-level route outside the shell. All other routes are children of the `AppShell` layout route. Until their domain task, each entry renders `PlaceholderPage` with its title/code so the complete matrix can be smoke-rendered.

- [ ] **Step 5: Implement the structural shell**

Implement the shell DOM, landmarks, selected states, work tabs, page header, and query-driven mega menu. `IconRail` contains favorite, full-menu, edit, settings, and logout affordances. `MegaMenu` uses a teal title bar plus two levels: eight primary groups in the left column and the selected group's child links in the right column. `AppShell` imports `admin.css`. Add stable `data-shell-part` attributes for root, rail, menu, top bar, work tabs, and content. At this step, apply only structural class names and basic visibility; deliberately do not add the 40px/205px/38px dimensional rules or the 1280px minimum. Those production CSS behaviors are written only after the failing browser geometry test in Task 4.

- [ ] **Step 6: Verify GREEN and the placeholder route matrix**

Extend the shell test with a table-driven loop over every static path above and representative dynamic IDs (`cr-001`, `ap-001`, `cp-001`, `ct-001`). Assert the route title/code, selected group/menu item, and that `/login` has no `관리자 메뉴` navigation.

Run: `npm test -- --run src/components/shell/AppShell.test.tsx src/app/App.test.tsx`

Expected: shell, app, and every placeholder route pass with no console warnings. Confirm the semantic structure maps to `hsas-01-product-register.png` and the two-level menu structure maps to `hsas-08-mega-menu.png`; no dimensional CSS is added before Task 4 RED.

- [ ] **Step 7: Commit**

```bash
git add src/app src/components/shell src/test src/styles/admin.css
git commit -m "feat: add HSAS admin shell and navigation"
```

### Task 4: Reproduce the latest login reference

**Files:**
- Test: `src/features/auth/LoginPage.test.tsx`
- Test: `tests/visual/login-shell.spec.ts`
- Create: `src/features/auth/LoginPage.tsx`, `src/features/auth/QrBadge.tsx`, `src/styles/login.css`
- Create: `playwright.config.ts`
- Modify: `package.json`, `package-lock.json`, `src/app/App.tsx`, `src/app/router.tsx`, `src/styles/admin.css`

- [ ] **Step 1: Write the failing login reference test**

```tsx
renderRoute("/login");
expect(screen.getByText("Partners")).toBeInTheDocument();
expect(screen.getByText("더현대Hi 협력사 업무지원시스템")).toBeInTheDocument();
expect(screen.getByPlaceholderText("ID를 입력하세요.")).toBeInTheDocument();
expect(screen.getByPlaceholderText("비밀번호를 입력하세요.")).toBeInTheDocument();
expect(screen.getByRole("checkbox", { name: "아이디 저장" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
expect(screen.getByText("아이디 찾기")).toBeInTheDocument();
expect(screen.getByText("비밀번호 초기화")).toBeInTheDocument();
expect(screen.getByText("시스템 담당자 문의")).toBeInTheDocument();
expect(screen.getByText("신규입점문의")).toBeInTheDocument();
expect(screen.getByText("광고신청/안내")).toBeInTheDocument();
expect(screen.getByRole("img", { name: "파트너스 앱 QR" })).toBeInTheDocument();
expect(screen.getByText("파트너스 APP 다운로드")).toBeInTheDocument();
expect(screen.queryByRole("navigation", { name: "관리자 메뉴" })).not.toBeInTheDocument();
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- --run src/features/auth/LoginPage.test.tsx`

Expected: FAIL because the route still renders the temporary login content.

- [ ] **Step 3: Implement the minimal semantic login DOM**

Build the wordmark, fields, checkbox, buttons, contact/quick links, and a local deterministic SVG QR pattern with the tested accessible labels. Add stable `data-login-part="card"`, `data-login-part="quick-links"`, and `data-login-part="qr"` contracts, but do not add final layout CSS yet. No submit or authentication logic.

- [ ] **Step 4: Verify semantic GREEN**

Run: `npm test -- --run src/features/auth/LoginPage.test.tsx`

Expected: all login tests pass.

- [ ] **Step 5: Install and configure browser geometry tooling**

Run:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Create `playwright.config.ts` with test directory `tests/visual`, `baseURL: "http://127.0.0.1:4173"`, locale `ko-KR`, timezone `Asia/Seoul`, light color scheme, reduced motion, device scale factor 1, and a web server command `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort` with `reuseExistingServer: false`. Add `test:visual: "playwright test"` to package scripts.

- [ ] **Step 6: Write failing login and shell geometry tests**

Wrap the router provider in `src/app/App.tsx` with `[data-app-ready="true"]`; fixture parsing is synchronous, so the marker means the route tree has rendered. In the browser test, wait for that marker, `document.fonts.ready`, and all images' `complete` state.

At `/login` with viewport 1869×942, locate the explicit `data-login-part` nodes and assert the card is 460±12px wide and 570±16px high, its center is within 30px of the reference center, the quick-link rail is to its right, and no admin shell exists. At `/creators` with viewport 1310×741, locate the explicit `data-shell-part` nodes and assert the rail is 40±2px, menu 205±3px, top bar 38±2px, and the whole shell root—not the inner content—has a minimum width of 1280px. The content consumes the shell width remaining after rail and menu. Save fixed artifacts to `test-results/visual/login-reference.png` and `test-results/visual/admin-shell-reference.png`.

- [ ] **Step 7: Run the geometry test and verify RED**

Run: `npx playwright test tests/visual/login-shell.spec.ts`

Expected: FAIL on card/shell geometry because final login and shell layout CSS has not been implemented.

- [ ] **Step 8: Implement final login and shell geometry CSS**

Build the centered 460×570 white card, 1px border, 16px radius, low shadow, two underlined icon fields, teal 350×56 login button, dark account-support bar, and right-side quick links. `LoginPage.tsx` imports `login.css`. Now add the measured shell dimensions to `admin.css`: 40px rail, 205px menu, 38px top bar, 1280px minimum on the shell root, and content width equal to the remaining shell area.

- [ ] **Step 9: Verify browser GREEN and inspect captures**

Run: `npm test -- --run src/features/auth/LoginPage.test.tsx && npx playwright test tests/visual/login-shell.spec.ts`

Expected: unit tests and both browser checkpoints pass. Inspect `login-reference.png` against `docs/superpowers/references/hsas-09-current-login.png`, and `admin-shell-reference.png` against `hsas-01-product-register.png`; adjust only measured geometry/color differences and re-run.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json playwright.config.ts tests/visual/login-shell.spec.ts src/features/auth src/styles/login.css src/styles/admin.css src/app
git commit -m "feat: reproduce partners login UI"
```

## Chunk 2: Core administrator workflows

### Task 5: Implement creator pool and proposal history

**Files:**
- Test: `src/features/creators/CreatorPages.test.tsx`
- Create: `src/features/creators/fixtures.ts`, `src/features/creators/CreatorPages.tsx`
- Create: `src/components/content/AiSummaryPanel.tsx`
- Modify: `src/app/router.tsx`, `src/styles/admin.css`

- [ ] **Step 1: Write failing route and fixture-state tests**

Cover `/creators`, `/creators?fixture=empty`, `/creators/cr-001`, `/creators/cr-001?fixture=ai-pending`, `/creators/missing`, `/proposals`, and `/proposals?fixture=empty`. Assert keyword/category/tier/platform filters; platform channel, views and reactions; AI fitness and evidence or pending state; Instagram DM Meta constraint; email state; proposal target, send method, sent time, and channel/status columns; channel/status filters; and the proposal-empty message.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx`

Expected: FAIL because creator routes render placeholders.

- [ ] **Step 3: Implement typed fixtures and pages**

Use types equivalent to:

```ts
type ProposalChannel = "Instagram DM" | "이메일";
type ProposalStatus = "발송 대기" | "발송 완료" | "발송 실패" | "셀렉터스 전환";

interface CreatorChannelFixture {
  platform: "Instagram" | "YouTube";
  handle: string;
  followers: number;
  views: number;
  reactions: number;
}

interface AiReportFixture {
  status: "ready" | "pending";
  summary: string;
  fitnessScore: number | null;
  evidence: string[];
}

interface CreatorFixture {
  id: string;
  name: string;
  platforms: string[];
  categories: string[];
  tier: "T0" | "T1" | "T2" | "T3";
  followers: number;
  contentCount: number;
  recentActivity: string;
  channels: CreatorChannelFixture[];
  aiReport: AiReportFixture;
  proposalStatus: ProposalStatus | "미제안";
  availableProposalChannels: ProposalChannel[];
}

interface ProposalFixture {
  id: string;
  targetId: string;
  targetName: string;
  channel: ProposalChannel;
  sendMethod: "수동" | "자동";
  sentAt: string;
  status: ProposalStatus;
  constraintNote?: string;
}
```

Compose `SearchPanel`, `DenseTable`, `StatusPill`, and `AiSummaryPanel`; keep all action buttons inert.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx`

Expected: all creator and proposal variants pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/creators src/components/content/AiSummaryPanel.tsx src/app/router.tsx src/styles/admin.css
git commit -m "feat: add creator pool and proposal screens"
```

### Task 6: Implement cohort, selector, and qualification screens

**Files:**
- Test: `src/features/selectors/SelectorPages.test.tsx`
- Create: `src/features/selectors/fixtures.ts`, `src/features/selectors/SelectorPages.tsx`
- Modify: `src/app/router.tsx`, `src/styles/admin.css`

- [ ] **Step 1: Write failing tests**

Assert `/cohorts` exposes cohort name, recruitment/activity periods, status, participant count, and a visible `기수 생성` affordance; `/selectors` exposes selector name, row-level cohort, cohort filter, SNS channel, activity status, content count, violation count, clicks, conversions, and recent activity; `/selectors/qualifications` exposes current status, penalty count, revocation reason, explicit blacklist status, next-cohort restriction, manual change value, and change-reason controls.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- --run src/features/selectors/SelectorPages.test.tsx`

Expected: FAIL because selector routes are placeholders.

- [ ] **Step 3: Implement fixtures and the three screens**

Represent 활동 중, 경고, 박탈, 수료 with status pills. Define typed `CohortFixture` fields for `name`, recruitment/activity dates, status, and `participantCount`; `SelectorFixture` fields for selector `name`, row-level `cohort`, SNS, content/violation/click/conversion metrics and recent activity; and `QualificationFixture` fields for current status, accumulated penalties, revocation reason, `blacklisted`, next-cohort restriction, proposed status, and change reason. Add an inert `기수 생성` button. Use the reference dense-table grammar and a compact inline edit panel for manual qualification changes.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/features/selectors/SelectorPages.test.tsx`

```bash
git add src/features/selectors src/app/router.tsx src/styles/admin.css
git commit -m "feat: add selector operations screens"
```

### Task 7: Implement applicant review states

**Files:**
- Test: `src/features/applicants/ApplicantPages.test.tsx`
- Create: `src/features/applicants/fixtures.ts`, `src/features/applicants/ApplicantPages.tsx`
- Modify: `src/app/router.tsx`, `src/styles/admin.css`

- [ ] **Step 1: Write failing tests**

Cover list and detail routes plus `/applicants/ap-003?fixture=auto-rejected` and `/applicants/missing`. Assert applicant ID/name/channel, follower/content/recent-activity/views/reactions fields, review status, AI fitness/evidence, approval/rejection controls, auto-rejection flag, failed criteria, internal reason, and email/알림톡 send status variants for pending, completed, and failed. Assert the shared missing-detail message for the unmatched ID.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- --run src/features/applicants/ApplicantPages.test.tsx`

Expected: FAIL because applicant routes are placeholders.

- [ ] **Step 3: Implement static list/detail fixtures**

Use a typed `ApplicantFixture` containing identity/channel fields, metrics, review status, AI fitness/evidence, automatic-rejection flag, failed criteria, internal reason, and result-delivery channel/status. Use one detail layout for manual review and automatic rejection; the query fixture swaps status panels only. Keep approval, rejection, and send buttons visual-only. Unmatched IDs render the shared `대상을 찾을 수 없습니다` panel.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/features/applicants/ApplicantPages.test.tsx`

```bash
git add src/features/applicants src/app/router.tsx src/styles/admin.css
git commit -m "feat: add applicant review screens"
```

### Task 8: Implement campaign list, forms, and product modal

**Files:**
- Test: `src/features/campaigns/CampaignPages.test.tsx`
- Create: `src/features/campaigns/fixtures.ts`, `src/features/campaigns/CampaignPages.tsx`
- Modify: `src/app/router.tsx`, `src/styles/admin.css`

- [ ] **Step 1: Write failing tests**

Cover `/campaigns`, `/campaigns/new`, `/campaigns/cp-001/edit`, `/campaigns/missing/edit`, and `/campaigns/new?fixture=product-modal`. Assert campaign name, start/end dates, selected product IDs/names and product counts, campaign state, delete eligibility/reason, an inert row delete action, populated edit values, product-selection field/button, modal table/actions, and the shared missing-detail panel.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- --run src/features/campaigns/CampaignPages.test.tsx`

Expected: FAIL because campaign routes are placeholders.

- [ ] **Step 3: Implement list/form/modal composition**

Define `CampaignFixture` with `id`, `name`, `startDate`, `endDate`, `products`, `status`, `deleteEligible`, and `deleteBlockedReason`. Reuse `FormRow`, `DenseTable`, `Modal`, and segmented controls. The list renders the inert delete action; the create/edit form renders campaign-name and product-selection controls. The query fixture renders the modal already open; no open/close logic is required. Unmatched edit IDs render the shared `대상을 찾을 수 없습니다` panel.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/features/campaigns/CampaignPages.test.tsx`

```bash
git add src/features/campaigns src/app/router.tsx src/styles/admin.css
git commit -m "feat: add campaign management screens"
```

### Task 9: Implement content review and violation management

**Files:**
- Test: `src/features/content/ContentPages.test.tsx`
- Create: `src/features/content/fixtures.ts`, `src/features/content/ContentPages.tsx`
- Create: `src/components/content/EditorFrame.tsx`, `src/components/content/MediaTiles.tsx`
- Modify: `src/app/router.tsx`, `src/styles/admin.css`

- [ ] **Step 1: Write failing tests for all three review types**

Test the normal `/content/reviews` queue, exact NEW detail route `/content/reviews/ct-001`, `/content/reviews/ct-002?fixture=violation-correction`, `/content/reviews/ct-003?fixture=edited`, `/content/reviews/missing`, and `/content/reviews?fixture=no-selection`. Assert author, cohort, platform, submitted time, type label, review/processing status, AI status, violation type, required previous/current snapshots, text/URL/media-count differences, AI summary, type-specific action labels, and the shared missing-detail panel. For `/content/violations`, assert cohort/violation-type/processing-state filters, selector and content identity, notice text/send status, accumulated penalties, `위반사항 안내` action, and `패널티 부여` action.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- --run src/features/content/ContentPages.test.tsx`

Expected: FAIL because content routes are placeholders.

- [ ] **Step 3: Implement the review-state fixture model**

```ts
type ReviewType = "NEW" | "VIOLATION_CORRECTION" | "EDITED";

interface ContentSnapshot {
  text: string;
  urls: string[];
  mediaCount: number;
  mediaKinds: string[];
  capturedAt: string;
}

interface ContentReviewFixture {
  id: string;
  author: string;
  cohort: string;
  sourcePlatform: string;
  submittedAt: string;
  reviewType: ReviewType;
  previousSnapshot: ContentSnapshot | null;
  currentSnapshot: ContentSnapshot;
  aiStatus: "ready" | "pending";
  aiSummary: string;
  detectedIssues: string[];
  violationType: string | null;
  reviewStatus: "검수 대기" | "수정 요청" | "승인" | "위반 확정";
  processingState: "미처리" | "안내 대기" | "처리 완료";
  availableActions: string[];
}

interface ViolationFixture {
  id: string;
  cohort: string;
  selectorName: string;
  contentId: string;
  violationType: string;
  noticeText: string;
  noticeStatus: "미발송" | "발송 대기" | "발송 완료" | "발송 실패";
  processingState: "미처리" | "처리 중" | "처리 완료";
  accumulatedPenalties: number;
}
```

Compose editor and media tiles in a single detail shell; no rich-text editing or upload behavior. The violation screen renders inert notice-send and penalty-assignment actions. Unmatched content IDs render the shared `대상을 찾을 수 없습니다` panel.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/features/content/ContentPages.test.tsx`

```bash
git add src/features/content src/components/content src/app/router.tsx src/styles/admin.css
git commit -m "feat: add content review and violation screens"
```

## Chunk 3: Analytics, operations, route coverage, and visual verification

### Task 10: Implement performance dashboards

**Files:**
- Test: `src/features/performance/PerformancePages.test.tsx`
- Create: `src/features/performance/fixtures.ts`, `src/features/performance/PerformancePages.tsx`
- Create: `src/components/content/MetricStrip.tsx`
- Modify: `src/app/router.tsx`, `src/styles/admin.css`

- [ ] **Step 1: Write failing tests**

Assert `/performance` shows clicks, conversions and conversion rate broken out by both campaign and selector; `/performance/creators` and `/performance/contents` show conversion, views, likes and comments columns plus shared cohort/campaign filters.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- --run src/features/performance/PerformancePages.test.tsx`

Expected: FAIL because performance routes are placeholders.

- [ ] **Step 3: Implement flat metric strips and dense tables**

Avoid modern floating cards. Use bordered summary bands, compact filters, restrained teal highlights, and a small static inline SVG trend plot only where it clarifies hierarchy.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/features/performance/PerformancePages.test.tsx`

```bash
git add src/features/performance src/components/content/MetricStrip.tsx src/app/router.tsx src/styles/admin.css
git commit -m "feat: add performance analytics screens"
```

### Task 11: Implement settlement and notice screens

**Files:**
- Test: `src/features/operations/OperationsPages.test.tsx`
- Create: `src/features/operations/fixtures.ts`, `src/features/operations/OperationsPages.tsx`
- Modify: `src/app/router.tsx`, `src/styles/admin.css`

- [ ] **Step 1: Write failing tests**

Assert `/settlements` shows month, selector identity, expected/final amount, edit eligibility, confirmation and payment states; `/system/notices` shows title, audience, publication period/status, author, modified date, a compact editor form, and a visible delete action.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- --run src/features/operations/OperationsPages.test.tsx`

Expected: FAIL because operations routes are placeholders.

- [ ] **Step 3: Implement both screens and verify GREEN**

Run: `npm test -- --run src/features/operations/OperationsPages.test.tsx`

Expected: all operations tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/operations src/app/router.tsx src/styles/admin.css
git commit -m "feat: add settlement and notice screens"
```

### Task 12: Add requirement and fixture-state route coverage

**Files:**
- Create: `src/app/routeCoverage.test.tsx`
- Create after RED: `src/app/requirementCoverage.ts`
- Modify as needed: `src/components/shell/PageHeader.tsx`, domain pages, and `src/app/router.tsx`

- [ ] **Step 1: Write the failing requirement-manifest route test**

Import `ADMIN_REQUIREMENT_COVERAGE` from the not-yet-created `src/app/requirementCoverage.ts`. Each case has `route`, `rows`, `expectedTexts`, `expectedActions`, and `primaryRole`. Render every route, assert the primary component role, every required field/column text, every required action, and `[data-requirement-rows]` equal to the mapped Excel rows.

The manifest must contain at least these cases, without collapsing their expectations to one label:

| Route | Excel rows | Required visible fields/actions |
| --- | --- | --- |
| `/login` | 2 | ID, 비밀번호, 아이디 저장, 로그인 |
| `/creators` | 3–4 | 키워드, 카테고리, 티어, 플랫폼, 이름, 팔로워, 콘텐츠 수, 최근 활동일 |
| `/creators/cr-001` | 5–8 | 기본 정보, AI 적합도/근거, Instagram DM, Meta 제약, 이메일 |
| `/proposals` | 9–10 | 대상, 채널, 발송 방식, 발송 시각, 상태, 채널/상태 필터 |
| `/cohorts` | 11 | 기수명, 모집 기간, 활동 기간, 모집 상태, 참여자 수 |
| `/selectors` | 12 | SNS, 활동 상태, 콘텐츠, 위반, 클릭, 전환, 최근 활동일 |
| `/selectors/qualifications` | 13–14 | 현재 자격, 패널티, 박탈 사유, 차기 기수 제한, 변경 자격, 변경 사유 |
| `/applicants` | 15 | 지원자, SNS, 팔로워, 콘텐츠, 최근 활동, 심사 상태 |
| `/applicants/ap-001` | 16–18, 20 | 조회 수, 반응 수, AI 적합도/근거, 승인, 반려, 결과 전송 상태 |
| `/applicants/ap-003?fixture=auto-rejected` | 19 | 자동 반려, 미충족 기준, 내부 사유 |
| `/campaigns` | 23 | 상태, 삭제 가능 여부, 삭제 불가 사유, 삭제 |
| `/campaigns/new` and `/campaigns/cp-001/edit` | 21–22 | 캠페인명, 기간, 상품 선택, 등록/저장 |
| `/content/reviews`, three detail fixtures | 24–26 | 검수 유형, 작성자, 기수, 플랫폼, 이전/현재 텍스트·URL·미디어 수, AI 상태, 처리 상태, 유형별 액션 |
| `/content/violations` | 27–29 | 기수/유형/처리 필터, 안내 문구/상태, 누적 패널티, 위반사항 안내, 패널티 부여 |
| `/performance` | 30 | 캠페인, 셀렉터스, 클릭, 구매 전환, 전환율 |
| `/performance/creators` | 31 | 구매 전환, 조회, 좋아요, 댓글 |
| `/performance/contents` | 32 | 구매 전환, 조회, 좋아요, 댓글 |
| `/settlements` | 33–35 | 귀속월, 셀렉터스, 예상액, 확정액, 수정 가능, 확정, 지급 상태 |
| `/system/notices` | 36 | 제목, 대상, 게시 기간/상태, 작성자, 수정일, 작성, 수정, 삭제 |

The same test file separately renders `/creators?fixture=empty`, `/proposals?fixture=empty`, `/creators/cr-001?fixture=ai-pending`, `/content/reviews?fixture=no-selection`, both content-diff fixtures, all unmatched detail IDs, `/campaigns/new?fixture=product-modal`, and `/?fixture=mega-menu`, asserting each state-specific message or dialog/overlay role.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- --run src/app/routeCoverage.test.tsx`

Expected: FAIL because `src/app/requirementCoverage.ts` does not exist. After creating the empty export, it must still FAIL on absent route metadata or any missing required field/action; do not accept an empty matrix.

- [ ] **Step 3: Implement the manifest and minimal coverage fixes**

Create the complete typed manifest above. Add a nonvisual `data-requirement-rows` attribute to `PageHeader` or the page root from explicit route metadata. Fix missing route entries, accessible labels, fixture fields, or static actions only; do not add business interactions.

- [ ] **Step 4: Run the complete unit suite and build**

Run: `npm test -- --run && npm run build && npm run lint`

Expected: all tests pass, build exits 0, and lint reports no errors.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "test: cover admin requirements and fixture states"
```

### Task 13: Add browser visual checks and complete the reference comparison

**Files:**
- Create: `tests/visual/admin.spec.ts`, `docs/superpowers/verification/2026-08-03-fuma-admin-ui.md`
- Modify: `playwright.config.ts`, `src/app/App.tsx`
- Modify after RED/inspection: `src/styles/login.css`, `src/styles/admin.css`, focused component styles only

- [ ] **Step 1: Tighten the deterministic Playwright contract**

Update `playwright.config.ts` to keep the Task 4 fixed server and set `baseURL: "http://127.0.0.1:4173"`, `reuseExistingServer: false`, `deviceScaleFactor: 1`, locale `ko-KR`, timezone `Asia/Seoul`, light color scheme, reduced motion, one worker, zero retries, and screenshot/video only on failure. The server command remains `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort`.

- [ ] **Step 2: Write the failing guarded visual-route test**

The test visits and captures:

```ts
const checkpoints = [
  ["/login", { width: 1869, height: 942 }, "login"],
  ["/creators", { width: 1310, height: 741 }, "creators"],
  ["/creators", { width: 1440, height: 900 }, "creators-1440"],
  ["/applicants/ap-001", { width: 1318, height: 742 }, "applicant-detail"],
  ["/campaigns/new?fixture=product-modal", { width: 1316, height: 741 }, "campaign-modal"],
  ["/content/reviews/ct-003?fixture=edited", { width: 1316, height: 735 }, "content-edited"],
  ["/?fixture=mega-menu", { width: 762, height: 577 }, "mega-menu"],
  ["/performance", { width: 1316, height: 742 }, "performance"],
  ["/settlements", { width: 1316, height: 742 }, "settlements"],
] as const;
```

Before each `goto`, register listeners for `console` errors, `pageerror`, and `requestfailed`. Register a route guard that allows `http://127.0.0.1:4173`, `data:`, and `blob:` only; record and abort every other request. After navigation, require empty error/request arrays.

Require `[data-app-ready="true"]`, then wait for `document.fonts.ready` and `Array.from(document.images).every(image => image.complete)`. Require route-specific `[data-visual-contract]` markers that do not exist yet so this test has a genuine RED state. Save fixed files under `test-results/visual/<checkpoint-name>.png`.

- [ ] **Step 3: Run and verify RED**

Run: `npx playwright test tests/visual/admin.spec.ts`

Expected: FAIL on missing route-specific visual-contract markers, not on server startup or selector typos.

- [ ] **Step 4: Implement visual contracts and overflow assertions**

Add stable markers to the app/component roots: `login`, `admin-shell`, `dense-table`, `modal`, `content-review`, `mega-menu`, and `metric-strip`. Disable animation/transitions under Playwright's reduced-motion media query.

Use these explicit overflow rules:

- `/login`: `documentElement.scrollWidth <= viewport.width + 1`.
- Admin checkpoints at widths 1280 and above: `scrollWidth <= viewport.width + 2`.
- Mega menu at 762px: `1280 <= scrollWidth <= 1284`, proving only the intended minimum admin canvas overflows.

Use these core geometry tolerances:

- login card 460±12px wide, 570±16px high;
- rail 40±2px, side menu 205±3px, top bar 38±2px;
- compact controls 27±3px and dense table rows 27±4px;
- modal width 820±24px at 1316px viewport and teal title bar 32±4px;
- all key text bounding boxes remain inside their component rectangles.

- [ ] **Step 5: Run all visual checkpoints and inspect screenshots**

Run: `npx playwright test tests/visual/admin.spec.ts`

Expected: nine passing checkpoints and nine fixed-name screenshot artifacts.

Compare each artifact with the corresponding files in `docs/superpowers/references/` using design spec section 16.2. Inspect the actual PNGs with the image viewer, not just test output. Correct shell widths, vertical bands, font sizes, field heights, table row heights, modal dimensions, login card position, and teal/gray ratios.

Record each checkpoint in `docs/superpowers/verification/2026-08-03-fuma-admin-ui.md` with route, viewport, output PNG, mapped reference, measured dimensions, visual verdict, and any accepted content-only difference. A checkpoint is not complete without this comparison record.

- [ ] **Step 6: Re-run after focused visual corrections**

Run: `npm test -- --run && npm run lint && npm run build && npx playwright test tests/visual/login-shell.spec.ts tests/visual/admin.spec.ts`

Expected: all unit tests, lint, build, the two early geometry checks, and nine final visual checkpoints pass with zero console/page/request failures and no external request attempts.

- [ ] **Step 7: Verify the final diff and commit**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and only intended files changed.

```bash
git add playwright.config.ts tests src docs/superpowers/verification/2026-08-03-fuma-admin-ui.md
git commit -m "test: verify FUMA admin visual prototype"
```

## Final Verification Checklist

- [ ] `npm test -- --run` reports zero failures.
- [ ] `npm run lint` reports zero errors.
- [ ] `npm run build` exits 0.
- [ ] `npx playwright test tests/visual/login-shell.spec.ts tests/visual/admin.spec.ts` reports two early geometry checks and nine final checkpoints passing.
- [ ] The 1440×900 administrator checkpoint passes in addition to all native reference sizes.
- [ ] `/login` matches `hsas-09-current-login.png` at 1869×942.
- [ ] Admin shell geometry matches `hsas-01` and `hsas-03` at reference viewports.
- [ ] Forms, modal, media/editor, and mega menu match their mapped references.
- [ ] All routes in the spec coverage matrix render requirement-specific fields.
- [ ] All deterministic empty, pending, modal, overlay, and missing states are reachable.
- [ ] No API requests, backend integration, or mutable business behavior was added.
- [ ] Playwright recorded zero console errors, page errors, request failures, and non-localhost requests.
- [ ] The verification record contains a verdict for every fixed-name screenshot.
