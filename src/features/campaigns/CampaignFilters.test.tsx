import { fireEvent, screen, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

describe("campaign filter behavior", () => {
  test("filters by query, status, and date and restores the full list", () => {
    renderRoute("/campaigns");
    const search = screen.getByRole("search", { name: "검색 조건" });
    const results = screen.getByRole("region", { name: "캠페인 목록" });

    fireEvent.change(within(search).getByRole("textbox", { name: "검색어" }), {
      target: { value: "cp-003" },
    });
    fireEvent.keyDown(within(search).getByRole("textbox", { name: "검색어" }), {
      key: "Enter",
    });
    expect(within(results).getByText("cp-003")).toBeInTheDocument();
    expect(within(results).queryByText("cp-001")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "종료" }));
    expect(screen.getByText("총 1건")).toBeInTheDocument();

    fireEvent.click(within(search).getByRole("button", { name: "초기화" }));
    expect(screen.getByText("총 3건")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "종료" }));
    expect(screen.getByText("총 1건")).toBeInTheDocument();
    expect(within(results).getByText("cp-003")).toBeInTheDocument();
    expect(within(results).queryByText("cp-002")).not.toBeInTheDocument();
    fireEvent.click(within(search).getByRole("button", { name: "초기화" }));

    fireEvent.change(within(search).getByLabelText("진행 시작일"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.change(within(search).getByLabelText("진행 종료일"), {
      target: { value: "2026-07-31" },
    });
    fireEvent.click(within(search).getByRole("button", { name: "조회" }));

    expect(screen.getByText("총 1건")).toBeInTheDocument();
    expect(within(results).getByText("cp-002")).toBeInTheDocument();
    expect(within(results).queryByText("cp-003")).not.toBeInTheDocument();
    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();

    fireEvent.click(within(search).getByRole("button", { name: "초기화" }));
    expect(within(search).getByLabelText("진행 시작일")).toHaveValue("");
    expect(within(search).getByLabelText("진행 종료일")).toHaveValue("");
    expect(screen.getByText("총 3건")).toBeInTheDocument();
  });

  test("switches the campaign detail dataset with its tabs", () => {
    renderRoute("/campaigns/cp-001");
    const detail = screen.getByRole("dialog", { name: "캠페인 상세" });

    expect(within(detail).getByRole("region", { name: "참여 셀렉터스" })).toBeInTheDocument();
    expect(within(detail).queryByRole("region", { name: "포함 상품" })).not.toBeInTheDocument();

    fireEvent.click(within(detail).getByRole("button", { name: "포함 상품" }));

    expect(within(detail).getByRole("region", { name: "포함 상품" })).toBeInTheDocument();
    expect(within(detail).queryByRole("region", { name: "참여 셀렉터스" })).not.toBeInTheDocument();
  });

  test("filters the product picker without losing hidden selections", () => {
    renderRoute("/campaigns/new?fixture=product-modal");
    const dialog = screen.getByRole("dialog", { name: "해당 상품 선택", hidden: true });
    const productList = within(dialog).getByRole("region", { name: "상품 목록", hidden: true });
    const query = within(dialog).getByRole("textbox", { name: "상품 검색", hidden: true });

    fireEvent.click(within(dialog).getByRole("checkbox", {
      name: /남성 사이드 로고 스트레치 패딩 자켓.*선택/,
      hidden: true,
    }));
    fireEvent.change(query, { target: { value: "2200089867" } });

    expect(within(dialog).getByText("총 1개 상품")).toBeInTheDocument();
    expect(within(productList).getByText("2200089867")).toBeInTheDocument();
    expect(within(productList).queryByText("2200098405")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", {
      name: "선택 완료 (1)",
      hidden: true,
    })).toBeInTheDocument();
  });
});
