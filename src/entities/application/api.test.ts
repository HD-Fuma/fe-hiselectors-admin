import {
  createAdminApplicationTest,
  getAdminApplication,
  getAdminApplications,
  updateAdminApplicationStatus,
} from "./api";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify({
    success: status < 400,
    code: status < 400 ? "OK" : "ERROR",
    message: status < 400 ? null : "지원자를 찾을 수 없습니다.",
    data: status < 400 ? data : null,
  }), { status, headers: { "Content-Type": "application/json" } });
}

describe("application admin api", () => {
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

  test("serializes list filters and sends the stored authorization", async () => {
    const page = { content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(page)));

    await expect(getAdminApplications({
      keyword: "홍길동",
      snsCode: "INSTAGRAM",
      status: "PENDING",
      generationId: 3,
      minimumCriteriaOnly: true,
      page: 0,
      size: 20,
    })).resolves.toEqual(page);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("keyword=%ED%99%8D%EA%B8%B8%EB%8F%99");
    expect(String(url)).toContain("snsCode=INSTAGRAM");
    expect(String(url)).toContain("status=PENDING");
    expect(String(url)).toContain("generationId=3");
    expect(String(url)).toContain("minimumCriteriaOnly=true");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer admin.jwt");
  });

  test("loads detail and surfaces the backend error message", async () => {
    const detail = { id: 7, applicantName: "지원자", metrics: {}, contents: [] };
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(json(detail))
      .mockResolvedValueOnce(json(null, 404)));

    await expect(getAdminApplication(7)).resolves.toEqual(detail);
    await expect(getAdminApplication(404)).rejects.toThrow("지원자를 찾을 수 없습니다.");
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/\/api\/admin\/applications\/7$/);
  });

  test("updates a pending application status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ id: 7, status: "APPROVED" })));

    await expect(updateAdminApplicationStatus(7, "APPROVED"))
      .resolves.toEqual({ id: 7, status: "APPROVED" });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toMatch(/\/api\/admin\/applications\/7\/status$/);
    expect(init).toEqual(expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ status: "APPROVED" }),
    }));
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer admin.jwt");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });

  test("creates a test application from a profile URL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ id: 41 })));

    await expect(createAdminApplicationTest("https://www.instagram.com/test.account"))
      .resolves.toEqual({ id: 41 });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toMatch(/\/api\/admin\/applications\/test$/);
    expect(init).toEqual(expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ profileUrl: "https://www.instagram.com/test.account" }),
    }));
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer admin.jwt");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });
});
