import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { CONTENT_INFLUENCE } from "../../entities/performance";
import { renderRoute } from "../../test/renderRoute";

const API_CONTENTS = [
  {
    accountId: "api_creator",
    commentCount: 14,
    contentId: 901,
    contentType: "SHORT_FORM",
    contentUrl: "https://instagram.com/reel/api-901",
    followerCount: 12000,
    generationName: "1기",
    likeCount: 420,
    media: [{
      mediaType: "VIDEO",
      mediaUrl: "https://cdn.example.com/901.mp4",
      sequenceNo: 0,
      snsMediaId: "901",
      thumbnailUrl: "https://cdn.example.com/901.jpg",
    }],
    profileImageUrl: "https://cdn.example.com/profile.jpg",
    publishedAt: "2026-08-18T09:00:00",
    selectorsId: 91,
    selectorsNickname: "API 셀렉터",
    snsCode: "INSTAGRAM",
    snsContentId: "api-901",
    texts: ["API 최고 조회 콘텐츠", "API에서 불러온 본문"],
    trend: [
      { commentCount: 5, likeCount: 100, recordedAt: "2026-08-18T10:00:00", viewCount: 3000 },
      { commentCount: 14, likeCount: 420, recordedAt: "2026-08-19T10:00:00", viewCount: 9000 },
    ],
    viewCount: 9000,
  },
  {
    accountId: "api_creator_2",
    commentCount: 2,
    contentId: 902,
    contentType: "FEED",
    contentUrl: "https://instagram.com/p/api-902",
    followerCount: 5000,
    generationName: "1기",
    likeCount: 40,
    media: [],
    profileImageUrl: null,
    publishedAt: "2026-08-19T09:00:00",
    selectorsId: 92,
    selectorsNickname: "API 셀렉터 2",
    snsCode: "INSTAGRAM",
    snsContentId: "api-902",
    texts: ["API 두 번째 콘텐츠"],
    trend: [{ commentCount: 2, likeCount: 40, recordedAt: "2026-08-19T10:00:00", viewCount: 1000 }],
    viewCount: 1000,
  },
] as const;

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const isSummary = new URL(String(input)).pathname.endsWith("/summary");
    const data = isSummary
      ? {
          currentGenerationContentCount: 8,
          currentGenerationName: "1기",
          formats: [
            { contentType: "SHORT_FORM", count: 30 },
            { contentType: "FEED", count: 20 },
            { contentType: "SHORTS", count: 17 },
            { contentType: "LONG_FORM", count: 20 },
          ],
          previousGenerationContentCount: 5,
          previousGenerationName: "이전 기수",
          totalContentCount: 87,
        }
      : { content: API_CONTENTS, totalPages: 1 };
    return Promise.resolve(new Response(JSON.stringify({
      code: "OK",
      data,
      message: null,
      success: true,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
  }));
});

test("content performance opens card and list details in a side panel", async () => {
  const user = userEvent.setup();
  renderRoute("/performance/contents");

  const results = await screen.findByRole(
    "region",
    { name: "콘텐츠 성과 및 추이" },
    { timeout: 8_000 },
  );
  expect(screen.getByRole("search", { name: "검색 조건" }).parentElement)
    .toHaveAttribute("data-visual-contract", "list-search-panel");
  expect(within(results).getByText("콘텐츠 성과 및 추이")).toBeInTheDocument();
  const sort = within(results).getByRole("combobox", { name: "콘텐츠 성과 정렬" });
  expect(sort).toHaveValue("latest");
  await user.selectOptions(sort, "views");
  const highestViewContent = API_CONTENTS[0];
  await user.click(within(results).getByRole("switch", { name: "보기 방식" }));
  await within(results).findByRole("button", { name: /API 최고 조회 콘텐츠 콘텐츠 상세 보기$/ });
  expect(within(results).getByText("릴스")).toHaveClass("fuma-content-performance-format", "is-reels");
  expect(within(results).getByText("피드")).toHaveClass("fuma-content-performance-format", "is-feed");
  expect(within(results).queryByText("인스타 릴스")).not.toBeInTheDocument();
  expect(within(results).getAllByRole("button", { name: /콘텐츠 상세 보기$/ })[0])
    .toHaveAccessibleName(new RegExp(`${highestViewContent.texts[0]} 콘텐츠 상세 보기$`));
  const uploadStatus = screen.getByRole("heading", { name: "업로드 현황" }).closest("article");
  expect(uploadStatus).not.toBeNull();
  expect([...uploadStatus!.querySelectorAll("dt")].map((term) => term.textContent)).toEqual([
    "전체",
    "이번 기수",
    "이전 대비",
  ]);
  await within(uploadStatus!).findByText("87건");
  expect(within(uploadStatus!).getByText("8건")).toBeInTheDocument();
  expect(within(uploadStatus!).getByText("+60.0%")).toBeInTheDocument();
  expect(screen.getByText("기간별 콘텐츠 성과")).toBeInTheDocument();
  const periodSearch = screen.getByRole("form", { name: "콘텐츠 성과 기간 검색" });
  fireEvent.change(within(periodSearch).getByLabelText("성과 시작일"), {
    target: { value: "2026-08-18" },
  });
  fireEvent.change(within(periodSearch).getByLabelText("성과 종료일"), {
    target: { value: "2026-08-19" },
  });
  fireEvent.click(within(periodSearch).getByRole("button", { name: "조회" }));
  const chartScroll = await screen.findByRole(
    "region",
    { name: "기간별 콘텐츠 성과 그래프 좌우 이동" },
  );
  expect(chartScroll).toHaveClass("fuma-content-cohort-chart__scroll--draggable");
  const cohortChart = screen.getByRole("article", { name: "기간별 콘텐츠 성과" });
  expect(within(cohortChart).getByRole("tooltip", { hidden: true }))
    .toHaveTextContent("그래프를 좌우로 드래그해서 이동하세요");
  expect(within(cohortChart).getByRole("tooltip", { hidden: true })).toHaveClass("is-visible");
  expect(within(cohortChart).queryByRole("button", { name: "차트 이동 방법" })).not.toBeInTheDocument();
  expect(within(cohortChart).getByRole("button", { name: "종합" })).toHaveAttribute("aria-pressed", "true");
  expect(within(cohortChart).getByRole("img", { name: "기간별 전체 성과 추이" })).toBeInTheDocument();
  expect(cohortChart.querySelectorAll("[data-series]")).toHaveLength(4);
  expect(within(cohortChart).getByRole("list", { name: "차트 범례" }).children).toHaveLength(4);
  const cohortPoints = [...cohortChart.querySelectorAll<SVGGElement>("[data-period-date]")];
  const cohortNames = cohortPoints.map((point) => point.dataset.periodDate ?? "");
  expect(cohortPoints.length).toBeGreaterThan(0);
  expect(cohortNames).toEqual(
    [...cohortNames].sort((left, right) => left.localeCompare(right)),
  );
  await user.click(within(cohortChart).getByRole("button", { name: "댓글 수" }));
  expect(within(cohortChart).getByRole("img", { name: "기간별 댓글 수 추이" })).toBeInTheDocument();
  expect(cohortChart.querySelectorAll("[data-series]")).toHaveLength(1);
  const selectedLegend = within(cohortChart).getByRole("list", { name: "차트 범례" });
  expect(selectedLegend.children).toHaveLength(1);
  expect(within(selectedLegend).getByText("댓글 수")).toBeInTheDocument();
  const formatPanel = within(uploadStatus!).getByRole("region", { name: "콘텐츠 유형" });
  expect(within(formatPanel).queryByText("전체 콘텐츠")).not.toBeInTheDocument();
  expect(screen.queryByText(/조회 결과 [\d,]+건/)).not.toBeInTheDocument();

  const detailButtons = within(results).getAllByRole("button", { name: /콘텐츠 상세 보기$/ });
  const firstTrigger = detailButtons[0];
  const firstCard = firstTrigger.closest("article");
  expect(firstCard).not.toBeNull();
  expect(firstTrigger.tagName).toBe("BUTTON");
  expect(firstTrigger.parentElement).toBe(firstCard);
  expect(firstCard!.querySelector(".fuma-content-performance-card__back")).not.toBeInTheDocument();

  await user.click(firstTrigger);
  const cardDetail = screen.getByRole("dialog", { name: "콘텐츠 상세" });
  const originalContent = within(cardDetail).getByRole("region", { name: "콘텐츠 원문" });
  expect(within(originalContent).getByText("콘텐츠 제목")).toBeInTheDocument();
  expect(within(originalContent).getByText("원문")).toBeInTheDocument();
  expect(within(originalContent).getByText(/API에서 불러온 본문/)).toBeInTheDocument();
  expect(within(originalContent).getByLabelText(`${highestViewContent.texts[0]} 영상`))
    .toHaveProperty("tagName", "VIDEO");
  expect(within(originalContent).getByLabelText(`${highestViewContent.texts[0]} 영상`))
    .toHaveAttribute("src", highestViewContent.media[0].mediaUrl);
  expect(within(cardDetail).getByRole("heading", { name: highestViewContent.texts[0] })).toBeInTheDocument();
  expect(within(cardDetail).getByRole("heading", { name: "조회 및 반응 추이" })).toBeInTheDocument();
  const detailTrend = within(cardDetail).getByRole("img", { name: "콘텐츠 조회 및 반응 추이" });
  expect(detailTrend.querySelectorAll("[data-series]")).toHaveLength(3);
  await user.click(within(cardDetail).getByRole("button", { name: "좋아요" }));
  expect(detailTrend.querySelectorAll("[data-series]")).toHaveLength(1);
  expect(detailTrend.querySelectorAll(".fuma-content-cohort-chart__label").length).toBeGreaterThan(0);
  await user.click(within(cardDetail).getByRole("button", { name: "상세 패널 닫기" }));
  expect(screen.queryByRole("dialog", { name: "콘텐츠 상세" })).not.toBeInTheDocument();

  await user.click(within(results).getByRole("switch", { name: "보기 방식" }));
  const list = within(results).getByRole("region", { name: "콘텐츠 성과 목록" });
  expect(within(list).getByRole("columnheader", { name: "콘텐츠 유형" })).toBeInTheDocument();
  expect(within(list).getAllByText("릴스")[0]).toHaveClass("fuma-content-performance-format", "is-reels");
  expect(within(list).getByRole("columnheader", { name: /^조회수 · 좋아요 추이/ })).toBeInTheDocument();
  expect(within(list).queryByRole("columnheader", { name: "조회수 추이" })).not.toBeInTheDocument();
  expect(within(list).queryByRole("columnheader", { name: "좋아요 수 추이" })).not.toBeInTheDocument();
  const firstListRow = within(list).getAllByRole("row")[1];
  const tableTrend = within(firstListRow).getByRole("img", { name: /날짜별 조회수 및 좋아요 추이/ });
  expect(tableTrend).toHaveAccessibleName(/08\.18: 조회수 3,000, 좋아요 100/);
  expect(tableTrend).toHaveAccessibleName(/08\.19: 조회수 9,000, 좋아요 420/);
  expect(tableTrend.querySelectorAll("[data-series]")).toHaveLength(2);
  await user.click(firstListRow);
  expect(screen.getByRole("dialog", { name: "콘텐츠 상세" })).toBeInTheDocument();
}, 15_000);

test("period performance chart applies its local date range", async () => {
  const user = userEvent.setup();
  renderRoute("/performance/contents");

  await screen.findByRole("heading", { name: "콘텐츠 성과" }, { timeout: 5_000 });
  expect(screen.queryByLabelText("집계 시작일")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("집계 종료일")).not.toBeInTheDocument();
  expect(screen.queryByRole("figure", { name: "기간별 업로드 추이" })).not.toBeInTheDocument();

  const chart = screen.getByRole("article", { name: "기간별 콘텐츠 성과" });
  fireEvent.change(within(chart).getByLabelText("성과 시작일"), {
    target: { value: "2026-07-22" },
  });
  fireEvent.change(within(chart).getByLabelText("성과 종료일"), {
    target: { value: "2026-07-24" },
  });
  await user.click(within(chart).getByRole("button", { name: "조회" }));

  expect(
    [...chart.querySelectorAll<HTMLElement>("[data-period-date]")].map(
      (point) => point.dataset.periodDate,
    ),
  ).toEqual(["2026-07-22", "2026-07-23", "2026-07-24"]);
  await user.click(within(chart).getByRole("button", { name: "게시글 수" }));
  const expectedDailyCounts = ["2026-07-22", "2026-07-23", "2026-07-24"].map((date) => (
    CONTENT_INFLUENCE.filter((content) => content.publishedAt === date).length
  ));
  expect(
    [...chart.querySelectorAll<SVGGElement>('[data-series="contentCount"] [data-metric-value]')]
      .map((point) => Number(point.dataset.metricValue)),
  ).toEqual(expectedDailyCounts);

  fireEvent.change(within(chart).getByLabelText("성과 시작일"), {
    target: { value: "2026-07-23" },
  });
  await user.click(within(chart).getByRole("button", { name: "조회" }));
  expect(
    [...chart.querySelectorAll<HTMLElement>("[data-period-date]")].map(
      (point) => point.dataset.periodDate,
    ),
  ).toEqual(["2026-07-23", "2026-07-24"]);
}, 10_000);
