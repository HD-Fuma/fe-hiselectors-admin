import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";

const TASK_RUN = {
  runId: "creator-sync-1",
  taskType: "CREATOR_SYNC",
  triggerType: "ADMIN_TRIGGERED",
  status: "QUEUED",
  currentStep: null,
  progressMessage: null,
  totalCount: null,
  processedCount: 0,
  succeededCount: 0,
  failedCount: 0,
  skippedCount: 0,
  progressPercent: null,
  startedBy: { adminId: 1, name: "관리자" },
  startedAt: null,
  finishedAt: null,
};

function json(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

test("starts the quick creator pool task and opens the existing list", async () => {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/admin/discovery/youtube/run" && init?.method === "POST") {
      return json(TASK_RUN);
    }
    if (url.pathname === "/api/admin/categories") return json([]);
    if (url.pathname === "/api/admin/creators") {
      return json({ content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 });
    }
    return Promise.reject(new Error(`Unexpected request: ${url.pathname}`));
  });
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  const { router } = renderRoute("/creators/test");

  expect(await screen.findByRole("heading", { name: "테스트 크리에이터 풀 구축" }))
    .toBeInTheDocument();
  expect(screen.getByText("카테고리별 키워드 1개")).toBeInTheDocument();
  expect(screen.getByText("Instagram · YouTube")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "테스트 크리에이터 풀 구축" }))
    .not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "테스트 풀 구축" }));

  await waitFor(() => expect(router.state.location.pathname).toBe("/creators"));
  const discoveryCalls = fetchMock.mock.calls.filter(([input]) => (
    new URL(String(input)).pathname === "/api/admin/discovery/youtube/run"
  ));
  expect(discoveryCalls).toHaveLength(1);
  expect(new URL(String(discoveryCalls[0][0])).search).toBe("?test=true");
});
