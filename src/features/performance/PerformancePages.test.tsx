import { render, screen, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";
import {
  PerformanceBarChart,
  PerformanceKpiGrid,
  PerformanceRanking,
  PerformanceTrendChart,
} from "./PerformanceCharts";
import {
  buildContentVisualData,
  buildCreatorVisualData,
  buildDashboardVisualData,
} from "./PerformancePages";
import {
  CAMPAIGN_PERFORMANCE,
  CONTENT_INFLUENCE,
  CREATOR_INFLUENCE,
  PERFORMANCE_TREND,
  SELECTOR_PERFORMANCE,
  formatCount,
  formatRate,
} from "./fixtures";

const COHORT_OPTIONS = "전체3기2기";
const CAMPAIGN_OPTIONS =
  "전체2026 가을 골프웨어 셀렉션여름 바캉스 스타일링초여름 패션 리뷰";
const EMPTY_STATE = "표시할 성과 데이터가 없습니다";

function expectColumnHeaders(region: HTMLElement, names: string[]) {
  for (const name of names) {
    expect(within(region).getByRole("columnheader", { name })).toBeInTheDocument();
  }
}

function expectCommonFilters(search: HTMLElement) {
  expect(within(search).getByRole("combobox", { name: "기수" })).toHaveTextContent(
    COHORT_OPTIONS,
  );
  expect(
    within(search).getByRole("combobox", { name: "캠페인" }),
  ).toHaveTextContent(CAMPAIGN_OPTIONS);
  expect(within(search).getByLabelText("집계 시작일")).toHaveAttribute("type", "date");
  expect(within(search).getByLabelText("집계 시작일")).toHaveValue("2026-08-01");
  expect(within(search).getByLabelText("집계 종료일")).toHaveAttribute("type", "date");
  expect(within(search).getByLabelText("집계 종료일")).toHaveValue("2026-08-03");
  for (const name of ["조회", "초기화"]) {
    expect(within(search).getByRole("button", { name })).toHaveAttribute(
      "type",
      "button",
    );
  }
}

test("formats zero, thousands, and conversion rates for dense analytics tables", () => {
  expect(formatCount(0)).toBe("0");
  expect(formatCount(42200)).toBe("42,200");
  expect(formatRate(0, 0)).toBe("0.00%");
  expect(formatRate(829, 24820)).toBe("3.34%");
});

test("keeps the selected-period daily trend equal to the dashboard totals", () => {
  const dashboardClicks = CAMPAIGN_PERFORMANCE.reduce(
    (total, campaign) => total + campaign.clicks,
    0,
  );
  const dashboardConversions = CAMPAIGN_PERFORMANCE.reduce(
    (total, campaign) => total + campaign.conversions,
    0,
  );

  expect(PERFORMANCE_TREND.map((point) => point.date)).toEqual([
    "2026-08-01",
    "2026-08-02",
    "2026-08-03",
  ]);
  expect(
    PERFORMANCE_TREND.reduce((total, point) => total + point.clicks, 0),
  ).toBe(dashboardClicks);
  expect(
    PERFORMANCE_TREND.reduce((total, point) => total + point.conversions, 0),
  ).toBe(dashboardConversions);
});

test("keeps campaign totals equal to canonical content attribution", () => {
  for (const campaign of CAMPAIGN_PERFORMANCE) {
    const attributedContent = CONTENT_INFLUENCE.filter(
      (content) => content.campaignId === campaign.id,
    );
    const clicks = attributedContent.reduce(
      (total, content) => total + content.clicks,
      0,
    );
    const conversions = attributedContent.reduce(
      (total, content) => total + content.conversions,
      0,
    );

    expect(clicks, `${campaign.id} 클릭 합계`).toBe(campaign.clicks);
    expect(conversions, `${campaign.id} 구매 전환 합계`).toBe(
      campaign.conversions,
    );
  }
});

test("keeps creator and selector totals equal to their canonical content groups", () => {
  for (const creator of CREATOR_INFLUENCE) {
    const attributedContent = CONTENT_INFLUENCE.filter(
      (content) => content.creatorId === creator.id,
    );

    expect(
      attributedContent.reduce((total, content) => total + content.conversions, 0),
      `${creator.id} 구매 전환 합계`,
    ).toBe(creator.conversions);
    expect(
      attributedContent.reduce((total, content) => total + content.views, 0),
      `${creator.id} 조회 합계`,
    ).toBe(creator.views);
    expect(
      attributedContent.reduce((total, content) => total + content.likes, 0),
      `${creator.id} 좋아요 합계`,
    ).toBe(creator.likes);
    expect(
      attributedContent.reduce((total, content) => total + content.comments, 0),
      `${creator.id} 댓글 합계`,
    ).toBe(creator.comments);
  }

  for (const selector of SELECTOR_PERFORMANCE) {
    const attributedContent = CONTENT_INFLUENCE.filter(
      (content) => content.selectorId === selector.id,
    );

    expect(
      attributedContent.reduce(
        (total, content) => total + content.clicks,
        0,
      ),
      `${selector.id} 클릭 합계`,
    ).toBe(selector.clicks);
    expect(
      attributedContent.reduce((total, content) => total + content.conversions, 0),
      `${selector.id} 구매 전환 합계`,
    ).toBe(selector.conversions);
  }
});

test("builds page-level no-result and all-zero summaries with common chart empty states", () => {
  const emptyDashboard = buildDashboardVisualData([], [], []);
  const emptyCreators = buildCreatorVisualData([]);
  const emptyContents = buildContentVisualData([]);

  expect(emptyDashboard.kpis.map((item) => item.value)).toEqual([
    "-",
    "-",
    "-",
    "-",
  ]);
  expect(emptyCreators.kpis.map((item) => item.value)).toEqual([
    "-",
    "-",
    "-",
    "-",
  ]);
  expect(emptyContents.kpis.map((item) => item.value)).toEqual([
    "-",
    "-",
    "-",
    "-",
  ]);

  const emptyView = render(
    <>
      <PerformanceKpiGrid ariaLabel="빈 성과 요약" items={emptyDashboard.kpis} />
      <PerformanceTrendChart points={emptyDashboard.trendPoints} title="빈 추이" />
      <PerformanceBarChart
        items={emptyDashboard.campaignItems}
        mode="single"
        primaryLabel="전환율"
        title="빈 캠페인"
      />
      <PerformanceRanking items={emptyDashboard.selectorItems} title="빈 순위" />
    </>,
  );
  expect(screen.getAllByText(EMPTY_STATE)).toHaveLength(3);
  emptyView.unmount();

  const zeroDashboard = buildDashboardVisualData(
    [{ ...CAMPAIGN_PERFORMANCE[0], clicks: 0, conversions: 0 }],
    [{ ...SELECTOR_PERFORMANCE[0], clicks: 0, conversions: 0 }],
    [{ ...PERFORMANCE_TREND[0], clicks: 0, conversions: 0 }],
  );
  const zeroCreators = buildCreatorVisualData([
    {
      ...CREATOR_INFLUENCE[0],
      comments: 0,
      conversions: 0,
      likes: 0,
      views: 0,
    },
  ]);
  const zeroContents = buildContentVisualData([
    {
      ...CONTENT_INFLUENCE[0],
      clicks: 0,
      comments: 0,
      conversions: 0,
      likes: 0,
      views: 0,
    },
  ]);

  expect(zeroDashboard.kpis.map((item) => item.value)).toEqual([
    "0",
    "0",
    "0",
    "1명",
  ]);
  expect(zeroDashboard.campaignItems[0].primaryText).toBe("전환율 0.00%");
  expect(zeroCreators.kpis.map((item) => item.value)).toEqual([
    "0",
    "0",
    "0",
    "0",
  ]);
  expect(zeroContents.kpis.map((item) => item.value)).toEqual([
    "1개",
    "0",
    "0",
    "0",
  ]);

  render(
    <>
      <PerformanceTrendChart points={zeroDashboard.trendPoints} title="0 추이" />
      <PerformanceBarChart
        items={zeroDashboard.campaignItems}
        mode="single"
        primaryLabel="전환율"
        title="0 캠페인"
      />
      <PerformanceRanking items={zeroDashboard.selectorItems} title="0 순위" />
    </>,
  );
  expect(screen.getAllByText(EMPTY_STATE)).toHaveLength(3);
});

test("limits page-mapped content performance to the top five conversions", () => {
  const contents = [
    { conversions: 10, id: "ct-test-f", title: "테스트 콘텐츠 F", views: 6_000 },
    { conversions: 60, id: "ct-test-b", title: "테스트 콘텐츠 B", views: 1_000 },
    { conversions: 60, id: "ct-test-a", title: "테스트 콘텐츠 A", views: 2_000 },
    { conversions: 40, id: "ct-test-d", title: "테스트 콘텐츠 D", views: 3_000 },
    { conversions: 50, id: "ct-test-c", title: "테스트 콘텐츠 C", views: 4_000 },
    { conversions: 20, id: "ct-test-e", title: "테스트 콘텐츠 E", views: 5_000 },
  ].map((item) => ({
    ...CONTENT_INFLUENCE[0],
    ...item,
  }));
  const visualData = buildContentVisualData(contents);

  render(
    <PerformanceBarChart
      items={visualData.chartItems}
      mode="single"
      primaryLabel="조회 수"
      title="테스트 콘텐츠 성과 순위"
    />,
  );

  const chart = screen.getByRole("figure", {
    name: "테스트 콘텐츠 성과 순위",
  });
  expect(
    [...chart.querySelectorAll(".fuma-performance-bar-chart__row")].map(
      (row) => row.getAttribute("data-item-id"),
    ),
  ).toEqual([
    "ct-test-a",
    "ct-test-b",
    "ct-test-c",
    "ct-test-d",
    "ct-test-e",
  ]);
});

test("renders the exact dashboard metrics and campaign and selector performance tables", () => {
  renderRoute("/performance");

  expect(screen.getByRole("heading", { name: "관리자 성과 대시보드" })).toBeInTheDocument();
  expect(screen.getByText("PF101")).toBeInTheDocument();
  expectCommonFilters(screen.getByRole("search", { name: "검색 조건" }));

  const metrics = screen.getByRole("group", { name: "성과 요약" });
  for (const [label, value] of [
    ["총 클릭 수", "42,200"],
    ["구매 전환 수", "1,399"],
    ["전환율", "3.32%"],
    ["집계 셀렉터스", "4명"],
  ]) {
    expect(within(metrics).getByText(label)).toBeInTheDocument();
    expect(within(metrics).getByText(value)).toBeInTheDocument();
  }
  expect(metrics.tagName).toBe("DL");

  const trend = screen.getByRole("figure", { name: "선택 기간 성과 추이" });
  for (const point of PERFORMANCE_TREND) {
    expect(
      within(trend).getByText(
        `${point.label}: 클릭 ${formatCount(point.clicks)}, 구매 전환 ${formatCount(point.conversions)}`,
      ),
    ).toBeInTheDocument();
  }

  const campaignChart = screen.getByRole("figure", {
    name: "캠페인 전환 성과",
  });
  expect(
    [...campaignChart.querySelectorAll(".fuma-performance-bar-chart__row")].map(
      (row) => row.getAttribute("data-item-id"),
    ),
  ).toEqual(["cp-002", "cp-001", "cp-003"]);
  for (const campaign of CAMPAIGN_PERFORMANCE) {
    expect(
      within(campaignChart).getByText(
        `${campaign.name}: 전환율 ${formatRate(campaign.conversions, campaign.clicks)}`,
      ),
    ).toBeInTheDocument();
  }

  const selectorRanking = screen.getByRole("figure", {
    name: "셀렉터스 성과 순위",
  });
  expect(
    [...selectorRanking.querySelectorAll(".fuma-performance-ranking__item")].map(
      (row) => row.getAttribute("data-item-id"),
    ),
  ).toEqual(["sl-004", "sl-001", "sl-002", "sl-003"]);

  expect(screen.getByText("캠페인별 성과", { selector: "strong" })).toBeInTheDocument();
  expect(screen.getByText("총 3건")).toBeInTheDocument();
  const campaigns = screen.getByRole("region", { name: "캠페인별 성과" });
  expectColumnHeaders(campaigns, [
    "캠페인 ID",
    "캠페인명",
    "상태",
    "클릭 수",
    "구매 전환 수",
    "전환율",
  ]);
  const firstCampaign = within(campaigns).getByRole("row", {
    name: /cp-001 2026 가을 골프웨어 셀렉션 시작 전 14,060 370 2.63%/,
  });
  expect(within(firstCampaign).getByText("시작 전")).toHaveClass(
    "hsas-status-pill--pending",
  );
  const activeCampaign = within(campaigns).getByRole("row", {
    name: /cp-002 여름 바캉스 스타일링 진행 중 25,020 975 3.90%/,
  });
  expect(within(activeCampaign).getByText("진행 중")).toHaveClass(
    "hsas-status-pill--approved",
  );
  expect(within(campaigns).getByRole("row", {
    name: /cp-003 초여름 패션 리뷰 종료 3,120 54 1.73%/,
  })).toBeInTheDocument();

  expect(screen.getByText("셀렉터스별 성과", { selector: "strong" })).toBeInTheDocument();
  expect(screen.getByText("총 4건")).toBeInTheDocument();
  const selectors = screen.getByRole("region", { name: "셀렉터스별 성과" });
  expectColumnHeaders(selectors, [
    "셀렉터스 ID",
    "셀렉터스",
    "기수",
    "활동 상태",
    "클릭 수",
    "구매 전환 수",
    "전환율",
  ]);
  const selector = within(selectors).getByRole("row", {
    name: /sl-001 김서연 3기 활동 중 12,840 428 3.33%/,
  });
  expect(within(selector).getByText("활동 중")).toHaveClass(
    "hsas-status-pill--approved",
  );
  expect(within(selectors).getByRole("row", {
    name: /sl-004 오하늘 2기 수료 18,600 711 3.82%/,
  })).toBeInTheDocument();
  expect(screen.getAllByText("1 / 1 페이지")).toHaveLength(2);
  expect(screen.getAllByText("페이지당 20개")).toHaveLength(2);
});

test("renders creator influence filters and exact engagement metrics", () => {
  renderRoute("/performance/creators");

  expect(screen.getByRole("heading", { name: "크리에이터 분석 리포트" })).toBeInTheDocument();
  expect(screen.getByText("PF201")).toBeInTheDocument();
  const search = screen.getByRole("search", { name: "검색 조건" });
  expectCommonFilters(search);
  expect(
    within(search).getByRole("textbox", { name: "크리에이터명" }),
  ).toHaveAttribute("placeholder", "이름 검색");

  const metrics = screen.getByRole("group", { name: "크리에이터 성과 요약" });
  for (const [label, value] of [
    ["총 조회 수", "309,300"],
    ["총 좋아요", "22,922"],
    ["총 댓글", "1,684"],
    ["구매 전환 수", "1,399"],
  ]) {
    expect(within(metrics).getByText(label)).toBeInTheDocument();
    expect(within(metrics).getByText(value)).toBeInTheDocument();
  }

  const chart = screen.getByRole("figure", { name: /크리에이터 성과 추이/ });
  for (const creator of CREATOR_INFLUENCE) {
    expect(
      within(chart).getByText(
        `${creator.name}: 조회 수 ${formatCount(creator.views)}, 구매 전환 ${formatCount(creator.conversions)}`,
      ),
    ).toBeInTheDocument();
  }

  expect(screen.getByText("크리에이터 영향력", { selector: "strong" })).toBeInTheDocument();
  const results = screen.getByRole("region", { name: "크리에이터 영향력" });
  expect(within(results).getByText("총 4건")).toBeInTheDocument();
  expectColumnHeaders(results, [
    "크리에이터 ID",
    "크리에이터",
    "기수",
    "주요 플랫폼",
    "캠페인",
    "구매 전환 수",
    "조회 수",
    "좋아요",
    "댓글",
  ]);
  expect(within(results).getByRole("row", {
    name: /cr-001 김서연 3기 Instagram \/ YouTube 2개 캠페인 428 110,400 8,860 586/,
  })).toBeInTheDocument();
  expect(within(results).getByRole("row", {
    name: /cr-004 오하늘 2기 Instagram 여름 바캉스 스타일링 711 154,200 11,920 940/,
  })).toBeInTheDocument();
  expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
});

test("renders content status tracking with per-content view totals", () => {
  renderRoute("/performance/contents");

  expect(
    screen.getByRole("heading", { level: 1, name: "콘텐츠 성과" }),
  ).toBeInTheDocument();

  const statusMonitor = screen.getByRole("region", { name: "콘텐츠 상태 추적" });
  expect(
    within(statusMonitor).getByRole("heading", {
      level: 2,
      name: "콘텐츠 상태 추적",
    }),
  ).toBeInTheDocument();
  expect(
    within(statusMonitor).getByText(
      "콘텐츠가 갑자기 비공개되거나 오류가 발생해도 자동 알림으로 즉시 대응하여 캠페인을 안정적으로 이어갈 수 있습니다.",
    ),
  ).toBeInTheDocument();
  expect(
    within(statusMonitor).getByRole("button", { name: "이상 감지" }),
  ).toHaveAttribute("type", "button");

  const table = within(statusMonitor).getByRole("table");
  expectColumnHeaders(table, [
    "전체 콘텐츠 선택",
    "No.",
    "콘텐츠",
    "성과",
    "Σ 총합",
    "25-09-01",
    "25-09-02",
    "25-09-03",
    "25-09-04",
  ]);
  expect(
    within(table).getByRole("checkbox", { name: "전체 콘텐츠 선택" }),
  ).toBeChecked();
  expect(within(table).getAllByRole("row")).toHaveLength(
    CONTENT_INFLUENCE.length + 1,
  );

  for (const [index, content] of CONTENT_INFLUENCE.entries()) {
    const row = within(table).getByRole("row", {
      name: new RegExp(`${content.title} 선택 ${index + 1}`),
    });
    expect(
      within(row).getByRole("checkbox", { name: `${content.title} 선택` }),
    ).toBeChecked();
    expect(within(row).getByText(formatCount(content.views))).toBeInTheDocument();
  }
});
