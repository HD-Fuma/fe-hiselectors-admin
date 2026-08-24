import { getCampaignPerformance } from ".";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("selectors-auth", JSON.stringify({
    accessToken: "admin.jwt",
    tokenType: "Bearer",
  }));
});

afterEach(() => vi.unstubAllGlobals());

test("loads one campaign performance period with admin authentication", async () => {
  const performance = {
    campaignId: 12,
    startDate: "2026-08-01",
    endDate: "2026-08-24",
    summary: {
      confirmedSales: 1450000,
      confirmedOrderCount: 18,
      soldQuantity: 21,
      contributingSelectorCount: 4,
      canceledOrReturnedOrderCount: 1,
      canceledOrReturnedRate: 5.26,
    },
    daily: [],
    products: [],
    selectors: [],
  };
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "OK",
    data: performance,
    message: null,
    success: true,
  }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();

  await expect(getCampaignPerformance(12, {
    startDate: "2026-08-01",
    endDate: "2026-08-24",
  }, controller.signal)).resolves.toEqual(performance);

  const [input, init] = fetchMock.mock.calls[0];
  const url = new URL(String(input));
  expect(url.pathname).toBe("/api/admin/campaigns/12/performance");
  expect(url.searchParams.get("startDate")).toBe("2026-08-01");
  expect(url.searchParams.get("endDate")).toBe("2026-08-24");
  expect(new Headers((init as RequestInit).headers).get("Authorization"))
    .toBe("Bearer admin.jwt");
  expect((init as RequestInit).signal).toBe(controller.signal);
});

test("uses the API error message when campaign performance fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "CAMPAIGN_NOT_FOUND",
    data: null,
    message: "캠페인을 찾을 수 없습니다.",
    success: false,
  }), { status: 404, headers: { "Content-Type": "application/json" } })));

  await expect(getCampaignPerformance(999)).rejects.toThrow("캠페인을 찾을 수 없습니다.");
});
