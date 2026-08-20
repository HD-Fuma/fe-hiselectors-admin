import { getSelector, getSelectorFilterGenerations, getSelectors } from "./api";

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
    const detail = { id: 7, nickname: "셀렉터", generations: [], snsAccounts: [] };
    const generations = [{ id: 3, generationName: "3기" }];
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(json(detail))
      .mockResolvedValueOnce(json(generations)));

    await expect(getSelector(7)).resolves.toEqual(detail);
    await expect(getSelectorFilterGenerations()).resolves.toEqual(generations);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/\/api\/admin\/selectors\/7$/);
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toMatch(/\/api\/admin\/generations$/);
  });

  test("uses the backend error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: false, message: "셀렉터스를 찾을 수 없습니다." }),
      { status: 404 },
    )));

    await expect(getSelector(404)).rejects.toThrow("셀렉터스를 찾을 수 없습니다.");
  });
});
