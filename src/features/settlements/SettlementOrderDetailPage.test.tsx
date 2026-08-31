import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

const ORDERS = [
  {
    confirmedAt: "2026-09-01T12:30:00",
    orderNo: "ORDER-100",
    paidAmount: 39800,
    productCode: "PRODUCT-100",
    purchaseHistoryId: 100,
    purchasedAt: "2026-09-01T10:20:00",
    quantity: 2,
    selectorsCode: "SEL-0042",
    selectorsId: 42,
    selectorsNickname: "가을셀렉터스",
    status: "PURCHASE_CONFIRMED",
    userHiId: "hi-customer",
    userId: 501,
  },
  {
    confirmedAt: null,
    orderNo: "ORDER-101",
    paidAmount: 19900,
    productCode: "PRODUCT-101",
    purchaseHistoryId: 101,
    purchasedAt: "2026-09-01T09:00:00",
    quantity: 1,
    selectorsCode: "SEL-0043",
    selectorsId: 43,
    selectorsNickname: "반품셀렉터스",
    status: "RETURN_REQUESTED",
    userHiId: "return-customer",
    userId: 502,
  },
] as const;

function orderResponse() {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      content: ORDERS,
      number: 0,
      size: 20,
      totalElements: 21,
      totalPages: 2,
    },
    message: null,
    success: true,
  }), { headers: { "Content-Type": "application/json" }, status: 200 });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(orderResponse())));
});

afterEach(() => vi.unstubAllGlobals());

test("renders the order detail route with current-month results and status labels", async () => {
  renderRoute("/settlements/orders");

  expect(await screen.findByRole(
    "heading",
    { name: "주문 상세" },
    { timeout: 5_000 },
  )).toBeInTheDocument();
  const menu = screen.getByRole("navigation", { name: "관리자 메뉴" });
  expect(within(menu).getByRole("link", { name: "주문 상세" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(await screen.findByText("구매 확정")).toBeInTheDocument();
  expect(screen.getByText("반품 요청")).toBeInTheDocument();
  expect(screen.getByText("39,800원")).toBeInTheDocument();
  expect(screen.getByText("2026-09-01 12:30")).toBeInTheDocument();

  const month = screen.getByLabelText("주문월");
  const now = new Date();
  expect(month).toHaveValue(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );

  await waitFor(() => {
    const fetchMock = vi.mocked(fetch);
    const url = new URL(String(fetchMock.mock.calls.find(([input]) => (
      String(input).includes("/purchase-histories?")
    ))?.[0]));
    expect(url.searchParams.get("allMonths")).toBe("false");
    expect(url.searchParams.get("month")).toBe(month.getAttribute("value"));
  });
});

test("applies all-month and selectors filters and changes pages", async () => {
  renderRoute("/settlements/orders");
  await screen.findByText("구매 확정", {}, { timeout: 5_000 });

  fireEvent.click(screen.getByRole("checkbox", { name: "전체 기간" }));
  fireEvent.change(screen.getByRole("spinbutton", { name: "셀렉터스 ID" }), {
    target: { value: "42" },
  });
  fireEvent.click(screen.getByRole("button", { name: "조회" }));

  await waitFor(() => {
    const urls = vi.mocked(fetch).mock.calls
      .map(([input]) => new URL(String(input)))
      .filter((url) => url.pathname.endsWith("/purchase-histories"));
    expect(urls.some((url) => (
      url.searchParams.get("allMonths") === "true"
      && url.searchParams.get("selectorsId") === "42"
      && !url.searchParams.has("month")
    ))).toBe(true);
  });

  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
  await waitFor(() => {
    const urls = vi.mocked(fetch).mock.calls
      .map(([input]) => new URL(String(input)))
      .filter((url) => url.pathname.endsWith("/purchase-histories"));
    expect(urls.some((url) => url.searchParams.get("page") === "1")).toBe(true);
  });
});
