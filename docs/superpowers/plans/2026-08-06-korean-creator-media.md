# Korean Creator Media Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace creator-pool stock photos with cohesive photorealistic images of four fictional adult Korean women without changing applicant imagery.

**Architecture:** Generate a creator-only set of 16 local square assets under new `kr-cr-*` filenames. Point only creator fixtures at those assets so the list, detail, and proposal views update through the existing data flow while applicant fixtures keep the old shared files.

**Tech Stack:** OpenAI image generation, JPEG assets, React fixture data, Vitest, Playwright

---

## Chunk 1: Creator-only Media Assets and Wiring

### Task 1: Lock the new creator-only path contract

**Files:**
- Modify: `src/features/creators/fixtures.test.ts`
- Modify: `src/features/creators/CreatorEvidenceCard.test.tsx`
- Create: `tests/visual/creator-media.spec.ts`

- [ ] **Step 1: Write failing fixture assertions**

Update the four expected `profileImageUrl` values to `/creator-media/kr-cr-001-profile.jpg` through `/creator-media/kr-cr-004-profile.jpg`. Add this loop after the profile contract:

```ts
for (const [index, creator] of CREATORS.entries()) {
  const number = String(index + 1).padStart(3, "0");
  expect(creator.profile.profileImageUrl).toBe(
    `/creator-media/kr-cr-${number}-profile.jpg`,
  );
  expect(creator.featuredContents.map((content) => content.thumbnailUrl)).toEqual(
    ["01", "02", "03"].map(
      (suffix) => `/creator-media/kr-cr-${number}-${suffix}.jpg`,
    ),
  );
}
```

Update the evidence-card profile expectation to `/creator-media/kr-cr-003-profile.jpg`.

- [ ] **Step 2: Add a failing browser asset contract**

Create `tests/visual/creator-media.spec.ts` with three tests titled `creator media loads on list`, `creator media loads on detail`, and `creator media loads on proposal`. Map them to `[/creators, /creators/cr-001, /proposals/new?creator=cr-001]`. Each test waits for `[data-app-ready="true"]`, requires at least one visible `img[src*="/creator-media/kr-cr-"]`, and polls until every matched image is loaded:

```ts
await expect.poll(() =>
  images.evaluateAll((nodes) =>
    nodes.every((node) => {
      const image = node as HTMLImageElement;
      return image.complete && image.naturalWidth > 0;
    }),
  ),
).toBe(true);
```

Also assert that `.fuma-creator-profile-fallback` and `.fuma-creator-media__fallback` have count zero. Save a screenshot for each route to `test-results/visual/creator-media-list.png`, `creator-media-detail.png`, and `creator-media-proposal.png`.

- [ ] **Step 3: Run the tests to verify RED**

Run: `npm test -- --run src/features/creators/fixtures.test.ts src/features/creators/CreatorEvidenceCard.test.tsx`

Expected: FAIL because fixtures still reference the old `cr-*` files.

Run: `npx playwright test tests/visual/creator-media.spec.ts`

Expected: FAIL because no image source contains `/creator-media/kr-cr-`.

### Task 2: Generate and validate four cohesive image sets

**Files:**
- Create: `public/creator-media/kr-cr-001-profile.jpg`
- Create: `public/creator-media/kr-cr-001-01.jpg`
- Create: `public/creator-media/kr-cr-001-02.jpg`
- Create: `public/creator-media/kr-cr-001-03.jpg`
- Create: `public/creator-media/kr-cr-002-profile.jpg`
- Create: `public/creator-media/kr-cr-002-01.jpg`
- Create: `public/creator-media/kr-cr-002-02.jpg`
- Create: `public/creator-media/kr-cr-002-03.jpg`
- Create: `public/creator-media/kr-cr-003-profile.jpg`
- Create: `public/creator-media/kr-cr-003-01.jpg`
- Create: `public/creator-media/kr-cr-003-02.jpg`
- Create: `public/creator-media/kr-cr-003-03.jpg`
- Create: `public/creator-media/kr-cr-004-profile.jpg`
- Create: `public/creator-media/kr-cr-004-01.jpg`
- Create: `public/creator-media/kr-cr-004-02.jpg`
- Create: `public/creator-media/kr-cr-004-03.jpg`
- Create: `docs/superpowers/references/creator-media-sources.md`

- [ ] **Step 1: Generate `cr-001` profile**

Call built-in `image_gen` with: `photorealistic-natural; square creator fixture; fictional adult Korean woman in her mid-20s, polished Seoul beauty and fashion influencer, head-and-shoulders profile portrait, natural skin texture, soft daylight, clean neutral studio with subtle pink accents; no real-person resemblance, minor, logo, watermark, readable text, distorted face or hands`. Copy the exact absolute path returned in `output_hint` with `cp -R <returned-absolute-path> /private/tmp/kr-cr-001-profile-source`, then inspect it with `view_image`.

- [ ] **Step 2: Generate `cr-001-01`**

Call built-in `image_gen` with `referenced_image_paths: [/private/tmp/kr-cr-001-profile-source]` and prompt `identity-preserve; same adult woman; full-body summer daily outfit on a tasteful Seoul street; square social post; no text, logo, watermark, or distorted hands`. Copy the returned `output_hint` path to `/private/tmp/kr-cr-001-01-source` and inspect it.

- [ ] **Step 3: Generate `cr-001-02`**

Use the same reference path and constraints for `close beauty portrait applying warm autumn-tone makeup`; copy to `/private/tmp/kr-cr-001-02-source` and inspect it.

- [ ] **Step 4: Generate `cr-001-03`**

Use the same reference path and constraints for `morning office-look mirror outfit, smartphone showing no readable UI`; copy to `/private/tmp/kr-cr-001-03-source` and inspect it.

- [ ] **Step 5: Generate `cr-002` profile**

Generate a distinct fictional adult Korean woman in her late 20s, warm approachable home-food YouTube creator, cozy modern Korean apartment kitchen, amber daylight, using the same portrait and safety constraints as Step 1. Copy to `/private/tmp/kr-cr-002-profile-source` and inspect it.

- [ ] **Step 6: Generate `cr-002-01`**

Use `cr-002-profile-source` as the reference for `same woman cooking a weeknight Korean meal`; copy to `/private/tmp/kr-cr-002-01-source` and inspect it.

- [ ] **Step 7: Generate `cr-002-02`**

Use the same reference for `same woman making pour-over coffee at a home café counter`; copy to `/private/tmp/kr-cr-002-02-source` and inspect it.

- [ ] **Step 8: Generate `cr-002-03`**

Use the same reference for `same woman presenting a weekend table spread`; copy to `/private/tmp/kr-cr-002-03-source` and inspect it.

- [ ] **Step 9: Generate `cr-003` profile**

Generate a distinct fictional adult Korean woman in her mid-20s, bright active travel and lifestyle creator, fresh natural daylight and airy blue-green palette, using the same portrait and safety constraints as Step 1. Copy to `/private/tmp/kr-cr-003-profile-source` and inspect it.

- [ ] **Step 10: Generate `cr-003-01`**

Use `cr-003-profile-source` as the reference for `same woman walking beside a Korean summer beach`; copy to `/private/tmp/kr-cr-003-01-source` and inspect it.

- [ ] **Step 11: Generate `cr-003-02`**

Use the same reference for `same woman exploring a contemporary Seoul city street`; copy to `/private/tmp/kr-cr-003-02-source` and inspect it.

- [ ] **Step 12: Generate `cr-003-03`**

Use the same reference for `same woman packing clothes and travel gear with her face visible in the frame`; copy to `/private/tmp/kr-cr-003-03-source` and inspect it.

- [ ] **Step 13: Generate `cr-004` profile**

Generate a distinct fictional adult Korean woman in her late 20s, refined café and dessert influencer, upscale brunch styling, warm cream and berry palette, using the same portrait and safety constraints as Step 1. Copy to `/private/tmp/kr-cr-004-profile-source` and inspect it.

- [ ] **Step 14: Generate `cr-004-01`**

Use `cr-004-profile-source` as the reference for `same woman presenting a seasonal fruit dessert`; copy to `/private/tmp/kr-cr-004-01-source` and inspect it.

- [ ] **Step 15: Generate `cr-004-02`**

Use the same reference for `same woman enjoying a styled brunch table`; copy to `/private/tmp/kr-cr-004-02-source` and inspect it.

- [ ] **Step 16: Generate `cr-004-03`**

Use the same reference for `same woman reviewing a new café drink with the cup label blank`; copy to `/private/tmp/kr-cr-004-03-source` and inspect it.

- [ ] **Step 17: Normalize files**

For each `/private/tmp/kr-cr-*-source`, use `sips` to convert and resize into its exact matching `public/creator-media/kr-cr-*.jpg` destination:

```bash
sips -s format jpeg -s formatOptions 90 -m "/System/Library/ColorSync/Profiles/sRGB Profile.icc" -z 640 640 /private/tmp/kr-cr-001-profile-source --out public/creator-media/kr-cr-001-profile.jpg
```

Repeat with the same command shape for all 16 explicit source/destination pairs. Do not overwrite the existing non-`kr-` assets.

- [ ] **Step 18: Record provenance**

Create `creator-media-sources.md` stating that all `kr-cr-*` files are AI-generated fictional adults for UI fixture use, the generation date, each creator's art direction, and that they are not intended to represent a real person or endorsement.

- [ ] **Step 19: Validate the asset contract**

Run: `test "$(find public/creator-media -name 'kr-cr-*.jpg' -type f | wc -l | tr -d ' ')" = "16"`

Expected: exit 0.

Run: `test "$(file public/creator-media/kr-cr-*.jpg | grep -c 'JPEG image data')" = "16"`

Expected: exit 0, proving all 16 are JPEG files.

Run: `for media_file in public/creator-media/kr-cr-*.jpg; do test "$(sips -g pixelWidth "$media_file" | awk '/pixelWidth/ {print $2}')" = "640" || exit 1; test "$(sips -g pixelHeight "$media_file" | awk '/pixelHeight/ {print $2}')" = "640" || exit 1; sips -g profile "$media_file" | grep -q 'sRGB' || exit 1; done`

Expected: exit 0, proving every file is 640×640 sRGB.

Visually reject and regenerate any file with a minor-looking subject, real-person resemblance, malformed face/hands, visible watermark/logo/text, or identity drift within a creator's four-image set. Confirm the four creators remain visually distinct.

### Task 3: Wire creator fixtures and verify integrations

**Files:**
- Modify: `src/features/creators/fixtures.ts`
- Test: `src/features/creators/fixtures.test.ts`
- Test: `src/features/creators/CreatorEvidenceCard.test.tsx`
- Verify: `src/features/creators/CreatorPages.test.tsx`
- Verify: `src/features/applicants/ApplicantPages.test.tsx`

- [ ] **Step 1: Update only creator fixture paths**

Change the four profile paths and twelve `featuredContents[].thumbnailUrl` values from `/creator-media/cr-*` to the corresponding `/creator-media/kr-cr-*` values. Do not modify applicant fixtures or old stock assets.

- [ ] **Step 2: Run focused tests to verify GREEN**

Run: `npm test -- --run src/features/creators/fixtures.test.ts src/features/creators/CreatorEvidenceCard.test.tsx src/features/creators/CreatorPages.test.tsx`

Expected: PASS.

- [ ] **Step 3: Confirm applicant paths remain isolated**

Run: `if rg -n 'kr-cr-' src/features/applicants; then exit 1; fi`

Expected: exit 0 with no `kr-cr-` references in applicant `.ts` or `.tsx` files.

Run: `npm test -- --run src/features/applicants/ApplicantPages.test.tsx`

Expected: PASS.

- [ ] **Step 4: Verify creator views in the browser**

Run: `npx playwright test tests/visual/creator-media.spec.ts tests/visual/admin.spec.ts --grep "creator media loads on|creators visual checkpoint at the legacy viewport"`

Expected: all four selected tests PASS, covering the list, creator detail, proposal compose, and legacy card geometry. Inspect `test-results/visual/creator-media-list.png`, `creator-media-detail.png`, and `creator-media-proposal.png` to confirm faces are not awkwardly cropped.

- [ ] **Step 5: Commit the media refresh**

```bash
git add public/creator-media/kr-cr-*.jpg docs/superpowers/references/creator-media-sources.md src/features/creators/fixtures.ts src/features/creators/fixtures.test.ts src/features/creators/CreatorEvidenceCard.test.tsx tests/visual/creator-media.spec.ts
git commit -m "feat: refresh Korean creator media"
```

### Task 4: Final verification

**Files:**
- Verify only

- [ ] **Step 1: Run the full unit suite**

Run: `npm test -- --run`

Expected: PASS.

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint`

Expected: PASS.

Run: `npm run build`

Expected: PASS.
