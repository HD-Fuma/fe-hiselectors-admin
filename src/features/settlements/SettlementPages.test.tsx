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
    status: "PAYMENT_HOLD",
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
    status: "SETTLED",
    updatedAt: "2026-08-01T03:00:00",
  },
] as const;

function previousMonth() {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

function detailResponse() {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
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

function requestedUrl(call: unknown[]) {
  return new URL(String(call[0]));
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

test("requests and renders the previous-month settlement page", async () => {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => (
    new URL(String(input)).pathname.endsWith("/detail")
      ? Promise.resolve(detailResponse())
      : Promise.resolve(pageResponse())
  ));
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/settlements");

  const results = await screen.findByRole("region", { name: "정산 지급 목록" });
  expect(within(results).getByText("SEL-0007")).toBeInTheDocument();

  const search = screen.getByRole("search", { name: "검색 조건" });
  expect(within(search).getByLabelText("활동월")).toHaveValue(previousMonth());
  expect(within(search).queryByRole("textbox", { name: "ID 또는 이름" })).not.toBeInTheDocument();

  const statusFilter = screen.getByRole("navigation", { name: "지급 상태" });
  for (const status of ["전체", "계산 중", "지급 대기", "지급 보류", "지급 완료"]) {
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
    "정산 대상 건수",
    "매출 실적",
    "수수료율",
    "예상 수수료",
    "지급 상태",
  ]);
  expect(within(results).getByText("1,234")).toBeInTheDocument();
  expect(within(results).getByText("2,500,000원")).toBeInTheDocument();
  expect(within(results).getByText("3%")).toBeInTheDocument();
  expect(within(results).getByText("75,000원")).toBeInTheDocument();
  expect(within(results).getByText("계산 중")).toHaveClass("hsas-status-pill--neutral");
  expect(within(results).getByText("지급 대기")).toHaveClass("hsas-status-pill--pending");
  expect(within(results).getByText("지급 보류")).toHaveClass("hsas-status-pill--danger");
  expect(within(results).getByText("지급 완료")).toHaveClass("hsas-status-pill--approved");
  expect(screen.getByText("총 42건")).toBeInTheDocument();

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [input, init] = fetchMock.mock.calls[0];
  const url = new URL(String(input));
  expect(url.pathname).toBe("/api/admin/settlements/estimates");
  expect(url.searchParams.get("activityMonth")).toBe(previousMonth());
  expect(url.searchParams.get("page")).toBe("0");
  expect(url.searchParams.get("size")).toBe("20");
  expect(url.searchParams.has("status")).toBe(false);
  expect(url.searchParams.has("selectorsId")).toBe(false);
  expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe(
    "Bearer admin.jwt",
  );

  fireEvent.click(within(results).getByRole("row", { name: /SEL-0007/ }));
  expect(await screen.findByRole("dialog", { name: "셀렉터스 상세" })).toBeInTheDocument();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const detailUrl = requestedUrl(fetchMock.mock.calls[1]);
  expect(detailUrl.pathname).toBe("/api/admin/settlements/selectors/42/detail");
  expect(detailUrl.searchParams.get("page")).toBe("0");
  expect(detailUrl.searchParams.get("size")).toBe("12");
  const [, detailInit] = fetchMock.mock.calls[1];
  expect(new Headers((detailInit as RequestInit).headers).get("Authorization")).toBe(
    "Bearer admin.jwt",
  );
  const detail = screen.getByRole("dialog", { name: "셀렉터스 상세" });
  expect(within(detail).getByRole("heading", { name: "API 여름셀렉터" })).toBeInTheDocument();
  expect(within(detail).getByText("12,345")).toBeInTheDocument();
  expect(within(detail).getByText("321건")).toBeInTheDocument();
  expect(within(detail).getByText("1,200,000원")).toBeInTheDocument();
  expect(within(detail).getAllByText("75,000원")).not.toHaveLength(0);
  const historyTable = within(detail).getByRole("region", { name: "셀렉터스 정산 내역" });
  expect(within(historyTable).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "순번",
    "활동월",
    "정산 대상 건수",
    "매출 실적",
    "수수료율",
    "예상 수수료",
    "지급 상태",
  ]);
  expect(within(historyTable).getByText("1,234")).toBeInTheDocument();
  expect(within(historyTable).getByText("2,500,000원")).toBeInTheDocument();
  expect(within(historyTable).getByText("3%")).toBeInTheDocument();
  expect(within(historyTable).getByText("75,000원")).toBeInTheDocument();
  expect(within(historyTable).getByText("계산 중")).toHaveClass("hsas-status-pill--neutral");
  fireEvent.click(screen.getByRole("button", { name: "상세 패널 닫기" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "셀렉터스 상세" }))
    .not.toBeInTheDocument());
});

test("applies the month on search and requests status and pages immediately", async () => {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const requestedPage = Number(new URL(String(input)).searchParams.get("page") ?? 0);
    return Promise.resolve(pageResponse({ number: requestedPage }));
  });
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/settlements");
  await screen.findByText("SEL-0007");

  const search = screen.getByRole("search", { name: "검색 조건" });
  fireEvent.change(within(search).getByLabelText("활동월"), {
    target: { value: "2026-06" },
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);

  fireEvent.click(within(search).getByRole("button", { name: "조회" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(requestedUrl(fetchMock.mock.calls[1]).searchParams.get("activityMonth")).toBe("2026-06");

  fireEvent.click(screen.getByRole("button", { name: "지급 보류" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  const statusUrl = requestedUrl(fetchMock.mock.calls[2]);
  expect(statusUrl.searchParams.get("status")).toBe("PAYMENT_HOLD");
  expect(statusUrl.searchParams.get("page")).toBe("0");

  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  expect(requestedUrl(fetchMock.mock.calls[3]).searchParams.get("page")).toBe("1");
});

test("shows loading, empty, and error states", async () => {
  let resolveRequest: ((response: Response) => void) | undefined;
  const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
    resolveRequest = resolve;
  }));
  vi.stubGlobal("fetch", fetchMock);

  const { unmount } = renderRoute("/settlements");
  expect(await screen.findByText("정산 내역을 불러오는 중입니다.")).toHaveAttribute(
    "role",
    "status",
  );
  resolveRequest?.(pageResponse({ content: [], totalElements: 0, totalPages: 0 }));
  expect(await screen.findByText("조회된 정산 내역이 없습니다.")).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "페이지 이동" })).not.toBeInTheDocument();
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
});

test("ignores a stale response after a newer filter request", async () => {
  const pendingResponses: Array<(response: Response) => void> = [];
  const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
    pendingResponses.push(resolve);
  }));
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/settlements");
  await waitFor(() => expect(pendingResponses).toHaveLength(1));
  pendingResponses[0](pageResponse());
  await screen.findByText("SEL-0007");

  const search = screen.getByRole("search", { name: "검색 조건" });
  fireEvent.change(within(search).getByLabelText("활동월"), {
    target: { value: "2026-06" },
  });
  fireEvent.click(within(search).getByRole("button", { name: "조회" }));
  await waitFor(() => expect(pendingResponses).toHaveLength(2));

  fireEvent.change(within(search).getByLabelText("활동월"), {
    target: { value: "2026-05" },
  });
  fireEvent.click(within(search).getByRole("button", { name: "조회" }));
  await waitFor(() => expect(pendingResponses).toHaveLength(3));

  pendingResponses[2](pageResponse({
    content: [{ ...SETTLEMENTS[0], selectorsCode: "LATEST" }],
    totalElements: 1,
    totalPages: 1,
  }));
  expect(await screen.findByText("LATEST")).toBeInTheDocument();

  pendingResponses[1](pageResponse({
    content: [{ ...SETTLEMENTS[0], selectorsCode: "STALE" }],
    totalElements: 1,
    totalPages: 1,
  }));
  await waitFor(() => expect(screen.queryByText("STALE")).not.toBeInTheDocument());
  expect(screen.getByText("LATEST")).toBeInTheDocument();
});
