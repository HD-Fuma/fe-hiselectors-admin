import { createCampaign, deleteCampaign, getCampaigns } from "./api";

describe("campaign admin api", () => {
  beforeEach(() => {
    localStorage.setItem("selectors-auth", JSON.stringify({ accessToken: "token", tokenType: "Bearer" }));
  });

  test("serializes list filters and sends the stored authorization", async () => {
    const page = { content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, code: "OK", message: null, data: page }), { status: 200 })));

    await expect(getCampaigns({ keyword: "여름", status: "ACTIVE", startDate: "2026-08-01", endDate: "2026-08-31", page: 0, size: 20 })).resolves.toEqual(page);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("keyword=%EC%97%AC%EB%A6%84");
    expect(String(url)).toContain("status=ACTIVE");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token");
  });

  test("posts the complete editor payload and accepts an empty delete response", async () => {
    const body = { title: "캠페인", description: "설명", startDate: "2026-08-01", endDate: "2026-08-31", thumbnailUrl: null, productIds: [1] };
    const campaign = { id: 1, ...body, status: "ACTIVE", products: [], createdAt: "", updatedAt: "" };
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, code: "OK", message: null, data: campaign }), { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })));

    await expect(createCampaign(body)).resolves.toEqual(campaign);
    await deleteCampaign(1);

    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ method: "POST", body: JSON.stringify(body) });
    expect(vi.mocked(fetch).mock.calls[1][1]).toMatchObject({ method: "DELETE" });
  });

  test("uses the backend message on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "시작 전 캠페인만 삭제할 수 있습니다." }), { status: 409 })));
    await expect(deleteCampaign(1)).rejects.toThrow("시작 전 캠페인만 삭제할 수 있습니다.");
  });
});
