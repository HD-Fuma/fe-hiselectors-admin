import { render, screen } from "@testing-library/react";
import { DashboardPage } from "./DashboardPage";

test("renders only the dashboard background", () => {
  const { container } = render(<DashboardPage />);

  expect(screen.getByRole("heading", { name: "대시보드" })).toHaveClass("hsas-visually-hidden");
  expect(container.querySelector(".fuma-dashboard")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
