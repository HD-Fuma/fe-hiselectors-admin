import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";

export interface DiscoveryKeyword {
  id: number;
  keyword: string;
  enabled: boolean;
  priority: number;
  lastRunAt: string | null;
}

export interface DiscoveryCategory {
  id: number;
  code: string;
  name: string;
  displayOrder: number;
  enabled: boolean;
  keywords: DiscoveryKeyword[];
}

export interface DiscoveryCategoryCreateRequest {
  code: string;
  name: string;
  displayOrder: number;
}

export interface DiscoveryCategoryUpdateRequest {
  name: string;
  displayOrder: number;
  enabled: boolean;
}

export interface DiscoveryKeywordCreateRequest {
  keyword: string;
  priority: number;
}

export interface DiscoveryKeywordUpdateRequest {
  enabled: boolean;
  priority: number;
}

export interface DiscoveryKeywordCreateResponse {
  keyword: DiscoveryKeyword;
  warnings: string[];
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

async function errorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json() as { message?: unknown };
    return typeof body.message === "string" && body.message.trim() ? body.message : fallback;
  } catch { return fallback; }
}

async function request<T>(path: string, init: RequestInit = {}, fallback = "요청에 실패했습니다.") {
  const response = await adminFetch(`${API_BASE_URL}${path}`, { ...init, headers: init.headers ?? headers() });
  if (!response.ok) throw new Error(await errorMessage(response, fallback));
  const body = await response.json() as { data?: T | null; message?: string | null; success?: boolean };
  if (!body.success || body.data == null) throw new Error(body.message || fallback);
  return body.data;
}

async function requestEmpty(path: string, fallback: string) {
  const response = await adminFetch(`${API_BASE_URL}${path}`, { method: "DELETE", headers: headers() });
  if (!response.ok) throw new Error(await errorMessage(response, fallback));
}

export function getDiscoveryCategories(signal?: AbortSignal) {
  return request<DiscoveryCategory[]>(
    "/api/admin/categories",
    { signal },
    "발굴 카테고리 조회에 실패했습니다.",
  );
}

export function createDiscoveryCategory(body: DiscoveryCategoryCreateRequest) {
  return request<DiscoveryCategory>(
    "/api/admin/categories",
    { method: "POST", headers: headers(true), body: JSON.stringify(body) },
    "카테고리 생성에 실패했습니다.",
  );
}

export function updateDiscoveryCategory(id: number, body: DiscoveryCategoryUpdateRequest) {
  return request<DiscoveryCategory>(
    `/api/admin/categories/${id}`,
    { method: "PATCH", headers: headers(true), body: JSON.stringify(body) },
    "카테고리 수정에 실패했습니다.",
  );
}

export function deleteDiscoveryCategory(id: number) {
  return requestEmpty(`/api/admin/categories/${id}`, "카테고리 삭제에 실패했습니다.");
}

export function createDiscoveryKeyword(categoryId: number, body: DiscoveryKeywordCreateRequest) {
  return request<DiscoveryKeywordCreateResponse>(
    `/api/admin/categories/${categoryId}/keywords`,
    { method: "POST", headers: headers(true), body: JSON.stringify(body) },
    "키워드 생성에 실패했습니다.",
  );
}

export function updateDiscoveryKeyword(
  categoryId: number,
  keywordId: number,
  body: DiscoveryKeywordUpdateRequest,
) {
  return request<DiscoveryKeyword>(
    `/api/admin/categories/${categoryId}/keywords/${keywordId}`,
    { method: "PATCH", headers: headers(true), body: JSON.stringify(body) },
    "키워드 수정에 실패했습니다.",
  );
}

export function deleteDiscoveryKeyword(categoryId: number, keywordId: number) {
  return requestEmpty(
    `/api/admin/categories/${categoryId}/keywords/${keywordId}`,
    "키워드 삭제에 실패했습니다.",
  );
}
