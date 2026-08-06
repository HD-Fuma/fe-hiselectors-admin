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

  test("renders settlement results as read-only data", () => {
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
      within(search).queryByRole("combobox", { name: "수정 가능 여부" }),
    ).not.toBeInTheDocument();
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
      "확정 상태",
      "지급 상태",
    ]);
    expect(within(results).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(results).queryByRole("button")).not.toBeInTheDocument();

    const kim = within(results).getByRole("row", { name: /st-001.*김서연/ });
    expect(within(kim).getByText("sl-001")).toBeInTheDocument();
    expect(within(kim).getAllByText("486,000원")).toHaveLength(2);
    expect(within(kim).getByText("미확정")).toHaveClass("hsas-status-pill--pending");
    expect(within(kim).getByText("지급 전")).toHaveClass("hsas-status-pill--neutral");

    const park = within(results).getByRole("row", { name: /st-002.*박도윤/ });
    expect(within(park).getByText("352,000원")).toBeInTheDocument();
    expect(within(park).getByText("340,000원")).toBeInTheDocument();

    const lee = within(results).getByRole("row", { name: /st-003.*이지아/ });
    expect(within(lee).getByText("확정", { selector: ".hsas-status-pill" }))
      .toHaveClass("hsas-status-pill--approved");
    expect(within(lee).getByText("지급 대기")).toHaveClass("hsas-status-pill--pending");

    const oh = within(results).getByRole("row", { name: /st-004.*오하늘/ });
    expect(within(oh).getByText("2026-07")).toBeInTheDocument();
    expect(within(oh).getByText("지급 완료")).toHaveClass("hsas-status-pill--approved");

    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
    expect(screen.getByText("페이지당 20개")).toBeInTheDocument();
  });
});
