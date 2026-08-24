import type {
  ApiResult,
  KakaoRecipientItem,
  KakaoRecipientRequest,
  SpringPage,
} from "./model";
import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";

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

export async function getKakaoRecipients(
  request: KakaoRecipientRequest,
  signal?: AbortSignal,
): Promise<SpringPage<KakaoRecipientItem>> {
  const searchParams = new URLSearchParams({
    page: String(request.page),
    size: String(request.size),
  });
  if (request.keyword) searchParams.set("keyword", request.keyword);
  if (request.status) searchParams.set("status", request.status);

  const response = await adminFetch(
    `${API_BASE_URL}/api/admin/kakao/recipients?${searchParams.toString()}`,
    { headers: authenticatedHeaders(), signal },
  );
  if (!response.ok) {
    throw new Error(await errorMessage(response, "카카오 수신 현황을 불러오지 못했습니다."));
  }

  const result = await response.json() as ApiResult<SpringPage<KakaoRecipientItem>>;
  if (!result.success || !result.data) {
    throw new Error(result.message || "카카오 수신 현황을 불러오지 못했습니다.");
  }
  return result.data;
}
