import { getSettlementPurchaseHistories } from ".";

function purchaseHistoryPage() {
  return {
    content: [{
      confirmedAt: "2026-08-02T10:00:00",
      orderNo: "ORDER-1",
      paidAmount: 25000,
      productCode: "PRODUCT-1",
      purchaseHistoryId: 1,
      purchasedAt: "2026-08-01T10:00:00",
      quantity: 2,
      selectorsCode: "SEL-1",
      selectorsId: 7,
      selectorsNickname: "셀렉터스",
      status: "PURCHASE_CONFIRMED",
      userHiId: "customer",
      userId: 10,
    }],
    number: 1,
    size: 50,
    totalElements: 51,
    totalPages: 2,
  };
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("selectors-auth", JSON.stringify({
    accessToken: "admin.jwt",
    tokenType: "Bearer",
  }));
});

afterEach(() => vi.unstubAllGlobals());

test("loads a monthly settlement purchase history page", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "OK",
    data: purchaseHistoryPage(),
    message: null,
    success: true,
  }), { headers: { "Content-Type": "application/json" }, status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();

  await expect(getSettlementPurchaseHistories({
    allMonths: false,
    month: "2026-08",
    page: 1,
    selectorsId: 7,
    size: 50,
  }, controller.signal)).resolves.toEqual(purchaseHistoryPage());

  const [input, init] = fetchMock.mock.calls[0];
  const url = new URL(String(input));
  expect(url.pathname).toBe("/api/admin/settlements/purchase-histories");
  expect(url.searchParams.get("month")).toBe("2026-08");
  expect(url.searchParams.get("allMonths")).toBe("false");
  expect(url.searchParams.get("selectorsId")).toBe("7");
  expect(url.searchParams.get("page")).toBe("1");
  expect(url.searchParams.get("size")).toBe("50");
  expect(url.searchParams.getAll("sort")).toEqual(["purchasedAt,desc", "id,desc"]);
  expect(new Headers(init.headers).get("Authorization")).toBe("Bearer admin.jwt");
  expect(init.signal).toBe(controller.signal);
});

test("omits month and selectors when loading all purchase history", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "OK",
    data: purchaseHistoryPage(),
    message: null,
    success: true,
  }), { headers: { "Content-Type": "application/json" }, status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  await getSettlementPurchaseHistories({
    allMonths: true,
    month: "2026-08",
    page: 0,
    size: 20,
  });

  const url = new URL(String(fetchMock.mock.calls[0][0]));
  expect(url.searchParams.get("allMonths")).toBe("true");
  expect(url.searchParams.has("month")).toBe(false);
  expect(url.searchParams.has("selectorsId")).toBe(false);
});

test("uses the backend purchase history error message", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "BAD_REQUEST",
    data: null,
    message: "조회월 형식이 올바르지 않습니다.",
    success: false,
  }), { headers: { "Content-Type": "application/json" }, status: 400 })));

  await expect(getSettlementPurchaseHistories({
    allMonths: false,
    month: "invalid",
    page: 0,
    size: 20,
  })).rejects.toThrow("조회월 형식이 올바르지 않습니다.");
});
