import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

const HISTORY_ITEM = {
  body: "안녕하세요. 선정 결과를 확인해 주세요.",
  channel: "KAKAO_MESSAGE",
  notificationId: 35,
  purposeCode: "SELECTION_APPROVED",
  receiver: "kakao-message-uuid",
  recipientHiId: "hi-selector",
  recipientName: "김하이",
  recipientStatus: "READY",
  recipientUserId: 12,
  referenceId: 99,
  requestAt: "2026-08-15T09:00:00",
  sentAt: null,
  status: "FAILED",
} as const;

const EMAIL_ITEM = {
  ...HISTORY_ITEM,
  body: "정산 계좌를 등록해 주세요.",
  channel: "EMAIL",
  notificationId: 36,
  purposeCode: "SETTLEMENT_MISSING",
  receiver: "creator@example.com",
  recipientHiId: "hi-creator",
  recipientName: "이메이",
} as const;

function historyResponse(content: readonly object[] = [HISTORY_ITEM]) {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      content,
      number: 0,
      size: 100,
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

test("filters notification history and resends a failed message after confirmation", async () => {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/resend")) {
      expect(init?.method).toBe("POST");
      return Promise.resolve(new Response(JSON.stringify({
        code: "OK",
        data: { notificationId: 35, status: "SENT" },
        message: null,
        success: true,
      }), { headers: { "Content-Type": "application/json" }, status: 200 }));
    }
    return Promise.resolve(historyResponse());
  });
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/notifications");

  await screen.findByRole("row", { name: /선정 승인/ });
  const results = screen.getByRole("region", { name: "알림 및 메시지 발송 내역" });
  expect(within(results).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "순번",
    "수신자",
    "발송 목적",
    "채널",
    "요청 시각",
    "발송 시각",
    "상태",
  ]);
  const dataRow = within(results).getByRole("row", { name: /선정 승인/ });
  expect(within(dataRow).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
    "1",
    "김하이 (hi-selector)",
    "선정 승인",
    "카카오 메시지",
    "2026. 8. 15. 오전 9:00",
    "-",
    "발송 실패",
  ]);

  const search = screen.getByRole("search", { name: "검색 조건" });
  expect(search.closest(".fuma-operations-search.fuma-settlement-search")).not.toBeNull();
  expect(within(search).getByText("발송 요청 기간")).toBeInTheDocument();
  expect(within(search).queryByLabelText("요청일 시작")).not.toBeInTheDocument();
  fireEvent.change(within(search).getByLabelText("발송 목적"), {
    target: { value: "SELECTION_APPROVED" },
  });
  fireEvent.change(within(search).getByLabelText("발송 요청 시작일"), {
    target: { value: "2026-08-01" },
  });
  fireEvent.change(within(search).getByLabelText("발송 요청 종료일"), {
    target: { value: "2026-08-31" },
  });
  fireEvent.change(within(search).getByLabelText("수신자 이름 또는 Hi ID"), {
    target: { value: "김하이" },
  });
  fireEvent.click(within(search).getByRole("button", { name: "조회" }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const [request, options] = fetchMock.mock.calls[1];
  const url = new URL(String(request));
  expect(url.pathname).toBe("/api/admin/notifications");
  expect(url.searchParams.get("purpose")).toBe("SELECTION_APPROVED");
  expect(url.searchParams.get("from")).toBe("2026-08-01");
  expect(url.searchParams.get("to")).toBe("2026-08-31");
  expect(url.searchParams.get("recipientKeyword")).toBe("김하이");
  expect(new Headers((options as RequestInit).headers).get("Authorization")).toBe("Bearer admin.jwt");

  fireEvent.click(within(results).getByRole("row", { name: /선정 승인/ }));
  const detail = await screen.findByRole("dialog", { name: "발송 내역 상세" });
  expect(within(detail).getByText(HISTORY_ITEM.body)).toBeInTheDocument();
  fireEvent.click(within(detail).getByRole("button", { name: "재발송" }));

  const confirmation = await screen.findByRole("dialog", { name: "메시지 재발송" });
  expect(screen.queryByRole("dialog", { name: "발송 내역 상세" })).not.toBeInTheDocument();
  expect(within(confirmation).getByText("김하이 (hi-selector)")).toBeInTheDocument();
  fireEvent.click(within(confirmation).getByRole("button", { name: "재발송" }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  expect(new URL(String(fetchMock.mock.calls[2][0])).pathname).toBe(
    "/api/admin/notifications/35/resend",
  );
  expect(new URL(String(fetchMock.mock.calls[3][0])).pathname).toBe("/api/admin/notifications");
});

test("filters loaded history by channel tab without calling the API again", async () => {
  const fetchMock = vi.fn().mockResolvedValue(historyResponse([HISTORY_ITEM, EMAIL_ITEM]));
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/notifications");
  const results = await screen.findByRole("region", { name: "알림 및 메시지 발송 내역" });
  expect(within(results).getByText("김하이 (hi-selector)")).toBeInTheDocument();
  expect(within(results).getByText("이메이 (hi-creator)")).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "발송 채널" })).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.has("channel")).toBe(false);

  fireEvent.click(screen.getByRole("button", { name: "이메일" }));
  expect(within(results).queryByText("김하이 (hi-selector)")).not.toBeInTheDocument();
  expect(within(results).getByText("이메이 (hi-creator)")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "카카오 메시지" }));
  expect(within(results).getByText("김하이 (hi-selector)")).toBeInTheDocument();
  expect(within(results).queryByText("이메이 (hi-creator)")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "전체" }));
  expect(within(results).getByText("김하이 (hi-selector)")).toBeInTheDocument();
  expect(within(results).getByText("이메이 (hi-creator)")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
