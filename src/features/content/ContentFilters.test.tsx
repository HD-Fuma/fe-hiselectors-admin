import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

describe("content review filter behavior", () => {
  test("applies keyword, review type, and platform filters and resets them", async () => {
    const { router } = renderRoute("/content/reviews");
    const search = screen.getByRole("search", { name: "검색 조건" });

    expect(screen.getByText("총 50건")).toBeInTheDocument();
    expect(screen.getByText("1 / 3 페이지")).toBeInTheDocument();

    fireEvent.change(within(search).getByRole("textbox", { name: "콘텐츠/작성자" }), {
      target: { value: "CT-001" },
    });
    fireEvent.change(within(search).getByRole("combobox", { name: "검수 유형" }), {
      target: { value: "신규 콘텐츠" },
    });
    fireEvent.change(within(search).getByRole("combobox", { name: "플랫폼" }), {
      target: { value: "YouTube" },
    });
    fireEvent.click(within(search).getByRole("button", { name: "조회" }));

    expect(screen.getByText("총 1건")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: /김서연 7일 입어본 가을 골프웨어 솔직 리뷰 검수 상세 보기/,
    })).toBeInTheDocument();
    expect(router.state.location.search).toContain("q=CT-001");
    expect(router.state.location.search).toContain("reviewType=");
    expect(router.state.location.search).toContain("platform=YouTube");

    const filteredSearch = screen.getByRole("search", { name: "검색 조건" });
    fireEvent.click(within(filteredSearch).getByRole("button", { name: "초기화" }));

    await waitFor(() => expect(screen.getByText("총 50건")).toBeInTheDocument());
    const resetSearch = screen.getByRole("search", { name: "검색 조건" });
    expect(within(resetSearch).getByRole("textbox", { name: "콘텐츠/작성자" })).toHaveValue("");
    expect(within(resetSearch).getByRole("combobox", { name: "검수 유형" })).toHaveValue("");
    expect(within(resetSearch).getByRole("combobox", { name: "플랫폼" })).toHaveValue("");
  });

  test("applies each review select independently", async () => {
    renderRoute("/content/reviews");
    let search = screen.getByRole("search", { name: "검색 조건" });

    fireEvent.change(within(search).getByRole("combobox", { name: "검수 유형" }), {
      target: { value: "위반 수정본" },
    });
    fireEvent.click(within(search).getByRole("button", { name: "조회" }));
    expect(screen.getByText("총 5건")).toBeInTheDocument();

    search = screen.getByRole("search", { name: "검색 조건" });
    fireEvent.click(within(search).getByRole("button", { name: "초기화" }));
    await waitFor(() => expect(screen.getByText("총 50건")).toBeInTheDocument());

    search = screen.getByRole("search", { name: "검색 조건" });
    fireEvent.change(within(search).getByRole("combobox", { name: "플랫폼" }), {
      target: { value: "YouTube" },
    });
    fireEvent.click(within(search).getByRole("button", { name: "조회" }));

    expect(screen.getByText("총 23건")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Instagram 플랫폼" })).not.toBeInTheDocument();
  });

  test("resets paging for data filters while preserving the selected view", () => {
    const { router } = renderRoute("/content/reviews");

    fireEvent.click(screen.getByRole("button", { name: "목록" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
    expect(screen.getByText("2 / 3 페이지")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "위반 항목만" }));
    expect(screen.getByText(/1 \/ \d+ 페이지/)).toBeInTheDocument();
    expect(screen.getByText("총 17건")).toBeInTheDocument();
    expect(screen.queryByText("ct-001")).not.toBeInTheDocument();
    expect(router.state.location.search).not.toContain("page=");

    fireEvent.click(screen.getByRole("button", { name: "검수 완료" }));
    expect(screen.getByRole("button", { name: "검수 완료" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText("ct-002")).not.toBeInTheDocument();
    expect(screen.getByText("총 0건")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    fireEvent.click(within(search).getByRole("button", { name: "초기화" }));

    expect(screen.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("checkbox", { name: "위반 항목만" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "목록" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("region", { name: "수집 콘텐츠 리스트" })).toBeInTheDocument();
    expect(screen.getByText("1 / 3 페이지")).toBeInTheDocument();
    expect(router.state.location.search).toBe("?view=list");
  });
});
