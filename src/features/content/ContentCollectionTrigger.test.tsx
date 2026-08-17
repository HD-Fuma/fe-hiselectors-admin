import { fireEvent, screen, within } from "@testing-library/react";
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
  let resolveRequest: ((response: Response) => void) | undefined;
  const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
    resolveRequest = resolve;
  }));
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/content/inspections");

  const categoryTabs = await screen.findByRole("navigation", { name: "콘텐츠 처리 구분" });
  const refreshButton = within(categoryTabs).getByRole("button", { name: "새로고침" });
  expect(refreshButton.parentElement).toHaveClass("fuma-content-collection-run-actions");
  expect(refreshButton.parentElement?.tagName).toBe("SPAN");
  expect(within(categoryTabs).getByRole("button", { name: "검수 시작" })).toBeEnabled();

  fireEvent.click(refreshButton);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(within(categoryTabs).getByRole("button", { name: "수집 중..." })).toBeDisabled();
  const [input, init] = fetchMock.mock.calls[0];
  expect(String(input)).toBe("http://localhost:8080/api/admin/content-collections");
  expect((init as RequestInit).method).toBe("POST");
  expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe(
    "Bearer admin.jwt",
  );

  resolveRequest?.(collectionResponse());

  const status = await screen.findByRole("status");
  expect(status).toHaveTextContent("대상 3건");
  expect(status).toHaveTextContent("성공 2건");
  expect(status).toHaveTextContent("실패 1건");
  expect(status).toHaveTextContent("신규 저장 7건");
  expect(within(categoryTabs).getByRole("button", { name: "새로고침" })).toBeEnabled();
});

test("shows a collection failure as an inline alert", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "INTERNAL_SERVER_ERROR",
    data: null,
    message: "콘텐츠 수집 서버 오류",
    success: false,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 500,
  })));

  renderRoute("/content/inspections");
  fireEvent.click(await screen.findByRole("button", { name: "새로고침" }));

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
