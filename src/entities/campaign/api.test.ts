import { createCampaign, deleteCampaign, getCampaigns, uploadCampaignThumbnail } from "./api";

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

  test("uploads a campaign thumbnail as authorized multipart data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      code: "OK",
      message: null,
      data: { url: "https://media.example.com/campaigns/thumb.webp" },
    }), { status: 201 })));
    const file = new File(["thumbnail"], "campaign.webp", { type: "image/webp" });

    await expect(uploadCampaignThumbnail(file)).resolves.toEqual({
      url: "https://media.example.com/campaigns/thumb.webp",
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/admin/uploads/campaign-thumbnails");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token");
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get("file")).toBe(file);
  });

  test("uses the backend message on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "종료된 캠페인만 삭제할 수 있습니다." }), { status: 409 })));
    await expect(deleteCampaign(1)).rejects.toThrow("종료된 캠페인만 삭제할 수 있습니다.");
  });
});
