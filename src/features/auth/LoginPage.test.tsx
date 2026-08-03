import { screen } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

describe("Partners login", () => {
  test("renders the complete partner login form", () => {
    renderRoute("/login");

    expect(screen.getByText("Partners")).toBeInTheDocument();
    expect(screen.getByText("더현대Hi 협력사 업무지원시스템")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ID를 입력하세요.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("비밀번호를 입력하세요.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "아이디 저장" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });

  test("renders account support and partner shortcuts", () => {
    renderRoute("/login");

    expect(screen.getByText("아이디 찾기")).toBeInTheDocument();
    expect(screen.getByText("비밀번호 초기화")).toBeInTheDocument();
    expect(screen.getByText("시스템 담당자 문의")).toBeInTheDocument();
    expect(screen.getByText("신규입점문의")).toBeInTheDocument();
    expect(screen.getByText("광고신청/안내")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "파트너스 앱 QR" })).toBeInTheDocument();
    expect(screen.getByText("파트너스 APP 다운로드")).toBeInTheDocument();
  });

  test("keeps administrator chrome out of the login route", () => {
    renderRoute("/login");

    expect(screen.queryByTestId("admin-shell")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "관리자 메뉴" })).not.toBeInTheDocument();
  });
});
