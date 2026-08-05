# Creator Card and Analysis Report Alignment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild creator-pool cards and the creator analysis UI around the updated functional specification, without adding backend/API behavior.

**Architecture:** Extend the creator fixture contract with public profile links, category taxonomy, keywords, ER, and a 90-day analysis snapshot. Keep card presentation in `CreatorEvidenceCard`, move report-specific presentation into a dedicated component, and preserve the existing app shell and routes. Tests define the public UI contract before each implementation change.

**Tech Stack:** React, TypeScript, React Router, Vitest, Testing Library, CSS.

---

## Chunk 1: Creator data and pool-card contract

### Task 1: Add report-ready creator fixture fields

**Files:**
- Modify: `src/features/creators/fixtures.ts`
- Test: `src/features/creators/fixtures.test.ts`

- [ ] **Step 1: Write failing fixture assertions**

Assert every profile has a public profile URL, every creator has keywords and an ER percentage, and the four fixtures use only the approved category taxonomy.

- [ ] **Step 2: Run fixture test to verify it fails**

Run: `npm test -- --run src/features/creators/fixtures.test.ts`
Expected: FAIL because the new fields are absent.

- [ ] **Step 3: Extend the fixture types and sample creators**

Add `profileUrl`, `keywords`, and `engagementRate` to the card contract. Keep one Instagram or YouTube profile per creator; remove fixture fields that only support the retired card tier/AI-fit row.

- [ ] **Step 4: Run fixture test to verify it passes**

Run: `npm test -- --run src/features/creators/fixtures.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/creators/fixtures.ts src/features/creators/fixtures.test.ts
git commit -m "feat: add creator analysis fixture fields"
```

### Task 2: Define the revised card behavior with failing tests

**Files:**
- Modify: `src/features/creators/CreatorEvidenceCard.test.tsx`
- Modify: `src/features/creators/CreatorEvidenceCard.tsx`

- [ ] **Step 1: Write failing card assertions**

For an Instagram and a YouTube fixture, assert the card exposes `대표 게시글`, profile image, platform account, name, category, keyword chips, platform-specific audience label, and ER. Assert `티어`, `AI 적합도`, and proposal status are not rendered inside the card.

- [ ] **Step 2: Run card test to verify it fails**

Run: `npm test -- --run src/features/creators/CreatorEvidenceCard.test.tsx`
Expected: FAIL against the old two-metric and meta-row card.

- [ ] **Step 3: Implement the minimal card markup**

Keep the three thumbnail mosaic, change its accessible label to `대표 게시글`, render profile/identity fields, category and keyword chips, and a compact audience/ER metric pair. Retain only `상세 보기` and generic `제안하기` actions.

- [ ] **Step 4: Run card test to verify it passes**

Run: `npm test -- --run src/features/creators/CreatorEvidenceCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/creators/CreatorEvidenceCard.tsx src/features/creators/CreatorEvidenceCard.test.tsx src/features/creators/CreatorMediaMosaic.tsx
git commit -m "feat: align creator cards with analysis fields"
```

### Task 3: Style the card without changing the shell

**Files:**
- Modify: `src/styles/admin.css`
- Test: `src/features/creators/CreatorPages.test.tsx`

- [ ] **Step 1: Write failing pool-page assertions**

Assert the card view contains keyword chips and no tier filter/control. Keep the current card-grid and shell roles intact.

- [ ] **Step 2: Run page test to verify it fails**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx`
Expected: FAIL because the old filter and card metadata remain.

- [ ] **Step 3: Apply focused CSS**

Add only card-level classes for section label, chip rows, and balanced metrics. Keep the existing sidebar, topbar, page header, and grid selector contracts unchanged.

- [ ] **Step 4: Run pool-page tests to verify it passes**

Run: `npm test -- --run src/features/creators/CreatorEvidenceCard.test.tsx src/features/creators/CreatorPages.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/styles/admin.css src/features/creators/CreatorPages.test.tsx
git commit -m "style: refine creator analysis card hierarchy"
```

## Chunk 2: Analysis report and pool controls

### Task 4: Add a typed 90-day analysis report fixture

**Files:**
- Modify: `src/features/creators/fixtures.ts`
- Create: `src/features/creators/CreatorAnalysisReport.test.tsx`
- Create: `src/features/creators/CreatorAnalysisReport.tsx`

- [ ] **Step 1: Write failing report component tests**

Assert report output labels: updated date/window, profile URL, audience, cadence, public versus 90-day collected counts, last-post date, average views/likes/comments, format mix, ER formula/sample size, summary, categories, keywords, collaborations, style, tone, risk, strengths/cautions, and cited content URLs.

- [ ] **Step 2: Run report test to verify it fails**

Run: `npm test -- --run src/features/creators/CreatorAnalysisReport.test.tsx`
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the report component and fixture model**

Use static, typed fixture data only. Label unavailable platform metrics explicitly and render content URLs as links. Use the normalized ER wording from the design spec and no API calls.

- [ ] **Step 4: Run report test to verify it passes**

Run: `npm test -- --run src/features/creators/CreatorAnalysisReport.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/creators/fixtures.ts src/features/creators/CreatorAnalysisReport.tsx src/features/creators/CreatorAnalysisReport.test.tsx
git commit -m "feat: add creator analysis report UI"
```

### Task 5: Replace the old AI summary section and align pool filters/table

**Files:**
- Modify: `src/features/creators/CreatorPages.tsx`
- Modify: `src/features/creators/CreatorPages.test.tsx`

- [ ] **Step 1: Write failing route tests**

Assert creator-pool controls are keyword, follower/subscriber range, and platform; assert the dense table shows account, keywords, audience, ER, and recent activity; assert creator detail renders the analysis report instead of the retired generic AI-fit panel.

- [ ] **Step 2: Run route test to verify it fails**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx`
Expected: FAIL against category/tier controls and the generic AI summary panel.

- [ ] **Step 3: Implement focused route updates**

Replace pool filters and table columns to match the spreadsheet’s creator-pool requirements. Render `CreatorAnalysisReport` in the detail page. Do not alter proposal-history routes, sidebar, or shell.

- [ ] **Step 4: Run affected tests to verify it passes**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx src/features/creators/CreatorAnalysisReport.test.tsx src/app/routeCoverage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/creators/CreatorPages.tsx src/features/creators/CreatorPages.test.tsx src/app/routeCoverage.test.tsx
git commit -m "feat: align creator pool and detail report"
```

### Task 6: Final focused verification

**Files:**
- Verify: `src/features/creators/*.test.tsx`
- Verify: `src/app/routeCoverage.test.tsx`

- [ ] **Step 1: Run creator-focused test suite**

Run: `npm test -- --run src/features/creators/fixtures.test.ts src/features/creators/CreatorEvidenceCard.test.tsx src/features/creators/CreatorMediaMosaic.test.tsx src/features/creators/CreatorAnalysisReport.test.tsx src/features/creators/CreatorPages.test.tsx src/app/routeCoverage.test.tsx`
Expected: PASS.

- [ ] **Step 2: Build production assets**

Run: `npm run build`
Expected: successful TypeScript and Vite build.

- [ ] **Step 3: Check scope**

Run: `git diff --name-only 9f40082..HEAD -- src/components/shell src/app/navigation.ts src/styles/tokens.css`
Expected: no output.

- [ ] **Step 4: Commit any final targeted corrections**

```bash
git add <changed-files>
git commit -m "fix: finalize creator analysis UI"
```
