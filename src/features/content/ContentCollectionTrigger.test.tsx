import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import adminStyles from "../../styles/admin.css?raw";
import contentInspectionStyles from "../../styles/content-inspection.css?raw";
import { renderRoute } from "../../test/renderRoute";

function collectionResponse() {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      failedAccountCount: 1,
      generationId: 10,
      generationName: "1기",
      savedContentCount: 7,
      succeededAccountCount: 2,
      targetAccountCount: 3,
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

test("requests one content collection run and reports progress and result", async () => {
  let resolveCollection: ((response: Response) => void) | undefined;
  let resolveReload: ((response: Response) => void) | undefined;
  let getRequestCount = 0;
  const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "POST") {
      return new Promise<Response>((resolve) => {
        resolveCollection = resolve;
      });
    }
    getRequestCount += 1;
    if (getRequestCount === 1) {
      return Promise.resolve(contentsResponse([contentItem(1, "기존 콘텐츠")]));
    }
    return new Promise<Response>((resolve) => {
      resolveReload = resolve;
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/content/inspections");

  await waitFor(
    () => expect(screen.getByRole("main")).toHaveTextContent("기존 콘텐츠"),
    { timeout: 3_000 },
  );
  const categoryTabs = await screen.findByRole("navigation", { name: "콘텐츠 처리 구분" });
  const refreshButton = within(categoryTabs).getByRole("button", { name: "새로고침" });
  expect(refreshButton.parentElement).toHaveClass("fuma-content-collection-run-actions");
  expect(refreshButton.parentElement?.tagName).toBe("SPAN");
  expect(within(categoryTabs).getByRole("button", { name: "검수 시작" })).toBeEnabled();

  fireEvent.click(refreshButton);

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(within(categoryTabs).getByRole("button", { name: "수집 중..." })).toBeDisabled();
  const [input, init] = fetchMock.mock.calls[1];
  expect(String(input)).toBe("http://localhost:8080/api/admin/content-collections");
  expect((init as RequestInit).method).toBe("POST");
  expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe(
    "Bearer admin.jwt",
  );

  resolveCollection?.(collectionResponse());
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(within(categoryTabs).getByRole("button", { name: "수집 중..." })).toBeDisabled();

  resolveReload?.(contentsResponse([
    contentItem(2, "새로 수집된 콘텐츠"),
    contentItem(1, "기존 콘텐츠"),
  ]));

  const status = await screen.findByRole("status");
  expect(status).toHaveTextContent("대상 3건");
  expect(status).toHaveTextContent("성공 2건");
  expect(status).toHaveTextContent("실패 1건");
  expect(status).toHaveTextContent("신규 저장 7건");
  expect(screen.getByRole("main")).toHaveTextContent("새로 수집된 콘텐츠");
  expect(within(categoryTabs).getByRole("button", { name: "새로고침" })).toBeEnabled();
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
  fireEvent.click(screen.getByRole("button", { name: "새로고침" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("콘텐츠 수집 서버 오류");
  expect(screen.getByRole("button", { name: "새로고침" })).toBeEnabled();
});

test("uses an isolated action layout and a readable success text token", () => {
  expect(adminStyles).not.toContain(".fuma-content-collection-run-actions");
  expect(contentInspectionStyles).toMatch(/\.fuma-content-collection-run-actions\s*\{/);
  const feedbackRule = contentInspectionStyles.match(
    /\.fuma-content-inspection-collection-feedback\s*\{([^}]*)\}/,
  )?.[1];
  expect(feedbackRule).toMatch(/color:\s*var\(--hsas-color-ink-700\)/);
});
