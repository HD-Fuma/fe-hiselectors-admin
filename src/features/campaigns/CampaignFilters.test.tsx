import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

const campaign = {
  id: 3, status: "ENDED", title: "초여름 패션 리뷰", description: "캠페인 설명",
  startDate: "2026-05-01", endDate: "2026-06-30", thumbnailUrl: null,
  productIds: [10], products: [{ id: 10, code: "P-10", productName: "골프 재킷", brandName: "브랜드", category: "골프", regularPrice: 10000, salePrice: 9000, status: "ON_SALE", thumbnailUrl: null, detailUrl: null }],
  createdAt: "2026-01-01T00:00:00", updatedAt: "2026-01-01T00:00:00",
};

function json(data: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify({ success: true, code: "OK", message: null, data }), { status, headers: { "Content-Type": "application/json" } }));
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/participants")) return json({ content: [{ selectorId: 7, nickname: "셀렉터", platform: "INSTAGRAM", accountId: "selector", followerCount: 100 }], number: 0, size: 20, totalElements: 1, totalPages: 1 });
    if (url.includes("/api/admin/products")) return json({ content: campaign.products, number: 0, size: 20, totalElements: 1, totalPages: 1 });
    if (/\/campaigns\/3(?:\?|$)/.test(url)) return json(campaign);
    return json({ content: [campaign], number: 0, size: 20, totalElements: 1, totalPages: 1 });
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
    await waitFor(() => expect(within(results).getByText("초여름 패션 리뷰")).toBeInTheDocument());

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

  test("switches the campaign detail dataset with its tabs", async () => {
    renderRoute("/campaigns/3");
    const detail = await screen.findByRole("dialog", { name: "캠페인 상세" });

    expect(await within(detail).findByRole("region", { name: "참여 셀렉터스" })).toBeInTheDocument();
    expect(within(detail).queryByRole("region", { name: "포함 상품" })).not.toBeInTheDocument();

    fireEvent.click(within(detail).getByRole("button", { name: "포함 상품" }));

    expect(within(detail).getByRole("region", { name: "포함 상품" })).toBeInTheDocument();
    expect(within(detail).queryByRole("region", { name: "참여 셀렉터스" })).not.toBeInTheDocument();
  });

  test("filters the product picker without losing hidden selections", async () => {
    renderRoute("/campaigns/new");
    const editor = await screen.findByRole("dialog", { name: "새 캠페인 생성" });
    fireEvent.click(within(editor).getByRole("button", { name: "상품 선택" }));
    const dialog = await screen.findByRole("dialog", { name: "해당 상품 선택", hidden: true });
    const productList = within(dialog).getByRole("region", { name: "상품 목록", hidden: true });
    const query = within(dialog).getByRole("textbox", { name: "상품 검색", hidden: true });

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
});
