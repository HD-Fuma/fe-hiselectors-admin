import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import adminStyles from "../../styles/admin.css?raw";
import contentInspectionStyles from "../../styles/content-inspection.css?raw";
import { renderRoute } from "../../test/renderRoute";

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

function contentItem(contentId: number, title: string) {
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
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("requests one content collection run with idempotency and reports accepted status", async () => {
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
  expect(within(categoryTabs).getByRole("button", { name: "신규 등록" })).toBeInTheDocument();
  expect(within(categoryTabs).getByRole("button", { name: "수정 감지" })).toBeInTheDocument();
  expect(within(categoryTabs).getByRole("button", { name: "위반 확정" })).toBeInTheDocument();
  expect(within(categoryTabs).getByRole("button", { name: "승인 완료" })).toBeInTheDocument();
  const refreshButton = within(categoryTabs).getByRole("button", { name: "콘텐츠 새로고침" });
  expect(refreshButton.parentElement).toHaveClass("fuma-content-collection-run-actions");
  expect(refreshButton.parentElement?.tagName).toBe("SPAN");
  expect(refreshButton.querySelector("svg")).toBeInTheDocument();
  expect(within(categoryTabs).getByRole("button", { name: "검수 시작" })).toBeEnabled();

  const requestsBeforeRun = fetchMock.mock.calls.length;
  fireEvent.click(refreshButton);

  expect(fetchMock).toHaveBeenCalledTimes(requestsBeforeRun + 1);
  expect(within(categoryTabs).getByRole("button", { name: "콘텐츠 새로고침 중" })).toBeDisabled();
  const [input, init] = fetchMock.mock.calls[requestsBeforeRun];
  expect(new URL(String(input)).pathname).toBe("/api/admin/content-batch/run");
  expect((init as RequestInit).method).toBe("POST");
  expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe(
    "Bearer admin.jwt",
  );
  const idempotencyKey = new Headers((init as RequestInit).headers).get("Idempotency-Key");
  expect(idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);

  const status = await screen.findByRole("status");
  expect(status).toHaveTextContent("작업 요청됨");
  expect(status).toHaveTextContent("진행상황에서 확인");
  expect(status).toHaveTextContent("run-content-1");
  expect(fetchMock).toHaveBeenCalledTimes(requestsBeforeRun + 1);
  expect(within(categoryTabs).getByRole("button", { name: "콘텐츠 새로고침" })).toBeEnabled();
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

test("does not reload contents after an accepted collection request", async () => {
  const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "POST") {
      return Promise.resolve(collectionResponse());
    }
    return Promise.resolve(contentsResponse([]));
  });
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/content/inspections");
  await screen.findByText("검색 결과가 없습니다.");
  const requestsBeforeRun = fetchMock.mock.calls.length;
  fireEvent.click(screen.getByRole("button", { name: "콘텐츠 새로고침" }));

  await screen.findByRole("status");
  expect(fetchMock).toHaveBeenCalledTimes(requestsBeforeRun + 1);
});

test("locks the violation-only toggle on decided categories", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(contentsResponse([
    contentItem(1, "기존 콘텐츠"),
  ])));

  renderRoute("/content/inspections");

  const categoryTabs = await screen.findByRole("navigation", { name: "콘텐츠 처리 구분" });
  const toggle = await screen.findByRole("checkbox", { name: "위반 항목만" });
  expect(toggle).toBeEnabled();
  expect(toggle).not.toBeChecked();

  fireEvent.click(within(categoryTabs).getByRole("button", { name: "위반 확정" }));
  expect(toggle).toBeDisabled();
  expect(toggle).toBeChecked();

  fireEvent.click(within(categoryTabs).getByRole("button", { name: "승인 완료" }));
  expect(toggle).toBeDisabled();
  expect(toggle).not.toBeChecked();

  fireEvent.click(within(categoryTabs).getByRole("button", { name: "신규 등록" }));
  expect(toggle).toBeEnabled();
  expect(toggle).not.toBeChecked();
});

test("uses an isolated action layout and a readable success text token", () => {
  expect(adminStyles).not.toContain(".fuma-content-collection-run-actions");
  expect(contentInspectionStyles).toMatch(/\.fuma-content-collection-run-actions\s*\{/);
  const feedbackRule = contentInspectionStyles.match(
    /\.fuma-content-inspection-collection-feedback\s*\{([^}]*)\}/,
  )?.[1];
  expect(feedbackRule).toMatch(/color:\s*var\(--hsas-color-ink-700\)/);
});
