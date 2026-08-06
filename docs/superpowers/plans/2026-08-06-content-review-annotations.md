# Content Review Annotations Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mark each violation at its exact image, caption, or URL location and show the matching correction note immediately beside that content section.

**Architecture:** Store typed annotations on each content snapshot. `SnapshotPanel` renders active annotations through media overlays, text marks, URL row highlights, and a target-aligned note column. Annotated comparisons stack vertically; ordinary comparisons remain side by side.

**Tech Stack:** React, TypeScript, CSS Grid, Vitest, Testing Library

---

## Chunk 1: Annotation contract and UI

### Task 1: Define fixture annotations

**Files:**
- Modify: `src/features/content/fixtures.ts`
- Test: `src/features/content/fixtures.test.ts`

- [x] Add a failing target-validity test and confirm it fails with zero annotations.
- [ ] Add a discriminated `ContentAnnotationTarget` and `ContentAnnotation` contract.
- [ ] Add three active annotations to the previous snapshot of `ct-002` only.
- [ ] Run `npm test -- src/features/content/fixtures.test.ts` and confirm GREEN.

### Task 2: Render location markers and adjacent notes

**Files:**
- Modify: `src/components/content/MediaTiles.tsx`
- Modify: `src/features/content/ContentPages.tsx`
- Modify: `src/styles/content-review.css`
- Test: `src/components/content/MediaTiles.test.tsx`
- Test: `src/features/content/ContentPages.test.tsx`

- [x] Add a failing detail test for previous-only image, exact caption, URL markers and matching notes.
- [ ] Render image boxes and numbered pins inside the target tile.
- [ ] Highlight the exact caption quote and target URL row.
- [ ] Render target-grouped note cards in the adjacent grid column.
- [ ] Apply the active filter before marker, note and stacked-layout decisions; hide new/current/resolved-only annotations.
- [ ] Run the three focused content tests and confirm GREEN, including existing media fallback coverage.

### Task 3: Verify the visible result

- [ ] Run only the focused content-review tests.
- [ ] Run the production build.
- [ ] Capture `ct-002` at 1600px and check marker/note alignment and overlap.
- [ ] Capture a narrow viewport and confirm note rows move below their targets without overlap.
