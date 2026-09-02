import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";

const SELECTOR_PERFORMANCE_SUMMARY = {
  categories: [{
    averageSales: 12_700_000,
    category: "BEAUTY",
    medianSales: 8_400_000,
    reference: true,
    selectorCount: 2,
  }],
  distribution: {
    buckets: [
      { key: "ZERO", selectorCount: 0 },
      { key: "UP_TO_100000", selectorCount: 0 },
      { key: "UP_TO_500000", selectorCount: 0 },
      { key: "UP_TO_1000000", selectorCount: 0 },
      { key: "OVER_1000000", selectorCount: 2 },
    ],
    sellingSelectorCount: 2,
    topShareRate: 96.5,
    zeroSalesSelectorCount: 0,
  },
  kpis: {
    accruedCommissionAmount: 1_200_000,
    accruedCommissionChangeRate: 20,
    averageSales: 12_700_000,
    averageSalesChangeRate: 10,
    clickCount: 800,
    confirmedOrderChangeRate: 15,
    confirmedOrderCount: 34,
    conversionRate: 4.25,
    medianSales: 8_400_000,
    previousAccruedCommissionAmount: 1_000_000,
    previousAverageSales: 11_500_000,
    previousConfirmedOrderCount: 30,
    previousTotalSales: 20_000_000,
    totalSales: 25_400_000,
    totalSalesChangeRate: 27,
  },
  top5: [{
    category: "BEAUTY",
    generationName: "5기",
    nickname: "최고매출",
    previousRank: null,
    profileImageUrl: null,
    rank: 1,
    selectorId: 1,
    totalSales: 24_500_000,
  }],
  universe: {
    generationIds: [5, 3],
    previousEndDate: "2026-07-31",
    previousStartDate: "2026-04-01",
    selectorCount: 2,
  },
  watchlist: {
    clicksWithoutPurchase: 0,
    newTop10: 1,
    noClicks: 0,
    noUploads: 0,
    salesDrop: 0,
    salesSurge: 1,
  },
} as const;

const SELECTOR_PERFORMANCE_TREND = {
  bucket: "DAY",
  endDate: "2026-08-03",
  points: [
    { accruedCommissionAmount: 5, confirmedOrderCount: 1, date: "2026-08-01", totalSales: 100 },
    { accruedCommissionAmount: 10, confirmedOrderCount: 2, date: "2026-08-02", totalSales: 200 },
    { accruedCommissionAmount: 15, confirmedOrderCount: 3, date: "2026-08-03", totalSales: 300 },
  ],
  startDate: "2026-08-01",
} as const;

const GENERATIONS = [
  {
    activityEndDate: "2026-10-31T23:59:59",
    activityStartDate: "2026-08-01T00:00:00",
    endDate: "2026-07-31T23:59:59",
    generationName: "5기",
    id: 5,
    startDate: "2026-07-01T00:00:00",
    status: "ACTIVE",
  },
  {
    activityEndDate: "2026-10-31T23:59:59",
    activityStartDate: "2026-08-01T00:00:00",
    endDate: "2026-07-31T23:59:59",
    generationName: "3기",
    id: 3,
    startDate: "2026-07-01T00:00:00",
    status: "ACTIVE",
  },
  {
    activityEndDate: "2026-06-30T23:59:59",
    activityStartDate: "2026-01-01T00:00:00",
    endDate: "2026-03-31T23:59:59",
    generationName: "2기",
    id: 2,
    startDate: "2026-01-01T00:00:00",
    status: "INACTIVE",
  },
] as const;

function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function json(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify({
    code: "OK",
    data,
    message: null,
    success: true,
  }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/admin/selectors/")) {
      return new Promise<Response>(() => {});
    }
    if (url.includes("/api/admin/selector-performance/summary")) {
      return json(SELECTOR_PERFORMANCE_SUMMARY);
    }
    if (url.includes("/api/admin/selector-performance/trend")) {
      return json(SELECTOR_PERFORMANCE_TREND);
    }
    if (url.includes("/api/admin/generations")) {
      return json(GENERATIONS);
    }
    return json([]);
  }));
});

test("shows the cohort dashboard without a ranked sales list", async () => {
  renderRoute("/performance/selectors");

  expect(await screen.findByRole(
    "heading",
    { name: "셀렉터스 성과" },
    { timeout: 3_000 },
  )).toBeInTheDocument();
  expect(screen.queryByText("업로드 현황")).not.toBeInTheDocument();
  expect(screen.queryByText("기간별 콘텐츠 성과")).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "셀렉터스 성과 목록" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "전체 셀렉터스 성과 목록" })).not.toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "셀렉터스 구분" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "우수 활동자" })).not.toBeInTheDocument();

  const searches = screen.getAllByRole("search", { name: "검색 조건" });
  expect(searches).toHaveLength(1);
  expect(searches[0].parentElement).toHaveAttribute("data-visual-contract", "list-search-panel");
  expect(searches[0].closest(".fuma-performance-top-filter")).not.toBeNull();
  expect(within(searches[0]).getByRole("combobox", { name: "기수" })).toBeInTheDocument();
  expect(await within(searches[0]).findByLabelText("집계 시작일")).toHaveValue("2026-08-01");
  expect(within(searches[0]).getByLabelText("집계 종료일")).toHaveValue(localDateKey());
  expect(within(searches[0]).queryByLabelText("셀렉터스명")).not.toBeInTheDocument();

  const performanceUrls = await waitFor(() => {
    const urls = vi.mocked(fetch).mock.calls
      .map(([input]) => new URL(String(input), "http://localhost"))
      .filter((url) => (
        url.pathname === "/api/admin/selector-performance/summary"
        || url.pathname === "/api/admin/selector-performance/trend"
      ));
    expect(urls).toHaveLength(2);
    return urls;
  });
  expect(performanceUrls.every((url) => url.searchParams.get("startDate") === "2026-08-01")).toBe(true);
  expect(performanceUrls.every((url) => url.searchParams.get("endDate") === localDateKey())).toBe(true);
});

test("opens selector detail from the top 5 table without navigating away", async () => {
  const user = userEvent.setup();
  const { router } = renderRoute("/performance/selectors");

  const ranking = await screen.findByRole(
    "article",
    { name: "성과 TOP 5" },
    { timeout: 3_000 },
  );
  await user.click(await within(ranking).findByRole("button"));

  expect(router.state.location.pathname).toBe("/performance/selectors");
  expect(screen.getByTestId("admin-shell")).toHaveTextContent("셀렉터스 성과");
  expect(screen.getByRole("dialog", { name: "셀렉터스 상세" })).toBeInTheDocument();
});

test("shows the cohort dashboard and keeps watchlist selection on the summary", async () => {
  const user = userEvent.setup();
  renderRoute("/performance/selectors");

  const overview = await screen.findByRole("region", { name: "셀렉터스 성과 요약" }, { timeout: 3_000 });
  expect(await within(overview).findByText("2명")).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "기간 성과" })).toBeInTheDocument();
  expect(within(overview).queryByRole("form", { name: "셀렉터스 성과 기간 검색" }))
    .not.toBeInTheDocument();
  const topFilter = screen.getAllByRole("search", { name: "검색 조건" })[0];
  expect(within(topFilter).getByRole("combobox", { name: "기수" })).toBeInTheDocument();
  expect(within(topFilter).getByLabelText("집계 시작일")).toBeInTheDocument();
  expect(within(overview).getByText("집계 대상 셀렉터스")).toBeInTheDocument();
  expect(within(overview).getByText("발생 수수료")).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "성과 추이" })).toBeInTheDocument();
  expect(within(overview).getByRole("img", { name: "기간별 전체 셀렉터스 성과 추이" })).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "성과 분포" })).toBeInTheDocument();
  expect(within(overview).getByRole("img", { name: "매출 구간별 인원" })).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "성과 TOP 5" })).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "셀렉터스 유형별 성과" })).toBeInTheDocument();
  expect(within(overview).getByRole("img", { name: "유형별 매출 분포" })).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "관리 필요" })).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "성과 발견" })).toBeInTheDocument();
  expect(within(overview).queryByText("업로드 현황")).not.toBeInTheDocument();
  expect(within(overview).queryByText("중간매출")).not.toBeInTheDocument();

  const rise = within(overview).getByRole("button", {
    name: /직전 동일 기간 대비 매출 100% 이상 증가/,
  });
  await user.click(rise);
  expect(rise).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("region", { name: "전체 셀렉터스 성과 목록" })).not.toBeInTheDocument();
});
