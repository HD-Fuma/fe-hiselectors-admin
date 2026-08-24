import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, vi } from "vitest";
import type {
  Campaign,
  CampaignPerformanceDetail,
} from "../../entities/campaign";
import type { SelectorDetail } from "../../entities/selectors";
import { renderRoute } from "../../test/renderRoute";

const CAMPAIGNS: Campaign[] = [
  {
    id: 91,
    status: "ENDED",
    title: "종료 캠페인",
    description: "종료된 캠페인",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    thumbnailUrl: null,
    productIds: [201],
    products: [],
    createdAt: "2026-05-20T09:00:00",
    updatedAt: "2026-07-01T09:00:00",
  },
  {
    id: 42,
    status: "ACTIVE",
    title: "진행 중 캠페인",
    description: "현재 진행 중인 캠페인",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    thumbnailUrl: null,
    productIds: [101, 102],
    products: [],
    createdAt: "2026-07-25T09:00:00",
    updatedAt: "2026-08-01T09:00:00",
  },
  {
    id: 105,
    status: "SCHEDULED",
    title: "예정 캠페인",
    description: "시작 전 캠페인",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    thumbnailUrl: null,
    productIds: [],
    products: [],
    createdAt: "2026-08-20T09:00:00",
    updatedAt: "2026-08-20T09:00:00",
  },
];

const ACTIVE_PERFORMANCE: CampaignPerformanceDetail = {
  campaignId: 42,
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  summary: {
    confirmedSales: 12_345_600,
    confirmedOrderCount: 37,
    soldQuantity: 44,
    contributingSelectorCount: 3,
    canceledOrReturnedOrderCount: 2,
    canceledOrReturnedRate: 5.13,
  },
  daily: [
    { date: "2026-08-03", confirmedSales: 4_000_000, confirmedOrderCount: 12, soldQuantity: 14 },
    { date: "2026-08-01", confirmedSales: 3_200_000, confirmedOrderCount: 10, soldQuantity: 12 },
    { date: "2026-08-02", confirmedSales: 5_145_600, confirmedOrderCount: 15, soldQuantity: 18 },
  ],
  products: [
    {
      productId: 102,
      productCode: "PRD-102",
      productName: "두 번째 상품",
      brandName: "브랜드 B",
      thumbnailUrl: null,
      confirmedSales: 5_345_600,
      confirmedOrderCount: 17,
      soldQuantity: 20,
      contributingSelectorCount: 2,
    },
    {
      productId: 101,
      productCode: "PRD-101",
      productName: "매출 상위 상품",
      brandName: "브랜드 A",
      thumbnailUrl: null,
      confirmedSales: 7_000_000,
      confirmedOrderCount: 20,
      soldQuantity: 24,
      contributingSelectorCount: 3,
    },
  ],
  selectors: [
    {
      selectorId: 8,
      selectorCode: "SEL0008",
      nickname: "보조 셀렉터",
      profileImageUrl: null,
      confirmedSales: 4_345_600,
      confirmedOrderCount: 14,
      soldQuantity: 17,
      productCount: 1,
    },
    {
      selectorId: 7,
      selectorCode: "SEL0007",
      nickname: "매출 리더",
      profileImageUrl: "https://cdn.example.com/selector-7.jpg",
      confirmedSales: 8_000_000,
      confirmedOrderCount: 23,
      soldQuantity: 27,
      productCount: 2,
    },
  ],
};

const ENDED_PERFORMANCE: CampaignPerformanceDetail = {
  campaignId: 91,
  startDate: "2026-06-01",
  endDate: "2026-06-30",
  summary: {
    confirmedSales: 2_100_000,
    confirmedOrderCount: 8,
    soldQuantity: 9,
    contributingSelectorCount: 1,
    canceledOrReturnedOrderCount: 0,
    canceledOrReturnedRate: 0,
  },
  daily: [
    { date: "2026-06-01", confirmedSales: 2_100_000, confirmedOrderCount: 8, soldQuantity: 9 },
  ],
  products: [
    {
      productId: 201,
      productCode: "PRD-201",
      productName: "종료 캠페인 상품",
      brandName: "브랜드 C",
      thumbnailUrl: null,
      confirmedSales: 2_100_000,
      confirmedOrderCount: 8,
      soldQuantity: 9,
      contributingSelectorCount: 1,
    },
  ],
  selectors: [
    {
      selectorId: 19,
      selectorCode: "SEL0019",
      nickname: "종료 캠페인 셀렉터",
      profileImageUrl: null,
      confirmedSales: 2_100_000,
      confirmedOrderCount: 8,
      soldQuantity: 9,
      productCount: 1,
    },
  ],
};

const ZERO_PERFORMANCE: CampaignPerformanceDetail = {
  campaignId: 42,
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  summary: {
    confirmedSales: 0,
    confirmedOrderCount: 0,
    soldQuantity: 0,
    contributingSelectorCount: 0,
    canceledOrReturnedOrderCount: 0,
    canceledOrReturnedRate: 0,
  },
  daily: [],
  products: [],
  selectors: [],
};

const LEADER_SELECTOR_DETAIL: SelectorDetail = {
  id: 7,
  selectorsCode: "SEL0007",
  nickname: "매출 리더",
  roleId: "ACTIVE",
  roleName: "활동 중",
  applicationId: null,
  userId: null,
  createdAt: "2026-07-01T09:00:00",
  updatedAt: "2026-08-24T09:00:00",
  snsVerifiedAt: null,
  privacyAgreedAt: null,
  alimtalkAgreed: false,
  generations: [],
  snsAccount: {
    id: 70,
    snsCode: "INSTAGRAM",
    accountId: "sales.leader",
    followerCount: 12_300,
    profileImageUrl: "https://cdn.example.com/selector-7.jpg",
    lastCollectedAt: "2026-08-24T09:00:00",
  },
  totalPenaltyCount: 0,
  activePenaltyCount: 0,
  blacklistTarget: false,
  contents: [],
  performance: {
    contentCount: 0,
    totalViewCount: 0,
    totalLikeCount: 0,
    totalCommentCount: 0,
  },
};

function json(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify({
    code: "OK",
    data,
    message: null,
    success: true,
  }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/admin/campaigns") {
      return json({
        content: CAMPAIGNS,
        number: 0,
        size: 100,
        totalElements: CAMPAIGNS.length,
        totalPages: 1,
      });
    }
    if (url.pathname === "/api/admin/campaigns/42/performance") {
      return json(ACTIVE_PERFORMANCE);
    }
    if (url.pathname === "/api/admin/campaigns/91/performance") {
      return json(ENDED_PERFORMANCE);
    }
    if (url.pathname === "/api/admin/selectors/7") {
      return json(LEADER_SELECTOR_DETAIL);
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

function performanceRequestUrls() {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input)))
    .filter((url) => url.pathname.endsWith("/performance"));
}

function expectedActiveEndDate() {
  const today = new Date();
  const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return localDate < "2026-08-01"
    ? "2026-08-01"
    : localDate > "2026-08-31"
      ? "2026-08-31"
      : localDate;
}

test("keeps campaign and period controls in the filter panel and exposes sales results", async () => {
  const user = userEvent.setup();
  renderRoute("/performance/products");

  expect(await screen.findByRole(
    "heading",
    { name: "캠페인 성과" },
    { timeout: 3_000 },
  )).toBeInTheDocument();
  const search = await screen.findByRole("search", { name: "검색 조건" });
  const campaignSelect = within(search).getByRole(
    "combobox",
    { name: "성과 조회 캠페인" },
  );
  expect(campaignSelect).toHaveValue("42");
  expect(within(campaignSelect).getAllByRole("option").map((option) => option.textContent)).toEqual([
    "진행 중 캠페인",
    "종료 캠페인",
    "예정 캠페인",
  ]);
  expect(within(search).getByLabelText("캠페인 성과 시작일")).toHaveValue("2026-08-01");
  expect(within(search).getByLabelText("캠페인 성과 종료일")).toHaveValue(expectedActiveEndDate());

  const overview = await screen.findByRole("region", { name: "캠페인 성과 요약" });
  expect(within(overview).queryByRole("combobox", { name: "성과 조회 캠페인" }))
    .not.toBeInTheDocument();
  expect(within(overview).queryByLabelText("캠페인 성과 시작일")).not.toBeInTheDocument();
  expect(within(overview).queryByLabelText("캠페인 성과 종료일")).not.toBeInTheDocument();
  await within(overview).findByText("12,345,600원");
  expect(within(overview).getByText("37건")).toBeInTheDocument();
  expect(within(overview).getByText("44개")).toBeInTheDocument();
  expect(within(overview).getByText("3명")).toBeInTheDocument();
  expect(within(overview).queryByText("매출 귀속 기준")).not.toBeInTheDocument();

  const chart = within(overview).getByRole("img", { name: "기간별 전체 캠페인 성과 추이" });
  expect(chart.querySelectorAll("[data-series]")).toHaveLength(3);
  expect(
    [...chart.querySelectorAll<SVGGElement>("[data-period-date]")]
      .map((point) => point.dataset.periodDate),
  ).toEqual(["2026-08-01", "2026-08-02", "2026-08-03"]);

  const trendMetric = within(overview).getByRole("group", { name: "기간별 캠페인 성과 지표" });
  await user.click(within(trendMetric).getByRole("button", { name: "주문" }));
  const orderChart = within(overview).getByRole("img", { name: "기간별 확정 주문 추이" });
  expect(orderChart.querySelectorAll("[data-series]")).toHaveLength(1);
  expect(orderChart.querySelector('[data-series="confirmedOrderCount"]')).toBeInTheDocument();
  expect(
    [...orderChart.querySelectorAll<SVGGElement>("[data-metric-value]")]
      .map((point) => Number(point.dataset.metricValue)),
  ).toEqual([10, 15, 12]);

  const detail = screen.getByRole("region", { name: "캠페인 매출 상세" });
  const productTable = within(detail).getByRole("region", { name: "상품별 캠페인 매출" });
  const productRows = within(productTable).getAllByRole("row").slice(1);
  expect(productRows[0]).toHaveTextContent("매출 상위 상품");
  expect(productRows[0]).toHaveTextContent("7,000,000원");
  expect(productRows[1]).toHaveTextContent("두 번째 상품");

  const breakdown = within(detail).getByRole("navigation", { name: "캠페인 매출 상세 기준" });
  expect(breakdown).toHaveClass("fuma-list-action-toolbar");
  expect(within(breakdown).getAllByRole("button").map((button) => button.textContent)).toEqual([
    "상품별",
    "셀렉터스별",
  ]);
  expect(within(breakdown).getByRole("button", { name: "상품별" }))
    .toHaveAttribute("aria-pressed", "true");
  expect(within(breakdown).queryByRole("button", { name: "셀렉터스별 매출 기여" }))
    .not.toBeInTheDocument();
  await user.click(within(breakdown).getByRole("button", { name: "셀렉터스별" }));
  const selectorTable = within(detail).getByRole("region", { name: "셀렉터스별 캠페인 매출" });
  const selectorRows = within(selectorTable).getAllByRole("row").slice(1);
  expect(selectorRows[0]).toHaveTextContent("매출 리더");
  expect(selectorRows[0]).toHaveTextContent("8,000,000원");
  expect(selectorRows[1]).toHaveTextContent("보조 셀렉터");

  const initialRequest = performanceRequestUrls().find((url) => (
    url.pathname === "/api/admin/campaigns/42/performance"
  ));
  expect(initialRequest?.searchParams.get("startDate")).toBe("2026-08-01");
  expect(initialRequest?.searchParams.get("endDate")).toBe(expectedActiveEndDate());
});

test("shows selector profile images and opens the selector detail panel from a row", async () => {
  const user = userEvent.setup();
  const { router } = renderRoute("/performance/products");

  const detail = await screen.findByRole("region", { name: "캠페인 매출 상세" });
  const breakdown = await within(detail).findByRole(
    "navigation",
    { name: "캠페인 매출 상세 기준" },
  );
  const selectorsTab = within(breakdown).getByRole("button", { name: "셀렉터스별" });
  await user.click(selectorsTab);
  expect(selectorsTab).toHaveAttribute("aria-pressed", "true");

  const selectorTable = within(detail).getByRole("region", { name: "셀렉터스별 캠페인 매출" });
  const leaderRow = within(selectorTable).getAllByRole("row")[1];
  expect(within(leaderRow).getByRole("img", { name: "매출 리더 프로필 이미지" }))
    .toHaveAttribute("src", "https://cdn.example.com/selector-7.jpg");

  await user.click(leaderRow);

  const panel = await screen.findByRole("dialog", { name: "셀렉터스 상세" });
  expect(await within(panel).findByRole("heading", { name: "매출 리더" }))
    .toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/performance/products");
  expect(fetchMock.mock.calls.some(([input]) => (
    new URL(String(input)).pathname === "/api/admin/selectors/7"
  ))).toBe(true);
});

test("applies draft campaign and dates together, then resets to the active campaign defaults", async () => {
  const user = userEvent.setup();
  const { router } = renderRoute("/performance/products");
  const search = await screen.findByRole("search", { name: "검색 조건" });
  const campaignSelect = within(search).getByRole(
    "combobox",
    { name: "성과 조회 캠페인" },
  );
  const overview = screen.getByRole("region", { name: "캠페인 성과 요약" });
  await within(overview).findByText("12,345,600원");
  const initialActiveRequestCount = performanceRequestUrls().filter((url) => (
    url.pathname === "/api/admin/campaigns/42/performance"
    && url.searchParams.get("startDate") === "2026-08-01"
    && url.searchParams.get("endDate") === expectedActiveEndDate()
  )).length;

  await user.selectOptions(campaignSelect, "91");
  expect(campaignSelect).toHaveValue("91");
  expect(within(search).getByLabelText("캠페인 성과 시작일")).toHaveValue("2026-06-01");
  expect(within(search).getByLabelText("캠페인 성과 종료일")).toHaveValue("2026-06-30");
  expect(within(overview).getByText("12,345,600원")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/performance/products");
  expect(performanceRequestUrls().filter((url) => (
    url.pathname === "/api/admin/campaigns/91/performance"
  ))).toHaveLength(0);

  fireEvent.change(within(search).getByLabelText("캠페인 성과 시작일"), {
    target: { value: "2026-06-10" },
  });
  fireEvent.change(within(search).getByLabelText("캠페인 성과 종료일"), {
    target: { value: "2026-06-20" },
  });
  expect(performanceRequestUrls().filter((url) => (
    url.pathname === "/api/admin/campaigns/91/performance"
  ))).toHaveLength(0);
  await user.click(within(search).getByRole("button", { name: "조회" }));

  await waitFor(() => {
    const periodRequest = performanceRequestUrls().find((url) => (
      url.pathname === "/api/admin/campaigns/91/performance"
      && url.searchParams.get("startDate") === "2026-06-10"
      && url.searchParams.get("endDate") === "2026-06-20"
    ));
    expect(periodRequest).toBeDefined();
  });
  expect(await within(overview).findByText("2,100,000원")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/performance/products");

  await user.click(within(search).getByRole("button", { name: "초기화" }));
  expect(campaignSelect).toHaveValue("42");
  expect(within(search).getByLabelText("캠페인 성과 시작일")).toHaveValue("2026-08-01");
  expect(within(search).getByLabelText("캠페인 성과 종료일")).toHaveValue(expectedActiveEndDate());
  await waitFor(() => {
    const activeDefaultRequestCount = performanceRequestUrls().filter((url) => (
      url.pathname === "/api/admin/campaigns/42/performance"
      && url.searchParams.get("startDate") === "2026-08-01"
      && url.searchParams.get("endDate") === expectedActiveEndDate()
    )).length;
    expect(activeDefaultRequestCount).toBeGreaterThan(initialActiveRequestCount);
  });
  expect(await within(overview).findByText("12,345,600원")).toBeInTheDocument();
});

test("keeps totals and breakdown tabs out of a zero-result detail state", async () => {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/admin/campaigns") {
      return json({
        content: CAMPAIGNS,
        number: 0,
        size: 100,
        totalElements: CAMPAIGNS.length,
        totalPages: 1,
      });
    }
    if (url.pathname === "/api/admin/campaigns/42/performance") {
      return json(ZERO_PERFORMANCE);
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  });

  renderRoute("/performance/products");

  const detail = await screen.findByRole("region", { name: "캠페인 매출 상세" });
  expect(await within(detail).findByRole(
    "heading",
    { name: /확정 매출이 없습니다/ },
  )).toBeInTheDocument();
  expect(within(detail).queryByText("총 0건")).not.toBeInTheDocument();
  expect(within(detail).queryByRole(
    "navigation",
    { name: "캠페인 매출 상세 기준" },
  )).not.toBeInTheDocument();
});

test("keeps API error details and empty result controls out of the dashboard", async () => {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/admin/campaigns") {
      return json({
        content: CAMPAIGNS,
        number: 0,
        size: 100,
        totalElements: CAMPAIGNS.length,
        totalPages: 1,
      });
    }
    if (url.pathname === "/api/admin/campaigns/42/performance") {
      return Promise.resolve(new Response(JSON.stringify({
        code: "NOT_FOUND",
        data: null,
        message: "요청한 리소스를 찾을 수 없습니다.",
        success: false,
      }), { status: 404, headers: { "Content-Type": "application/json" } }));
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  });

  renderRoute("/performance/products");

  const detail = await screen.findByRole("region", { name: "캠페인 매출 상세" });
  expect(await within(detail).findByRole(
    "heading",
    { name: "캠페인 매출 상세를 불러오지 못했습니다." },
  )).toBeInTheDocument();
  expect(within(detail).queryByText("요청한 리소스를 찾을 수 없습니다.")).not.toBeInTheDocument();
  expect(within(detail).queryByText("총 0건")).not.toBeInTheDocument();
  expect(within(detail).queryByRole(
    "navigation",
    { name: "캠페인 매출 상세 기준" },
  )).not.toBeInTheDocument();
});
