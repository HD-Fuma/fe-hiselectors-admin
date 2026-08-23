const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://api.hiselectors.shop")
  .replace(/\/$/, "");
const AUTH_STORAGE_KEY = "selectors-auth";

interface StoredAuthSession {
  accessToken?: unknown;
  tokenType?: unknown;
}

interface ApiResult<T> {
  code: string;
  data: T | null;
  message: string | null;
  success: boolean;
}

export type ContentInspectionSnsCode = "INSTAGRAM" | "YOUTUBE";
export type CollectedContentType = "SHORT_FORM" | "LONG_FORM" | "SHORTS" | "FEED";

export interface CollectedContentMedia {
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string | null;
  snsMediaId: string | null;
  sequenceNo: number;
}

export interface CollectedContent {
  accountId: string;
  contentId: number;
  contentType: CollectedContentType;
  contentUrl: string;
  generationName: string;
  inspectedAt: string | null;
  inspectionStatus: string | null;
  latestVersionId: number;
  latestVersionNo: number;
  latestVersionStoredAt: string;
  media: CollectedContentMedia[];
  profileImageUrl: string | null;
  selectorsId: number;
  selectorsNickname: string | null;
  snsCode: ContentInspectionSnsCode;
  snsContentId: string;
  storedAt: string;
  texts: string[];
}

interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ContentBatchRunResponse {
  newContentCount: number;
  engagementCount: number;
  newContentSucceeded: boolean;
  storedContentSucceeded: boolean;
}

export type ContentVersionInspectionStatus =
  | "PENDING"
  | "INSPECTING"
  | "COMPLETED"
  | "FAILED";

export type ContentViolationType =
  | "AD_DISCLOSURE_INVALID"
  | "AFFILIATE_LINK_INVALID"
  | "ABUSIVE_LANGUAGE"
  | "HATE_DISCRIMINATION"
  | "VIOLENCE_THREAT"
  | "SEXUAL_CONTENT"
  | "POLITICAL_CONTENT"
  | "SOCIAL_CONTROVERSY"
  | "FALSE_EXAGGERATED_CLAIM"
  | "BRAND_REPUTATION_DAMAGE";

export type ContentViolationItemStatus =
  | "PENDING"
  | "VIOLATION_CONFIRMED"
  | "EDIT_REQUESTED"
  | "DISMISSED"
  | "RESOLVED";

export type ContentEvidenceMediaType = "TEXT" | "IMAGE" | "VIDEO";

export interface ContentBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ContentEvidenceLocation {
  bbox: ContentBoundingBox | null;
  contentMediaId: number | null;
  endIndex: number | null;
  endTime: number | null;
  excerpt: string | null;
  mediaType: ContentEvidenceMediaType;
  startIndex: number | null;
  startTime: number | null;
}

export interface ContentViolationEvidence {
  confidence: number;
  locations: ContentEvidenceLocation[];
  reason: string;
}

export interface ContentViolation {
  evidence: ContentViolationEvidence | null;
  status: ContentViolationItemStatus;
  violationItemId: number;
  violationType: ContentViolationType;
  violationTypeDescription: string;
}

export interface ContentReport {
  contentReportId: number;
  flow: string | null;
  overallAssessment: string | null;
  purpose: string | null;
  summary: string | null;
}

export interface ContentVersionSummary {
  contentVersionId: number;
  createdAt: string;
  inspectedAt: string | null;
  inspectionStatus: ContentVersionInspectionStatus;
  versionNo: number;
}

export interface ContentVersionDetail extends ContentVersionSummary {
  contentReport: ContentReport | null;
  texts: string[];
  violations: ContentViolation[];
}

export interface ContentDetail {
  contentId: number;
  contentType: CollectedContentType;
  contentUrl: string;
  selectedVersion: ContentVersionDetail;
  selectorsId: number;
  snsCode: ContentInspectionSnsCode;
  snsContentId: string;
  storedAt: string;
  versions: ContentVersionSummary[];
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

export async function runContentBatch(): Promise<ContentBatchRunResponse> {
  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);

  const response = await fetch(`${API_BASE_URL}/api/admin/content-batch/run`, {
    headers,
    method: "POST",
  });

  let result: ApiResult<ContentBatchRunResponse>;
  try {
    result = await response.json() as ApiResult<ContentBatchRunResponse>;
  } catch {
    throw new Error("콘텐츠 배치 실행에 실패했습니다.");
  }

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || "콘텐츠 배치 실행에 실패했습니다.");
  }

  return result.data;
}

async function getCurrentGenerationContentPage(page: number, signal?: AbortSignal) {
  const searchParams = new URLSearchParams({ page: String(page), size: "100" });
  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);

  const response = await fetch(
    `${API_BASE_URL}/api/admin/contents?${searchParams.toString()}`,
    { headers, signal },
  );
  if (!response.ok) {
    throw new Error(await errorMessage(response, "콘텐츠 목록 조회에 실패했습니다."));
  }

  const result = await response.json() as ApiResult<SpringPage<CollectedContent>>;
  if (!result.success || !result.data) {
    throw new Error(result.message || "콘텐츠 목록 조회에 실패했습니다.");
  }
  return result.data;
}

export async function getCurrentGenerationContents(signal?: AbortSignal) {
  const contents: CollectedContent[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const result = await getCurrentGenerationContentPage(page, signal);
    contents.push(...result.content);
    totalPages = result.totalPages;
    page += 1;
  }

  return contents;
}

async function fetchContentDetail(path: string, signal?: AbortSignal) {
  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);

  const response = await fetch(`${API_BASE_URL}${path}`, { headers, signal });
  if (!response.ok) {
    throw new Error(await errorMessage(response, "콘텐츠 상세 조회에 실패했습니다."));
  }

  const result = await response.json() as ApiResult<ContentDetail>;
  if (!result.success || !result.data?.selectedVersion) {
    throw new Error(result.message || "콘텐츠 상세 조회에 실패했습니다.");
  }
  return result.data;
}

export function getContentDetail(contentId: number, signal?: AbortSignal) {
  return fetchContentDetail(`/api/admin/contents/${contentId}`, signal);
}

export function getContentVersionDetail(
  contentId: number,
  contentVersionId: number,
  signal?: AbortSignal,
) {
  return fetchContentDetail(
    `/api/admin/contents/${contentId}/versions/${contentVersionId}`,
    signal,
  );
}
