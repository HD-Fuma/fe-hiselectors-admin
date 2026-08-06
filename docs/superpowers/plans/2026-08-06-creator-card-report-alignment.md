# Creator Card and Analysis Report Alignment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild creator-pool cards and the creator analysis UI around the updated functional specification, without adding backend/API behavior.

**Architecture:** Extend the creator fixture contract with public profile links, category taxonomy, keywords, and typed 90-day post inputs. Derive ER, cadence, and shortlist score through pure helpers rather than precomputed display fields. Keep card presentation in `CreatorEvidenceCard`, move report-specific presentation into a dedicated component, and preserve the existing app shell and routes. Tests define the public UI contract before each implementation change.

**Tech Stack:** React, TypeScript, React Router, Vitest, Testing Library, CSS.

---

## Chunk 1: Creator data and pool-card contract

### Task 1: Add report-ready creator fixture fields

**Files:**
- Modify: `src/features/creators/fixtures.ts`
- Test: `src/features/creators/fixtures.test.ts`
- Create: `src/features/creators/creatorAnalysis.ts`
- Create: `src/features/creators/creatorAnalysis.test.ts`

- [ ] **Step 1: Write failing fixture assertions**

Assert every profile has a public profile URL, every creator has keywords and only one supported profile platform, every card has three representative posts, and the four fixtures use only the approved category taxonomy. Add calculation assertions for a 90-day window ending at `updatedAt`, weekly cadence derived from collected posts, eligible post-level ER averaging, zero-audience exclusion, unavailable metrics, and `ER × log(1 + audience)` shortlist score.

- [ ] **Step 2: Run fixture test to verify it fails**

Run: `npm test -- --run src/features/creators/fixtures.test.ts src/features/creators/creatorAnalysis.test.ts`
Expected: FAIL because the new fields are absent.

- [ ] **Step 3: Extend the fixture types and sample creators**

Add `profileUrl`, `keywords`, and a typed 90-day analysis snapshot with post-level interactions and audience snapshots. Add pure `creatorAnalysis` helpers that derive engagement rate, sample size, cadence, and shortlist score. Keep one Instagram or YouTube profile per creator and explicitly reject Facebook. Retain `tier` and legacy AI report data until their detail-page consumers are migrated; they simply stop rendering in the pool card.

- [ ] **Step 4: Run fixture test to verify it passes**

Run: `npm test -- --run src/features/creators/fixtures.test.ts src/features/creators/creatorAnalysis.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/creators/fixtures.ts src/features/creators/fixtures.test.ts src/features/creators/creatorAnalysis.ts src/features/creators/creatorAnalysis.test.ts
git commit -m "feat: add creator analysis fixture fields"
```

### Task 2: Define the revised card behavior with failing tests

**Files:**
- Modify: `src/features/creators/CreatorEvidenceCard.test.tsx`
- Modify: `src/features/creators/CreatorEvidenceCard.tsx`
- Modify: `src/features/creators/CreatorMediaMosaic.test.tsx`
- Modify: `src/features/creators/CreatorMediaMosaic.tsx`

- [ ] **Step 1: Write failing card assertions**

For an Instagram and a YouTube fixture, assert the card exposes three representative square post slots under `대표 게시글`, profile image, exactly one platform badge, platform account, name, category, keyword chips, platform-specific audience label, and derived ER. Update the mosaic component test for the renamed accessible label. Assert `티어`, `AI 적합도`, and proposal status are not rendered inside the card.

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
git add src/features/creators/CreatorEvidenceCard.tsx src/features/creators/CreatorEvidenceCard.test.tsx src/features/creators/CreatorMediaMosaic.tsx src/features/creators/CreatorMediaMosaic.test.tsx
git commit -m "feat: align creator cards with analysis fields"
```

### Task 3: Style the card without changing the shell

**Files:**
- Modify: `src/styles/admin.css`

- [ ] **Step 1: Apply focused CSS**

Add only card-level classes for section label, chip rows, and balanced metrics. Keep the existing sidebar, topbar, page header, and grid selector contracts unchanged.

- [ ] **Step 2: Run pool-card tests to verify styles did not alter the UI contract**

Run: `npm test -- --run src/features/creators/CreatorEvidenceCard.test.tsx src/features/creators/CreatorPages.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/styles/admin.css
git commit -m "style: refine creator analysis card hierarchy"
```

## Chunk 2: Analysis report and pool controls

### Task 4: Add a typed 90-day analysis report fixture

**Files:**
- Modify: `src/features/creators/fixtures.ts`
- Create: `src/features/creators/CreatorAnalysisReport.test.tsx`
- Create: `src/features/creators/CreatorAnalysisReport.tsx`

- [ ] **Step 1: Write failing report component tests**

Assert report output labels and relationships: the 90-day window ends at `updatedAt`; daily cadence equals collected posts divided by 90 days, weekly cadence equals that daily rate multiplied by seven, and longest publication gap is derived from post dates; profile URL, audience, public versus 90-day collected counts, last-post date, eligible average views/likes/comments, format mix, derived ER formula/sample size, summary, categories, keywords, collaborations, style, tone, risk, strengths/cautions. Add fixture cases for an unavailable metric, a zero-audience post excluded from ER, platform-specific supplemental interactions, and an individually attached supporting URL for every AI claim.

- [ ] **Step 2: Run report test to verify it fails**

Run: `npm test -- --run src/features/creators/CreatorAnalysisReport.test.tsx`
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the report component and fixture model**

Use static, typed fixture data only. Label unavailable platform metrics explicitly, render content URLs as links next to their respective AI claims, and show ER sample size/formula. Use the normalized ER wording from the design spec, include platform-specific supplemental interactions separately, and make no API calls. Render a fixture-backed selection block that calculates Top 2N score with `ER × log(1 + audience)`, then shows final Top N category-distribution adjustment with its explicit category cap.

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
- Modify: `src/features/creators/CreatorMediaMosaic.test.tsx`
- Modify: `src/app/requirementCoverage.ts`
- Modify: `src/app/routeCoverage.test.tsx`
- Modify: `tests/visual/admin.spec.ts`

- [ ] **Step 1: Write failing route tests**

Assert creator-pool controls are keyword, follower/subscriber range, and platform; assert the tier filter is absent; assert the dense table shows account, keywords, audience, ER, and recent activity; assert creator detail renders the analysis report and selection-method block instead of the retired generic AI-fit panel.

- [ ] **Step 2: Run route test to verify it fails**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx src/features/creators/CreatorMediaMosaic.test.tsx src/app/routeCoverage.test.tsx`
Expected: FAIL against category/tier controls and the generic AI summary panel.

- [ ] **Step 3: Implement focused route updates**

Replace pool filters and table columns to match the spreadsheet’s creator-pool requirements. Render `CreatorAnalysisReport` in the detail page. Do not alter proposal-history routes, sidebar, or shell.

- [ ] **Step 4: Run affected tests to verify it passes**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx src/features/creators/CreatorAnalysisReport.test.tsx src/app/routeCoverage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/creators/CreatorPages.tsx src/features/creators/CreatorPages.test.tsx src/features/creators/CreatorMediaMosaic.test.tsx src/app/requirementCoverage.ts src/app/routeCoverage.test.tsx tests/visual/admin.spec.ts
git commit -m "feat: align creator pool and detail report"
```

### Task 6: Final focused verification

**Files:**
- Verify: `src/features/creators/*.test.tsx`
- Verify: `src/app/routeCoverage.test.tsx`

- [ ] **Step 1: Run creator-focused test suite**

Run: `npm test -- --run src/features/creators/fixtures.test.ts src/features/creators/creatorAnalysis.test.ts src/features/creators/CreatorEvidenceCard.test.tsx src/features/creators/CreatorMediaMosaic.test.tsx src/features/creators/CreatorAnalysisReport.test.tsx src/features/creators/CreatorPages.test.tsx src/app/routeCoverage.test.tsx && npm test -- --run`
Expected: PASS.

- [ ] **Step 2: Build production assets**

Run: `npm run build`
Expected: successful TypeScript and Vite build.

- [ ] **Step 3: Run visual creator-pool regression**

Run: `npx playwright test tests/visual/admin.spec.ts --grep "creator"`
Expected: creator pool visual contract passes with three visible square post tiles and no shell change.

- [ ] **Step 4: Check scope**

Run: `git diff --name-only 9f40082..HEAD -- src/components/shell src/app/navigation.ts src/styles/tokens.css`
Expected: no output.

- [ ] **Step 5: Commit any final targeted corrections**

```bash
git add <changed-files>
git commit -m "fix: finalize creator analysis UI"
```
