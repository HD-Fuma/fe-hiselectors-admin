import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { CollectedContent } from "../../entities/content";
import adminStyles from "../../styles/admin.css?raw";
import contentInspectionStyles from "../../styles/content-inspection.css?raw";
import { getTaskRunPanelApiMock, renderRoute } from "../../test/renderRoute";

function collectionResponse(overrides: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      currentStep: null,
      failedCount: 0,
      finishedAt: null,
      processedCount: 0,
      progressMessage: null,
      progressPercent: null,
      runId: "run-content-1",
      skippedCount: 0,
      startedAt: "2026-08-23T01:00:00Z",
      startedBy: { adminId: 1, name: "관리자" },
      status: "QUEUED",
      succeededCount: 0,
      taskType: "CONTENT_SYNC",
      totalCount: null,
      triggerType: "ADMIN_TRIGGERED",
      ...overrides,
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function contentItem(contentId: number, title: string): CollectedContent {
  const storedAt = `2026-08-18T10:${String(contentId).padStart(2, "0")}:00`;
  return {
    accountId: `account-${contentId}`,
    contentId,
    contentType: "FEED",
    contentUrl: `https://instagram.com/p/${contentId}`,
    generationName: "4기",
    inspectedAt: null,
    inspectionStatus: null,
    latestVersionId: contentId * 10,
    latestVersionNo: 1,
    latestVersionStoredAt: storedAt,
    media: [],
    profileImageUrl: null,
    selectorsId: contentId,
    selectorsNickname: `셀렉터 ${contentId}`,
    snsCode: "INSTAGRAM",
    snsContentId: `post-${contentId}`,
    storedAt,
    texts: [title],
  };
}

function contentsResponse(contents: ReturnType<typeof contentItem>[]) {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      content: contents,
      number: 0,
      size: 100,
      totalElements: contents.length,
      totalPages: 1,
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("selectors-auth", JSON.stringify({
    accessToken: "admin.jwt",
    loginId: "admin",
    role: "ADMIN",
    tokenType: "Bearer",
  }));
  getTaskRunPanelApiMock().getTaskRun.mockClear().mockResolvedValue({
    runId: "run-content-1",
    status: "SUCCEEDED",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("requests one content collection run with idempotency and hides the accepted request copy", async () => {
  const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "POST") {
      return Promise.resolve(collectionResponse());
    }
    return Promise.resolve(contentsResponse([contentItem(1, "기존 콘텐츠")]));
  });
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/content/inspections");

  await waitFor(
    () => expect(screen.getByRole("main")).toHaveTextContent("기존 콘텐츠"),
    { timeout: 3_000 },
  );
  const categoryTabs = await screen.findByRole("navigation", { name: "콘텐츠 처리 구분" });
  expect(within(categoryTabs).getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
  expect(within(categoryTabs).getByRole("button", { name: "신규" })).toBeInTheDocument();
  expect(within(categoryTabs).getByRole("button", { name: "수정" })).toBeInTheDocument();
  expect(within(categoryTabs).getByRole("button", { name: "위반" })).toBeInTheDocument();
  expect(within(categoryTabs).queryByRole("button", { name: "위반 확정" })).not.toBeInTheDocument();
  expect(screen.queryByRole("checkbox", { name: "위반 항목만" })).not.toBeInTheDocument();
  const refreshButton = within(categoryTabs).getByRole("button", { name: "콘텐츠 새로고침" });
  expect(refreshButton.parentElement).toHaveClass("fuma-content-collection-run-actions");
  expect(refreshButton.parentElement?.tagName).toBe("SPAN");
  expect(refreshButton.querySelector("svg")).toBeInTheDocument();
  const startButton = within(categoryTabs).getByRole("button", { name: "검수 시작" });
  expect(startButton).toBeEnabled();
  expect(startButton).toHaveAttribute("aria-describedby", "content-inspection-start-tooltip");
  const startTooltip = document.getElementById("content-inspection-start-tooltip");
  expect(startTooltip).toHaveClass("is-visible");
  expect(startTooltip).toHaveTextContent("검수할 항목이 1건 있습니다.");
  expect(startTooltip).toHaveTextContent("검수 시작 버튼을 눌러 검수를 진행하세요");
  expect(startTooltip?.querySelector("br")).not.toBeInTheDocument();

  const requestsBeforeRun = fetchMock.mock.calls.length;
  fireEvent.click(refreshButton);

  expect(within(categoryTabs).getByRole("button", { name: "콘텐츠 새로고침 중" })).toBeDisabled();
  const [input, init] = fetchMock.mock.calls[requestsBeforeRun];
  expect(new URL(String(input)).pathname).toBe("/api/admin/content-batch/run");
  expect((init as RequestInit).method).toBe("POST");
  expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe(
    "Bearer admin.jwt",
  );
  const idempotencyKey = new Headers((init as RequestInit).headers).get("Idempotency-Key");
  expect(idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);

  await waitFor(() => expect(
    within(categoryTabs).getByRole("button", { name: "콘텐츠 새로고침" }),
  ).toBeEnabled());
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByText(/작업 요청됨|작업 ID|진행상황에서 확인/)).not.toBeInTheDocument();
  expect(getTaskRunPanelApiMock().getTaskRun).toHaveBeenCalledWith(
    "run-content-1",
    expect.any(AbortSignal),
  );
});

test("requests a scoped content collection run when fast mode is enabled", async () => {
  localStorage.setItem("selectors-content-fast-mode", "true");
  const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "POST") {
      return Promise.resolve(collectionResponse());
    }
    return Promise.resolve(contentsResponse([contentItem(1, "기존 콘텐츠")]));
  });
  vi.stubGlobal("fetch", fetchMock);
  renderRoute("/content/inspections");

  await waitFor(() => expect(screen.getByRole("main")).toHaveTextContent("기존 콘텐츠"));
  const categoryTabs = screen.getByRole("navigation", { name: "콘텐츠 처리 구분" });
  fireEvent.click(within(categoryTabs).getByRole("button", { name: "콘텐츠 새로고침" }));

  const request = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
  expect(request).toBeDefined();
  expect(new URL(String(request?.[0])).searchParams.get("fastMode")).toBe("true");
});

test("shows only new and modified content on the all tab from the existing list API", async () => {
  const fetchMock = vi.fn().mockResolvedValue(contentsResponse([
    contentItem(1, "신규 콘텐츠"),
    {
      ...contentItem(2, "수정 콘텐츠"),
      latestVersionNo: 2,
    },
    {
      ...contentItem(3, "승인된 콘텐츠"),
      inspectedAt: "2026-08-18T11:00:00",
      inspectionStatus: "APPROVED",
    },
  ]));
  vi.stubGlobal("fetch", fetchMock);

  const { router } = renderRoute("/content/inspections");
  const categoryTabs = await screen.findByRole("navigation", { name: "콘텐츠 처리 구분" });

  expect(await screen.findByRole("button", { name: /신규 콘텐츠 검수 시작/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /수정 콘텐츠 검수 시작/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /승인된 콘텐츠 검수 시작/ })).not.toBeInTheDocument();
  expect(within(categoryTabs).getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
  expect(new URLSearchParams(router.state.location.search).get("category")).toBeNull();
  expect(screen.getByText("총 2건")).toBeInTheDocument();

  fireEvent.click(within(categoryTabs).getByRole("button", { name: "신규" }));

  expect(within(categoryTabs).getByRole("button", { name: "신규" })).toHaveAttribute("aria-pressed", "true");
  expect(new URLSearchParams(router.state.location.search).get("category")).toBe("신규");
  expect(screen.getByRole("button", { name: /신규 콘텐츠 검수 시작/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /수정 콘텐츠 검수 시작/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /승인된 콘텐츠 검수 시작/ })).not.toBeInTheDocument();
  expect(screen.getByText("총 1건")).toBeInTheDocument();
  expect(fetchMock.mock.calls.filter(([input]) => (
    new URL(String(input)).pathname === "/api/admin/contents"
  ))).toHaveLength(1);
});

test("shows backend-provided completed content on the violation tab", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(contentsResponse([{
    ...contentItem(2, "승인된 콘텐츠"),
    inspectedAt: "2026-08-18T11:00:00",
    inspectionStatus: "APPROVED",
  }])));

  renderRoute("/content/inspections");

  const categoryTabs = await screen.findByRole("navigation", { name: "콘텐츠 처리 구분" });
  fireEvent.click(within(categoryTabs).getByRole("button", { name: "위반" }));

  expect(await screen.findAllByText("승인된 콘텐츠")).not.toHaveLength(0);
});

test("shows the backend conflict message when a collection is already running", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation((_input, init?: RequestInit) => (
    init?.method === "POST"
      ? Promise.resolve(new Response(JSON.stringify({
          code: "TASK_ALREADY_RUNNING",
          data: null,
          message: "같은 작업이 이미 실행 중입니다.",
          success: false,
        }), {
          headers: { "Content-Type": "application/json" },
          status: 409,
        }))
      : Promise.resolve(contentsResponse([]))
  )));

  renderRoute("/content/inspections");
  await screen.findByText("검색 결과가 없습니다.");
  fireEvent.click(screen.getByRole("button", { name: "콘텐츠 새로고침" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("같은 작업이 이미 실행 중입니다.");
});

test("shows a collection failure as an inline alert", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation((_input, init?: RequestInit) => (
    init?.method === "POST"
      ? Promise.resolve(new Response(JSON.stringify({
          code: "INTERNAL_SERVER_ERROR",
          data: null,
          message: "콘텐츠 수집 서버 오류",
          success: false,
        }), {
          headers: { "Content-Type": "application/json" },
          status: 500,
        }))
      : Promise.resolve(contentsResponse([]))
  )));

  renderRoute("/content/inspections");
  expect(await screen.findByText("검색 결과가 없습니다.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "콘텐츠 새로고침" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("콘텐츠 수집 서버 오류");
  expect(screen.getByRole("button", { name: "콘텐츠 새로고침" })).toBeEnabled();
});

test("reloads contents as soon as collection succeeds", async () => {
  let contentRequests = 0;
  const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "POST") {
      return Promise.resolve(collectionResponse());
    }
    contentRequests += 1;
    return Promise.resolve(contentsResponse(
      contentRequests === 1 ? [] : [contentItem(2, "새 콘텐츠")],
    ));
  });
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/content/inspections");
  await screen.findByText("검색 결과가 없습니다.");
  fireEvent.click(screen.getByRole("button", { name: "콘텐츠 새로고침" }));

  expect(await screen.findAllByText("새 콘텐츠")).not.toHaveLength(0);
  expect(contentRequests).toBe(2);
});

test("shows the analysis state from inspection status without the SNS account id", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(contentsResponse([
    contentItem(1, "분석 전 콘텐츠"),
    {
      ...contentItem(2, "분석 완료 콘텐츠"),
      inspectedAt: "2026-08-18T11:00:00",
      inspectionStatus: "COMPLETED",
    },
  ])));

  renderRoute("/content/inspections");

  expect(await screen.findByText("분석 완료")).toBeInTheDocument();
  expect(screen.getByText("분석 대기")).toBeInTheDocument();
  expect(screen.queryByText("(account-1)")).not.toBeInTheDocument();
  expect(screen.queryByText("(account-2)")).not.toBeInTheDocument();
});

test("uses an isolated action layout and a readable success text token", () => {
  expect(adminStyles).not.toContain(".fuma-content-collection-run-actions");
  expect(contentInspectionStyles).toMatch(/\.fuma-content-collection-run-actions\s*\{/);
  const startTooltipRule = contentInspectionStyles.match(
    /\.fuma-content-inspection-start-tooltip > \.hsas-tooltip\s*\{([^}]*)\}/,
  )?.[1];
  expect(startTooltipRule).toMatch(/position:\s*absolute;/);
  expect(startTooltipRule).toMatch(/bottom:\s*calc\(100% \+ var\(--hsas-space-8\)\);/);
  expect(startTooltipRule).toMatch(/max-width:\s*none;/);
  expect(startTooltipRule).toMatch(/white-space:\s*nowrap;/);
  const feedbackRule = contentInspectionStyles.match(
    /\.fuma-content-inspection-collection-feedback\s*\{([^}]*)\}/,
  )?.[1];
  expect(feedbackRule).toMatch(/color:\s*var\(--hsas-color-ink-700\)/);
});
