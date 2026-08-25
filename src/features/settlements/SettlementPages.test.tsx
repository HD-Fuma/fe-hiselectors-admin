import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { SettlementEstimate } from "../../entities/settlement";
import { renderRoute } from "../../test/renderRoute";

const SETTLEMENTS = [
  {
    calculatedAt: "2026-08-01T03:00:00",
    settlementRate: 3,
    confirmedPurchaseCount: 1_234,
    settlementAmount: 75_000,
    confirmedSalesAmount: 2_500_000,
    selectorsCode: "SEL-0007",
    selectorsId: 42,
    selectorsNickname: "여름셀렉터",
    settlementId: 101,
    activityMonth: "2026-07",
    settlementMonth: "2026-08",
    paymentMonth: "2026-09",
    settlementSourceCode: "DAILY_BATCH",
    status: "CALCULATING",
    updatedAt: "2026-08-01T03:00:00",
  },
  {
    calculatedAt: "2026-08-01T03:00:00",
    settlementRate: 4,
    confirmedPurchaseCount: 15,
    settlementAmount: 12_000,
    confirmedSalesAmount: 300_000,
    selectorsCode: "SEL-0013",
    selectorsId: 48,
    selectorsNickname: "이월셀렉터",
    settlementId: 107,
    activityMonth: "2026-07",
    settlementMonth: "2026-08",
    paymentMonth: null,
    settlementSourceCode: "DAILY_BATCH",
    status: "PAYMENT_CARRYOVER",
    updatedAt: "2026-08-01T03:00:00",
  },
  {
    calculatedAt: "2026-08-01T03:00:00",
    settlementRate: 5,
    confirmedPurchaseCount: 80,
    settlementAmount: 40_000,
    confirmedSalesAmount: 800_000,
    selectorsCode: "SEL-0008",
    selectorsId: 43,
    selectorsNickname: "가을셀렉터",
    settlementId: 102,
    activityMonth: "2026-07",
    settlementMonth: "2026-08",
    paymentMonth: "2026-09",
    settlementSourceCode: "USER_REFRESH",
    status: "PAYMENT_PENDING",
    updatedAt: "2026-08-01T03:00:00",
  },
  {
    calculatedAt: "2026-08-01T03:00:00",
    settlementRate: 7,
    confirmedPurchaseCount: 40,
    settlementAmount: 35_000,
    confirmedSalesAmount: 500_000,
    selectorsCode: "SEL-0009",
    selectorsId: 44,
    selectorsNickname: "겨울셀렉터",
    settlementId: 103,
    activityMonth: "2026-07",
    settlementMonth: "2026-08",
    paymentMonth: "2026-09",
    settlementSourceCode: "DAILY_BATCH",
    status: "PAYMENT_HOLD_INFO",
    updatedAt: "2026-08-01T03:00:00",
  },
  {
    calculatedAt: "2026-08-01T03:00:00",
    settlementRate: 10,
    confirmedPurchaseCount: 20,
    settlementAmount: 30_000,
    confirmedSalesAmount: 300_000,
    selectorsCode: "SEL-0010",
    selectorsId: 45,
    selectorsNickname: "봄셀렉터",
    settlementId: 104,
    activityMonth: "2026-07",
    settlementMonth: "2026-08",
    paymentMonth: "2026-09",
    settlementSourceCode: "DAILY_BATCH",
    status: "PAYMENT_HOLD_BLACK",
    updatedAt: "2026-08-01T03:00:00",
  },
  {
    calculatedAt: "2026-08-01T03:00:00",
    settlementRate: 10,
    confirmedPurchaseCount: 20,
    settlementAmount: 30_000,
    confirmedSalesAmount: 300_000,
    selectorsCode: "SEL-0011",
    selectorsId: 46,
    selectorsNickname: "초여름셀렉터",
    settlementId: 105,
    activityMonth: "2026-07",
    settlementMonth: "2026-08",
    paymentMonth: "2026-09",
    settlementSourceCode: "DAILY_BATCH",
    status: "SETTLED",
    updatedAt: "2026-08-01T03:00:00",
  },
  {
    calculatedAt: "2026-08-01T03:00:00",
    settlementRate: 3,
    confirmedPurchaseCount: 5,
    settlementAmount: 3_000,
    confirmedSalesAmount: 100_000,
    selectorsCode: "SEL-0012",
    selectorsId: 47,
    selectorsNickname: "초여름셀렉터",
    settlementId: 106,
    activityMonth: "2026-07",
    settlementMonth: "2026-08",
    paymentMonth: "2026-09",
    settlementSourceCode: "DAILY_BATCH",
    status: "EXPIRED",
    updatedAt: "2026-08-01T03:00:00",
  },
] as const;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function pageResponse({
  content = SETTLEMENTS,
  number = 0,
  size = 20,
  totalElements = 42,
  totalPages = 3,
}: {
  content?: readonly SettlementEstimate[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
} = {}) {
  return new Response(JSON.stringify({
    code: "OK",
    data: { content, number, size, totalElements, totalPages },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function summaryResponse(overrides: Record<string, unknown> = {}) {
  const activityMonth = typeof overrides.activityMonth === "string"
    ? overrides.activityMonth
    : currentMonth();
  const [year, month] = activityMonth.split("-").map(Number);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(year, month - 6 + index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
  const monthlyTrend = months.map((monthValue, index) => ({
    activityMonth: monthValue,
    commissionToSalesRate: [4, 4.13, 4.29, 4.37, 4.5, 4.48][index],
    confirmedPurchaseCount: [900, 980, 1_050, 1_160, 1_270, 1_389][index],
    confirmedSalesAmount: [3_000_000, 3_200_000, 3_500_000, 3_800_000, 4_000_000, 4_400_000][index],
    settlementAmount: [120_000, 132_000, 150_000, 166_000, 180_000, 197_000][index],
    settlementCount: [30, 32, 35, 37, 40, 42][index],
  }));

  return new Response(JSON.stringify({
    code: "OK",
    data: {
      activityMonth,
      commissionToSalesRate: 4.48,
      confirmedPurchaseCount: 1_389,
      confirmedSalesAmount: 4_400_000,
      monthlyTrend,
      settlementAmount: 197_000,
      settlementCount: 42,
      statusDistribution: [
        { status: "CALCULATING", settlementCount: 5, settlementAmount: 20_000 },
        { status: "PAYMENT_CARRYOVER", settlementCount: 3, settlementAmount: 15_000 },
        { status: "PAYMENT_PENDING", settlementCount: 10, settlementAmount: 40_000 },
        { status: "PAYMENT_HOLD_INFO", settlementCount: 2, settlementAmount: 12_000 },
        { status: "PAYMENT_HOLD_BLACK", settlementCount: 1, settlementAmount: 8_000 },
        { status: "SETTLED", settlementCount: 20, settlementAmount: 100_000 },
        { status: "EXPIRED", settlementCount: 1, settlementAmount: 2_000 },
      ],
      ...overrides,
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function detailResponse() {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      accountRegistered: true,
      profile: {
        accountId: "@api_selector",
        followerCount: 12_345,
        lastCollectedAt: "2026-08-14T09:30:00",
        profileImageUrl: "https://cdn.example.com/profile.jpg",
        selectorsCode: "SEL-API-42",
        selectorsId: 42,
        selectorsNickname: "API 여름셀렉터",
        snsCode: "INSTAGRAM",
      },
      settlementSummary: {
        cumulativePaidCommission: 1_200_000,
        cumulativePurchaseConversionCount: 321,
        currentMonth: "2026-08",
        currentMonthPurchaseConversionCount: 12,
        nextMonthScheduledCommission: 75_000,
        nextPaymentMonth: "2026-09",
        nextPaymentSettlementStatus: "PAYMENT_PENDING",
        cumulativeSalesAmount: 4_400_000,
      },
      histories: {
        content: SETTLEMENTS,
        number: 0,
        size: 12,
        totalElements: 4,
        totalPages: 1,
      },
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function selectorDetailResponse() {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      id: 42,
      selectorsCode: "SEL-API-42",
      nickname: "API 여름셀렉터",
      roleId: "ACTIVE",
      roleName: "활성",
      applicationId: 70,
      userId: 700,
      createdAt: "2026-07-01T11:00:00",
      updatedAt: "2026-08-20T09:00:00",
      snsVerifiedAt: "2026-07-01T11:00:00",
      privacyAgreedAt: "2026-07-01T11:05:00",
      alimtalkAgreed: true,
      generations: [{
        generationId: 3,
        generationName: "3기",
        startDate: "2026-07-01T00:00:00",
        endDate: "2026-08-31T23:59:59",
        activityStartDate: "2026-08-01T00:00:00",
        activityEndDate: "2026-10-31T23:59:59",
        status: "ACTIVE",
        joinedAt: "2026-07-02T12:00:00",
        totalSales: 1_500_000,
        confirmedPurchaseCount: 12,
        paidCommissionAmount: 320_000,
      }],
      snsAccount: {
        id: 11,
        snsCode: "INSTAGRAM",
        accountId: "@api_selector",
        followerCount: 12_345,
        profileImageUrl: "https://cdn.example.com/profile.jpg",
        lastCollectedAt: "2026-08-14T09:30:00",
      },
      totalPenaltyCount: 3,
      activePenaltyCount: 2,
      blacklistTarget: false,
      contents: [],
      performance: {
        contentCount: 0,
        totalViewCount: 0,
        totalLikeCount: 0,
        totalCommentCount: 0,
      },
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function requestedUrl(call: unknown[]) {
  return new URL(String(call[0]));
}

function settlementFetchResponse(input: RequestInfo | URL) {
  const url = String(input);
  if (url.includes("/api/admin/settlements/selectors/") && url.includes("/detail")) {
    return detailResponse();
  }
  if (/\/api\/admin\/selectors\/\d+(?:\?|$)/.test(url)) return selectorDetailResponse();
  if (url.includes("/api/admin/settlements/estimates/summary")) return summaryResponse();
  return pageResponse();
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("selectors-auth", JSON.stringify({
    accessToken: "admin.jwt",
    loginId: "admin",
    role: "ADMIN",
    tokenType: "Bearer",
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("requests and renders the current-month settlement page", async () => {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => (
    Promise.resolve(settlementFetchResponse(input))
  ));
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/settlements");

  const results = await screen.findByRole("region", { name: "정산 지급 목록" });
  expect(await within(results).findByText("SEL-0007")).toBeInTheDocument();

  const search = screen.getByRole("search", { name: "검색 조건" });
  expect(within(search).getByLabelText("활동월")).toHaveValue(currentMonth());
  expect(within(search).queryByRole("textbox", { name: "ID 또는 이름" })).not.toBeInTheDocument();

  const statusFilter = screen.getByRole("navigation", { name: "지급 상태" });
  for (const status of ["전체", "계산 중", "지급 이월", "지급 대기", "정산 보류", "지급 완료", "지급 만료"]) {
    expect(within(statusFilter).getByRole("button", { name: status })).toHaveAttribute(
      "type",
      "button",
    );
  }

  expect(within(results).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "순번",
    "활동월",
    "셀렉터스코드",
    "셀렉터스명",
    "정산 건수",
    "매출 실적",
    "수수료율",
    "정산 수수료",
    "지급 상태",
  ]);
  const summerRow = within(results).getByRole("row", { name: /SEL-0007/ });
  expect(within(summerRow).getByText("1,234")).toBeInTheDocument();
  expect(within(summerRow).getByText("2,500,000원")).toBeInTheDocument();
  expect(within(summerRow).getByText("3%")).toBeInTheDocument();
  expect(within(summerRow).getByText("75,000원")).toBeInTheDocument();
  expect(within(results).getByText("계산 중")).toHaveClass("hsas-status-pill--neutral");
  expect(within(results).getByText("지급 이월")).toHaveClass("hsas-status-pill--pending");
  expect(within(results).getByText("지급 대기")).toHaveClass("hsas-status-pill--pending");
  expect(within(results).getAllByText("정산 보류")).toHaveLength(2);
  for (const hold of within(results).getAllByText("정산 보류")) {
    expect(hold).toHaveClass("hsas-status-pill--danger");
  }
  expect(within(results).getByText("지급 완료")).toHaveClass("hsas-status-pill--approved");
  expect(within(results).getByText("지급 만료")).toHaveClass("hsas-status-pill--rejected");
  expect(screen.getByText("총 42건")).toBeInTheDocument();
  expect(screen.queryByText("샘플 데이터")).not.toBeInTheDocument();

  const summary = screen.getByRole("region", { name: "정산 요약" });
  expect(await within(summary).findByRole("article", { name: "예상 정산액" })).toHaveTextContent(
    "197,000원",
  );
  expect(within(summary).getByText("전월 대비 +9.44%")).toBeInTheDocument();
  expect(within(summary).getByText("전월 180,000원")).toBeInTheDocument();
  expect(within(summary).getAllByText("확정 매출").length).toBeGreaterThan(0);
  expect(within(summary).getByText("4,400,000원")).toBeInTheDocument();
  expect(within(summary).getByText("매출 대비 수수료율")).toBeInTheDocument();
  expect(within(summary).getByText("수수료 ÷ 매출 × 100")).toBeInTheDocument();
  expect(within(summary).getByText("4.48%")).toBeInTheDocument();
  expect(within(summary).getByText("구매 확정")).toBeInTheDocument();
  expect(within(summary).getByText("1,389건")).toBeInTheDocument();
  expect(within(summary).getByText("정산 대상")).toBeInTheDocument();
  expect(within(summary).getByText("42건")).toBeInTheDocument();
  const trend = within(summary).getByRole("img", {
    name: /최근 6개월 확정 매출 및 수수료율 추이/,
  });
  expect(trend).toHaveAccessibleName(/확정 매출 4,400,000원, 수수료율 4.48%/);
  expect(trend.querySelector("[data-echarts-stub]")).toBeInTheDocument();
  const chartLegend = within(summary).getByRole("list", { name: "정산 추이 차트 범례" });
  expect(within(chartLegend).getByText("확정 매출")).toBeInTheDocument();
  expect(within(chartLegend).getByText("수수료율")).toBeInTheDocument();
  const statusOverview = within(summary).getByRole("article", { name: "지급 상태 현황" });
  expect(within(statusOverview).getByText("지급 이월")).toHaveClass("hsas-status-pill--pending");
  const holdAttention = within(statusOverview).getByLabelText("정산 보류 확인 필요");
  expect(holdAttention).toHaveTextContent("정산 보류 3건 · 20,000원");
  expect(holdAttention).toHaveTextContent("계좌 정보와 블랙리스트 여부를 확인해 주세요.");

  expect(fetchMock).toHaveBeenCalledTimes(2);
  const [input, init] = fetchMock.mock.calls[0];
  const url = new URL(String(input));
  expect(url.pathname).toBe("/api/admin/settlements/estimates");
  expect(url.searchParams.get("activityMonth")).toBe(currentMonth());
  expect(url.searchParams.get("page")).toBe("0");
  expect(url.searchParams.get("size")).toBe("20");
  expect(url.searchParams.has("status")).toBe(false);
  expect(url.searchParams.has("selectorsId")).toBe(false);
  expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe(
    "Bearer admin.jwt",
  );
  const [summaryInput, summaryInit] = fetchMock.mock.calls[1];
  const summaryUrl = new URL(String(summaryInput));
  expect(summaryUrl.pathname).toBe("/api/admin/settlements/estimates/summary");
  expect(summaryUrl.searchParams.get("activityMonth")).toBe(currentMonth());
  expect(summaryUrl.searchParams.has("status")).toBe(false);
  expect(new Headers((summaryInit as RequestInit).headers).get("Authorization")).toBe(
    "Bearer admin.jwt",
  );

  fireEvent.click(summerRow);
  expect(await screen.findByRole("dialog", { name: "셀렉터스 정산 상세" })).toBeInTheDocument();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  const detailPaths = fetchMock.mock.calls.slice(2).map((call) => requestedUrl(call).pathname).sort();
  expect(detailPaths).toEqual([
    "/api/admin/selectors/42",
    "/api/admin/settlements/selectors/42/detail",
  ]);
  const detailCall = fetchMock.mock.calls.find((call) => (
    requestedUrl(call).pathname === "/api/admin/settlements/selectors/42/detail"
  ));
  expect(detailCall).toBeDefined();
  const detailUrl = requestedUrl(detailCall ?? []);
  expect(detailUrl.pathname).toBe("/api/admin/settlements/selectors/42/detail");
  expect(detailUrl.searchParams.get("page")).toBe("0");
  expect(detailUrl.searchParams.get("size")).toBe("12");
  const [, detailInit] = detailCall ?? [];
  expect(new Headers((detailInit as RequestInit).headers).get("Authorization")).toBe(
    "Bearer admin.jwt",
  );
  const detail = screen.getByRole("dialog", { name: "셀렉터스 정산 상세" });
  expect(within(detail).getByRole("heading", { name: "API 여름셀렉터" })).toBeInTheDocument();
  expect(within(detail).queryByText("동의 및 수신 정보")).not.toBeInTheDocument();
  expect(within(detail).queryByText("간략 성과")).not.toBeInTheDocument();
  expect(within(detail).queryByText("등록 콘텐츠")).not.toBeInTheDocument();
  expect(within(detail).queryByText("참여 기수 이력")).not.toBeInTheDocument();
  expect(within(detail).getByText("정산 정보")).toBeInTheDocument();
  expect(within(detail).queryByText("활동 중")).not.toBeInTheDocument();
  expect(within(detail).getByRole("link", { name: "@api_selector" })).toHaveAttribute(
    "href",
    "https://www.instagram.com/api_selector",
  );
  expect(within(detail).getByText("팔로워 1.2만명")).toBeInTheDocument();
  expect(within(detail).getAllByText("321건").length).toBeGreaterThan(0);
  expect(within(detail).getByText("1,200,000원")).toBeInTheDocument();
  expect(within(detail).getAllByText("75,000원")).not.toHaveLength(0);
  const historyTable = within(detail).getByRole("region", { name: "셀렉터스 정산 내역" });
  expect(within(historyTable).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "순번",
    "활동월",
    "정산 건수",
    "매출 실적",
    "수수료율",
    "정산 수수료",
    "지급 상태",
  ]);
  const firstHistoryRow = within(historyTable).getAllByRole("row")[1];
  expect(within(firstHistoryRow).getByText("1,234")).toBeInTheDocument();
  expect(within(firstHistoryRow).getByText("2,500,000원")).toBeInTheDocument();
  expect(within(firstHistoryRow).getByText("3%")).toBeInTheDocument();
  expect(within(firstHistoryRow).getByText("75,000원")).toBeInTheDocument();
  expect(within(firstHistoryRow).getByText("계산 중")).toHaveClass("hsas-status-pill--neutral");
  fireEvent.click(screen.getByRole("button", { name: "상세 패널 닫기" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "셀렉터스 정산 상세" }))
    .not.toBeInTheDocument());
});

test("applies the month on search and requests status and pages immediately", async () => {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/summary")) {
      return Promise.resolve(summaryResponse({
        activityMonth: url.searchParams.get("activityMonth") ?? currentMonth(),
      }));
    }
    const requestedPage = Number(url.searchParams.get("page") ?? 0);
    return Promise.resolve(pageResponse({ number: requestedPage }));
  });
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/settlements");
  await screen.findByText("SEL-0007");

  const search = screen.getByRole("search", { name: "검색 조건" });
  fireEvent.change(within(search).getByLabelText("활동월"), {
    target: { value: "2026-06" },
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);

  fireEvent.click(within(search).getByRole("button", { name: "조회" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  expect(requestedUrl(fetchMock.mock.calls[2]).searchParams.get("activityMonth")).toBe("2026-06");
  expect(requestedUrl(fetchMock.mock.calls[3]).searchParams.get("activityMonth")).toBe("2026-06");

  fireEvent.click(screen.getByRole("button", { name: "정산 보류" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(6));
  const holdEstimateCalls = fetchMock.mock.calls.slice(4, 6);
  expect(holdEstimateCalls.map((call) => requestedUrl(call).searchParams.get("status")).sort())
    .toEqual(["PAYMENT_HOLD_BLACK", "PAYMENT_HOLD_INFO"]);
  expect(holdEstimateCalls.every((call) => requestedUrl(call).searchParams.get("page") === "0"))
    .toBe(true);
  const summary = screen.getByRole("region", { name: "정산 요약" });
  expect(within(summary).getByText("4,400,000원")).toBeInTheDocument();
  expect(within(summary).getByRole("article", { name: "예상 정산액" })).toHaveTextContent(
    "197,000원",
  );
  expect(within(summary).getByText("4.48%")).toBeInTheDocument();
  const summaryCalls = fetchMock.mock.calls.filter((call) => (
    requestedUrl(call).pathname === "/api/admin/settlements/estimates/summary"
  ));
  expect(summaryCalls).toHaveLength(2);
  expect(summaryCalls.every((call) => !requestedUrl(call).searchParams.has("status"))).toBe(true);

  fireEvent.click(screen.getByRole("button", { name: "지급 이월" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(7));
  const carryoverUrl = requestedUrl(fetchMock.mock.calls[6]);
  expect(carryoverUrl.searchParams.get("status")).toBe("PAYMENT_CARRYOVER");
  expect(carryoverUrl.searchParams.get("page")).toBe("0");

  fireEvent.click(screen.getByRole("button", { name: "지급 대기" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(8));
  const statusUrl = requestedUrl(fetchMock.mock.calls[7]);
  expect(statusUrl.searchParams.get("status")).toBe("PAYMENT_PENDING");
  expect(statusUrl.searchParams.get("page")).toBe("0");

  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(9));
  expect(requestedUrl(fetchMock.mock.calls[8]).searchParams.get("page")).toBe("1");
});

test("shows loading, demo fallback, and error states", async () => {
  const pendingResponses: Array<(response: Response) => void> = [];
  const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
    pendingResponses.push(resolve);
  }));
  vi.stubGlobal("fetch", fetchMock);

  const { unmount } = renderRoute("/settlements");
  expect(await screen.findByText("정산 내역을 불러오는 중입니다.")).toHaveAttribute(
    "role",
    "status",
  );
  expect(screen.getByText("정산 요약을 불러오는 중입니다.")).toHaveAttribute("role", "status");
  await waitFor(() => expect(pendingResponses).toHaveLength(2));
  pendingResponses[0](pageResponse({ content: [], totalElements: 0, totalPages: 0 }));
  pendingResponses[1](summaryResponse({
    commissionToSalesRate: 0,
    confirmedPurchaseCount: 0,
    confirmedSalesAmount: 0,
    monthlyTrend: [],
    settlementAmount: 0,
    settlementCount: 0,
    statusDistribution: [],
  }));
  const results = await screen.findByRole("region", { name: "정산 지급 목록" });
  const demoRow = await within(results).findByRole("row", { name: /SEL-0001/ });
  expect(screen.getByText("샘플 데이터 · 실제 지급과 무관")).toBeInTheDocument();
  expect(screen.getByText("샘플 데이터")).toBeInTheDocument();
  expect(screen.getByText("총 44건")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /최근 6개월 확정 매출 및 수수료율 추이/ }))
    .toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "페이지 이동" })).toBeInTheDocument();

  fireEvent.click(demoRow);
  const detail = await screen.findByRole("dialog", { name: "셀렉터스 정산 상세" });
  expect(within(detail).getByRole("heading", { name: "김서연" })).toBeInTheDocument();
  expect(within(detail).getByRole("region", { name: "셀렉터스 정산 내역" }))
    .toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  unmount();

  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "INTERNAL_SERVER_ERROR",
    data: null,
    message: "서버 오류",
    success: false,
  }), { status: 500 })));
  renderRoute("/settlements");
  expect(await screen.findByText("정산 내역 조회에 실패했습니다.")).toHaveAttribute(
    "role",
    "alert",
  );
  expect(screen.getByText("정산 요약 조회에 실패했습니다.")).toHaveAttribute("role", "alert");
});

test("keeps the settlement table when only the summary request fails", async () => {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/summary")) {
      return Promise.resolve(new Response(JSON.stringify({
        code: "INTERNAL_SERVER_ERROR",
        data: null,
        message: "서버 오류",
        success: false,
      }), { status: 500 }));
    }
    return Promise.resolve(pageResponse());
  });
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/settlements");

  const results = await screen.findByRole("region", { name: "정산 지급 목록" });
  expect(await within(results).findByText("SEL-0007")).toBeInTheDocument();
  expect(screen.getByText("정산 요약 조회에 실패했습니다.")).toHaveAttribute("role", "alert");
  expect(within(results).queryByText("정산 내역 조회에 실패했습니다.")).not.toBeInTheDocument();
});

test("keeps aggregate KPIs when a rollback summary omits dashboard arrays", async () => {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/summary")) {
      return Promise.resolve(summaryResponse({
        monthlyTrend: undefined,
        statusDistribution: undefined,
      }));
    }
    return Promise.resolve(pageResponse());
  });
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/settlements");

  const summary = await screen.findByRole("region", { name: "정산 요약" });
  expect(await within(summary).findByRole("article", { name: "예상 정산액" })).toHaveTextContent(
    "197,000원",
  );
  expect(within(summary).getByText("표시할 월별 추이 데이터가 없습니다.")).toBeInTheDocument();
  expect(within(summary).getByText("표시할 지급 상태 데이터가 없습니다.")).toBeInTheDocument();
});

test("ignores a stale response after a newer filter request", async () => {
  const pendingResponses: Array<(response: Response) => void> = [];
  const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
    pendingResponses.push(resolve);
  }));
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/settlements");
  await waitFor(() => expect(pendingResponses).toHaveLength(2));
  pendingResponses[0](pageResponse());
  pendingResponses[1](summaryResponse());
  await screen.findByText("SEL-0007");

  const search = screen.getByRole("search", { name: "검색 조건" });
  fireEvent.change(within(search).getByLabelText("활동월"), {
    target: { value: "2026-06" },
  });
  fireEvent.click(within(search).getByRole("button", { name: "조회" }));
  await waitFor(() => expect(pendingResponses).toHaveLength(4));

  fireEvent.change(within(search).getByLabelText("활동월"), {
    target: { value: "2026-05" },
  });
  fireEvent.click(within(search).getByRole("button", { name: "조회" }));
  await waitFor(() => expect(pendingResponses).toHaveLength(6));

  pendingResponses[4](pageResponse({
    content: [{ ...SETTLEMENTS[0], selectorsCode: "LATEST" }],
    totalElements: 1,
    totalPages: 1,
  }));
  pendingResponses[5](summaryResponse({ settlementAmount: 123_000 }));
  expect(await screen.findByText("LATEST")).toBeInTheDocument();
  expect(screen.getByText("123,000원")).toBeInTheDocument();

  pendingResponses[2](pageResponse({
    content: [{ ...SETTLEMENTS[0], selectorsCode: "STALE" }],
    totalElements: 1,
    totalPages: 1,
  }));
  pendingResponses[3](summaryResponse({ settlementAmount: 999_000 }));
  await waitFor(() => expect(screen.queryByText("STALE")).not.toBeInTheDocument());
  expect(screen.queryByText("999,000원")).not.toBeInTheDocument();
  expect(screen.getByText("LATEST")).toBeInTheDocument();
});
