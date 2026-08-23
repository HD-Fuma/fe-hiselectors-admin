import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";

export type ApplicationSnsCode = "INSTAGRAM" | "YOUTUBE";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ApplicationMediaCollectionStatus = "PENDING" | "DONE" | "FAILED";
export type ApplicationAnalysisStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "FAILED";
export type ApplicationContentType = "SHORT_FORM" | "LONG_FORM" | "SHORTS" | "FEED";
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
  followerCount: number | null;
  status: ApplicationStatus;
  mediaCollectionStatus: ApplicationMediaCollectionStatus;
  appliedAt: string;
  mediaCollectedAt: string | null;
  updatedAt: string;
}

export interface AdminApplicationSummary extends AdminApplicationIdentity {
  engagementRate: number | null;
  totalContentCount: number | null;
  recent90DayContentCount: number | null;
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
  contentType: ApplicationContentType | null;
  sequenceNo: number;
  publishedAt: string | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  collectedAt: string;
}

export interface AdminApplicationDetail extends AdminApplicationIdentity {
  analysisStatus: ApplicationAnalysisStatus;
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
  warning: string;
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
  minimumCriteriaOnly?: boolean;
  page: number;
  size: number;
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
