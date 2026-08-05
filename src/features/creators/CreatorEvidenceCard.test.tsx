import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CREATORS, type CreatorFixture } from "./fixtures";
import { CreatorDetailPage, ProposalHistoryPage } from "./CreatorPages";
import {
  CreatorEvidenceCard,
  averageViews,
  compactNumber,
  engagementRate,
  proposalAction,
  proposalTone,
} from "./CreatorEvidenceCard";

const zia = CREATORS[2];
const evidenceFixtures = [
  {
    id: "cr-001",
    portrait: "sage",
    featuredContents: [
      {
        id: "seo-look",
        platform: "Instagram",
        title: "여름 데일리 룩",
        mediaType: "이미지",
        views: 98_600,
        visual: "fashion",
      },
      {
        id: "seo-tone",
        platform: "Instagram",
        title: "가을 톤 메이크업",
        mediaType: "이미지",
        views: 74_200,
        visual: "beauty",
      },
      {
        id: "seo-video",
        platform: "YouTube",
        title: "5분 출근 룩북",
        mediaType: "동영상",
        views: 63_100,
        visual: "skincare",
      },
    ],
  },
  {
    id: "cr-002",
    portrait: "navy",
    featuredContents: [
      {
        id: "doyoon-home",
        platform: "YouTube",
        title: "퇴근 후 집밥",
        mediaType: "동영상",
        views: 54_800,
        visual: "cooking",
      },
      {
        id: "doyoon-coffee",
        platform: "YouTube",
        title: "홈카페 레시피",
        mediaType: "동영상",
        views: 37_400,
        visual: "coffee",
      },
      {
        id: "doyoon-table",
        platform: "YouTube",
        title: "주말 한 상",
        mediaType: "이미지",
        views: 29_600,
        visual: "table",
      },
    ],
  },
  {
    id: "cr-003",
    portrait: "coral",
    featuredContents: [
      {
        id: "zia-coast",
        platform: "Instagram",
        title: "여름 바다 산책",
        mediaType: "이미지",
        views: 42_300,
        visual: "coast",
      },
      {
        id: "zia-city",
        platform: "Facebook",
        title: "도시 여행 노트",
        mediaType: "이미지",
        views: 28_100,
        visual: "city",
      },
      {
        id: "zia-pack",
        platform: "Instagram",
        title: "3박 4일 패킹",
        mediaType: "동영상",
        views: 19_600,
        visual: "packing",
      },
    ],
  },
  {
    id: "cr-004",
    portrait: "amber",
    featuredContents: [
      {
        id: "haneul-dessert",
        platform: "Instagram",
        title: "제철 과일 디저트",
        mediaType: "동영상",
        views: 218_000,
        visual: "dessert",
      },
      {
        id: "haneul-table",
        platform: "Instagram",
        title: "오늘의 브런치",
        mediaType: "이미지",
        views: 184_000,
        visual: "table",
      },
      {
        id: "haneul-coffee",
        platform: "Instagram",
        title: "카페 신메뉴 리뷰",
        mediaType: "동영상",
        views: 169_000,
        visual: "coffee",
      },
    ],
  },
] as const;

const withStatus = (status: CreatorFixture["proposalStatus"]): CreatorFixture => ({
  ...zia,
  proposalStatus: status,
});

function renderCard(creator: CreatorFixture = zia) {
  return render(
    <MemoryRouter>
      <ul>
        <CreatorEvidenceCard creator={creator} />
      </ul>
    </MemoryRouter>,
  );
}

function renderCardRoutes(creator: CreatorFixture = zia) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="/"
          element={
            <ul>
              <CreatorEvidenceCard creator={creator} />
            </ul>
          }
        />
        <Route path="/creators/:creatorId" element={<CreatorDetailPage />} />
        <Route path="/proposals" element={<ProposalHistoryPage />} />
      </Routes>
    </MemoryRouter>,
  );
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

    for (const text of [
      "@zia.trip",
      "여행 / 라이프",
      "콘텐츠 142개",
      "5.1만",
      "1.4만",
      "5.1%",
      "생성 대기",
      "T3",
      "발송 실패",
      "최근 활동일 2026-07-29",
    ]) {
      expect(within(card).getByText(text)).toBeInTheDocument();
    }

    expect(within(card).getByText("팔로워·구독자")).toBeInTheDocument();
    expect(within(card).getByText("평균 조회")).toBeInTheDocument();
    expect(within(card).getByText("평균 반응률")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "이지아 상세 보기" })).toHaveAttribute(
      "href",
      "/creators/cr-003",
    );
    expect(within(card).getByRole("link", { name: "이지아 다시 제안" })).toHaveAttribute(
      "href",
      "/creators/cr-003#proposal",
    );
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

  test("navigates the proposal action to the detail proposal target", async () => {
    const user = userEvent.setup();
    renderCardRoutes();

    await user.click(screen.getByRole("link", { name: "이지아 다시 제안" }));

    expect(screen.getByRole("region", { name: "영입 제안" })).toHaveAttribute(
      "id",
      "proposal",
    );
  });

  test("navigates the history action to proposals filtered for the creator", async () => {
    const user = userEvent.setup();
    renderCardRoutes(withStatus("발송 완료"));

    await user.click(screen.getByRole("link", { name: "이지아 제안 이력" }));

    expect(screen.getByText("총 1건")).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "제안 이력 목록" });
    expect(within(results).getByRole("row", { name: /이지아 \(cr-003\)/ })).toBeInTheDocument();
    expect(within(results).queryByText(/김서연/)).not.toBeInTheDocument();
  });

  test("renders first-channel and zero-safe fallbacks", () => {
    renderCard({ ...zia, channels: [], followers: 0 } as CreatorFixture);

    expect(screen.getByText("채널 정보 없음")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("0.0%")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/NaN|Infinity/);
  });
});

describe("creator evidence-card helpers", () => {
  test("computes channel averages and a zero-safe weighted reaction rate", () => {
    expect(averageViews(zia)).toBe(13_600);
    expect(engagementRate(zia)).toBeCloseTo(5.147, 2);

    const empty = { ...zia, channels: [] } as CreatorFixture;
    const zero = {
      ...zia,
      channels: zia.channels.map((channel) => ({ ...channel, views: 0 })),
    } as CreatorFixture;

    expect(averageViews(empty)).toBe(0);
    expect(engagementRate(empty)).toBe(0);
    expect(engagementRate(zero)).toBe(0);
  });

  test("rounds a fractional channel average to the nearest whole view", () => {
    const fractional = {
      ...zia,
      channels: [
        { ...zia.channels[0], views: 1 },
        { ...zia.channels[1], views: 2 },
      ],
    } as CreatorFixture;

    expect(averageViews(fractional)).toBe(2);
  });

  test("formats compact Korean view and follower counts", () => {
    expect(compactNumber.format(13_600)).toBe("1.4만");
    expect(compactNumber.format(51_100)).toBe("5.1만");
  });

  test.each(evidenceFixtures)(
    "$id has its exact portrait and ordered featured content payload",
    ({ id, portrait, featuredContents }) => {
      const creator = CREATORS.find((item) => item.id === id);

      expect(creator).toBeDefined();
      expect({
        portrait: creator?.portrait,
        featuredContents: creator?.featuredContents,
      }).toEqual({ portrait, featuredContents });
    },
  );

  test("declares Zia's Facebook audience and channel metrics exactly", () => {
    expect(zia.platforms).toEqual(["Instagram", "Facebook"]);
    expect(zia.followers).toBe(51_100);
    expect(zia.channels[1]).toEqual({
      platform: "Facebook",
      handle: "지아의 여행노트",
      followers: 18_400,
      views: 9_300,
      reactions: 420,
    });
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
