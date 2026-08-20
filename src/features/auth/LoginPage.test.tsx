import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";

describe("administrator login", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: "OK",
      data: {
        accessToken: "admin.jwt",
        loginId: "admin1",
        role: "ADMIN",
        tokenType: "Bearer",
      },
      message: null,
      success: true,
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchMock);
    renderRoute("/login");

    await user.type(screen.getByPlaceholderText("아이디 입력"), " admin1 ");
    await user.type(screen.getByPlaceholderText("비밀번호 입력"), "password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("heading", { name: "크리에이터 풀" })).toBeInTheDocument();
    expect(screen.getByTestId("admin-shell")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.hiselectors.shop/api/auth/admin/login",
      expect.objectContaining({
        body: JSON.stringify({ loginId: "admin1", password: "password" }),
        method: "POST",
      }),
    );
    expect(JSON.parse(localStorage.getItem("selectors-auth") ?? "{}")).toMatchObject({
      accessToken: "admin.jwt",
      loginId: "admin1",
      role: "ADMIN",
      tokenType: "Bearer",
    });
  });

  test("requires both credentials before requesting login", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderRoute("/login");

    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(screen.getByRole("alert")).toHaveTextContent("아이디와 비밀번호를 입력해 주세요.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("shows the backend message when administrator login fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: "UNAUTHORIZED",
      data: null,
      message: "아이디 또는 비밀번호가 일치하지 않습니다.",
      success: false,
    }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    })));
    renderRoute("/login");

    await user.type(screen.getByPlaceholderText("아이디 입력"), "admin1");
    await user.type(screen.getByPlaceholderText("비밀번호 입력"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(
      "아이디 또는 비밀번호가 일치하지 않습니다.",
    ));
    expect(screen.queryByTestId("admin-shell")).not.toBeInTheDocument();
    expect(localStorage.getItem("selectors-auth")).toBeNull();
  });
});
