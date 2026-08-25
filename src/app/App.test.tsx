import { render, screen } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";
import { App } from "./App";
import { createAppRouter } from "./router";

vi.mock("../entities/task-run", () => ({
  getTaskRunPanel: vi.fn().mockResolvedValue({
    items: [],
    serverTime: "2026-08-23T00:00:00Z",
  }),
  streamTaskRunProgress: vi.fn().mockReturnValue(new Promise(() => undefined)),
}));

beforeEach(() => {
  localStorage.clear();
});

test("renders the FUMA application root", () => {
  const { container } = render(<App initialEntries={["/login"]} />);
  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(container.querySelector('[data-app-ready="true"]')).toBeInTheDocument();
});

test("opens the default administrator screen at the application root", async () => {
  localStorage.setItem("selectors-auth", JSON.stringify({
    accessToken: "test.admin.jwt",
    loginId: "test-admin",
    name: "테스트 관리자",
    role: "ADMIN",
    tokenType: "Bearer",
  }));
  render(<App initialEntries={["/"]} />);

  expect(await screen.findByRole("heading", { name: "크리에이터 풀" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "관리자 메뉴" })).toBeInTheDocument();
});

test("renders browser routes beneath a GitHub Pages repository base path", () => {
  const previousPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.history.replaceState({}, "", "/fe-selectors-admin/login");

  try {
    const router = createAppRouter(undefined, "/fe-selectors-admin");
    render(<RouterProvider router={router} />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hi-Selectors" })).toBeInTheDocument();
  } finally {
    window.history.replaceState({}, "", previousPath || "/");
  }
});
