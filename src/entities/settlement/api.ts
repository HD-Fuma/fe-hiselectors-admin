import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import type {
  ApiResult,
  SettlementEstimate,
  SettlementEstimateRequest,
  SettlementSelectorDetail,
  SpringPage,
} from "./model";

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

export async function getSettlementEstimates(
  request: SettlementEstimateRequest,
  signal?: AbortSignal,
): Promise<SpringPage<SettlementEstimate>> {
  const searchParams = new URLSearchParams({
    page: String(request.page),
    size: String(request.size),
  });

  if (request.activityMonth) searchParams.set("activityMonth", request.activityMonth);
  if (request.status) searchParams.set("status", request.status);

  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);

  const response = await adminFetch(
    `${API_BASE_URL}/api/admin/settlements/estimates?${searchParams.toString()}`,
    { headers, signal },
  );

  if (!response.ok) {
    throw new Error(await errorMessage(response, "정산 내역 조회에 실패했습니다."));
  }

  const result = await response.json() as ApiResult<SpringPage<SettlementEstimate>>;
  if (!result.success || !result.data) {
    throw new Error(result.message || "정산 내역 조회에 실패했습니다.");
  }

  return result.data;
}

export async function getSettlementSelectorDetail(
  selectorsId: number,
  signal?: AbortSignal,
): Promise<SettlementSelectorDetail> {
  const searchParams = new URLSearchParams({ page: "0", size: "12" });
  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);

  const response = await adminFetch(
    `${API_BASE_URL}/api/admin/settlements/selectors/${selectorsId}/detail?${searchParams.toString()}`,
    { headers, signal },
  );

  if (!response.ok) {
    throw new Error(await errorMessage(response, "셀렉터스 상세 정보 조회에 실패했습니다."));
  }

  const result = await response.json() as ApiResult<SettlementSelectorDetail>;
  if (!result.success || !result.data) {
    throw new Error(result.message || "셀렉터스 상세 정보 조회에 실패했습니다.");
  }

  return result.data;
}
