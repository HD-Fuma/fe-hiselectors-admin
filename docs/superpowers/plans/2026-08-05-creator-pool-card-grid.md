# Creator Pool Card Grid Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/creators` a profile-first three-column content card grid with clear Instagram, YouTube, and Facebook identity while preserving the dense table as a secondary view.

**Architecture:** Keep `CreatorListPage` as the route composer. Put platform branding, deterministic SVG artwork, media mosaic, one-card presentation, the named grid, and the creator-only toolbar in focused files; keep the existing generic table toolbar for other pages. Extend typed fixtures without external URLs, then verify through direct component tests, route tests, and two Playwright viewports.

**Tech Stack:** React 19, TypeScript 6, React Router 7, CSS, Vitest/Testing Library, Playwright

---

## File Structure

- Create `src/features/creators/PlatformIcon.tsx`: three inline brand marks and accessible/decorative modes.
- Create `src/features/creators/PlatformIcon.test.tsx`: exact icon semantics for all platforms.
- Create `src/features/creators/CreatorArtwork.tsx`: deterministic profile/content SVG artwork.
- Create `src/features/creators/CreatorMediaMosaic.tsx`: zero-to-three content tiles, platform source, view count, and video marker.
- Create `src/features/creators/CreatorMediaMosaic.test.tsx`: mosaic semantics and short-array safety.
- Create `src/features/creators/CreatorEvidenceCard.tsx`: identity, metrics, states, and routes for one creator.
- Create `src/features/creators/CreatorEvidenceCard.test.tsx`: card semantics, metrics, icons, content, and every proposal action mapping.
- Create `src/features/creators/CreatorCardGrid.tsx`: named list and card mapping.
- Create `src/features/creators/CreatorResultToolbar.tsx`: result count, static sort, and accessible view toggle.
- Modify `src/features/creators/fixtures.ts`: platform union, artwork keys, Facebook data, and three featured contents per creator.
- Modify `src/features/creators/CreatorPages.tsx`: default card composition, list toggle, empty state, Facebook filter, branded table/detail cells.
- Modify `src/features/creators/CreatorPages.test.tsx`: page integration, toggle, search option, table preservation, detail branding, empty state.
- Modify `src/app/requirementCoverage.ts` and `src/app/routeCoverage.test.tsx`: default-card semantic coverage.
- Modify `src/styles/admin.css`: toolbar, 3-column cards, mosaic, identity, metrics, states, links, platform colors, responsive behavior.
- Modify `tests/visual/admin.spec.ts`: creator grid geometry and text bounds at 1310×741 and 1440×900.
- Create `docs/superpowers/verification/2026-08-05-creator-pool-card-grid.md`: fresh command and screenshot evidence.

## Chunk 1: Directly Tested Card Primitives

### Task 1: Platform icon contract

**Files:**
- Create: `src/features/creators/PlatformIcon.test.tsx`
- Create: `src/features/creators/PlatformIcon.tsx`
- Modify: `src/features/creators/fixtures.ts`

- [ ] **Step 1: Write the failing platform-icon test**

```tsx
import { render, screen } from "@testing-library/react";
import { PlatformIcon } from "./PlatformIcon";

test.each(["Instagram", "YouTube", "Facebook"] as const)(
  "renders an accessible %s platform icon without external assets",
  (platform) => {
    const { container, rerender } = render(<PlatformIcon platform={platform} />);
    expect(screen.getByRole("img", { name: `${platform} 플랫폼` })).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("img")).not.toBeInTheDocument();

    rerender(<PlatformIcon decorative platform={platform} />);
    expect(screen.queryByRole("img", { name: `${platform} 플랫폼` })).not.toBeInTheDocument();
  },
);
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/features/creators/PlatformIcon.test.tsx`

Expected: FAIL with module-not-found for `./PlatformIcon`.

- [ ] **Step 3: Add the platform type and icon implementation**

Add `export type CreatorPlatform = "Instagram" | "YouTube" | "Facebook"` in `fixtures.ts`; use it for `CreatorChannelFixture.platform` and `CreatorBaseFixture.platforms`.

Implement `PlatformIcon.tsx` with this complete selection:

```tsx
import type { ReactNode } from "react";
import type { CreatorPlatform } from "./fixtures";

const iconPaths: Record<CreatorPlatform, ReactNode> = {
  Instagram: (
    <>
      <rect fill="none" height="13" rx="4" stroke="currentColor" strokeWidth="2" width="13" x="3.5" y="3.5" />
      <circle cx="10" cy="10" fill="none" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="14.4" cy="5.7" fill="currentColor" r="1" />
    </>
  ),
  YouTube: (
    <>
      <rect fill="currentColor" height="12" rx="3.5" width="18" x="1" y="4" />
      <path d="m8 7 5 3-5 3V7Z" fill="white" />
    </>
  ),
  Facebook: <path d="M11.7 17v-6h2l.3-2.4h-2.3V7.1c0-.7.2-1.2 1.2-1.2H14V3.8c-.5-.1-1.1-.2-1.8-.2-1.8 0-3.1 1.1-3.1 3.2v1.8H7V11h2.1v6h2.6Z" fill="currentColor" />,
};

export function PlatformIcon({ decorative = false, platform }: { decorative?: boolean; platform: CreatorPlatform }) {
  return (
    <span
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : `${platform} 플랫폼`}
      className={`fuma-platform-icon fuma-platform-icon--${platform.toLowerCase()}`}
      role={decorative ? undefined : "img"}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20">{iconPaths[platform]}</svg>
    </span>
  );
}
```

- [ ] **Step 4: Run GREEN**

Run: `npm test -- --run src/features/creators/PlatformIcon.test.tsx`

Expected: 3 tests pass.

### Task 2: Artwork and media mosaic contract

**Files:**
- Create: `src/features/creators/CreatorArtwork.tsx`
- Create: `src/features/creators/CreatorMediaMosaic.tsx`
- Create: `src/features/creators/CreatorMediaMosaic.test.tsx`
- Modify: `src/features/creators/fixtures.ts`

- [ ] **Step 1: Write the complete failing mosaic test**

Create `CreatorMediaMosaic.test.tsx` exactly as follows:

```tsx
import { render, screen, within } from "@testing-library/react";
import type { CreatorFeaturedContentFixture } from "./fixtures";
import { CreatorPortrait } from "./CreatorArtwork";
import { CreatorMediaMosaic } from "./CreatorMediaMosaic";

const contents: CreatorFeaturedContentFixture[] = [
  { id: "coast", platform: "Instagram", title: "여름 바다 산책", mediaType: "이미지", views: 42_300, visual: "coast" },
  { id: "city", platform: "Facebook", title: "도시 여행 노트", mediaType: "이미지", views: 28_100, visual: "city" },
  { id: "packing", platform: "YouTube", title: "3박 4일 패킹", mediaType: "동영상", views: 19_600, visual: "packing" },
];

test("renders up to three locally drawn popular-content tiles", () => {
  const { rerender } = render(<CreatorMediaMosaic contents={contents} creatorName="이지아" />);
  let mosaic = screen.getByRole("list", { name: "이지아 인기 콘텐츠" });
  expect(within(mosaic).getAllByRole("listitem")).toHaveLength(3);
  expect(within(mosaic).getAllByRole("img", { name: /이지아 인기 콘텐츠:/ })).toHaveLength(3);
  expect(within(mosaic).getByText("Instagram")).toBeInTheDocument();
  expect(within(mosaic).getByText("Facebook")).toBeInTheDocument();
  expect(within(mosaic).getByText("YouTube")).toBeInTheDocument();
  expect(within(mosaic).getByRole("img", { name: "동영상" })).toBeInTheDocument();
  expect(within(mosaic).getByText("4.2만")).toBeInTheDocument();

  rerender(<CreatorMediaMosaic contents={contents.slice(0, 2)} creatorName="이지아" />);
  mosaic = screen.getByRole("list", { name: "이지아 인기 콘텐츠" });
  expect(within(mosaic).getAllByRole("listitem")).toHaveLength(2);

  rerender(<CreatorMediaMosaic contents={[]} creatorName="이지아" />);
  mosaic = screen.getByRole("list", { name: "이지아 인기 콘텐츠" });
  expect(within(mosaic).queryAllByRole("listitem")).toHaveLength(0);
});

test("draws an accessible local creator portrait", () => {
  const { container } = render(<CreatorPortrait creatorName="이지아" variant="coral" />);
  expect(screen.getByRole("img", { name: "이지아 프로필 이미지" })).toBeInTheDocument();
  expect(container.querySelector("svg")).toBeInTheDocument();
  expect(container.querySelector("img")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/features/creators/CreatorMediaMosaic.test.tsx`

Expected: FAIL with module-not-found for `CreatorMediaMosaic`.

- [ ] **Step 3: Add exact media types and deterministic artwork**

Add to `fixtures.ts`:

```ts
export type CreatorPortraitVariant = "sage" | "navy" | "coral" | "amber";
export type CreatorMediaVisual = "beauty" | "fashion" | "skincare" | "cooking" | "coffee" | "table" | "coast" | "city" | "packing" | "dessert";
export interface CreatorFeaturedContentFixture {
  id: string;
  platform: CreatorPlatform;
  title: string;
  mediaType: "이미지" | "동영상";
  views: number;
  visual: CreatorMediaVisual;
}
```

Create `CreatorArtwork.tsx` with no network or CSS-image dependency:

```tsx
import type { CreatorMediaVisual, CreatorPortraitVariant } from "./fixtures";

const portraitPalettes: Record<CreatorPortraitVariant, readonly [string, string, string, string]> = {
  sage: ["#dfe9df", "#55766a", "#f1c9a8", "#303c38"],
  navy: ["#dce5ef", "#29425d", "#d6a47d", "#182635"],
  coral: ["#f4dfda", "#b85f55", "#f0c1a2", "#6b3938"],
  amber: ["#f3e7cf", "#ae7136", "#d89a6a", "#4b3429"],
};

const mediaPalettes: Record<CreatorMediaVisual, readonly [string, string, string, string]> = {
  beauty: ["#f6d9df", "#b94f70", "#fff4ef", "#713249"],
  fashion: ["#dbe4ef", "#385b7c", "#f5e0c6", "#24394f"],
  skincare: ["#dcece8", "#43877c", "#f7f1db", "#28584f"],
  cooking: ["#efe0d2", "#9b5437", "#f6c766", "#613527"],
  coffee: ["#eadfd6", "#76503c", "#d9ad78", "#493327"],
  table: ["#e3ead7", "#6e7b4a", "#f4d9b2", "#48512f"],
  coast: ["#d9ebef", "#2e7d88", "#f3d9aa", "#205761"],
  city: ["#dfe2e9", "#59647b", "#d9aa78", "#30394b"],
  packing: ["#ece1d5", "#a0603e", "#6b8796", "#573825"],
  dessert: ["#f5dfd6", "#be6754", "#f2c66d", "#793d34"],
};

export function CreatorPortrait({ creatorName, variant }: { creatorName: string; variant: CreatorPortraitVariant }) {
  const [background, clothes, skin, hair] = portraitPalettes[variant];
  return (
    <svg aria-label={`${creatorName} 프로필 이미지`} role="img" viewBox="0 0 96 96">
      <rect fill={background} height="96" width="96" />
      <path d="M12 96c4-23 18-35 36-35s32 12 36 35H12Z" fill={clothes} />
      <circle cx="48" cy="41" fill={skin} r="23" />
      <path d="M26 41c0-19 9-29 24-29 16 0 25 12 23 31-5-6-10-13-15-21-8 9-18 14-32 19Z" fill={hair} />
      <circle cx="40" cy="43" fill={hair} r="1.7" />
      <circle cx="56" cy="43" fill={hair} r="1.7" />
      <path d="M41 53c4 3 10 3 14 0" fill="none" stroke={hair} strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export function CreatorMediaArtwork({ creatorName, title, visual }: { creatorName: string; title: string; visual: CreatorMediaVisual }) {
  const [background, primary, accent, foreground] = mediaPalettes[visual];
  return (
    <svg aria-label={`${creatorName} 인기 콘텐츠: ${title}`} preserveAspectRatio="xMidYMid slice" role="img" viewBox="0 0 180 150">
      <rect fill={background} height="150" width="180" />
      <circle cx="139" cy="34" fill={accent} opacity=".82" r="34" />
      <rect fill={primary} height="98" opacity=".92" rx="22" transform="rotate(16 44 85)" width="42" x="23" y="36" />
      <rect fill={foreground} height="74" opacity=".32" rx="14" transform="rotate(-12 124 91)" width="54" x="97" y="54" />
      <path d="M0 126c32-25 54-31 79-20 26 12 50 11 101-16v60H0v-24Z" fill={foreground} opacity=".88" />
    </svg>
  );
}
```

- [ ] **Step 4: Implement the mosaic markup**

Create `CreatorMediaMosaic.tsx` exactly with a valid list/listitem relationship and Korean compact notation:

```tsx
import type { CreatorFeaturedContentFixture } from "./fixtures";
import { CreatorMediaArtwork } from "./CreatorArtwork";
import { PlatformIcon } from "./PlatformIcon";

const compactNumber = new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 });
export function formatCompactNumber(value: number) { return compactNumber.format(value); }

export function CreatorMediaMosaic({ contents, creatorName }: { contents: readonly CreatorFeaturedContentFixture[]; creatorName: string }) {
  return (
    <div aria-label={`${creatorName} 인기 콘텐츠`} className="fuma-creator-mosaic" role="list">
      {contents.slice(0, 3).map((content, index) => (
        <figure className={`fuma-creator-media fuma-creator-media--${index === 0 ? "main" : "support"}`} key={content.id} role="listitem">
          <CreatorMediaArtwork creatorName={creatorName} title={content.title} visual={content.visual} />
          <figcaption className="fuma-creator-media__caption">
            <span className="fuma-creator-media__source"><PlatformIcon decorative platform={content.platform} />{content.platform}</span>
            <span className="fuma-creator-media__views">{formatCompactNumber(content.views)}</span>
          </figcaption>
          {content.mediaType === "동영상" ? <span aria-label="동영상" className="fuma-creator-media__play" role="img">▶</span> : null}
        </figure>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run GREEN**

Run: `npm test -- --run src/features/creators/CreatorMediaMosaic.test.tsx`

Expected: all mosaic tests pass, including 3/2/0-item cases.

### Task 3: Evidence-card data, metric helpers, and action mapping

**Files:**
- Create: `src/features/creators/CreatorEvidenceCard.test.tsx`
- Create: `src/features/creators/CreatorEvidenceCard.tsx`
- Modify: `src/features/creators/fixtures.ts`

- [ ] **Step 1: Write complete failing helper/action tests before changing fixtures**

Start `CreatorEvidenceCard.test.tsx` with:

```tsx
import { CREATORS, type CreatorFixture } from "./fixtures";
import { averageViews, engagementRate, proposalAction, proposalTone } from "./CreatorEvidenceCard";

const zia = CREATORS[2];
const withStatus = (status: CreatorFixture["proposalStatus"]): CreatorFixture => ({ ...zia, proposalStatus: status });

describe("creator evidence-card helpers", () => {
  test("computes channel averages and a zero-safe weighted reaction rate", () => {
    expect(averageViews(zia)).toBe(13_600);
    expect(engagementRate(zia)).toBeCloseTo(5.147, 2);
    const empty = { ...zia, channels: [] } as CreatorFixture;
    const zero = { ...zia, channels: zia.channels.map((channel) => ({ ...channel, views: 0 })) } as CreatorFixture;
    expect(averageViews(empty)).toBe(0);
    expect(engagementRate(empty)).toBe(0);
    expect(engagementRate(zero)).toBe(0);
  });

  test.each([
    ["미제안", "영입 제안", "/creators/cr-003#proposal", "neutral"],
    ["발송 실패", "다시 제안", "/creators/cr-003#proposal", "rejected"],
    ["발송 대기", "제안 이력", "/proposals?creator=cr-003", "pending"],
    ["발송 완료", "제안 이력", "/proposals?creator=cr-003", "approved"],
    ["셀렉터스 전환", "제안 이력", "/proposals?creator=cr-003", "approved"],
  ] as const)("maps %s to its exact action", (status, label, to, tone) => {
    const creator = withStatus(status);
    expect(proposalAction(creator)).toEqual({ label, to });
    expect(proposalTone(status)).toBe(tone);
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/features/creators/CreatorEvidenceCard.test.tsx`

Expected: FAIL because the helper exports do not exist.

- [ ] **Step 3: Extend the fixtures with exact profile/content data**

Add `portrait: CreatorPortraitVariant` and `featuredContents: CreatorFeaturedContentFixture[]` to `CreatorBaseFixture`, then populate this exact order:

| Creator | Portrait | Featured content 1 | Featured content 2 | Featured content 3 |
| --- | --- | --- | --- | --- |
| cr-001 김서연 | sage | `seo-look`, Instagram, 여름 데일리 룩, 이미지, 98,600, fashion | `seo-tone`, Instagram, 가을 톤 메이크업, 이미지, 74,200, beauty | `seo-video`, YouTube, 5분 출근 룩북, 동영상, 63,100, skincare |
| cr-002 박도윤 | navy | `doyoon-home`, YouTube, 퇴근 후 집밥, 동영상, 54,800, cooking | `doyoon-coffee`, YouTube, 홈카페 레시피, 동영상, 37,400, coffee | `doyoon-table`, YouTube, 주말 한 상, 이미지, 29,600, table |
| cr-003 이지아 | coral | `zia-coast`, Instagram, 여름 바다 산책, 이미지, 42,300, coast | `zia-city`, Facebook, 도시 여행 노트, 이미지, 28,100, city | `zia-pack`, Instagram, 3박 4일 패킹, 동영상, 19,600, packing |
| cr-004 오하늘 | amber | `haneul-dessert`, Instagram, 제철 과일 디저트, 동영상, 218,000, dessert | `haneul-table`, Instagram, 오늘의 브런치, 이미지, 184,000, table | `haneul-coffee`, Instagram, 카페 신메뉴 리뷰, 동영상, 169,000, coffee |

For `cr-003`, set `platforms: ["Instagram", "Facebook"]`, add `{ platform: "Facebook", handle: "지아의 여행노트", followers: 18_400, views: 9_300, reactions: 420 }` after its Instagram channel, and set `followers: 51_100`. These inputs intentionally produce average views `13,600` (`1.4만`) and reaction rate `1,400 / 27,200 = 5.1%`.

- [ ] **Step 4: Implement complete metric/action helpers**

Export:

```ts
import type { StatusPillProps } from "../../components/ui/StatusPill";
import type { CreatorFixture, ProposalStatus } from "./fixtures";

export const compactNumber = new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 });
export function averageViews(creator: CreatorFixture) {
  return creator.channels.length === 0 ? 0 : Math.round(creator.channels.reduce((sum, item) => sum + item.views, 0) / creator.channels.length);
}
export function engagementRate(creator: CreatorFixture) {
  const views = creator.channels.reduce((sum, item) => sum + item.views, 0);
  return views === 0 ? 0 : (creator.channels.reduce((sum, item) => sum + item.reactions, 0) / views) * 100;
}
export function proposalAction(creator: CreatorFixture) {
  if (creator.proposalStatus === "미제안") return { label: "영입 제안", to: `/creators/${creator.id}#proposal` };
  if (creator.proposalStatus === "발송 실패") return { label: "다시 제안", to: `/creators/${creator.id}#proposal` };
  return { label: "제안 이력", to: `/proposals?creator=${creator.id}` };
}
export function proposalTone(status: ProposalStatus | "미제안"): NonNullable<StatusPillProps["tone"]> {
  if (status === "발송 완료" || status === "셀렉터스 전환") return "approved";
  if (status === "발송 대기") return "pending";
  if (status === "발송 실패") return "rejected";
  return "neutral";
}
```

- [ ] **Step 5: Run helper GREEN**

Run: `npm test -- --run src/features/creators/CreatorEvidenceCard.test.tsx`

Expected: helper/action tests pass.

### Task 4: Evidence-card render contract

**Files:**
- Modify: `src/features/creators/CreatorEvidenceCard.test.tsx`
- Modify: `src/features/creators/CreatorEvidenceCard.tsx`

- [ ] **Step 1: Add complete failing render and route tests**

Append to `CreatorEvidenceCard.test.tsx` (also add the four imports shown):

```tsx
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CreatorEvidenceCard } from "./CreatorEvidenceCard";

function renderCard(creator: CreatorFixture = zia) {
  return render(<MemoryRouter><ul><CreatorEvidenceCard creator={creator} /></ul></MemoryRouter>);
}

describe("CreatorEvidenceCard", () => {
  test("shows profile, popular posts, platform identity, metrics, and state", () => {
    renderCard();
    const card = screen.getByRole("article", { name: "이지아 크리에이터 카드" });
    expect(card.parentElement).toHaveAttribute("role", "listitem");
    expect(within(card).getByRole("img", { name: "이지아 프로필 이미지" })).toBeInTheDocument();
    expect(within(card).getAllByRole("img", { name: /이지아 인기 콘텐츠:/ })).toHaveLength(3);
    expect(within(card).getByRole("img", { name: "Instagram 플랫폼" })).toBeInTheDocument();
    expect(within(card).getByRole("img", { name: "Facebook 플랫폼" })).toBeInTheDocument();
    expect(within(card).getByText("Facebook")).toBeInTheDocument();
    for (const text of ["@zia.trip", "여행 / 라이프", "콘텐츠 142개", "5.1만", "1.4만", "5.1%", "생성 대기", "T3", "발송 실패", "최근 활동일 2026-07-29"]) {
      expect(within(card).getByText(text)).toBeInTheDocument();
    }
    expect(within(card).getByText("팔로워·구독자")).toBeInTheDocument();
    expect(within(card).getByText("평균 조회")).toBeInTheDocument();
    expect(within(card).getByText("평균 반응률")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "이지아 상세 보기" })).toHaveAttribute("href", "/creators/cr-003");
    expect(within(card).getByRole("link", { name: "이지아 다시 제안" })).toHaveAttribute("href", "/creators/cr-003#proposal");
  });

  test("shows a ready AI fitness label", () => {
    renderCard(CREATORS[0]);
    expect(screen.getByText("AI 적합도 92점")).toBeInTheDocument();
  });

  test.each([
    ["미제안", "영입 제안", "/creators/cr-003#proposal"],
    ["발송 실패", "다시 제안", "/creators/cr-003#proposal"],
    ["발송 대기", "제안 이력", "/proposals?creator=cr-003"],
    ["발송 완료", "제안 이력", "/proposals?creator=cr-003"],
    ["셀렉터스 전환", "제안 이력", "/proposals?creator=cr-003"],
  ] as const)("renders the %s action", (status, label, href) => {
    renderCard(withStatus(status));
    expect(screen.getByRole("link", { name: `이지아 ${label}` })).toHaveAttribute("href", href);
  });

  test("renders first-channel and zero-safe fallbacks", () => {
    renderCard({ ...zia, channels: [], followers: 0 } as CreatorFixture);
    expect(screen.getByText("채널 정보 없음")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("0.0%")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/NaN|Infinity/);
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/features/creators/CreatorEvidenceCard.test.tsx`

Expected: FAIL because `CreatorEvidenceCard` is not exported.

- [ ] **Step 3: Implement the complete card markup and its class contract**

Add these imports and export to `CreatorEvidenceCard.tsx` after the helpers:

```tsx
import { Link } from "react-router-dom";
import { StatusPill } from "../../components/ui/StatusPill";
import { CreatorPortrait } from "./CreatorArtwork";
import { CreatorMediaMosaic } from "./CreatorMediaMosaic";
import { PlatformIcon } from "./PlatformIcon";

export function CreatorEvidenceCard({ creator }: { creator: CreatorFixture }) {
  const action = proposalAction(creator);
  const handle = creator.channels[0]?.handle ?? "채널 정보 없음";
  return (
    <li className="fuma-creator-card" role="listitem">
      <article aria-label={`${creator.name} 크리에이터 카드`} className="fuma-creator-card__article">
        <CreatorMediaMosaic contents={creator.featuredContents} creatorName={creator.name} />
        <div className="fuma-creator-card__body">
          <header className="fuma-creator-card__identity">
            <span className="fuma-creator-card__portrait"><CreatorPortrait creatorName={creator.name} variant={creator.portrait} /></span>
            <div className="fuma-creator-card__identity-copy">
              <h2 className="fuma-creator-card__name">{creator.name}</h2>
              <p className="fuma-creator-card__handle">{handle}</p>
              <p className="fuma-creator-card__categories">{creator.categories.join(" / ")}<span>콘텐츠 {creator.contentCount}개</span></p>
            </div>
            <ul aria-label={`${creator.name} 플랫폼`} className="fuma-creator-card__platforms" role="list">
              {creator.platforms.map((platform) => <li key={platform}><PlatformIcon platform={platform} /></li>)}
            </ul>
          </header>
          <dl className="fuma-creator-card__metrics">
            <div className="fuma-creator-card__metric"><dt>팔로워·구독자</dt><dd>{compactNumber.format(creator.followers)}</dd></div>
            <div className="fuma-creator-card__metric"><dt>평균 조회</dt><dd>{compactNumber.format(averageViews(creator))}</dd></div>
            <div className="fuma-creator-card__metric"><dt>평균 반응률</dt><dd>{engagementRate(creator).toFixed(1)}%</dd></div>
          </dl>
          <div className="fuma-creator-card__meta">
            <strong className="fuma-creator-card__ai">{creator.aiReport.fitnessScore === null ? "생성 대기" : `AI 적합도 ${creator.aiReport.fitnessScore}점`}</strong>
            <span>{creator.tier}</span>
            <StatusPill tone={proposalTone(creator.proposalStatus)}>{creator.proposalStatus}</StatusPill>
            <span className="fuma-creator-card__recent">최근 활동일 {creator.recentActivity}</span>
          </div>
        </div>
        <footer className="fuma-creator-card__actions">
          <Link aria-label={`${creator.name} 상세 보기`} className="fuma-creator-card__action" to={`/creators/${creator.id}`}>상세 보기</Link>
          <Link aria-label={`${creator.name} ${action.label}`} className="fuma-creator-card__action fuma-creator-card__action--primary" to={action.to}>{action.label}</Link>
        </footer>
      </article>
    </li>
  );
}
```

- [ ] **Step 4: Run GREEN plus compile checks**

Run:

```bash
npm test -- --run src/features/creators/PlatformIcon.test.tsx src/features/creators/CreatorMediaMosaic.test.tsx src/features/creators/CreatorEvidenceCard.test.tsx
npm run lint
npm run build
```

Expected: all direct tests pass; lint and build exit 0.

- [ ] **Step 5: Commit Chunk 1**

```bash
git add src/features/creators/fixtures.ts src/features/creators/PlatformIcon.tsx src/features/creators/PlatformIcon.test.tsx src/features/creators/CreatorArtwork.tsx src/features/creators/CreatorMediaMosaic.tsx src/features/creators/CreatorMediaMosaic.test.tsx src/features/creators/CreatorEvidenceCard.tsx src/features/creators/CreatorEvidenceCard.test.tsx
git commit -m "feat: add tested creator evidence cards"
```

## Chunk 2: Creator Pool Integration

### Task 5: Direct grid and creator-toolbar contracts

**Files:**
- Create: `src/features/creators/CreatorPoolComponents.test.tsx`
- Create: `src/features/creators/CreatorCardGrid.tsx`
- Create: `src/features/creators/CreatorResultToolbar.tsx`

- [ ] **Step 1: Write complete failing component tests**

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { CREATORS } from "./fixtures";
import { CreatorCardGrid } from "./CreatorCardGrid";
import { CreatorResultToolbar } from "./CreatorResultToolbar";

test("toolbar owns the static sort and mutually exclusive view buttons", async () => {
  const user = userEvent.setup();
  const onViewChange = vi.fn();
  render(<CreatorResultToolbar count={4} onViewChange={onViewChange} view="cards" />);
  expect(screen.getByText("크리에이터 목록")).toBeInTheDocument();
  expect(screen.getByText("총 4건")).toBeInTheDocument();
  expect(screen.getByText("AI 적합도순").closest("button,select")).toBeNull();
  expect(screen.getByRole("button", { name: "카드 보기" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "목록 보기" })).toHaveAttribute("aria-pressed", "false");
  await user.click(screen.getByRole("button", { name: "목록 보기" }));
  expect(onViewChange).toHaveBeenCalledWith("list");
});

test("grid exposes a named list and maps creators to list items", () => {
  render(<MemoryRouter><CreatorCardGrid creators={[CREATORS[0]]} /></MemoryRouter>);
  const grid = screen.getByRole("list", { name: "크리에이터 목록" });
  expect(grid).toHaveAttribute("data-visual-contract", "creator-card-grid");
  expect(grid.querySelectorAll(':scope > [role="listitem"]')).toHaveLength(1);
  expect(within(grid).getByRole("article", { name: "김서연 크리에이터 카드" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/features/creators/CreatorPoolComponents.test.tsx`

Expected: FAIL with both component modules missing.

- [ ] **Step 3: Implement the complete grid and toolbar**

`CreatorCardGrid.tsx`:

```tsx
import type { CreatorFixture } from "./fixtures";
import { CreatorEvidenceCard } from "./CreatorEvidenceCard";

export function CreatorCardGrid({ creators }: { creators: readonly CreatorFixture[] }) {
  return (
    <ul aria-label="크리에이터 목록" className="fuma-creator-grid" data-visual-contract="creator-card-grid" role="list">
      {creators.map((creator) => <CreatorEvidenceCard creator={creator} key={creator.id} />)}
    </ul>
  );
}
```

`CreatorResultToolbar.tsx`:

```tsx
export type CreatorPoolView = "cards" | "list";

export function CreatorResultToolbar({ count, onViewChange, view }: { count: number; onViewChange: (view: CreatorPoolView) => void; view: CreatorPoolView }) {
  return (
    <div className="fuma-creator-toolbar">
      <strong className="fuma-creator-toolbar__summary">크리에이터 목록</strong>
      <span>총 {count}건</span>
      <div className="fuma-creator-toolbar__controls">
        <span className="fuma-creator-toolbar__sort">AI 적합도순</span>
        <div aria-label="보기 방식" className="fuma-creator-toolbar__views" role="group">
          <button aria-pressed={view === "cards"} className="fuma-creator-toolbar__view" onClick={() => onViewChange("cards")} type="button">카드 보기</button>
          <button aria-pressed={view === "list"} className="fuma-creator-toolbar__view" onClick={() => onViewChange("list")} type="button">목록 보기</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run GREEN**

Run: `npm test -- --run src/features/creators/CreatorPoolComponents.test.tsx`

Expected: 2 tests pass.

### Task 6: Make cards the route default

**Files:**
- Modify: `src/features/creators/CreatorPages.test.tsx`
- Modify: `src/features/creators/CreatorPages.tsx`

- [ ] **Step 1: Replace the populated-page test with this complete card-default contract**

Keep `expectColumnHeaders` for detail/proposal tests, but replace the first creator-pool test body with:

```tsx
test("renders the populated creator pool as profile-first cards", () => {
  renderRoute("/creators");
  expect(screen.getByRole("heading", { name: "크리에이터 풀" })).toBeInTheDocument();
  expect(screen.getByText("CR101")).toBeInTheDocument();
  const search = screen.getByRole("search", { name: "검색 조건" });
  expect(within(search).getByRole("textbox", { name: "키워드" })).toHaveAttribute("placeholder", "이름 또는 채널명 검색");
  expect(within(search).getByRole("combobox", { name: "카테고리" })).toHaveTextContent("전체뷰티패션리빙푸드여행라이프");
  expect(within(search).getByRole("combobox", { name: "티어" })).toHaveTextContent("전체T0T1T2T3");
  expect(within(search).getByRole("combobox", { name: "플랫폼" })).toHaveTextContent("전체InstagramYouTubeFacebook");
  expect(within(search).getByRole("button", { name: "조회" })).toBeInTheDocument();
  expect(within(search).getByRole("button", { name: "초기화" })).toBeInTheDocument();
  expect(screen.getByText("총 4건")).toBeInTheDocument();
  expect(screen.getByText("AI 적합도순").closest("button,select")).toBeNull();
  expect(screen.getByRole("button", { name: "카드 보기" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "목록 보기" })).toHaveAttribute("aria-pressed", "false");
  const cards = screen.getByRole("list", { name: "크리에이터 목록" });
  expect(cards.querySelectorAll(':scope > [role="listitem"]')).toHaveLength(4);
  for (const name of ["김서연", "박도윤", "이지아", "오하늘"]) {
    expect(within(cards).getByRole("article", { name: `${name} 크리에이터 카드` })).toBeInTheDocument();
  }
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
  expect(screen.getByText("페이지당 20개")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx`

Expected: the new test fails because the route still renders the dense table.

- [ ] **Step 3: Mount only the default card branch**

In `CreatorPages.tsx`, import `useState`, `CreatorCardGrid`, `CreatorResultToolbar`, and `CreatorPoolView`; add `Facebook` to `PLATFORM_OPTIONS`; initialize `const [view, setView] = useState<CreatorPoolView>("cards")`. Replace the creator `ResultToolbar` and table with this deliberately card-only checkpoint:

```tsx
<CreatorResultToolbar count={creators.length} onViewChange={setView} view={view} />
{view === "cards" ? <CreatorCardGrid creators={creators} /> : null}
```

The old `CREATOR_COLUMNS` definition stays in the file for Task 7, but there is no contradictory mounted table in this checkpoint. Do not modify the proposal-page `ResultToolbar`.

- [ ] **Step 4: Run GREEN**

Run these two focused commands (the pre-existing empty-fixture test remains for Task 8):

```bash
npm test -- --run src/features/creators/CreatorPages.test.tsx -t "renders the populated creator pool as profile-first cards"
npm test -- --run src/features/creators/CreatorPoolComponents.test.tsx
```

Expected: default card and direct component tests pass.

### Task 7: Wire the table toggle and platform branding

**Files:**
- Modify: `src/features/creators/CreatorPages.test.tsx`
- Modify: `src/features/creators/CreatorPages.tsx`

- [ ] **Step 1: Add the complete failing toggle test**

Add `import userEvent from "@testing-library/user-event";`, then add:

```tsx
test("switches to the preserved branded dense table and back", async () => {
  const user = userEvent.setup();
  renderRoute("/creators");
  await user.click(screen.getByRole("button", { name: "목록 보기" }));
  expect(screen.getByRole("button", { name: "목록 보기" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "카드 보기" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.queryByRole("list", { name: "크리에이터 목록" })).not.toBeInTheDocument();
  const results = screen.getByRole("region", { name: "크리에이터 목록" });
  expect(within(results).getByRole("table")).toBeInTheDocument();
  for (const name of ["ID", "이름", "플랫폼", "카테고리", "티어", "팔로워·구독자", "콘텐츠 수", "최근 활동일", "AI 리포트 상태", "제안 상태", "상세"]) {
    expect(within(results).getByRole("columnheader", { name })).toBeInTheDocument();
  }
  await user.click(screen.getByRole("button", { name: "카드 보기" }));
  expect(screen.getByRole("list", { name: "크리에이터 목록" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run table-toggle RED**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx -t "renders the populated creator pool|switches to the preserved branded dense table"`

Expected: FAIL because Task 6 intentionally renders nothing in list view.

- [ ] **Step 3: Wire the table branch**

Replace the card-only checkpoint with:

```tsx
{view === "cards" ? (
  <CreatorCardGrid creators={creators} />
) : (
  <div aria-label="크리에이터 목록" className="fuma-wide-table" role="region">
    <DenseTable columns={CREATOR_COLUMNS} emptyMessage="검색 결과가 없습니다." rowKey={(creator) => creator.id} rows={creators} />
  </div>
)}
```

- [ ] **Step 4: Run toggle GREEN**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx -t "renders the populated creator pool|switches to the preserved branded dense table"`

Expected: default and toggle/table-preservation tests pass.

- [ ] **Step 5: Add branded table/detail tests**

Add these two focused branding tests:

```tsx
test("brands Instagram and Facebook in the fallback table", async () => {
  const user = userEvent.setup();
  renderRoute("/creators");
  await user.click(screen.getByRole("button", { name: "목록 보기" }));
  const results = screen.getByRole("region", { name: "크리에이터 목록" });
  const ziaRow = within(results).getByRole("row", { name: /cr-003 이지아/ });
  expect(within(ziaRow).getByText("Instagram")).toBeInTheDocument();
  expect(within(ziaRow).getByText("Facebook")).toBeInTheDocument();
  expect(within(ziaRow).getByRole("img", { name: "Instagram 플랫폼" })).toBeInTheDocument();
  expect(within(ziaRow).getByRole("img", { name: "Facebook 플랫폼" })).toBeInTheDocument();
});

test("renders Facebook as a branded creator-detail channel", () => {
  renderRoute("/creators/cr-003");
  const channels = screen.getByRole("region", { name: "플랫폼별 채널" });
  const facebookRow = within(channels).getByRole("row", { name: /Facebook 지아의 여행노트/ });
  expect(within(facebookRow).getByText("Facebook")).toBeInTheDocument();
  expect(within(facebookRow).getByRole("img", { name: "Facebook 플랫폼" })).toBeInTheDocument();
});
```

- [ ] **Step 6: Run branding RED**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx -t "renders the populated creator pool|switches to the preserved branded dense table|brands Instagram and Facebook|renders Facebook as a branded creator-detail channel"`

Expected: FAIL because creator and detail table cells still render plain platform strings with no accessible brand icons.

- [ ] **Step 7: Implement one reusable platform-label renderer**

Import `PlatformIcon` and add:

```tsx
function PlatformLabel({ platform }: { platform: CreatorChannelFixture["platform"] }) {
  return <span className="fuma-platform-label"><PlatformIcon platform={platform} /><span>{platform}</span></span>;
}
```

Set the creator platform column renderer to `<div className="fuma-platform-labels">{creator.platforms.map((platform) => <PlatformLabel key={platform} platform={platform} />)}</div>`. Change `CHANNEL_COLUMNS` platform entry to an `id: "platform"` renderer returning `<PlatformLabel platform={channel.platform} />`.

- [ ] **Step 8: Run GREEN**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx -t "renders the populated creator pool|switches to the preserved branded dense table|brands Instagram and Facebook|renders Facebook as a branded creator-detail channel"`

Expected: default, toggle, and Facebook detail tests all pass.

### Task 8: Empty state and route-requirement metadata

**Files:**
- Modify: `src/features/creators/CreatorPages.test.tsx`
- Modify: `src/features/creators/CreatorPages.tsx`
- Modify: `src/app/requirementCoverage.ts`
- Modify: `src/app/routeCoverage.test.tsx`

- [ ] **Step 1: Replace the empty test and semantic contract with complete assertions**

```tsx
test("renders one explicit empty state instead of a card list or table", () => {
  renderRoute("/creators?fixture=empty");
  expect(screen.getByRole("heading", { name: "크리에이터 풀" })).toBeInTheDocument();
  expect(screen.getByText("총 0건")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "검색 결과가 없습니다." })).toBeInTheDocument();
  expect(screen.queryByRole("list", { name: "크리에이터 목록" })).not.toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
```

In the `/creators` entry of `SEMANTIC_ROUTE_CONTRACTS`, retain its four-item `expectedControls` array and delete `expectedTables`. This is a test change and must be made before production metadata.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/features/creators/CreatorPages.test.tsx src/app/routeCoverage.test.tsx`

Expected: FAIL because empty cards currently produce an empty named list and route metadata still expects a default table.

- [ ] **Step 3: Implement the empty branch and requirement text**

Render after the toolbar:

```tsx
{creators.length === 0 ? (
  <EmptyState title="검색 결과가 없습니다." />
) : view === "cards" ? (
  <CreatorCardGrid creators={creators} />
) : (
  <div aria-label="크리에이터 목록" className="fuma-wide-table" role="region">
    <DenseTable columns={CREATOR_COLUMNS} emptyMessage="검색 결과가 없습니다." rowKey={(creator) => creator.id} rows={creators} />
  </div>
)}
```

In the `/creators` `ADMIN_REQUIREMENT_COVERAGE` entry, use `expectedTexts: ["김서연", "팔로워·구독자", "콘텐츠 184개", "최근 활동일 2026-08-02"]` and remove its `expectedTables` field.

- [ ] **Step 4: Run GREEN verification**

Run:

```bash
npm test -- --run src/features/creators/CreatorPoolComponents.test.tsx src/features/creators/CreatorPages.test.tsx src/app/routeCoverage.test.tsx
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit Chunk 2**

```bash
git add src/features/creators/CreatorPoolComponents.test.tsx src/features/creators/CreatorCardGrid.tsx src/features/creators/CreatorResultToolbar.tsx src/features/creators/CreatorPages.tsx src/features/creators/CreatorPages.test.tsx src/app/requirementCoverage.ts src/app/routeCoverage.test.tsx
git commit -m "feat: make creator cards the default pool view"
```

## Chunk 3: Visual Contract

### Task 9: Three-column layout, card internals, and browser evidence

**Files:**
- Modify: `src/styles/admin.css`
- Modify: `tests/visual/admin.spec.ts`

- [ ] **Step 1: Replace table-only creator Playwright assertions with failing card assertions**

In both creator tests, remove `dense-table`, `expectControlAndDenseRowGeometry`, table-region text, and column-header checks. Keep admin-shell geometry, page header, and 1440 sidebar state checks. Add exact locators:

```ts
const grid = page.locator('[data-visual-contract="creator-card-grid"]');
const cards = grid.locator(":scope > .fuma-creator-card");
await expect(grid).toBeVisible();
await expect(cards).toHaveCount(4);
expect((await grid.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").filter(Boolean).length))).toBe(3);
const firstRowTops = await cards.evaluateAll((nodes) => nodes.slice(0, 3).map((node) => node.getBoundingClientRect().top));
expect(Math.max(...firstRowTops) - Math.min(...firstRowTops)).toBeLessThanOrEqual(1);
```

At 1310, run `expectKeyTextBounds` on the 김서연 article for `김서연`, `@seo.yeon`, `팔로워·구독자`, `평균 조회`, `평균 반응률`, `상세 보기`, `제안 이력`. At 1440, also run it on 이지아 for `이지아`, `@zia.trip`, `Facebook`, `생성 대기`, `발송 실패`, `다시 제안`. Assert all four card bounding boxes have positive width/height and each card's `scrollWidth <= clientWidth`.

- [ ] **Step 2: Run RED for geometry**

Run: `npm run test:visual -- tests/visual/admin.spec.ts --grep "creators visual checkpoint"`

Expected: both matching tests fail at the computed column-count assertion because unstyled `<ul>` does not expose three CSS grid columns; the grid locator itself must already pass.

- [ ] **Step 3: Add the exact toolbar, grid, card, and mosaic selectors**

Append this class contract to `admin.css` (the existing token is `--hsas-border: #d8dcdd`):

```css
.fuma-creator-toolbar { min-height:35px; display:flex; align-items:center; gap:8px; padding:4px 8px; border:1px solid var(--hsas-border); background:var(--hsas-surface-muted); }
.fuma-creator-toolbar__summary { color:var(--hsas-text); }
.fuma-creator-toolbar__controls { margin-left:auto; display:flex; align-items:center; gap:4px; }
.fuma-creator-toolbar__sort { padding-right:8px; border-right:1px solid var(--hsas-border); color:var(--hsas-text-muted); font-size:11px; }
.fuma-creator-toolbar__views { display:inline-flex; gap:2px; }
.fuma-creator-toolbar__view { height:27px; padding:0 8px; border:1px solid var(--hsas-border-dark); background:var(--hsas-surface); color:var(--hsas-text-muted); cursor:pointer; }
.fuma-creator-toolbar__view[aria-pressed="true"] { border-color:var(--hsas-teal-dark); background:var(--hsas-teal); color:var(--hsas-text-inverse); font-weight:700; }
.fuma-creator-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin:2px 0 0; padding:0; list-style:none; }
.fuma-creator-card { min-width:0; overflow:hidden; border:1px solid var(--hsas-border); background:var(--hsas-surface); transition:transform .15s ease,box-shadow .15s ease; }
.fuma-creator-card__article { height:100%; display:flex; flex-direction:column; min-width:0; }
.fuma-creator-mosaic { height:164px; display:grid; grid-template-columns:1.45fr .72fr; grid-template-rows:1fr 1fr; gap:2px; overflow:hidden; background:#e8ebec; }
.fuma-creator-media { position:relative; min-width:0; min-height:0; margin:0; overflow:hidden; }
.fuma-creator-media--main { grid-row:1 / span 2; }
.fuma-creator-media > svg { width:100%; height:100%; display:block; object-fit:cover; }
.fuma-creator-media__caption { position:absolute; inset:auto 0 0; display:flex; justify-content:space-between; gap:4px; padding:18px 6px 5px; background:linear-gradient(transparent,rgb(18 27 30 / 78%)); color:#fff; font-size:9px; }
.fuma-creator-media__source { display:inline-flex; min-width:0; align-items:center; gap:3px; }
.fuma-creator-media__source .fuma-platform-icon { width:14px; height:14px; }
.fuma-creator-media__views { font-variant-numeric:tabular-nums; }
.fuma-creator-media__play { position:absolute; top:6px; right:6px; width:20px; height:20px; display:grid; place-items:center; border-radius:50%; background:rgb(18 27 30 / 72%); color:#fff; font-size:9px; }
```

- [ ] **Step 4: Add exact identity, metric, metadata, action, and label selectors**

```css
.fuma-creator-card__body { min-width:0; flex:1; }
.fuma-creator-card__identity { position:relative; min-height:70px; display:flex; align-items:flex-start; gap:6px; padding:14px 10px 8px 72px; }
.fuma-creator-card__portrait { position:absolute; left:10px; top:-24px; width:54px; height:54px; overflow:hidden; border:3px solid #fff; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgb(35 49 54 / 18%); }
.fuma-creator-card__portrait svg { width:100%; height:100%; display:block; }
.fuma-creator-card__identity-copy { min-width:0; flex:1; }
.fuma-creator-card__name { margin:0; color:var(--hsas-text); font-size:15px; line-height:18px; }
.fuma-creator-card__handle { margin:1px 0 0; overflow:hidden; color:var(--hsas-text-muted); font-size:11px; text-overflow:ellipsis; white-space:nowrap; }
.fuma-creator-card__categories { margin:3px 0 0; display:flex; flex-wrap:wrap; gap:3px 7px; color:var(--hsas-text); font-size:10px; }
.fuma-creator-card__categories span { color:var(--hsas-text-muted); }
.fuma-creator-card__platforms { display:flex; flex:0 0 auto; gap:3px; margin:0; padding:0; list-style:none; }
.fuma-platform-icon { width:25px; height:25px; display:inline-grid; place-items:center; border-radius:50%; color:#fff; }
.fuma-platform-icon svg { width:17px; height:17px; display:block; }
.fuma-platform-icon--instagram { background:linear-gradient(135deg,#833ab4,#fd1d1d 55%,#fcb045); }
.fuma-platform-icon--youtube { background:#fff; color:#ff0033; box-shadow:inset 0 0 0 1px #ff0033; }
.fuma-platform-icon--facebook { background:#1877f2; }
.fuma-creator-card__metrics { min-height:58px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); margin:0; border-top:1px solid var(--hsas-border); border-bottom:1px solid var(--hsas-border); }
.fuma-creator-card__metric { min-width:0; display:flex; flex-direction:column; justify-content:center; padding:6px 7px; border-left:1px solid var(--hsas-border); }
.fuma-creator-card__metric:first-child { border-left:0; }
.fuma-creator-card__metric dt { overflow:hidden; color:var(--hsas-text-muted); font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
.fuma-creator-card__metric dd { margin:2px 0 0; color:var(--hsas-text); font-size:15px; font-weight:700; font-variant-numeric:tabular-nums; }
.fuma-creator-card__meta { min-height:40px; display:flex; align-items:center; gap:4px; padding:6px 8px; font-size:10px; }
.fuma-creator-card__ai { color:var(--hsas-teal-dark); }
.fuma-creator-card__recent { margin-left:auto; overflow:hidden; color:var(--hsas-text-muted); text-overflow:ellipsis; white-space:nowrap; }
.fuma-creator-card__actions { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); border-top:1px solid var(--hsas-border); }
.fuma-creator-card__action { height:31px; display:grid; place-items:center; color:var(--hsas-text); font-size:11px; font-weight:700; text-decoration:none; }
.fuma-creator-card__action + .fuma-creator-card__action { border-left:1px solid var(--hsas-border); }
.fuma-creator-card__action--primary { background:var(--hsas-teal); color:var(--hsas-text-inverse); }
.fuma-creator-card__action:focus-visible,.fuma-creator-toolbar__view:focus-visible { outline:2px solid var(--hsas-teal-dark); outline-offset:-2px; }
.fuma-platform-labels { display:flex; flex-wrap:wrap; gap:4px; }
.fuma-platform-label { display:inline-flex; align-items:center; gap:3px; white-space:nowrap; }
.fuma-platform-label .fuma-platform-icon { width:20px; height:20px; }
.fuma-platform-label .fuma-platform-icon svg { width:14px; height:14px; }
```

- [ ] **Step 5: Add the failing reduced-motion assertion and run RED**

Because `playwright.config.ts` uses `reducedMotion: "reduce"`, add this to the 1440 creator test after selecting the first card:

```ts
const firstCard = cards.first();
await expect.poll(() => firstCard.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0s");
await firstCard.hover();
await expect.poll(() => firstCard.evaluate((node) => getComputedStyle(node).transform)).toBe("none");
```

Run: `npm run test:visual -- tests/visual/admin.spec.ts --grep "creators visual checkpoint at 1440"`

Expected: RED at `transitionDuration`: the global reduced-motion rule currently computes `0.01ms`, not `0s`.

- [ ] **Step 6: Add interaction, responsive, and reduced-motion CSS**

```css
.fuma-creator-card:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgb(38 49 53 / 12%); }
@media (max-width:1199px) { .fuma-creator-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (prefers-reduced-motion:reduce) {
  .fuma-creator-card { transition:none !important; }
  .fuma-creator-card:hover { transform:none; }
}
```

- [ ] **Step 7: Run GREEN visual tests**

Run: `npm run test:visual -- tests/visual/admin.spec.ts --grep "creators visual checkpoint"`

Expected: 2 passed with zero external request, WebSocket, console, page, and request-failure diagnostics.

- [ ] **Step 8: Inspect screenshots as a separate acceptance step**

Open `test-results/visual/creators.png` and `test-results/visual/creators-1440.png`. Confirm: three aligned first-row cards; no card horizontal overflow; platform marks recognizable; names, metrics, statuses, and both links fully visible; image mosaic is the only high-color area; no key text overlap or clipping.

- [ ] **Step 9: Re-run unit checks and commit Chunk 3**

Run:

```bash
npm test -- --run src/features/creators/CreatorPages.test.tsx src/app/routeCoverage.test.tsx
npm run lint
npm run build
```

Expected: all commands exit 0.

```bash
git add src/styles/admin.css tests/visual/admin.spec.ts
git commit -m "style: add creator pool content cards"
```

## Chunk 4: Full Verification and Evidence

### Task 10: Verify the finished UI

**Files:**
- Create: `docs/superpowers/verification/2026-08-05-creator-pool-card-grid.md`

- [ ] **Step 1: Confirm the implementation commit is clean**

Run: `git status --short`

Expected: no output. If any implementation or test file is listed, stop, resolve it, commit it through the relevant prior task, and restart verification.

- [ ] **Step 2: Capture pre-verification provenance**

Run: `git rev-parse HEAD`

Record this SHA immediately; every subsequent result in the evidence document belongs to this exact clean commit.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: exit 0. Record the actual exit code.

- [ ] **Step 4: Run the full Vitest suite**

Run: `npm test -- --run`

Expected: exit 0 and zero failed files/tests. Record the actual passed file/test counts.

- [ ] **Step 5: Run the production build**

Run: `npm run build`

Expected: exit 0. Record the actual build result.

- [ ] **Step 6: Run the complete visual suite**

Run: `npm run test:visual`

Expected: all Playwright tests pass and the automatic browser diagnostics arrays remain empty.

- [ ] **Step 7: Record exact PNG dimensions**

Run:

```bash
sips -g pixelWidth -g pixelHeight test-results/visual/creators.png test-results/visual/creators-1440.png
```

Record the actual output beside these absolute paths:

- `/Users/leeyukyung/Documents/selectors_ui/.worktrees/fuma-admin-ui/test-results/visual/creators.png`
- `/Users/leeyukyung/Documents/selectors_ui/.worktrees/fuma-admin-ui/test-results/visual/creators-1440.png`

- [ ] **Step 8: Inspect both final creator screenshots**

Open both files with `view_image` and record each observation explicitly:

1. The first three creator cards form one aligned three-column row.
2. The fourth card starts an intentional second row rather than squeezing into the first.
3. No card has horizontal overflow, clipped borders, or cropped actions.
4. Instagram, YouTube, and Facebook marks are recognizable in their rendered contexts.
5. Names, handles, metric labels/values, AI state, proposal state, and both action links remain legible.
6. The content mosaic is the dominant high-color area while the admin chrome remains restrained.
7. No key text overlaps another element or escapes its card.

- [ ] **Step 9: Write fresh evidence**

Create the verification document with the pre-verification SHA, clean-status result, each exact command and exit code, actual Vitest/Playwright counts, both absolute screenshot paths and dimensions, and all seven visual observations. Do not record predicted results.

- [ ] **Step 10: Commit evidence**

```bash
git add docs/superpowers/verification/2026-08-05-creator-pool-card-grid.md
git commit -m "docs: record creator pool card verification"
```
