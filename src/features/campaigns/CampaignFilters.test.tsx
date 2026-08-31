import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

const campaign = {
  id: 3, status: "ENDED", title: "초여름 패션 리뷰", description: "캠페인 설명",
  startDate: "2026-05-01", endDate: "2026-06-30", thumbnailUrl: null,
  productIds: [10], products: [{ id: 10, code: "P-10", productName: "골프 재킷", brandName: "브랜드", category: "골프", regularPrice: 10000, salePrice: 9000, status: "ON_SALE", thumbnailUrl: null, detailUrl: null }],
  createdAt: "2026-01-01T00:00:00", updatedAt: "2026-01-01T00:00:00",
};
let campaignStatus: "SCHEDULED" | "ACTIVE" | "ENDED" = "ENDED";

const campaignWithThumbnail = {
  ...campaign,
  thumbnailUrl: "https://media.example.com/campaigns/existing.webp",
};

function json(data: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify({ success: true, code: "OK", message: null, data }), { status, headers: { "Content-Type": "application/json" } }));
}

beforeEach(() => {
  campaignStatus = "ENDED";
  const objectUrls = ["blob:first", "blob:second", "blob:third"];
  let objectUrlIndex = 0;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => objectUrls[objectUrlIndex++] ?? `blob:${objectUrlIndex}`),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/admin/uploads/campaign-thumbnails")) {
      return json({ url: "https://media.example.com/campaigns/uploaded.webp" }, 201);
    }
    if (url.endsWith("/api/admin/campaigns") && init?.method === "POST") {
      return json({ ...campaign, thumbnailUrl: "https://media.example.com/campaigns/uploaded.webp" }, 201);
    }
    if (url.includes("/api/admin/selector-matching")) return json([]);
    if (url.includes("/participants")) return json({ content: [{ selectorId: 7, nickname: "셀렉터", platform: "INSTAGRAM", accountId: "selector", followerCount: 100 }], number: 0, size: 20, totalElements: 1, totalPages: 1 });
    if (url.includes("/api/admin/products")) return json({ content: campaign.products, number: 0, size: 20, totalElements: 1, totalPages: 1 });
    if (/\/campaigns\/3(?:\?|$)/.test(url)) return json({ ...campaign, status: campaignStatus });
    return json({ content: [{ ...campaign, status: campaignStatus }], number: 0, size: 20, totalElements: 1, totalPages: 1 });
  }));
});

describe("campaign filter behavior", () => {
  test("requests the server with query, status, and date filters", async () => {
    renderRoute("/campaigns");
    const search = await screen.findByRole("search", { name: "검색 조건" });
    const results = screen.getByRole("region", { name: "캠페인 목록" });

    fireEvent.change(within(search).getByRole("textbox", { name: "검색어" }), {
      target: { value: "초여름" },
    });
    fireEvent.keyDown(within(search).getByRole("textbox", { name: "검색어" }), {
      key: "Enter",
    });
    await waitFor(() => expect(within(results).getByRole("button", {
      name: "초여름 패션 리뷰 캠페인 상세 보기",
    })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "종료" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("status=ENDED"), expect.anything()));

    fireEvent.click(within(search).getByRole("button", { name: "초기화" }));
    expect(screen.getByText("총 1건")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.change(within(search).getByLabelText("진행 시작일"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.change(within(search).getByLabelText("진행 종료일"), {
      target: { value: "2026-07-31" },
    });
    fireEvent.click(within(search).getByRole("button", { name: "조회" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/startDate=2026-07-01.*endDate=2026-07-31/), expect.anything()));
    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();

    fireEvent.click(within(search).getByRole("button", { name: "초기화" }));
    expect(within(search).getByLabelText("진행 시작일")).toHaveValue("");
    expect(within(search).getByLabelText("진행 종료일")).toHaveValue("");
    expect(screen.getByText("총 1건")).toBeInTheDocument();
  });

  test("uses the shared content collection card and view toggle", async () => {
    renderRoute("/campaigns");
    const results = await screen.findByRole("region", { name: "캠페인 목록" });
    const card = await within(results).findByRole("button", {
      name: "초여름 패션 리뷰 캠페인 상세 보기",
    });

    expect(card).toHaveClass("fuma-campaign-card");
    expect(card).toHaveAttribute("data-content-format", "instagram-image");
    expect(card.querySelector(".fuma-campaign-card__status")).toBeInTheDocument();
    expect(card.querySelector(".fuma-campaign-card__overlay")).toBeInTheDocument();
    expect(card.querySelector(".fuma-content-collection__media")?.contains(
      card.querySelector(".fuma-campaign-card__status"),
    )).toBe(true);
    expect(card.querySelector(".fuma-content-collection__media")?.contains(
      card.querySelector(".fuma-campaign-card__period"),
    )).toBe(true);
    expect(within(card).queryByText("캠페인")).not.toBeInTheDocument();
    expect(within(card).queryByText("ID 3")).not.toBeInTheDocument();
    expect(card.querySelector(".fuma-content-collection__copy")).not.toBeInTheDocument();
    expect(card.querySelector(".fuma-content-collection__meta")).not.toBeInTheDocument();

    const viewToggle = screen.getByRole("switch", { name: "보기 방식" });
    fireEvent.click(viewToggle);
    expect(within(results).getByRole("region", { name: "캠페인 리스트" })).toBeInTheDocument();

    fireEvent.click(viewToggle);
    const restoredCard = await within(results).findByRole("button", {
      name: "초여름 패션 리뷰 캠페인 상세 보기",
    });
    expect(restoredCard).toBe(card);
    fireEvent.click(restoredCard);

    expect(await screen.findByRole("dialog", { name: "캠페인 상세" })).toBeInTheDocument();
  });

  test("shows included products above participants without detail tabs", async () => {
    renderRoute("/campaigns/3");
    const detail = await screen.findByRole("dialog", { name: "캠페인 상세" });

    const productList = within(detail).getByRole("region", { name: "포함 상품" });
    const participantList = await within(detail).findByRole("region", { name: "참여 셀렉터스" });
    expect(productList).toBeInTheDocument();
    expect(participantList).toBeInTheDocument();
    expect(within(productList).getByRole("img", { name: "골프 재킷 썸네일" })).toBeInTheDocument();
    expect(productList.compareDocumentPosition(participantList) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(detail).queryByRole("button", { name: "포함 상품" })).not.toBeInTheDocument();
  });

  test.each([
    ["SCHEDULED", true],
    ["ACTIVE", false],
    ["ENDED", false],
  ] as const)("allows deletion only for %s campaigns", async (status, canDelete) => {
    campaignStatus = status;
    renderRoute("/campaigns/3");
    const detail = await screen.findByRole("dialog", { name: "캠페인 상세" });

    if (!canDelete) {
      expect(within(detail).queryByRole("button", { name: "삭제" })).not.toBeInTheDocument();
      return;
    }

    fireEvent.click(within(detail).getByRole("button", { name: "삭제" }));
    const confirmation = await screen.findByRole("alertdialog", { name: "캠페인 삭제" });
    expect(within(confirmation).getByText("시작 전 캠페인을 삭제할까요? 삭제 후 목록에서 보이지 않습니다.")).toBeInTheDocument();
  });

  test("reveals products by ten and appends participants by twenty", async () => {
    const products = Array.from({ length: 11 }, (_, index) => ({
      ...campaign.products[0],
      id: index + 1,
      code: `P-${index + 1}`,
      productName: `상품 ${index + 1}`,
    }));
    const participantRows = Array.from({ length: 21 }, (_, index) => ({
      selectorId: index + 1,
      nickname: `셀렉터 ${index + 1}`,
      platform: "INSTAGRAM",
      accountId: `selector-${index + 1}`,
      followerCount: 100,
    }));
    const expandedCampaign = { ...campaign, productIds: products.map(({ id }) => id), products };
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/admin/selector-matching")) return json([]);
      if (url.includes("/participants")) {
        const page = Number(new URL(url, "http://localhost").searchParams.get("page") ?? 0);
        return json({
          content: page === 0 ? participantRows.slice(0, 20) : participantRows.slice(20),
          number: page,
          size: 20,
          totalElements: 21,
          totalPages: 2,
        });
      }
      if (/\/campaigns\/3(?:\?|$)/.test(url)) return json(expandedCampaign);
      return json({ content: [expandedCampaign], number: 0, size: 20, totalElements: 1, totalPages: 1 });
    });

    renderRoute("/campaigns/3");
    const detail = await screen.findByRole("dialog", { name: "캠페인 상세" });
    const productList = within(detail).getByRole("region", { name: "포함 상품" });
    const participantList = await within(detail).findByRole("region", { name: "참여 셀렉터스" });

    expect(within(productList).queryByText("상품 11")).not.toBeInTheDocument();
    fireEvent.click(within(detail).getByRole("button", { name: "포함 상품 더보기" }));
    expect(within(productList).getByText("상품 11")).toBeInTheDocument();

    expect(within(participantList).queryByText("셀렉터 21")).not.toBeInTheDocument();
    fireEvent.click(within(detail).getByRole("button", { name: "참여 셀렉터스 더보기" }));
    expect(await within(participantList).findByText("셀렉터 21")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("page=1&size=20"), expect.anything());
  });

  test("transitions from campaign detail to editing without replaying the panel animation", async () => {
    renderRoute("/campaigns/3");
    const detail = await screen.findByRole("dialog", { name: "캠페인 상세" });

    fireEvent.click(within(detail).getByRole("link", { name: "캠페인 수정" }));

    const editor = await screen.findByRole("dialog", { name: "캠페인 수정" });
    expect(editor).toHaveAttribute("data-entry-animation", "false");
    expect(within(editor).getByRole("textbox", { name: "캠페인명" })).toHaveValue(campaign.title);
  });

  test("keeps the campaign list mounted while the create panel opens and closes", async () => {
    renderRoute("/campaigns");
    const campaignList = await screen.findByRole("region", { name: "캠페인 목록" });

    fireEvent.click(screen.getByRole("link", { name: "캠페인 생성" }));
    const editor = await screen.findByRole("dialog", { name: "새 캠페인 생성" });
    expect(screen.getByRole("region", { name: "캠페인 목록", hidden: true })).toBe(campaignList);

    fireEvent.click(within(editor).getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "새 캠페인 생성" })).not.toBeInTheDocument());
    expect(screen.getByRole("region", { name: "캠페인 목록" })).toBe(campaignList);
  });

  test("filters the product picker without losing hidden selections", async () => {
    renderRoute("/campaigns/new");
    const editor = await screen.findByRole("dialog", { name: "새 캠페인 생성" });
    expect(editor).toHaveAttribute("data-visual-contract", "detail-side-panel");
    expect(within(editor).getByText("1:1 비율 권장")).toBeInTheDocument();
    fireEvent.click(within(editor).getByRole("button", { name: "상품 선택" }));
    const dialog = await screen.findByRole("dialog", { name: "해당 상품 선택", hidden: true });
    const productList = within(dialog).getByRole("region", { name: "상품 목록", hidden: true });
    const query = within(dialog).getByRole("textbox", { name: "상품 검색", hidden: true });

    expect(within(productList).getByRole("img", { name: "골프 재킷 썸네일", hidden: true })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("checkbox", {
      name: /골프 재킷.*선택/,
      hidden: true,
    }));
    fireEvent.change(query, { target: { value: "P-10" } });
    fireEvent.keyDown(query, { key: "Enter" });

    expect(within(dialog).getByText("총 1개 상품")).toBeInTheDocument();
    expect(within(productList).getByText("P-10")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", {
      name: "선택 완료 (1)",
      hidden: true,
    })).toBeInTheDocument();
  });

  test("uploads a selected thumbnail before creating the campaign", async () => {
    renderRoute("/campaigns/new");
    const editor = await screen.findByRole("dialog", { name: "새 캠페인 생성" });
    const campaignList = screen.getByRole("region", { name: "캠페인 목록", hidden: true });
    const thumbnail = new File(["thumbnail"], "summer.png", { type: "image/png" });

    fireEvent.change(within(editor).getByLabelText("캠페인 썸네일 파일"), {
      target: { files: [thumbnail] },
    });
    expect(within(editor).getByRole("img", { name: "선택한 캠페인 썸네일 미리보기" })).toHaveAttribute(
      "src",
      "blob:first",
    );
    expect(within(editor).getByText("summer.png")).toBeInTheDocument();

    fireEvent.change(within(editor).getByRole("textbox", { name: "캠페인명" }), {
      target: { value: "여름 캠페인" },
    });
    fireEvent.change(within(editor).getByRole("textbox", { name: "설명" }), {
      target: { value: "여름 캠페인 설명" },
    });
    fireEvent.change(within(editor).getByLabelText("시작일"), {
      target: { value: "2026-08-01" },
    });
    fireEvent.change(within(editor).getByLabelText("종료일"), {
      target: { value: "2026-08-31" },
    });
    fireEvent.click(within(editor).getByRole("button", { name: "캠페인 생성" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/uploads/campaign-thumbnails"),
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    ));
    await waitFor(() => {
      const createCall = vi.mocked(fetch).mock.calls.find(([input, init]) =>
        String(input).endsWith("/api/admin/campaigns") && init?.method === "POST");
      expect(createCall).toBeDefined();
      expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
        title: "여름 캠페인",
        thumbnailUrl: "https://media.example.com/campaigns/uploaded.webp",
      });
    });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "새 캠페인 생성" })).not.toBeInTheDocument());
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(screen.getByRole("region", { name: "캠페인 목록" })).toBe(campaignList);
  });

  test("keeps the final deletion staged after deleting, selecting, and deleting again", async () => {
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/admin/products")) {
        return json({ content: campaign.products, number: 0, size: 20, totalElements: 1, totalPages: 1 });
      }
      if (/\/campaigns\/3(?:\?|$)/.test(url)) return json(campaignWithThumbnail);
      return json({ content: [campaignWithThumbnail], number: 0, size: 20, totalElements: 1, totalPages: 1 });
    });

    renderRoute("/campaigns/3/edit");
    const editor = await screen.findByRole("dialog", { name: "캠페인 수정" });
    expect(within(editor).getByRole("img", { name: "선택한 캠페인 썸네일 미리보기" })).toHaveAttribute(
      "src",
      campaignWithThumbnail.thumbnailUrl,
    );

    const actions = editor.querySelector<HTMLElement>(".fuma-campaign-thumbnail-upload__actions");
    expect(actions).not.toBeNull();
    if (!actions) throw new Error("thumbnail actions are required");
    expect(within(actions).getByText("이미지 변경")).toBeInTheDocument();
    expect(within(actions).getByRole("button", { name: "캠페인 썸네일 삭제" })).toBeInTheDocument();

    fireEvent.click(within(editor).getByRole("button", { name: "캠페인 썸네일 삭제" }));
    expect(within(editor).getByText("이미지 미선택")).toBeInTheDocument();
    expect(within(editor).queryByRole("img", { name: "선택한 캠페인 썸네일 미리보기" })).not.toBeInTheDocument();

    const input = within(editor).getByLabelText("캠페인 썸네일 파일") as HTMLInputElement;
    const thumbnail = new File(["thumbnail"], "replacement.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [thumbnail] } });
    expect(within(editor).getByRole("img", { name: "선택한 캠페인 썸네일 미리보기" })).toHaveAttribute(
      "src",
      "blob:first",
    );
    fireEvent.click(within(editor).getByRole("button", { name: "캠페인 썸네일 삭제" }));
    expect(within(editor).getByText("이미지 미선택")).toBeInTheDocument();

    fireEvent.click(within(editor).getByRole("button", { name: "저장" }));

    await waitFor(() => {
      const updateCall = vi.mocked(fetch).mock.calls.find(([input, init]) =>
        String(input).endsWith("/api/admin/campaigns/3") && init?.method === "PATCH");
      expect(updateCall).toBeDefined();
      expect(JSON.parse(String(updateCall?.[1]?.body))).toMatchObject({
        thumbnailUrl: null,
        removeThumbnail: true,
      });
    });
    expect(vi.mocked(fetch).mock.calls.filter(([input]) =>
      String(input).includes("/api/admin/uploads/campaign-thumbnails"))).toHaveLength(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
  });

  test("replaces an existing thumbnail and releases local previews in order", async () => {
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/admin/uploads/campaign-thumbnails")) {
        return json({ url: "https://media.example.com/campaigns/replacement.webp" }, 201);
      }
      if (url.includes("/api/admin/products")) {
        return json({ content: campaign.products, number: 0, size: 20, totalElements: 1, totalPages: 1 });
      }
      if (/\/campaigns\/3(?:\?|$)/.test(url)) return json(campaignWithThumbnail);
      return json({ content: [campaignWithThumbnail], number: 0, size: 20, totalElements: 1, totalPages: 1 });
    });

    renderRoute("/campaigns/3/edit");
    const editor = await screen.findByRole("dialog", { name: "캠페인 수정" });
    const input = within(editor).getByLabelText("캠페인 썸네일 파일") as HTMLInputElement;
    const firstThumbnail = new File(["first"], "first.png", { type: "image/png" });
    const secondThumbnail = new File(["second"], "second.webp", { type: "image/webp" });

    fireEvent.change(input, { target: { files: [firstThumbnail] } });
    fireEvent.change(input, { target: { files: [secondThumbnail] } });
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenLastCalledWith("blob:first");
    expect(within(editor).getByRole("img", { name: "선택한 캠페인 썸네일 미리보기" })).toHaveAttribute(
      "src",
      "blob:second",
    );

    fireEvent.click(within(editor).getByRole("button", { name: "저장" }));

    await waitFor(() => {
      const updateCall = vi.mocked(fetch).mock.calls.find(([input, init]) =>
        String(input).endsWith("/api/admin/campaigns/3") && init?.method === "PATCH");
      expect(updateCall).toBeDefined();
      const body = JSON.parse(String(updateCall?.[1]?.body));
      expect(body.thumbnailUrl).toBe("https://media.example.com/campaigns/replacement.webp");
      expect(body).not.toHaveProperty("removeThumbnail");
    });
    const uploadCall = vi.mocked(fetch).mock.calls.find(([input]) =>
      String(input).includes("/api/admin/uploads/campaign-thumbnails"));
    expect((uploadCall?.[1]?.body as FormData).get("file")).toBe(secondThumbnail);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "캠페인 수정" })).not.toBeInTheDocument());
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(vi.mocked(URL.revokeObjectURL).mock.calls.map(([url]) => url)).toEqual([
      "blob:first",
      "blob:second",
    ]);
  });

  test("discards a staged thumbnail deletion when editing is canceled", async () => {
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/admin/products")) {
        return json({ content: campaign.products, number: 0, size: 20, totalElements: 1, totalPages: 1 });
      }
      if (/\/campaigns\/3(?:\?|$)/.test(url)) return json(campaignWithThumbnail);
      return json({ content: [campaignWithThumbnail], number: 0, size: 20, totalElements: 1, totalPages: 1 });
    });

    renderRoute("/campaigns/3/edit");
    const editor = await screen.findByRole("dialog", { name: "캠페인 수정" });
    fireEvent.click(within(editor).getByRole("button", { name: "캠페인 썸네일 삭제" }));
    fireEvent.click(within(editor).getByRole("button", { name: "취소" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "캠페인 수정" })).not.toBeInTheDocument());
    expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);
  });

  test("clears a selected thumbnail and permits selecting the same file again", async () => {
    renderRoute("/campaigns/new");
    const editor = await screen.findByRole("dialog", { name: "새 캠페인 생성" });
    const input = within(editor).getByLabelText("캠페인 썸네일 파일") as HTMLInputElement;
    const thumbnail = new File(["thumbnail"], "summer.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [thumbnail] } });
    fireEvent.click(within(editor).getByRole("button", { name: "캠페인 썸네일 삭제" }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(input).toHaveValue("");
    expect(within(editor).getByText("이미지 미선택")).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [thumbnail] } });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(within(editor).getByText("summer.png")).toBeInTheDocument();
    fireEvent.click(within(editor).getByRole("button", { name: "캠페인 썸네일 삭제" }));

    fireEvent.change(within(editor).getByRole("textbox", { name: "캠페인명" }), {
      target: { value: "여름 캠페인" },
    });
    fireEvent.change(within(editor).getByRole("textbox", { name: "설명" }), {
      target: { value: "여름 캠페인 설명" },
    });
    fireEvent.change(within(editor).getByLabelText("시작일"), {
      target: { value: "2026-08-01" },
    });
    fireEvent.change(within(editor).getByLabelText("종료일"), {
      target: { value: "2026-08-31" },
    });
    fireEvent.click(within(editor).getByRole("button", { name: "캠페인 생성" }));

    await waitFor(() => {
      const createCall = vi.mocked(fetch).mock.calls.find(([input, init]) =>
        String(input).endsWith("/api/admin/campaigns") && init?.method === "POST");
      expect(createCall).toBeDefined();
      const body = JSON.parse(String(createCall?.[1]?.body));
      expect(body.thumbnailUrl).toBeNull();
      expect(body).not.toHaveProperty("removeThumbnail");
    });
    expect(vi.mocked(fetch).mock.calls.filter(([input]) =>
      String(input).includes("/api/admin/uploads/campaign-thumbnails"))).toHaveLength(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(vi.mocked(URL.revokeObjectURL).mock.calls.map(([url]) => url)).toEqual([
      "blob:first",
      "blob:second",
    ]);
  });
});
