import { screen, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

test("renders the settlement filters and domain table", () => {
  renderRoute("/settlements");

  const search = screen.getByRole("search", { name: "검색 조건" });
  expect(within(search).getByLabelText("정산월")).toHaveValue("2026-08");
  expect(within(search).getByRole("textbox", { name: "ID 또는 이름" })).toBeInTheDocument();

  const statusFilter = screen.getByRole("navigation", { name: "지급 상태" });
  for (const status of ["전체", "대기", "확정", "지급 완료"]) {
    expect(within(statusFilter).getByRole("button", { name: status })).toHaveAttribute(
      "type",
      "button",
    );
  }

  const results = screen.getByRole("region", { name: "정산 지급 목록" });
  for (const header of ["정산월", "셀렉터스 ID", "셀렉터스", "정산 금액", "지급 상태"]) {
    expect(within(results).getByRole("columnheader", { name: header })).toBeInTheDocument();
  }

  const firstSettlement = within(results).getByRole("row", { name: /st-001.*김서연/ });
  expect(within(firstSettlement).getByText("486,000원")).toBeInTheDocument();
  expect(within(firstSettlement).getByText("대기")).toHaveClass("hsas-status-pill--neutral");
});
