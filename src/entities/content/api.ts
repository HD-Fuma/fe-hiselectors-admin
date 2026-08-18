const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080")
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

export interface ContentCollectionBatchResponse {
  generationId: number;
  generationName: string;
  targetAccountCount: number;
  succeededAccountCount: number;
  failedAccountCount: number;
  savedContentCount: number;
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

export async function collectContentBatch(): Promise<ContentCollectionBatchResponse> {
  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);

  const response = await fetch(`${API_BASE_URL}/api/admin/content-collections`, {
    headers,
    method: "POST",
  });

  let result: ApiResult<ContentCollectionBatchResponse>;
  try {
    result = await response.json() as ApiResult<ContentCollectionBatchResponse>;
  } catch {
    throw new Error("콘텐츠 수집에 실패했습니다.");
  }

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || "콘텐츠 수집에 실패했습니다.");
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
