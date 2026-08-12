import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";

describe("administrator login", () => {
  test("renders only the administrator login form", () => {
    renderRoute("/login");

    expect(screen.getByRole("heading", { name: "Hi-Selectors" })).toBeInTheDocument();
    expect(screen.queryByText("관리자 계정으로 로그인하세요.")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("아이디 입력")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("비밀번호 입력")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "파트너스 앱 QR" })).not.toBeInTheDocument();
  });

  test("keeps administrator chrome out of the login route", () => {
    renderRoute("/login");

    expect(screen.queryByTestId("admin-shell")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "관리자 메뉴" })).not.toBeInTheDocument();
  });

  test("opens the administrator workspace after login", async () => {
    const user = userEvent.setup();
    renderRoute("/login");

    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(screen.getByRole("heading", { name: "크리에이터 풀" })).toBeInTheDocument();
    expect(screen.getByTestId("admin-shell")).toBeInTheDocument();
  });
});
