import {
  createGeneration,
  getSelector,
  getSelectorFilterGenerations,
  getSelectorMatching,
  getSelectorPerformanceBreakdown,
  getSelectorPerformanceSummary,
  getSelectorPerformanceTrend,
  getSelectorSalesPerformance,
  getSelectors,
  resetSelectorTestAccount,
  sendSelectorProposals,
  updateGeneration,
  updateGenerationStatus,
} from "./api";

function json(data: unknown) {
  return new Response(JSON.stringify({ success: true, code: "OK", message: null, data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("selector admin api", () => {
  beforeEach(() => {
    localStorage.setItem("selectors-auth", JSON.stringify({ accessToken: "token", tokenType: "Bearer" }));
  });

  test("serializes list filters and sends the stored authorization", async () => {
    const page = { content: [], number: 1, size: 20, totalElements: 0, totalPages: 0 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(page)));

    await expect(getSelectors({
      roleId: "ACTIVE",
      generationId: 3,
      nickname: "홍길동",
      snsCode: "INSTAGRAM",
      page: 1,
      size: 20,
    })).resolves.toEqual(page);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("roleId=ACTIVE");
    expect(String(url)).toContain("generationId=3");
    expect(String(url)).toContain("nickname=%ED%99%8D%EA%B8%B8%EB%8F%99");
    expect(String(url)).toContain("snsCode=INSTAGRAM");
    expect(String(url)).toContain("page=1");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token");
  });

  test("loads selector detail and filter generations", async () => {
    const detail = { id: 7, nickname: "셀렉터", generations: [], snsAccount: null };
    const generations = [{ id: 3, generationName: "3기" }];
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(json(detail))
      .mockResolvedValueOnce(json(generations)));

    await expect(getSelector(7)).resolves.toEqual(detail);
    await expect(getSelectorFilterGenerations()).resolves.toEqual(generations);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/\/api\/admin\/selectors\/7$/);
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toMatch(/\/api\/admin\/generations$/);
  });

  test("sends generation mutations", async () => {
    const generation = {
      id: 3,
      generationName: "3기",
      startDate: "2026-07-01T00:00:00",
      endDate: "2026-08-31T23:59:59",
      activityStartDate: "2026-09-01T00:00:00",
      activityEndDate: "2026-11-30T23:59:59",
      status: "INACTIVE",
    };
    const saveRequest = {
      generationName: "3기",
      startDate: "2026-07-01T00:00:00",
      endDate: "2026-08-31T23:59:59",
      activityStartDate: "2026-09-01T00:00:00",
      activityEndDate: "2026-11-30T23:59:59",
    };
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(json(generation))
      .mockResolvedValueOnce(json(generation))
      .mockResolvedValueOnce(json({ ...generation, status: "ACTIVE" })));

    await createGeneration(saveRequest);
    await updateGeneration(3, saveRequest);
    await updateGenerationStatus(3, "ACTIVE");

    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify(saveRequest),
    });
    expect(new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers).get("Content-Type"))
      .toBe("application/json");
    expect(vi.mocked(fetch).mock.calls[1][1]).toMatchObject({ method: "PATCH" });
    expect(vi.mocked(fetch).mock.calls[2][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ status: "ACTIVE" }),
    });
  });

  test("loads sales performance with its applied period and keyword", async () => {
    const rows = [{
      confirmedOrderCount: 8,
      excellentActivityType: "3기 활동 누적 1위",
      excellentGenerationName: "3기",
      excellentGenerationSales: 11_000_000,
      generationName: "3기",
      isExcellent: true,
      nickname: "김서연",
      roleId: "ACTIVE",
      selectorCode: "SEL0001",
      selectorId: 1,
      totalSales: 12_000_000,
    }];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(rows)));

    await expect(getSelectorSalesPerformance({
      endDate: "2026-08-31",
      generationId: 5,
      keyword: "김서연",
      startDate: "2026-08-01",
    })).resolves.toEqual(rows);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/admin/selector-performance?");
    expect(String(url)).toContain("startDate=2026-08-01");
    expect(String(url)).toContain("endDate=2026-08-31");
    expect(String(url)).toContain("generationId=5");
    expect(String(url)).toContain("keyword=%EA%B9%80%EC%84%9C%EC%97%B0");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token");
  });

  test("loads selector performance summary and trend with generation and period", async () => {
    const summary = { universe: { selectorCount: 2 } };
    const trend = { bucket: "DAY", points: [] };
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(json(summary))
      .mockResolvedValueOnce(json(trend)));

    await expect(getSelectorPerformanceSummary({
      generationId: 5,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    })).resolves.toEqual(summary);
    await expect(getSelectorPerformanceTrend({
      generationId: 5,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    })).resolves.toEqual(trend);

    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain(
      "/api/admin/selector-performance/summary?",
    );
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("generationId=5");
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain(
      "/api/admin/selector-performance/trend?",
    );
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain("startDate=2026-08-01");
  });

  test("sends the test account reset as a DELETE with the platform and account", async () => {
    const result = {
      snsCode: "INSTAGRAM",
      accountId: "hiselectors_test",
      selectorsIds: [7],
      applicationIds: [11],
      deletedRowCount: 23,
      deletedRowCounts: { selectors: 1, application: 1 },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(result)));

    await expect(resetSelectorTestAccount({
      snsCode: "INSTAGRAM",
      accountId: "@hiselectors_test",
    })).resolves.toEqual(result);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/admin/selectors/test-reset?");
    expect(String(url)).toContain("snsCode=INSTAGRAM");
    expect(String(url)).toContain("accountId=%40hiselectors_test");
    expect(init?.method).toBe("DELETE");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token");
  });

  test("loads the selector breakdown for the given period", async () => {
    const breakdown = { selectorId: 12, products: [], campaigns: [] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(breakdown)));

    await expect(getSelectorPerformanceBreakdown(12, {
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    })).resolves.toEqual(breakdown);

    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).toContain("/api/admin/selector-performance/12/breakdown?");
    expect(url).toContain("startDate=2026-08-01");
    expect(url).toContain("endDate=2026-08-31");
  });

  test("passes only the given matching target and limit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json([])));

    await expect(getSelectorMatching({ campaignId: 7, limit: 20 })).resolves.toEqual([]);

    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).toContain("/api/admin/selector-matching?");
    expect(url).toContain("campaignId=7");
    expect(url).toContain("limit=20");
    expect(url).not.toContain("productId");
    expect(url).not.toContain("category=");
  });

  test("posts selector proposals with the caller idempotency key", async () => {
    const run = { runId: "run-1", status: "QUEUED" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(run)));

    await expect(sendSelectorProposals(
      { selectorIds: [12, 45], subject: "제안", body: "본문" },
      "key-1",
    )).resolves.toEqual(run);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/admin/selector-proposals");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Idempotency-Key")).toBe("key-1");
    expect(JSON.parse(String(init?.body)).selectorIds).toEqual([12, 45]);
  });

  test("uses the backend error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: false, message: "셀렉터스를 찾을 수 없습니다." }),
      { status: 404 },
    )));

    await expect(getSelector(404)).rejects.toThrow("셀렉터스를 찾을 수 없습니다.");
  });
});
