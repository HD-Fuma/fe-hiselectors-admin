import { screen, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";
import { formatWon } from "./fixtures";

function expectColumnHeaders(region: HTMLElement, names: string[]) {
  for (const name of names) {
    expect(within(region).getByRole("columnheader", { name })).toBeInTheDocument();
  }
}

function expectButtonType(scope: HTMLElement, name: string) {
  expect(within(scope).getByRole("button", { name })).toHaveAttribute(
    "type",
    "button",
  );
}

describe("settlement payment management", () => {
  test("formats settlement amounts as Korean won", () => {
    expect(formatWon(0)).toBe("0원");
    expect(formatWon(486000)).toBe("486,000원");
  });

  test("renders filters and gates amount editing and confirmation by settlement state", () => {
    renderRoute("/settlements");

    expect(screen.getByRole("heading", { name: "정산 지급 관리" })).toBeInTheDocument();
    expect(screen.getByText("ST101")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    expect(within(search).getByLabelText("귀속월")).toHaveAttribute("type", "month");
    expect(within(search).getByLabelText("귀속월")).toHaveValue("2026-08");
    expect(within(search).getByRole("textbox", { name: "셀렉터스" })).toHaveAttribute(
      "placeholder",
      "셀렉터스 ID 또는 이름 검색",
    );
    expect(
      within(search).getByRole("combobox", { name: "수정 가능 여부" }),
    ).toHaveTextContent("전체가능불가");
    expect(
      within(search).getByRole("combobox", { name: "확정 상태" }),
    ).toHaveTextContent("전체미확정확정");
    expect(
      within(search).getByRole("combobox", { name: "지급 상태" }),
    ).toHaveTextContent("전체지급 전지급 대기지급 완료");
    expectButtonType(search, "조회");
    expectButtonType(search, "초기화");

    expect(screen.getByText("토스 페이먼츠 연동 후순위")).toBeInTheDocument();
    expect(screen.getByText("정산 지급 목록", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("총 4건")).toBeInTheDocument();

    const results = screen.getByRole("region", { name: "정산 지급 목록" });
    expectColumnHeaders(results, [
      "귀속월",
      "셀렉터스",
      "예상액",
      "확정액",
      "수정 가능 여부",
      "확정 상태",
      "지급 상태",
      "관리",
    ]);

    const kim = within(results).getByRole("row", { name: /st-001.*김서연/ });
    expect(within(kim).getByText("sl-001")).toBeInTheDocument();
    expect(within(kim).getByText("486,000원")).toBeInTheDocument();
    expect(within(kim).getByRole("textbox", { name: "김서연 지급액 수정" }))
      .toBeEnabled();
    expect(within(kim).getByRole("textbox", { name: "김서연 지급액 수정" }))
      .toHaveValue("486,000원");
    expect(within(kim).getByText("가능")).toHaveClass("hsas-status-pill--approved");
    expect(within(kim).getByText("미확정")).toHaveClass("hsas-status-pill--pending");
    expect(within(kim).getByText("지급 전")).toHaveClass("hsas-status-pill--neutral");
    expect(within(kim).getByRole("button", { name: "김서연 지급 확정" })).toBeEnabled();
    expectButtonType(kim, "김서연 지급 확정");

    const park = within(results).getByRole("row", { name: /st-002.*박도윤/ });
    expect(within(park).getByText("352,000원")).toBeInTheDocument();
    expect(within(park).getByRole("textbox", { name: "박도윤 지급액 수정" }))
      .toHaveValue("340,000원");
    expect(within(park).getByRole("button", { name: "박도윤 지급 확정" })).toBeEnabled();

    const lee = within(results).getByRole("row", { name: /st-003.*이지아/ });
    expect(within(lee).getByText("불가")).toHaveClass("hsas-status-pill--neutral");
    expect(within(lee).getByText("확정", { selector: ".hsas-status-pill" }))
      .toHaveClass("hsas-status-pill--approved");
    expect(within(lee).getByText("지급 대기")).toHaveClass("hsas-status-pill--pending");
    expect(within(lee).getByRole("textbox", { name: "이지아 지급액 수정" }))
      .toBeDisabled();
    expect(within(lee).getByRole("button", { name: "이지아 지급 확정" }))
      .toBeDisabled();

    const oh = within(results).getByRole("row", { name: /st-004.*오하늘/ });
    expect(within(oh).getByText("2026-07")).toBeInTheDocument();
    expect(within(oh).getByText("지급 완료")).toHaveClass("hsas-status-pill--approved");
    expect(within(oh).getByRole("textbox", { name: "오하늘 지급액 수정" }))
      .toBeDisabled();
    expect(within(oh).getByRole("button", { name: "오하늘 지급 확정" }))
      .toBeDisabled();

    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
    expect(screen.getByText("페이지당 20개")).toBeInTheDocument();
  });
});

describe("system notice management", () => {
  test("renders notice filters, exact rows, and the prefilled inline editor", () => {
    renderRoute("/system/notices");

    expect(screen.getByRole("heading", { name: "공지사항 관리" })).toBeInTheDocument();
    expect(screen.getByText("SY101")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    expect(within(search).getByRole("textbox", { name: "검색어" })).toHaveAttribute(
      "placeholder",
      "공지사항 제목 검색",
    );
    expect(within(search).getByRole("combobox", { name: "대상" })).toHaveTextContent(
      "전체전체 셀렉터스3기 셀렉터스2기 셀렉터스",
    );
    expect(within(search).getByLabelText("게시 시작일")).toHaveAttribute("type", "date");
    expect(within(search).getByLabelText("게시 종료일")).toHaveAttribute("type", "date");
    expect(within(search).getByRole("combobox", { name: "게시 상태" }))
      .toHaveTextContent("전체게시 예정게시 중게시 종료");
    expectButtonType(search, "조회");
    expectButtonType(search, "초기화");

    const results = screen.getByRole("region", { name: "공지사항 목록" });
    expect(screen.getByText("공지사항 목록", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("총 3건")).toBeInTheDocument();
    expectButtonType(document.body, "신규 작성");
    expectColumnHeaders(results, [
      "제목",
      "대상",
      "게시 기간",
      "게시 상태",
      "작성자",
      "수정일",
      "관리",
    ]);

    const august = within(results).getByRole("row", {
      name: /8월 셀렉터스 활동 안내.*전체 셀렉터스.*2026-08-01 ~ 2026-08-31.*게시 중.*FUMA 운영자.*2026-08-03 14:20/,
    });
    expect(within(august).getByText("게시 중")).toHaveClass(
      "hsas-status-pill--approved",
    );
    expectButtonType(august, "8월 셀렉터스 활동 안내 수정");
    expectButtonType(august, "8월 셀렉터스 활동 안내 삭제");

    const third = within(results).getByRole("row", {
      name: /3기 콘텐츠 제출 일정 안내.*3기 셀렉터스.*2026-08-10 ~ 2026-08-24.*게시 예정/,
    });
    expect(within(third).getByText("게시 예정")).toHaveClass(
      "hsas-status-pill--pending",
    );
    expectButtonType(third, "3기 콘텐츠 제출 일정 안내 수정");
    expectButtonType(third, "3기 콘텐츠 제출 일정 안내 삭제");

    const second = within(results).getByRole("row", {
      name: /2기 활동 종료 및 정산 일정 안내.*2기 셀렉터스.*2026-06-20 ~ 2026-06-30.*게시 종료.*정산관리자.*2026-06-30 18:05/,
    });
    expect(within(second).getByText("게시 종료")).toHaveClass(
      "hsas-status-pill--neutral",
    );
    expectButtonType(second, "2기 활동 종료 및 정산 일정 안내 수정");
    expectButtonType(second, "2기 활동 종료 및 정산 일정 안내 삭제");

    const editor = screen.getByRole("region", { name: "공지사항 작성/수정" });
    expect(within(editor).getByRole("heading", { name: "공지사항 작성/수정" }))
      .toBeInTheDocument();
    const title = within(editor).getByRole("textbox", { name: "제목" });
    expect(title).toHaveAttribute("placeholder", "공지사항 제목을 입력하세요.");
    expect(title).toHaveValue("8월 셀렉터스 활동 안내");
    expect(title).toBeRequired();
    expect(within(editor).getByRole("combobox", { name: "대상" })).toHaveValue("전체");
    expect(within(editor).getByDisplayValue("2026-08-01")).toBeRequired();
    expect(within(editor).getByDisplayValue("2026-08-31")).toBeRequired();
    expect(within(editor).getByRole("combobox", { name: "게시 상태" }))
      .toHaveValue("게시 중");
    const content = within(editor).getByRole("textbox", { name: "내용" });
    expect(content).toHaveAttribute("placeholder", "공지사항 내용을 입력하세요.");
    expect(content).toHaveValue(
      "8월 셀렉터스 활동 일정과 콘텐츠 제출 기준을 확인해 주세요.",
    );
    expect(content).toBeRequired();
    expectButtonType(editor, "저장");
    expectButtonType(editor, "취소");
    expect(
      within(editor).getByText("알림/메시징 연동은 향후 확장 예정입니다."),
    ).toBeInTheDocument();
  });
});
