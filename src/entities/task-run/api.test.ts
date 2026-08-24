import { getTaskRunPanel } from "./api";

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
});
