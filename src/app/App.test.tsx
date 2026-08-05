import { render, screen } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";
import { App } from "./App";
import { createAppRouter } from "./router";

test("renders the FUMA application root", () => {
  const { container } = render(<App initialEntries={["/login"]} />);
  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(container.querySelector('[data-app-ready="true"]')).toBeInTheDocument();
});

test("opens the administrator performance dashboard at the application root", () => {
  render(<App initialEntries={["/"]} />);

  expect(screen.getByRole("heading", { name: "관리자 성과 대시보드" })).toBeInTheDocument();
  expect(screen.getByText("PF101")).toBeInTheDocument();
});

test("renders browser routes beneath a GitHub Pages repository base path", () => {
  const previousPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.history.replaceState({}, "", "/fe-selectors-admin/login");

  try {
    const router = createAppRouter(undefined, "/fe-selectors-admin");
    render(<RouterProvider router={router} />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText("Partners")).toBeInTheDocument();
  } finally {
    window.history.replaceState({}, "", previousPath || "/");
  }
});
