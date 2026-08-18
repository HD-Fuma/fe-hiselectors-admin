import { createCampaign, deleteCampaign, getCampaigns } from "./api";

describe("campaign admin api", () => {
  beforeEach(() => {
    localStorage.setItem("selectors-auth", JSON.stringify({ accessToken: "token", tokenType: "Bearer" }));
  });

  test("serializes list filters and sends the stored authorization", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 }), { status: 200 })));

    await getCampaigns({ keyword: "여름", status: "ACTIVE", startDate: "2026-08-01", endDate: "2026-08-31", page: 0, size: 20 });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("keyword=%EC%97%AC%EB%A6%84");
    expect(String(url)).toContain("status=ACTIVE");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token");
  });

  test("posts the complete editor payload and accepts an empty delete response", async () => {
    const body = { title: "캠페인", description: "설명", startDate: "2026-08-01", endDate: "2026-08-31", thumbnailUrl: null, productIds: [1] };
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, ...body, status: "ACTIVE", products: [], createdAt: "", updatedAt: "" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })));

    await createCampaign(body);
    await deleteCampaign(1);

    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ method: "POST", body: JSON.stringify(body) });
    expect(vi.mocked(fetch).mock.calls[1][1]).toMatchObject({ method: "DELETE" });
  });

  test("uses the backend message on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "종료된 캠페인만 삭제할 수 있습니다." }), { status: 409 })));
    await expect(deleteCampaign(1)).rejects.toThrow("종료된 캠페인만 삭제할 수 있습니다.");
  });
});
