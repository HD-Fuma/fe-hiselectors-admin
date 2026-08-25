import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";

export type SelectorSnsCode = "INSTAGRAM" | "YOUTUBE";

export interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface SelectorSummary {
  id: number;
  selectorsCode: string;
  nickname: string;
  roleId: string;
  roleName: string | null;
  snsCode: SelectorSnsCode | null;
  snsAccountId: string | null;
  snsDisplayName: string | null;
  followerCount: number | null;
  profileImageUrl: string | null;
  createdAt: string;
  /** 지원자 AI 리포트에서 확정된 대표 카테고리(코드 또는 라벨). */
  category?: string | null;
}

export interface SelectorGeneration {
  generationId: number;
  generationName: string;
  startDate: string | null;
  endDate: string | null;
  activityStartDate: string | null;
  activityEndDate: string | null;
  status: string;
  joinedAt: string | null;
  totalSales: number;
  confirmedPurchaseCount: number;
  paidCommissionAmount: number;
}

export interface SelectorSnsAccount {
  id: number;
  snsCode: SelectorSnsCode | null;
  accountId: string | null;
  followerCount: number | null;
  profileImageUrl: string | null;
  lastCollectedAt: string | null;
}

export interface SelectorContent {
  id: number;
  snsCode: SelectorSnsCode | null;
  contentUrl: string;
  title: string | null;
  contentType: string | null;
  createdAt: string;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
}

export interface SelectorPerformance {
  contentCount: number | null;
  totalViewCount: number | null;
  totalLikeCount: number | null;
  totalCommentCount: number | null;
}

export interface SelectorDetail {
  id: number;
  selectorsCode: string;
  nickname: string;
  roleId: string;
  roleName: string | null;
  applicationId: number | null;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
  snsVerifiedAt: string | null;
  privacyAgreedAt: string | null;
  alimtalkAgreed: boolean;
  generations: SelectorGeneration[];
  snsAccount: SelectorSnsAccount | null;
  totalPenaltyCount: number;
  activePenaltyCount: number;
  blacklistTarget: boolean;
  contents: SelectorContent[];
  performance: SelectorPerformance;
}

export interface SelectorSearchRequest {
  roleId?: string;
  generationId?: number;
  nickname?: string;
  snsCode?: SelectorSnsCode;
  page: number;
  size: number;
}

export interface SelectorSalesPerformance {
  confirmedOrderCount: number;
  excellentActivityType: string | null;
  excellentGenerationName: string | null;
  excellentGenerationSales: number | null;
  generationName: string | null;
  isExcellent: boolean;
  nickname: string;
  roleId: string;
  selectorCode: string;
  selectorId: number;
  totalSales: number;
}

export interface SelectorSalesPerformanceRequest {
  endDate?: string;
  keyword?: string;
  startDate?: string;
}

export interface SelectorFilterGeneration {
  id: number;
  generationName: string;
}

export type GenerationStatus = "ACTIVE" | "INACTIVE";

export interface Generation {
  id: number;
  generationName: string;
  startDate: string;
  endDate: string;
  activityStartDate: string;
  activityEndDate: string;
  status: GenerationStatus;
}

export interface GenerationSaveRequest {
  generationName: string;
  startDate: string;
  endDate: string;
  activityStartDate: string;
  activityEndDate: string;
}

function headers(json = false) {
  const result = new Headers();
  const stored = localStorage.getItem("selectors-auth");
  if (stored) {
    try {
      const session = JSON.parse(stored) as { accessToken?: unknown; tokenType?: unknown };
      if (typeof session.accessToken === "string" && session.accessToken) {
        const tokenType = typeof session.tokenType === "string" && session.tokenType
          ? session.tokenType
          : "Bearer";
        result.set("Authorization", `${tokenType} ${session.accessToken}`);
      }
    } catch { /* malformed sessions are treated as signed out */ }
  }
  if (json) result.set("Content-Type", "application/json");
  return result;
}

async function message(response: Response, fallback: string) {
  try {
    const body = await response.json() as { message?: unknown };
    return typeof body.message === "string" && body.message.trim() ? body.message : fallback;
  } catch { return fallback; }
}

async function request<T>(path: string, fallback: string, init: RequestInit = {}): Promise<T> {
  const response = await adminFetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: init.headers ?? headers(),
  });
  if (!response.ok) throw new Error(await message(response, fallback));

  const result = await response.json() as { data?: T | null; message?: string | null; success?: boolean };
  if (!result.success || result.data == null) throw new Error(result.message || fallback);
  return result.data;
}

function query(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export function getSelectors(input: SelectorSearchRequest, signal?: AbortSignal) {
  return request<SpringPage<SelectorSummary>>(
    `/api/admin/selectors?${query({ ...input })}`,
    "셀렉터스 목록 조회에 실패했습니다.",
    { signal },
  );
}

export function getSelector(id: number, signal?: AbortSignal) {
  return request<SelectorDetail>(
    `/api/admin/selectors/${id}`,
    "셀렉터스 상세 조회에 실패했습니다.",
    { signal },
  );
}

export function getSelectorFilterGenerations(signal?: AbortSignal) {
  return request<SelectorFilterGeneration[]>(
    "/api/admin/generations",
    "기수 목록 조회에 실패했습니다.",
    { signal },
  );
}

export function getGenerations(signal?: AbortSignal) {
  return request<Generation[]>(
    "/api/admin/generations",
    "기수 목록 조회에 실패했습니다.",
    { signal },
  );
}

export function createGeneration(body: GenerationSaveRequest) {
  return request<Generation>(
    "/api/admin/generations",
    "기수 생성에 실패했습니다.",
    { method: "POST", headers: headers(true), body: JSON.stringify(body) },
  );
}

export function updateGeneration(id: number, body: GenerationSaveRequest) {
  return request<Generation>(
    `/api/admin/generations/${id}`,
    "기수 수정에 실패했습니다.",
    { method: "PATCH", headers: headers(true), body: JSON.stringify(body) },
  );
}

export function updateGenerationStatus(id: number, status: GenerationStatus) {
  return request<Generation>(
    `/api/admin/generations/${id}/status`,
    "기수 상태 변경에 실패했습니다.",
    { method: "PATCH", headers: headers(true), body: JSON.stringify({ status }) },
  );
}

export function getSelectorSalesPerformance(
  input: SelectorSalesPerformanceRequest = {},
  signal?: AbortSignal,
) {
  const search = query({
    endDate: input.endDate,
    keyword: input.keyword,
    startDate: input.startDate,
  });

  return request<SelectorSalesPerformance[]>(
    `/api/admin/selector-performance${search ? `?${search}` : ""}`,
    "셀렉터스 성과 목록 조회에 실패했습니다.",
    { signal },
  );
}
