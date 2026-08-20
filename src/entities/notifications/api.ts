import type {
  ApiResult,
  NotificationHistoryItem,
  NotificationHistoryRequest,
  SpringPage,
} from "./model";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080")
  .replace(/\/$/, "");
const AUTH_STORAGE_KEY = "selectors-auth";

interface StoredAuthSession {
  accessToken?: unknown;
  tokenType?: unknown;
}

function authorizationHeader() {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedSession) return null;

  try {
    const session = JSON.parse(storedSession) as StoredAuthSession;
    if (typeof session.accessToken !== "string" || !session.accessToken) return null;

    const tokenType = typeof session.tokenType === "string" && session.tokenType
      ? session.tokenType
      : "Bearer";
    return `${tokenType} ${session.accessToken}`;
  } catch {
    return null;
  }
}

async function errorMessage(response: Response, fallbackMessage: string) {
  try {
    const result = await response.json() as Partial<ApiResult<unknown>>;
    return typeof result.message === "string" && result.message.trim()
      ? result.message
      : fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function authenticatedHeaders() {
  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);
  return headers;
}

export async function getNotificationHistory(
  request: NotificationHistoryRequest,
  signal?: AbortSignal,
): Promise<SpringPage<NotificationHistoryItem>> {
  const searchParams = new URLSearchParams({
    page: String(request.page),
    size: String(request.size),
  });
  if (request.purpose) searchParams.set("purpose", request.purpose);
  if (request.status) searchParams.set("status", request.status);
  if (request.from) searchParams.set("from", request.from);
  if (request.to) searchParams.set("to", request.to);
  if (request.recipientKeyword) searchParams.set("recipientKeyword", request.recipientKeyword);

  const response = await fetch(
    `${API_BASE_URL}/api/admin/notifications?${searchParams.toString()}`,
    { headers: authenticatedHeaders(), signal },
  );
  if (!response.ok) {
    throw new Error(await errorMessage(response, "알림 및 메시지 내역을 불러오지 못했습니다."));
  }

  const result = await response.json() as ApiResult<SpringPage<NotificationHistoryItem>>;
  if (!result.success || !result.data) {
    throw new Error(result.message || "알림 및 메시지 내역을 불러오지 못했습니다.");
  }
  return result.data;
}

export async function resendNotification(notificationId: number) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/notifications/${notificationId}/resend`,
    { headers: authenticatedHeaders(), method: "POST" },
  );
  if (!response.ok) {
    throw new Error(await errorMessage(response, "메시지를 재발송하지 못했습니다."));
  }

  const result = await response.json() as ApiResult<unknown>;
  if (!result.success) {
    throw new Error(result.message || "메시지를 재발송하지 못했습니다.");
  }
}
