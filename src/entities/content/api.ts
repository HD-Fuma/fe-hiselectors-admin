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

export interface ContentCollectionBatchResponse {
  generationId: number;
  generationName: string;
  targetAccountCount: number;
  succeededAccountCount: number;
  failedAccountCount: number;
  savedContentCount: number;
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
