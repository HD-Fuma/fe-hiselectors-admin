import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";

export type ApplicationSnsCode = "INSTAGRAM" | "YOUTUBE";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ApplicationMediaCollectionStatus = "PENDING" | "DONE" | "FAILED";
export type ApplicationAnalysisStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "FAILED";
export type ApplicationContentType = "SHORT_FORM" | "LONG_FORM" | "SHORTS" | "FEED";
export type ApplicationMediaType = "IMAGE" | "VIDEO";
export type ApplicationContentFormat = ApplicationContentType | "UNKNOWN";
export type ApplicationRepresentativeContentType = "SHORT_FORM" | "FEED" | "LONG_FORM";

export interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminApplicationIdentity {
  id: number;
  userId: number;
  hiId: string;
  applicantName: string;
  email: string;
  phone: string;
  generationId: number;
  generationName: string;
  snsCode: ApplicationSnsCode;
  snsAccountId: string;
  snsDisplayName: string | null;
  followerCount: number | null;
  status: ApplicationStatus;
  mediaCollectionStatus: ApplicationMediaCollectionStatus;
  appliedAt: string;
  mediaCollectedAt: string | null;
  updatedAt: string;
}

export interface AdminApplicationSummary extends AdminApplicationIdentity {
  profileImageUrl: string | null;
  engagementRate: number | null;
  totalContentCount: number | null;
  recent90DayContentCount: number | null;
  lastPublishedAt: string | null;
}

export interface ApplicationMetricValue {
  value: number | null;
  sampleCount: number;
}

export interface ApplicationCadence {
  sampleCount: number;
  dailyAverage: number | null;
  weeklyAverage: number | null;
  maximumGapDays: number | null;
}

export interface ApplicationContentFormatCount {
  contentType: ApplicationContentFormat;
  count: number;
}

export interface ApplicationMetrics {
  analysisWindowDays: number;
  totalContentCount: number | null;
  recent90DayContentCount: number | null;
  lastPublishedAt: string | null;
  uploadCadence: ApplicationCadence;
  averageViewCount: ApplicationMetricValue;
  averageLikeCount: ApplicationMetricValue;
  averageCommentCount: ApplicationMetricValue;
  engagementRate: ApplicationMetricValue;
  contentFormats: ApplicationContentFormatCount[];
  viewCountPercentile: number | null;
  likeCountPercentile: number | null;
  commentCountPercentile: number | null;
}

export interface ApplicationContent {
  id: number;
  applicationId: number;
  snsCode: ApplicationSnsCode;
  snsContentId: string;
  contentUrl: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  contentType: ApplicationContentType | null;
  mediaType: ApplicationMediaType;
  title: string | null;
  caption: string | null;
  description: string | null;
  sequenceNo: number;
  publishedAt: string | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  collectedAt: string;
}

export interface AdminApplicationDetail extends AdminApplicationIdentity {
  analysisStatus: ApplicationAnalysisStatus;
  profileImageUrl: string | null;
  metrics: ApplicationMetrics;
  contents: ApplicationContent[];
}

export interface AdminApplicationAiReport {
  applicationId: number;
  summary: string;
  category: string;
  keywords: string[];
  contentStyle: string;
  tone: string;
  strength: string;
  cautions: string;
  risks: string;
  brandHistory: string;
  status: string;
  createdAt: string;
  representativeContentUrl: string | null;
  representativeContentType: ApplicationRepresentativeContentType | null;
  representativeViewCount: number | null;
  representativeCategory: string | null;
  representativeKeywords: string[] | null;
}

export interface AdminApplicationSearchRequest {
  keyword?: string;
  snsCode?: ApplicationSnsCode;
  status?: ApplicationStatus;
  generationId?: number;
  hasAiReport?: boolean;
  minimumCriteriaOnly?: boolean;
  page: number;
  size: number;
}

export interface AdminApplicationTestCreateResponse {
  id: number;
}

function headers(json = false) {
  const result = new Headers();
  if (json) result.set("Content-Type", "application/json");
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
  return result;
}

async function errorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json() as { message?: unknown };
    return typeof body.message === "string" && body.message.trim() ? body.message : fallback;
  } catch { return fallback; }
}

async function request<T>(
  path: string,
  fallback: string,
  signal?: AbortSignal,
  init?: RequestInit,
) {
  const response = await adminFetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: headers(init?.body !== undefined),
    signal,
  });
  if (!response.ok) throw new Error(await errorMessage(response, fallback));

  const body = await response.json() as {
    data?: T | null;
    message?: string | null;
    success?: boolean;
  };
  if (!body.success || body.data == null) throw new Error(body.message || fallback);
  return body.data;
}

function query(input: AdminApplicationSearchRequest) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export function getAdminApplications(input: AdminApplicationSearchRequest, signal?: AbortSignal) {
  return request<SpringPage<AdminApplicationSummary>>(
    `/api/admin/applications?${query(input)}`,
    "지원자 목록 조회에 실패했습니다.",
    signal,
  );
}

export function createAdminApplicationTest(profileUrl: string) {
  return request<AdminApplicationTestCreateResponse>(
    "/api/admin/applications/test",
    "테스트 지원자 생성에 실패했습니다.",
    undefined,
    { method: "POST", body: JSON.stringify({ profileUrl }) },
  );
}

export function getAdminApplication(id: number, signal?: AbortSignal) {
  return request<AdminApplicationDetail>(
    `/api/admin/applications/${id}`,
    "지원자 상세 조회에 실패했습니다.",
    signal,
  );
}

export async function getAdminApplicationAiReport(id: number, signal?: AbortSignal) {
  try {
    return await request<AdminApplicationAiReport>(
      `/api/admin/applications/${id}/ai-report`,
      "AI 리포트 조회에 실패했습니다.",
      signal,
    );
  } catch (reason) {
    if (!(reason instanceof DOMException && reason.name === "AbortError")) {
      console.error(`[ai-report] applicationId=${id}`, reason);
    }
    return null;
  }
}

export function updateAdminApplicationStatus(id: number, status: Exclude<ApplicationStatus, "PENDING">) {
  return request<{ id: number; status: ApplicationStatus }>(
    `/api/admin/applications/${id}/status`,
    "지원자 심사 처리에 실패했습니다.",
    undefined,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

const applicationDetailCache = new Map<number, Promise<AdminApplicationDetail>>();
const applicationAiReportCache = new Map<number, Promise<AdminApplicationAiReport | null>>();

/** 목록에서 행에 마우스를 올렸을 때 상세·AI 리포트를 미리 요청해 캐시해 둔다. 이미 요청 중이거나 캐시돼 있으면 아무 것도 하지 않는다. */
export function prefetchAdminApplication(id: number) {
  if (!applicationDetailCache.has(id)) {
    const request = getAdminApplication(id).catch((reason: unknown) => {
      applicationDetailCache.delete(id);
      throw reason;
    });
    applicationDetailCache.set(id, request);
  }
  if (!applicationAiReportCache.has(id)) {
    applicationAiReportCache.set(id, getAdminApplicationAiReport(id));
  }
}

export function getCachedAdminApplication(id: number) {
  return applicationDetailCache.get(id) ?? null;
}

export function getCachedAdminApplicationAiReport(id: number) {
  return applicationAiReportCache.get(id) ?? null;
}

export function invalidateAdminApplicationCache(id: number) {
  applicationDetailCache.delete(id);
  applicationAiReportCache.delete(id);
}

/** 테스트 간 격리를 위한 캐시 초기화. 프로덕션 코드에서는 사용하지 않는다. */
export function resetAdminApplicationCache() {
  applicationDetailCache.clear();
  applicationAiReportCache.clear();
}
