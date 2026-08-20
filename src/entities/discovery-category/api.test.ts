import {
  createDiscoveryCategory,
  createDiscoveryKeyword,
  deleteDiscoveryCategory,
  deleteDiscoveryKeyword,
  getDiscoveryCategories,
  updateDiscoveryCategory,
  updateDiscoveryKeyword,
} from "./api";

const keyword = { id: 10, keyword: "데일리룩", enabled: true, priority: 5, lastRunAt: null };
const category = { id: 1, code: "FASHION", name: "패션", displayOrder: 1, enabled: true, keywords: [keyword] };

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, code: "OK", message: null, data }), { status });
}

describe("discovery category admin api", () => {
  beforeEach(() => {
    localStorage.setItem("selectors-auth", JSON.stringify({ accessToken: "token", tokenType: "Bearer" }));
  });

  test("uses the category and nested keyword CRUD contracts", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(ok([category]))
      .mockResolvedValueOnce(ok(category, 201))
      .mockResolvedValueOnce(ok(category))
      .mockResolvedValueOnce(ok({ keyword, warnings: [] }, 201))
      .mockResolvedValueOnce(ok(keyword))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })));

    await getDiscoveryCategories();
    await createDiscoveryCategory({ code: "FASHION", name: "패션", displayOrder: 1 });
    await updateDiscoveryCategory(1, { name: "패션", displayOrder: 2, enabled: false });
    await createDiscoveryKeyword(1, { keyword: "데일리룩", priority: 5 });
    await updateDiscoveryKeyword(1, 10, { enabled: false, priority: 3 });
    await deleteDiscoveryKeyword(1, 10);
    await deleteDiscoveryCategory(1);

    const calls = vi.mocked(fetch).mock.calls;
    expect(calls.map(([url]) => String(url))).toEqual([
      "https://api.hiselectors.shop/api/admin/categories",
      "https://api.hiselectors.shop/api/admin/categories",
      "https://api.hiselectors.shop/api/admin/categories/1",
      "https://api.hiselectors.shop/api/admin/categories/1/keywords",
      "https://api.hiselectors.shop/api/admin/categories/1/keywords/10",
      "https://api.hiselectors.shop/api/admin/categories/1/keywords/10",
      "https://api.hiselectors.shop/api/admin/categories/1",
    ]);
    expect(calls.map(([, init]) => init?.method ?? "GET")).toEqual([
      "GET", "POST", "PATCH", "POST", "PATCH", "DELETE", "DELETE",
    ]);
    expect(new Headers(calls[1][1]?.headers).get("Authorization")).toBe("Bearer token");
  });

  test("shows the backend error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "사용 중인 카테고리는 삭제할 수 없습니다." }), { status: 409 }),
    ));

    await expect(deleteDiscoveryCategory(1)).rejects.toThrow("사용 중인 카테고리는 삭제할 수 없습니다.");
  });
});
