import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { resendNotification } from "../../entities/notifications";
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

function historyResponse() {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      content: [HISTORY_ITEM],
      number: 0,
      size: 20,
      totalElements: 1,
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
        data: {
          currentStep: null,
          failedCount: 0,
          processedCount: 0,
          progressPercent: null,
          runId: "kakao-resend-run-35",
          skippedCount: 0,
          startedBy: { adminId: 1, name: "관리자" },
          status: "QUEUED",
          succeededCount: 0,
          taskType: "KAKAO_MESSAGE_SEND",
          totalCount: null,
          triggerType: "ADMIN_TRIGGERED",
        },
        message: null,
        success: true,
      }), { headers: { "Content-Type": "application/json" }, status: 202 }));
    }
    return Promise.resolve(historyResponse());
  });
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/notifications");

  await screen.findByRole("row", { name: /선정 승인/ });
  const results = screen.getByRole("region", { name: "알림 및 메시지 발송 내역" });
  expect(within(results).getByText("선정 승인")).toBeInTheDocument();
  expect(within(results).getByText("김하이 (hi-selector)")).toBeInTheDocument();
  expect(within(results).getByText("발송 실패")).toBeInTheDocument();

  const search = screen.getByRole("search", { name: "검색 조건" });
  fireEvent.change(within(search).getByLabelText("발송 목적"), {
    target: { value: "SELECTION_APPROVED" },
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

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(new URL(String(fetchMock.mock.calls[2][0])).pathname).toBe(
    "/api/admin/notifications/35/resend",
  );
  const resendHeaders = new Headers((fetchMock.mock.calls[2][1] as RequestInit).headers);
  expect(resendHeaders.get("Authorization")).toBe("Bearer admin.jwt");
  expect(resendHeaders.get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/);
  const requested = await screen.findByRole("alertdialog", { name: "재발송 요청" });
  expect(requested).toHaveTextContent("메시지 재발송을 요청했습니다.");
  expect(requested).toHaveTextContent("작업 진행상황에서 확인해 주세요.");
});

test("uses request wording when the resend API rejects without a server message", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

  await expect(resendNotification(35)).rejects.toThrow("메시지 재발송 요청에 실패했습니다.");
});

test("uses request wording when resend fails without an Error", async () => {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => (
    new URL(String(input)).pathname.endsWith("/resend")
      ? Promise.reject(null)
      : Promise.resolve(historyResponse())
  ));
  vi.stubGlobal("fetch", fetchMock);
  renderRoute("/notifications");

  const results = await screen.findByRole("region", { name: "알림 및 메시지 발송 내역" });
  fireEvent.click(within(results).getByRole("row", { name: /선정 승인/ }));
  const detail = await screen.findByRole("dialog", { name: "발송 내역 상세" });
  fireEvent.click(within(detail).getByRole("button", { name: "재발송" }));
  const confirmation = await screen.findByRole("dialog", { name: "메시지 재발송" });
  fireEvent.click(within(confirmation).getByRole("button", { name: "재발송" }));

  expect(await within(confirmation).findByRole("alert"))
    .toHaveTextContent("메시지 재발송 요청에 실패했습니다.");
});
