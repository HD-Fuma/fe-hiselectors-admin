import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";

test("오늘 지표를 표시하고 기존 하단 지표 카드를 제거한다", () => {
  const { container } = render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "대시보드" })).toHaveClass("hsas-visually-hidden");
  expect(container.querySelector(".fuma-dashboard")).toBeInTheDocument();
  expect(screen.getByText("오늘 들어온 콘텐츠")).toBeInTheDocument();
  expect(screen.getByText("오늘 발생한 매출")).toBeInTheDocument();
  expect(screen.getByText("매출·정산 추이")).toBeInTheDocument();
  expect(screen.queryByText("검수 완료율")).not.toBeInTheDocument();
  expect(screen.queryByText("평균 검수시간")).not.toBeInTheDocument();
  expect(screen.queryByText("지원자 처리율")).not.toBeInTheDocument();
  expect(screen.queryByText("콘텐츠 증감률")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
