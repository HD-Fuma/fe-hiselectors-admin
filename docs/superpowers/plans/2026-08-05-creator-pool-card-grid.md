# Single-Platform Creator Profile Card Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the real `/creators` route into a restrained reference-matched profile card where every creator has exactly one Instagram or YouTube profile.

**Architecture:** Replace the multi-platform fixture shape with one required `profile` object and migrate every card/table/detail consumer in the same green commit. Render same-origin local photos with deterministic neutral fallbacks. Keep the existing routes and admin shell untouched, and protect the three-tile/centered-avatar/two-stat geometry with component and Playwright tests.

**Tech Stack:** React 19, TypeScript 6, React Router 7, CSS, Vitest/Testing Library, Playwright

---

## File Structure

- Create `src/features/creators/fixtures.test.ts`: compile-time/runtime single-profile contract.
- Modify `src/features/creators/fixtures.ts`: singular profile, local image paths, no Facebook or per-content platform.
- Modify all tests and components under `src/features/creators/` that read the removed fields.
- Add `public/creator-media/*.jpg`: four local profile photos and twelve local content photos.
- Create `docs/superpowers/references/creator-media-sources.md`: exact source manifest.
- Modify only `.fuma-creator-*` and `.fuma-platform-*` selectors in `src/styles/admin.css`.
- Modify `tests/visual/admin.spec.ts`: geometry at 1279, 1280, and 1440 while preserving sidebar assertions.
- Update `docs/superpowers/verification/2026-08-05-creator-pool-card-grid.md` and tracked screenshots.

## Chunk 1: Complete Single-Profile Migration

### Task 1: Change the schema and every consumer in one green unit

**Files:**
- Create: `src/features/creators/fixtures.test.ts`
- Modify: `src/features/creators/fixtures.ts`
- Modify: `src/features/creators/PlatformIcon.tsx`
- Modify: `src/features/creators/PlatformIcon.test.tsx`
- Modify: `src/features/creators/CreatorArtwork.tsx`
- Modify: `src/features/creators/CreatorMediaMosaic.tsx`
- Modify: `src/features/creators/CreatorMediaMosaic.test.tsx`
- Modify: `src/features/creators/CreatorEvidenceCard.tsx`
- Modify: `src/features/creators/CreatorEvidenceCard.test.tsx`
- Modify: `src/features/creators/CreatorPages.tsx`
- Modify: `src/features/creators/CreatorPages.test.tsx`
- Modify: `src/app/routeCoverage.test.tsx` only if its existing text contract fails

- [ ] **Step 1: Write the failing schema test**

```ts
import { CREATORS, type CreatorPlatform } from "./fixtures";

// @ts-expect-error Facebook is not a supported creator profile platform.
const unsupportedPlatform: CreatorPlatform = "Facebook";
void unsupportedPlatform;

test("stores exactly one Instagram or YouTube profile per creator", () => {
  expect(CREATORS.map(({ id, profile }) => ({ id, ...profile }))).toEqual([
    {
      id: "cr-001", platform: "Instagram", handle: "@seo.yeon",
      followers: 82_400, averageViews: 48_200, averageReactions: 3_278,
      profileImageUrl: "/creator-media/cr-001-profile.jpg",
    },
    {
      id: "cr-002", platform: "YouTube", handle: "도윤의 집밥",
      followers: 76_200, averageViews: 26_800, averageReactions: 1_320,
      profileImageUrl: "/creator-media/cr-002-profile.jpg",
    },
    {
      id: "cr-003", platform: "Instagram", handle: "@zia.trip",
      followers: 32_700, averageViews: 17_900, averageReactions: 980,
      profileImageUrl: "/creator-media/cr-003-profile.jpg",
    },
    {
      id: "cr-004", platform: "Instagram", handle: "@today_haneul",
      followers: 486_000, averageViews: 154_200, averageReactions: 12_860,
      profileImageUrl: "/creator-media/cr-004-profile.jpg",
    },
  ]);

  for (const creator of CREATORS) {
    expect(creator).not.toHaveProperty("platforms");
    expect(creator).not.toHaveProperty("channels");
    expect(creator).not.toHaveProperty("followers");
    expect(creator).not.toHaveProperty("portrait");
    creator.featuredContents.forEach((content) =>
      expect(content).not.toHaveProperty("platform"),
    );
  }
});
```

- [ ] **Step 2: Write failing consumer tests before implementation**

Update `PlatformIcon.test.tsx` to `test.each(["Instagram", "YouTube"] as const)` and add the same Facebook `@ts-expect-error` check. Update card tests to require exactly one platform icon, Instagram labels `평균 반응`/`팔로워`, YouTube labels `평균 조회`/`구독자`, and no third primary metric. Update page tests to require `전체InstagramYouTube`, one profile row in the dense list/detail, and no Facebook.

In `CreatorEvidenceCard.test.tsx`, delete the old `evidenceFixtures`, multi-channel average/rounding, `channels: []`, and Zia Facebook tests. Replace them with exact profile metrics (`cr-003`: `980`, `3.3만`; `cr-002`: `2.7만`, `7.6만`) and keep all proposal route/status tests. In `CreatorMediaMosaic.test.tsx`, remove content `platform` fields and platform-caption assertions but keep the current tile count/play-marker contract until Task 2 adds fixed placeholders.

- [ ] **Step 3: Run RED, including real type-check evidence**

Run: `npm run build`

Expected: FAIL with TypeScript `TS2578` for the unused Facebook `@ts-expect-error` and missing `profile` fields.

Run: `npm test -- --run src/features/creators/fixtures.test.ts src/features/creators/PlatformIcon.test.tsx src/features/creators/CreatorEvidenceCard.test.tsx src/features/creators/CreatorPages.test.tsx`

Expected: FAIL on the missing singular profile and old UI expectations.

- [ ] **Step 4: Implement the complete schema migration**

```ts
export type CreatorPlatform = "Instagram" | "YouTube";

export interface CreatorProfileFixture {
  platform: CreatorPlatform;
  handle: string;
  followers: number;
  averageViews: number;
  averageReactions: number;
  profileImageUrl: string;
}

export interface CreatorFeaturedContentFixture {
  id: string;
  title: string;
  mediaType: "이미지" | "동영상";
  views: number;
  visual: CreatorMediaVisual;
  thumbnailUrl: string;
}
```

Remove `Facebook`, `platforms`, `channels`, top-level `followers`, `portrait`, `CreatorPortraitVariant`, and `featuredContents[].platform`. Keep proposal contacts and history unchanged. Use these exact thumbnail paths:

- `cr-001`: `/creator-media/cr-001-01.jpg`, `/creator-media/cr-001-02.jpg`, `/creator-media/cr-001-03.jpg`
- `cr-002`: `/creator-media/cr-002-01.jpg`, `/creator-media/cr-002-02.jpg`, `/creator-media/cr-002-03.jpg`
- `cr-003`: `/creator-media/cr-003-01.jpg`, `/creator-media/cr-003-02.jpg`, `/creator-media/cr-003-03.jpg`
- `cr-004`: `/creator-media/cr-004-01.jpg`, `/creator-media/cr-004-02.jpg`, `/creator-media/cr-004-03.jpg`

- [ ] **Step 5: Migrate every consumer**

Remove the Facebook icon path; leave the now-unused Facebook CSS selector for Task 3's creator-style cleanup. Replace the variant-driven `CreatorPortrait` with a provisional neutral-initial `CreatorProfilePhoto` that has no `CreatorPortraitVariant` dependency, and make `CreatorEvidenceCard` use it. Task 2 will then add real `<img>` loading/error behavior test-first. Make the card read only `creator.profile`; remove `averageViews()` and `engagementRate()` channel helpers and render two platform-aware stats. Make `CreatorMediaMosaic` stop reading content platforms and remove source captions. Make `CreatorPages` filter `전체/Instagram/YouTube`, render `creator.profile` in the list, and pass `[creator.profile]` into the existing detail `DenseTable`. Preserve proposal channels and routing.

- [ ] **Step 6: Run GREEN before committing**

Run: `npm test -- --run src/features/creators/fixtures.test.ts src/features/creators/PlatformIcon.test.tsx src/features/creators/CreatorMediaMosaic.test.tsx src/features/creators/CreatorEvidenceCard.test.tsx src/features/creators/CreatorPages.test.tsx src/app/routeCoverage.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0 with the Facebook `@ts-expect-error` consumed by the narrowed union.

Run: `npm test -- --run`

Expected: all tests PASS.

- [ ] **Step 7: Commit the green migration**

```bash
git add src/features/creators src/app/routeCoverage.test.tsx
git commit -m "refactor: enforce one creator profile platform"
```

## Chunk 2: Local Photos and Neutral Fallbacks

### Task 2: Render same-origin photos in three fixed slots

**Files:**
- Add: `public/creator-media/*.jpg`
- Create: `docs/superpowers/references/creator-media-sources.md`
- Modify: `src/features/creators/CreatorArtwork.tsx`
- Modify: `src/features/creators/CreatorMediaMosaic.tsx`
- Modify: `src/features/creators/CreatorMediaMosaic.test.tsx`
- Modify: `src/features/creators/CreatorEvidenceCard.tsx`
- Modify: `src/features/creators/CreatorEvidenceCard.test.tsx`

- [ ] **Step 1: Write failing image and fallback tests**

For media, assert three same-origin `<img>` elements with `src` from `thumbnailUrl`, title-based alt text, no platform labels, and one play marker. With two/zero contents assert exactly three semantic slots remain. Fire `error` on an image and assert a replacement `role="img"` named `{creator} 인기 콘텐츠: {title} 이미지 없음` containing the title.

For profiles, assert the default card has one same-origin `<img alt="{creator} 프로필 이미지">`. Render a creator with `profileImageUrl: ""` and fire `error` on a normal image; in both cases assert a neutral `role="img"` named `{creator} 프로필 이미지 없음` containing the creator initials/name. These tests must fail against the current SVG portrait.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/features/creators/CreatorMediaMosaic.test.tsx src/features/creators/CreatorEvidenceCard.test.tsx`

Expected: FAIL because local `<img>` rendering, fixed placeholders, and profile fallbacks do not exist.

- [ ] **Step 3: Download the exact local JPG manifest**

Use Unsplash static image CDN only at build time. For every `source-id` below, download
`https://images.unsplash.com/{source-id}?auto=format&fit=crop&w=640&h=640&q=78&fm=jpg`
as a 640×640 JPG. Record the full URLs in `creator-media-sources.md`. Runtime code must reference only `/creator-media/*.jpg`.

| Local file | source-id |
|---|---|
| `cr-001-profile.jpg` | `photo-1494790108377-be9c29b29330` |
| `cr-002-profile.jpg` | `photo-1500648767791-00dcc994a43e` |
| `cr-003-profile.jpg` | `photo-1534528741775-53994a69daeb` |
| `cr-004-profile.jpg` | `photo-1544005313-94ddf0286df2` |
| `cr-001-01.jpg` | `photo-1483985988355-763728e1935b` |
| `cr-001-02.jpg` | `photo-1522335789203-aabd1fc54bc9` |
| `cr-001-03.jpg` | `photo-1596462502278-27bfdc403348` |
| `cr-002-01.jpg` | `photo-1556911220-bff31c812dba` |
| `cr-002-02.jpg` | `photo-1495474472287-4d71bcdd2085` |
| `cr-002-03.jpg` | `photo-1414235077428-338989a2e8c0` |
| `cr-003-01.jpg` | `photo-1507525428034-b723cf961d3e` |
| `cr-003-02.jpg` | `photo-1477959858617-67f85cf4f1df` |
| `cr-003-03.jpg` | `photo-1488646953014-85cb44e25828` |
| `cr-004-01.jpg` | `photo-1551024506-0bccd828d307` |
| `cr-004-02.jpg` | `photo-1551218808-94e220e084d2` |
| `cr-004-03.jpg` | `photo-1445116572660-236099ec97a0` |

Verify with `file public/creator-media/*.jpg`; expected: all 16 are JPEG, 640×640.

- [ ] **Step 4: Implement exact fallback markup**

Replace `CreatorPortrait` with `CreatorProfilePhoto({ creatorName, src })`. It renders the `<img>` until an empty source or `onError`, then renders `<span className="fuma-creator-profile-fallback" role="img" aria-label="{creatorName} 프로필 이미지 없음">{creatorName.slice(0, 1)}</span>`.

For missing/error content render `<span className="fuma-creator-media__fallback" role="img" aria-label="{creatorName} 인기 콘텐츠: {title} 이미지 없음"><span>{title}</span></span>`. Fill absent slots with the label `인기 콘텐츠 없음` until exactly three slots exist. Remove the old multicolor `CreatorMediaArtwork` paths.

- [ ] **Step 5: Run GREEN and commit**

Run: `npm test -- --run src/features/creators/CreatorMediaMosaic.test.tsx src/features/creators/CreatorEvidenceCard.test.tsx`

Expected: PASS.

```bash
git add public/creator-media docs/superpowers/references/creator-media-sources.md src/features/creators/CreatorArtwork.tsx src/features/creators/CreatorMediaMosaic.tsx src/features/creators/CreatorMediaMosaic.test.tsx src/features/creators/CreatorEvidenceCard.tsx src/features/creators/CreatorEvidenceCard.test.tsx
git commit -m "feat: add local creator profile media"
```

## Chunk 3: Reference Geometry and Final Verification

### Task 3: Apply the restrained card styling

**Files:**
- Modify: `src/features/creators/CreatorEvidenceCard.tsx`
- Modify: `src/features/creators/CreatorEvidenceCard.test.tsx`
- Modify: `src/styles/admin.css`
- Modify: `tests/visual/admin.spec.ts`

- [ ] **Step 1: Add failing structural and pixel-geometry assertions**

In the unit test, assert one centered profile wrapper contains the photo and platform badge, the mosaic exposes exactly three media slots, the primary metric list has exactly two children, and operations/actions remain outside the identity/stat region.

In `tests/visual/admin.spec.ts`, add checkpoints at 1279, 1280, and 1440. Assert 2/3/3 grid columns respectively; three tiles have equal width/height; adjacent gaps are 8px; avatar is 76px and centered; overlap is 38px; badge is 22px; one accessible platform icon and two primary metrics exist. Keep all existing sidebar geometry/menu/active/hover/focus assertions unchanged.

- [ ] **Step 2: Run both RED suites before implementation**

Run: `npm test -- --run src/features/creators/CreatorEvidenceCard.test.tsx`

Expected: FAIL on the old wrapper hierarchy.

Run: `npm run test:visual -- tests/visual/admin.spec.ts --grep creators`

Expected: FAIL on the old card geometry, old Facebook expectations, or the new 1279/1280 contract.

- [ ] **Step 3: Restructure the card and implement only creator-scoped CSS**

Move the platform badge inside the centered profile wrapper and keep operations/actions outside identity/stats. Use 12px card padding, three 1:1 tiles with 8px gap, 76px avatar with 38px overlap, 22px platform badge, centered type, 14px card radius, two equal stats, no default shadow, no hover translation, and border-only text actions. Move the grid breakpoint to `max-width: 1279px` and remove the unused `.fuma-platform-icon--facebook` selector here. Do not edit `.hsas-admin-*`, shell components, navigation, or tokens.

- [ ] **Step 4: Run both GREEN suites and commit**

Run: `npm test -- --run src/features/creators/CreatorEvidenceCard.test.tsx src/features/creators/CreatorMediaMosaic.test.tsx`

Expected: PASS.

Run: `npm run test:visual -- tests/visual/admin.spec.ts --grep creators`

Expected: PASS.

```bash
git add src/features/creators/CreatorEvidenceCard.tsx src/features/creators/CreatorEvidenceCard.test.tsx src/styles/admin.css tests/visual/admin.spec.ts
git commit -m "style: match creator profile card reference"
```

### Task 4: Prove visual geometry and shell preservation

**Files:**
- Modify: `docs/superpowers/verification/2026-08-05-creator-pool-card-grid.md`
- Update: `test-results/visual/creators.png`
- Add: `test-results/visual/creators-1279.png`
- Add: `test-results/visual/creators-1280.png`
- Update: `test-results/visual/creators-1440.png`

- [ ] **Step 1: Capture complete evidence**

Save full-page screenshots exactly as `creators-1279.png`, `creators-1280.png`, and `creators-1440.png`; keep `creators.png` for the legacy 1310 checkpoint. Assert all sixteen local images have positive `naturalWidth`, no external requests, no console/page errors, and the fourth card is fully visible.

- [ ] **Step 2: Run final verification**

Run: `npm run lint`

Run: `npm run build`

Run: `npm test -- --run`

Run: `npm run test:visual`

Expected: every command exits 0.

Run: `git diff --name-only 136f1ca..HEAD -- src/components/shell src/app/navigation.ts src/styles/tokens.css`

Expected: no output.

Run: `git diff -U0 136f1ca..HEAD -- src/styles/admin.css | rg '^[+-]\.(hsas-admin|hsas-work-tabs|hsas-page-header)'`

Expected: no output. Manually inspect remaining `admin.css` hunks and record that every changed selector begins with `.fuma-creator-` or `.fuma-platform-`.

- [ ] **Step 3: Update evidence and commit tracked screenshots**

Record commands, counts, screenshot hashes, one-platform proof, local image-load proof, and the empty sidebar guard output.

```bash
git add tests/visual/admin.spec.ts docs/superpowers/verification/2026-08-05-creator-pool-card-grid.md test-results/visual/creators.png test-results/visual/creators-1440.png
git add -f test-results/visual/creators-1279.png test-results/visual/creators-1280.png
git commit -m "test: verify refined creator profile cards"
```
