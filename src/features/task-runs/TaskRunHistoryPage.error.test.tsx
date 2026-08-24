import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TaskRunHistoryPage } from "./TaskRunHistoryPage";

afterEach(() => vi.unstubAllGlobals());

test("shows the exact history error state", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "INTERNAL_ERROR",
    data: null,
    message: "network",
    success: false,
  }), { headers: { "Content-Type": "application/json" }, status: 500 })));

  render(
    <MemoryRouter>
      <TaskRunHistoryPage />
    </MemoryRouter>,
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "작업 실행 이력 조회에 실패했습니다.",
  );
});
