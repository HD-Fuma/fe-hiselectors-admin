import { runCreatorDiscovery } from "./api";

const TASK_RUN = {
  runId: "creator-sync-1",
  taskType: "CREATOR_SYNC",
  triggerType: "ADMIN_TRIGGERED",
  status: "QUEUED",
  currentStep: null,
  progressMessage: null,
  totalCount: null,
  processedCount: 0,
  succeededCount: 0,
  failedCount: 0,
  skippedCount: 0,
  progressPercent: null,
  startedBy: { adminId: 1, name: "관리자" },
  startedAt: null,
  finishedAt: null,
};

function json(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  });
}

describe("creator discovery api", () => {
  beforeEach(() => {
    localStorage.setItem("selectors-auth", JSON.stringify({
      accessToken: "admin.jwt",
      tokenType: "Bearer",
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  test.each([
    { currentMonthOnly: false, mode: "normal", test: false, search: "" },
    { currentMonthOnly: false, mode: "test", test: true, search: "?test=true" },
    { currentMonthOnly: true, mode: "current-month", test: false, search: "?currentMonthOnly=true" },
    { currentMonthOnly: true, mode: "test current-month", test: true, search: "?test=true&currentMonthOnly=true" },
  ])("runs one $mode YouTube discovery task with an idempotency key", async ({ currentMonthOnly, test, search }) => {
    const idempotencyKey = test
      ? "00000000-0000-4000-8000-000000000002"
      : "00000000-0000-4000-8000-000000000001";
    vi.spyOn(crypto, "randomUUID").mockReturnValue(idempotencyKey);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(TASK_RUN)));

    await expect(runCreatorDiscovery(test, currentMonthOnly)).resolves.toEqual(TASK_RUN);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [input, init] = vi.mocked(fetch).mock.calls[0];
    const url = new URL(String(input));
    expect(url.pathname).toBe("/api/admin/discovery/youtube/run");
    expect(url.search).toBe(search);
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer admin.jwt");
    expect(new Headers(init?.headers).get("Idempotency-Key")).toBe(idempotencyKey);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });
});
