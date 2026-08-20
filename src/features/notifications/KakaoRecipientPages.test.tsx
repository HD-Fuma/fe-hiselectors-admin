import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

const RECIPIENTS = [
  {
    email: "ready@example.com",
    hiId: "hi-ready",
    nickname: "수신가능셀렉터",
    recipientStatus: "READY",
    selectorsCode: "SEL0001",
    selectorsId: 11,
    userId: 101,
  },
  {
    email: null,
    hiId: "hi-unlinked",
    nickname: "미연결셀렉터",
    recipientStatus: "UNLINKED",
    selectorsCode: "SEL0002",
    selectorsId: 12,
    userId: 102,
  },
  {
    email: "blocked@example.com",
    hiId: "hi-blocked",
    nickname: "수신불가셀렉터",
    recipientStatus: "REAUTH_REQUIRED",
    selectorsCode: "SEL0003",
    selectorsId: 13,
    userId: 103,
  },
] as const;

function pageResponse(content = RECIPIENTS) {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      content,
      number: 0,
      size: 20,
      totalElements: content.length,
      totalPages: 1,
    },
    message: null,
    success: true,
  }), { headers: { "Content-Type": "application/json" }, status: 200 });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("selectors-auth", JSON.stringify({
    accessToken: "admin.jwt",
    tokenType: "Bearer",
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("lists kakao recipient status and filters by keyword and status", async () => {
  const fetchMock = vi.fn().mockResolvedValue(pageResponse());
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/notifications/kakao-recipients");

  await screen.findByText("수신가능셀렉터");
  const results = screen.getByRole("region", { name: "카카오 수신 현황" });
  expect(within(results).getByRole("columnheader", { name: "셀렉터스명" })).toBeInTheDocument();
  expect(within(results).getByRole("columnheader", { name: "셀렉터스코드" })).toBeInTheDocument();
  expect(within(results).getByRole("columnheader", { name: "이메일 수신가능 여부" })).toBeInTheDocument();
  expect(within(results).getByRole("columnheader", { name: "알림 메시지 수신 가능 여부" })).toBeInTheDocument();

  const readyRow = within(results).getByRole("row", { name: /수신가능셀렉터/ });
  expect(within(readyRow).getByText("SEL0001")).toBeInTheDocument();
  expect(within(readyRow).getByLabelText("이메일 수신 가능")).toBeInTheDocument();
  expect(within(readyRow).getByLabelText("알림 메시지 수신 가능")).toBeInTheDocument();

  const unlinkedRow = within(results).getByRole("row", { name: /미연결셀렉터/ });
  expect(within(unlinkedRow).getByText("SEL0002")).toBeInTheDocument();
  expect(within(unlinkedRow).getByLabelText("이메일 수신 불가")).toBeInTheDocument();
  expect(within(unlinkedRow).getByLabelText("알림 메시지 미연결")).toBeInTheDocument();

  const blockedRow = within(results).getByRole("row", { name: /수신불가셀렉터/ });
  expect(within(blockedRow).getByLabelText("이메일 수신 가능")).toBeInTheDocument();
  expect(within(blockedRow).getByLabelText("알림 메시지 수신 불가, 재인증 필요")).toBeInTheDocument();

  const search = screen.getByRole("search", { name: "검색 조건" });
  fireEvent.change(within(search).getByLabelText("이름, 이메일 또는 셀렉터스 코드"), {
    target: { value: "수신가능" },
  });
  fireEvent.click(within(search).getByRole("button", { name: "조회" }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const [keywordRequest, keywordOptions] = fetchMock.mock.calls[1];
  const keywordUrl = new URL(String(keywordRequest));
  expect(keywordUrl.pathname).toBe("/api/admin/kakao/recipients");
  expect(keywordUrl.searchParams.get("keyword")).toBe("수신가능");
  expect(keywordUrl.searchParams.has("status")).toBe(false);
  expect(new Headers((keywordOptions as RequestInit).headers).get("Authorization")).toBe("Bearer admin.jwt");

  fireEvent.click(screen.getByRole("button", { name: "수신 가능" }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  const statusUrl = new URL(String(fetchMock.mock.calls[2][0]));
  expect(statusUrl.searchParams.get("keyword")).toBe("수신가능");
  expect(statusUrl.searchParams.get("status")).toBe("READY");
});

test("shows an error when kakao recipient lookup fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "INTERNAL_ERROR",
    data: null,
    message: "조회 실패",
    success: false,
  }), { headers: { "Content-Type": "application/json" }, status: 500 })));

  renderRoute("/notifications/kakao-recipients");

  expect(await screen.findByRole("alert")).toHaveTextContent("카카오 수신 현황 조회에 실패했습니다.");
});
