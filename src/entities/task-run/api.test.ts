import { getRecentTaskRuns, getTaskRunPanel } from "./api";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify({
    success: status < 400,
    code: status < 400 ? "OK" : "ERROR",
    message: status < 400 ? null : "작업 목록을 불러오지 못했습니다.",
    data: status < 400 ? data : null,
  }), { status, headers: { "Content-Type": "application/json" } });
}

describe("task run panel api", () => {
  beforeEach(() => {
    localStorage.setItem("selectors-auth", JSON.stringify({
      accessToken: "admin.jwt",
      tokenType: "Bearer",
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  test("loads the server panel DTO with authorization and abort signal", async () => {
    const panel = { items: [], serverTime: "2026-08-23T00:00:00Z" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(panel)));
    const controller = new AbortController();

    await expect(getTaskRunPanel(controller.signal)).resolves.toEqual(panel);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toMatch(/\/api\/admin\/task-runs\/panel$/);
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer admin.jwt");
    expect(init?.signal).toBe(controller.signal);
  });

  test("rejects an unsuccessful or malformed API envelope", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(json(null, 500))
      .mockResolvedValueOnce(json({ items: "not-an-array", serverTime: null })));

    await expect(getTaskRunPanel()).rejects.toThrow("작업 목록을 불러오지 못했습니다.");
    await expect(getTaskRunPanel()).rejects.toThrow("작업 목록을 불러오지 못했습니다.");
  });

  test("loads one-based recent history as a zero-based Spring page", async () => {
    const taskRun = {
      runId: "task-run-1",
      taskType: "SETTLEMENT_CALCULATION",
      triggerType: "ADMIN_TRIGGERED",
      status: "SUCCEEDED",
      currentStep: null,
      progressMessage: "신규 1건",
      totalCount: 1,
      processedCount: 1,
      succeededCount: 1,
      failedCount: 0,
      skippedCount: 0,
      progressPercent: 100,
      startedBy: { adminId: 7, name: null },
      startedAt: null,
      finishedAt: "2026-08-24T00:00:00Z",
    };
    const page = {
      content: [taskRun],
      number: 2,
      size: 20,
      totalElements: 41,
      totalPages: 3,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(page)));
    const controller = new AbortController();

    await expect(getRecentTaskRuns(3, controller.signal)).resolves.toEqual(page);

    const [request, init] = vi.mocked(fetch).mock.calls[0];
    const url = new URL(String(request));
    expect(url.pathname).toBe("/api/admin/task-runs/recent");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("size")).toBe("20");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer admin.jwt");
    expect(init?.signal).toBe(controller.signal);
  });

  test.each([
    ["content", { content: null, number: 0, size: 20, totalElements: 0, totalPages: 0 }],
    ["number", { content: [], number: -1, size: 20, totalElements: 0, totalPages: 0 }],
    ["size", { content: [], number: 0, size: "20", totalElements: 0, totalPages: 0 }],
    ["totalElements", { content: [], number: 0, size: 20, totalElements: 0.5, totalPages: 0 }],
    ["totalPages", { content: [], number: 0, size: 20, totalElements: 0, totalPages: null }],
  ])("rejects malformed recent page field %s", async (_field, page) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(page)));

    await expect(getRecentTaskRuns(1)).rejects.toThrow(
      "작업 실행 이력을 불러오지 못했습니다.",
    );
  });

  test("rejects an unsuccessful or malformed recent history envelope", async () => {
    const validPage = {
      content: [], number: 0, size: 20, totalElements: 0, totalPages: 0,
    };
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(json(null, 500))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: "true",
        message: null,
        data: validPage,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("not-json", { status: 200 })));

    await expect(getRecentTaskRuns(1)).rejects.toThrow(
      "작업 목록을 불러오지 못했습니다.",
    );
    await expect(getRecentTaskRuns(1)).rejects.toThrow(
      "작업 실행 이력을 불러오지 못했습니다.",
    );
    await expect(getRecentTaskRuns(1)).rejects.toThrow(
      "작업 실행 이력을 불러오지 못했습니다.",
    );
  });
});
