import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import type {
  ApiResult,
  SettlementEstimate,
  SettlementEstimateRequest,
  SettlementEstimateSummary,
  SettlementEstimateSummaryRequest,
  SettlementSelectorDetail,
  SettlementStatus,
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

const COMBINED_STATUS_FETCH_SIZE = 1_000;

function authorizationHeaders() {
  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);
  return headers;
}

function requestedStatuses(request: {
  status?: SettlementStatus;
  statuses?: readonly SettlementStatus[];
}) {
  if (request.statuses && request.statuses.length > 0) return request.statuses;
  if (request.status) return [request.status];
  return undefined;
}

function mergeEstimatePages(
  pages: SpringPage<SettlementEstimate>[],
  page: number,
  size: number,
): SpringPage<SettlementEstimate> {
  const content = pages
    .flatMap((item) => item.content)
    .sort((left, right) => (
      left.selectorsId - right.selectorsId
      || left.settlementId - right.settlementId
    ));
  const start = page * size;

  return {
    content: content.slice(start, start + size),
    number: page,
    size,
    totalElements: content.length,
    totalPages: Math.ceil(content.length / size),
  };
}

async function fetchSettlementEstimatePage(
  request: {
    activityMonth?: string;
    page: number;
    selectorsId?: number;
    size: number;
    status?: SettlementStatus;
  },
  signal?: AbortSignal,
): Promise<SpringPage<SettlementEstimate>> {
  const searchParams = new URLSearchParams({
    page: String(request.page),
    size: String(request.size),
  });

  if (request.activityMonth) searchParams.set("activityMonth", request.activityMonth);
  if (request.selectorsId) searchParams.set("selectorsId", String(request.selectorsId));
  if (request.status) searchParams.set("status", request.status);

  const response = await adminFetch(
    `${API_BASE_URL}/api/admin/settlements/estimates?${searchParams.toString()}`,
    { headers: authorizationHeaders(), signal },
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

export async function getSettlementEstimates(
  request: SettlementEstimateRequest,
  signal?: AbortSignal,
): Promise<SpringPage<SettlementEstimate>> {
  const statuses = requestedStatuses(request);
  if (!statuses || statuses.length <= 1) {
    return fetchSettlementEstimatePage({
      activityMonth: request.activityMonth,
      page: request.page,
      selectorsId: request.selectorsId,
      size: request.size,
      status: statuses?.[0],
    }, signal);
  }

  const pages = await Promise.all(statuses.map((status) => fetchSettlementEstimatePage({
    activityMonth: request.activityMonth,
    page: 0,
    selectorsId: request.selectorsId,
    size: COMBINED_STATUS_FETCH_SIZE,
    status,
  }, signal)));

  return mergeEstimatePages(pages, request.page, request.size);
}

async function fetchSettlementEstimateSummary(
  request: SettlementEstimateSummaryRequest,
  signal?: AbortSignal,
): Promise<SettlementEstimateSummary> {
  const searchParams = new URLSearchParams();
  if (request.activityMonth) searchParams.set("activityMonth", request.activityMonth);
  if (request.selectorsId) searchParams.set("selectorsId", String(request.selectorsId));

  const response = await adminFetch(
    `${API_BASE_URL}/api/admin/settlements/estimates/summary?${searchParams.toString()}`,
    { headers: authorizationHeaders(), signal },
  );

  if (!response.ok) {
    throw new Error(await errorMessage(response, "정산 요약 조회에 실패했습니다."));
  }

  const result = await response.json() as ApiResult<SettlementEstimateSummary>;
  if (!result.success || !result.data) {
    throw new Error(result.message || "정산 요약 조회에 실패했습니다.");
  }

  return {
    ...result.data,
    monthlyTrend: result.data.monthlyTrend ?? [],
    statusDistribution: result.data.statusDistribution ?? [],
  };
}

export async function getSettlementEstimateSummary(
  request: SettlementEstimateSummaryRequest,
  signal?: AbortSignal,
): Promise<SettlementEstimateSummary> {
  return fetchSettlementEstimateSummary(request, signal);
}

export async function getSettlementSelectorDetail(
  selectorsId: number,
  signal?: AbortSignal,
): Promise<SettlementSelectorDetail> {
  const searchParams = new URLSearchParams({ page: "0", size: "12" });

  const response = await adminFetch(
    `${API_BASE_URL}/api/admin/settlements/selectors/${selectorsId}/detail?${searchParams.toString()}`,
    { headers: authorizationHeaders(), signal },
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
