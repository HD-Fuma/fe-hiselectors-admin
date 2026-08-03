import { act, fireEvent, screen, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

const FIRST_PRODUCT_NAME =
  "[세인트앤드류스] 남성 사이드 로고 스트레치 패딩 팬츠 811C4PF334BK";
const SECOND_PRODUCT_NAME =
  "[세인트앤드류스] 여성 도트 히든 스트라이프 플리츠 스커트 821C4PN354BK";

function expectColumnHeaders(region: HTMLElement, names: string[]) {
  for (const name of names) {
    expect(within(region).getByRole("columnheader", { name })).toBeInTheDocument();
  }
}

function expectButtonType(scope: HTMLElement, name: string) {
  expect(within(scope).getByRole("button", { name })).toHaveAttribute("type", "button");
}

describe("campaign management list", () => {
  test("renders the filters, deletion rule, and all campaign states in their rows", () => {
    renderRoute("/campaigns");

    expect(screen.getByRole("heading", { name: "캠페인 관리" })).toBeInTheDocument();
    expect(screen.getByText("CP101")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    expect(within(search).getByRole("textbox", { name: "검색어" })).toHaveAttribute(
      "placeholder",
      "캠페인 ID 또는 캠페인명 검색",
    );
    expect(within(search).getByLabelText("시작일")).toHaveAttribute("type", "date");
    expect(within(search).getByLabelText("종료일")).toHaveAttribute("type", "date");

    const status = within(search).getByRole("group", { name: "상태" });
    for (const name of ["전체", "시작 전", "진행 중", "종료"]) {
      expect(within(status).getByRole("button", { name })).toHaveAttribute("type", "button");
    }
    expect(within(status).getByRole("button", { name: "전체" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      within(search).getByRole("combobox", { name: "삭제 가능 여부" }),
    ).toHaveTextContent("전체가능불가");
    expectButtonType(search, "조회");
    expectButtonType(search, "초기화");

    expect(
      screen.getAllByText("종료 일시가 오늘 이후인 캠페인만 삭제할 수 있습니다."),
    ).toHaveLength(2);
    expect(screen.getByText("캠페인 목록", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("총 3건")).toBeInTheDocument();

    const results = screen.getByRole("region", { name: "캠페인 목록" });
    expectColumnHeaders(results, [
      "캠페인 ID",
      "캠페인명",
      "시작일",
      "종료일",
      "상품 수",
      "상태",
      "삭제 가능 여부",
      "삭제 불가 사유",
      "관리",
    ]);

    const autumnRow = within(results).getByRole("row", {
      name: /cp-001 2026 가을 골프웨어 셀렉션/,
    });
    expect(within(autumnRow).getByText("2026-08-10")).toBeInTheDocument();
    expect(within(autumnRow).getByText("2026-09-30")).toBeInTheDocument();
    expect(within(autumnRow).getByText("2")).toBeInTheDocument();
    expect(within(autumnRow).getByText("시작 전")).toHaveClass(
      "hsas-status-pill--pending",
    );
    expect(within(autumnRow).getByText("가능")).toHaveClass(
      "hsas-status-pill--approved",
    );
    expect(within(autumnRow).getByText("-")).toBeInTheDocument();
    expectButtonType(autumnRow, "2026 가을 골프웨어 셀렉션 수정");
    const autumnDelete = within(autumnRow).getByRole("button", {
      name: "2026 가을 골프웨어 셀렉션 삭제",
    });
    expect(autumnDelete).toBeEnabled();
    expect(autumnDelete).toHaveAttribute("type", "button");

    const summerRow = within(results).getByRole("row", {
      name: /cp-002 여름 바캉스 스타일링/,
    });
    expect(within(summerRow).getByText("3")).toBeInTheDocument();
    expect(within(summerRow).getByText("진행 중")).toHaveClass(
      "hsas-status-pill--approved",
    );
    expect(within(summerRow).getByText("가능")).toHaveClass(
      "hsas-status-pill--approved",
    );
    expect(within(summerRow).getByRole("button", { name: "여름 바캉스 스타일링 삭제" }))
      .toBeEnabled();

    const endedRow = within(results).getByRole("row", {
      name: /cp-003 초여름 패션 리뷰/,
    });
    expect(within(endedRow).getByText("종료")).toHaveClass(
      "hsas-status-pill--neutral",
    );
    expect(within(endedRow).getByText("불가")).toHaveClass(
      "hsas-status-pill--rejected",
    );
    expect(
      within(endedRow).getByText(
        "종료 일시가 오늘 이후인 캠페인만 삭제할 수 있습니다.",
      ),
    ).toBeInTheDocument();
    expect(
      within(endedRow).getByRole("button", { name: "초여름 패션 리뷰 삭제" }),
    ).toBeDisabled();

    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
    expect(screen.getByText("페이지당 20개")).toBeInTheDocument();
  });
});

describe("campaign create and edit forms", () => {
  test("renders an empty create form with a selected-product empty state", () => {
    renderRoute("/campaigns/new");

    expect(screen.getByRole("heading", { name: "캠페인 등록" })).toBeInTheDocument();
    expect(screen.getByText("CP102")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "기본 정보" })).toBeInTheDocument();

    const name = screen.getByRole("textbox", { name: "캠페인명" });
    expect(name).toHaveValue("");
    expect(name).toBeRequired();
    expect(name).toHaveAttribute("placeholder", "캠페인명을 입력하세요.");
    expect(screen.getByLabelText("시작일")).toHaveValue("");
    expect(screen.getByLabelText("시작일")).toBeRequired();
    expect(screen.getByLabelText("종료일")).toHaveValue("");
    expect(screen.getByLabelText("종료일")).toBeRequired();
    expect(
      screen.getByText("캠페인 종료 시 셀렉터스 공유 링크 수정이 필요합니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("선택된 상품 0개")).toBeInTheDocument();
    const selectProducts = screen.getByRole("button", { name: "상품 선택" });
    expect(selectProducts).toHaveAttribute("type", "button");
    expect(selectProducts).toHaveAccessibleDescription("필수 항목");

    const products = screen.getByRole("region", { name: "선택 상품" });
    expectColumnHeaders(products, ["상품코드", "상품명", "삭제"]);
    expect(within(products).getByText("선택된 상품이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "상품 선택" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "등록" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "취소" })).toHaveAttribute("type", "button");
  });

  test("renders the populated edit form and derives the selected-product count", () => {
    renderRoute("/campaigns/cp-001/edit");

    expect(screen.getByRole("heading", { name: "캠페인 수정" })).toBeInTheDocument();
    expect(screen.getByText("CP103")).toBeInTheDocument();
    expect(screen.getByText("cp-001")).toBeInTheDocument();
    expect(screen.getByText("시작 전")).toHaveClass("hsas-status-pill--pending");
    expect(screen.getByRole("textbox", { name: "캠페인명" })).toHaveValue(
      "2026 가을 골프웨어 셀렉션",
    );
    expect(screen.getByLabelText("시작일")).toHaveValue("2026-08-10");
    expect(screen.getByLabelText("종료일")).toHaveValue("2026-09-30");
    expect(screen.getByText("선택된 상품 2개")).toBeInTheDocument();

    const products = screen.getByRole("region", { name: "선택 상품" });
    const firstRow = within(products).getByRole("row", { name: /2200098405/ });
    expect(within(firstRow).getByText(FIRST_PRODUCT_NAME)).toBeInTheDocument();
    expectButtonType(firstRow, `${FIRST_PRODUCT_NAME} 삭제`);
    const secondRow = within(products).getByRole("row", { name: /2200089867/ });
    expect(within(secondRow).getByText(SECOND_PRODUCT_NAME)).toBeInTheDocument();
    expectButtonType(secondRow, `${SECOND_PRODUCT_NAME} 삭제`);

    expect(screen.getByRole("button", { name: "저장" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "취소" })).toHaveAttribute("type", "button");
    expect(screen.queryByRole("button", { name: "등록" })).not.toBeInTheDocument();
  });

  test("resets uncontrolled edit fields when the router changes campaign identity", async () => {
    const { router } = renderRoute("/campaigns/cp-001/edit");

    fireEvent.change(screen.getByRole("textbox", { name: "캠페인명" }), {
      target: { value: "사용자 임시 캠페인명" },
    });
    fireEvent.change(screen.getByLabelText("시작일"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.change(screen.getByLabelText("종료일"), {
      target: { value: "2026-01-31" },
    });

    await act(async () => {
      await router.navigate("/campaigns/cp-002/edit");
    });

    expect(screen.getByText("cp-002")).toBeInTheDocument();
    expect(screen.getByText("진행 중")).toHaveClass("hsas-status-pill--approved");
    expect(screen.getByRole("textbox", { name: "캠페인명" })).toHaveValue(
      "여름 바캉스 스타일링",
    );
    expect(screen.getByLabelText("시작일")).toHaveValue("2026-07-15");
    expect(screen.getByLabelText("종료일")).toHaveValue("2026-08-31");
    expect(screen.getByText("선택된 상품 3개")).toBeInTheDocument();
  });

  test("renders a bounded missing state without leaking edit controls", () => {
    renderRoute("/campaigns/missing/edit");

    expect(screen.getByRole("heading", { name: "캠페인 수정" })).toBeInTheDocument();
    expect(screen.getByText("CP103")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "대상을 찾을 수 없습니다" }))
      .toBeInTheDocument();
    expect(
      screen.getByText("요청한 캠페인 정보를 확인할 수 없습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "캠페인명" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "저장" })).not.toBeInTheDocument();
  });
});

describe("campaign product selection fixture", () => {
  test("opens the exact legacy product-search modal from the query fixture", () => {
    renderRoute("/campaigns/new?fixture=product-modal");

    expect(
      screen.getByRole("heading", { name: "캠페인 등록", hidden: true }),
    ).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "상품 선택" });

    expect(within(dialog).getByRole("textbox", { name: "협력사 코드" })).toHaveValue(
      "004502",
    );
    expect(within(dialog).getByRole("textbox", { name: "협력사명" })).toHaveValue(
      "주식회사 현대백화점",
    );
    expect(
      within(dialog).getByRole("textbox", { name: "2차 협력사 코드" }),
    ).toHaveValue("761217");
    expect(
      within(dialog).getByRole("textbox", { name: "2차 협력사명" }),
    ).toHaveValue("(2)경 세인트앤드류스");
    expect(
      within(dialog).getByRole("textbox", { name: "판매상품 코드" }),
    ).toHaveValue("2200098405");
    expect(
      within(dialog).getByRole("textbox", { name: "판매상품명" }),
    ).toHaveValue(FIRST_PRODUCT_NAME);

    for (const name of [
      "상품매체",
      "판매상태",
      "세트상품여부",
      "생방송상품여부",
    ]) {
      expect(within(dialog).getByRole("combobox", { name })).toHaveValue("");
      expect(within(dialog).getByRole("combobox", { name })).toHaveTextContent("전체");
    }
    expect(within(dialog).getByRole("checkbox", { name: "기간(최근일주일)" }))
      .not.toBeChecked();
    expect(within(dialog).getByRole("checkbox", { name: "솔루션 검색" }))
      .not.toBeChecked();
    expectButtonType(dialog, "조회(F4)");

    expect(within(dialog).getByText("판매상품 목록", { selector: "strong" }))
      .toBeInTheDocument();
    expect(within(dialog).getByText("총 1건")).toBeInTheDocument();
    const results = within(dialog).getByRole("region", { name: "판매상품 목록" });
    expectColumnHeaders(results, [
      "선택",
      "판매상품코드",
      "판매상품명",
      "판매상태",
      "상품매체",
      "협력사",
      "MD명",
    ]);
    const productRow = within(results).getByRole("row", { name: /2200098405/ });
    expect(within(productRow).getByText(FIRST_PRODUCT_NAME)).toBeInTheDocument();
    expect(within(productRow).getByText("진행")).toBeInTheDocument();
    expect(within(productRow).getByText("Hmall")).toBeInTheDocument();
    expect(within(productRow).getByText("주식회사 현대백화점")).toBeInTheDocument();
    expect(within(productRow).getByText("스포츠&골프(복합점)")).toBeInTheDocument();
    expect(
      within(productRow).getByRole("checkbox", { name: `${FIRST_PRODUCT_NAME} 선택` }),
    ).not.toBeChecked();

    expect(within(dialog).getByText("1 / 1 페이지")).toBeInTheDocument();
    expect(within(dialog).getByText("페이지당 15개")).toBeInTheDocument();
    expectButtonType(dialog, "선택");
    expectButtonType(dialog, "취소");
  });
});
