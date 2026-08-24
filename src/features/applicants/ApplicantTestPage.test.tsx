import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";

function json(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify({
    success: true,
    code: "OK",
    message: null,
    data,
  }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

afterEach(() => vi.unstubAllGlobals());

test("creates one test applicant and opens the existing detail screen", async () => {
  vi.stubGlobal("fetch", vi.fn((_: RequestInfo | URL, init?: RequestInit) => (
    init?.method === "POST" ? json({ id: 41 }) : new Promise<Response>(() => {})
  )));
  const user = userEvent.setup();
  const { router } = renderRoute("/applicants/test");

  expect(await screen.findByRole("heading", { name: "테스트 지원자 등록" }))
    .toBeInTheDocument();
  expect(screen.getByText(/운영 DB에 테스트 데이터 1건/)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "테스트 지원자 등록" })).not.toBeInTheDocument();

  await user.type(
    screen.getByRole("textbox", { name: "SNS 프로필 URL" }),
    "https://www.instagram.com/test.account",
  );
  await user.click(screen.getByRole("button", { name: "테스트 지원자 생성" }));

  await waitFor(() => {
    expect(router.state.location.pathname).toBe("/applicants");
    expect(router.state.location.search).toBe("?detail=41");
  });
  expect(vi.mocked(fetch)).toHaveBeenCalledWith(
    expect.stringMatching(/\/api\/admin\/applications\/test$/),
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ profileUrl: "https://www.instagram.com/test.account" }),
    }),
  );
});
