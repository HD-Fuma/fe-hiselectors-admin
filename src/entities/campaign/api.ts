import type {
  Campaign,
  CampaignParticipant,
  CampaignSaveRequest,
  CampaignSearchRequest,
  CampaignProduct,
  ProductStatusCode,
  SpringPage,
} from "./model";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

function headers(json = false) {
  const result = new Headers();
  const stored = localStorage.getItem("selectors-auth");
  if (stored) {
    try {
      const session = JSON.parse(stored) as { accessToken?: unknown; tokenType?: unknown };
      if (typeof session.accessToken === "string" && session.accessToken) {
        result.set("Authorization", `${typeof session.tokenType === "string" && session.tokenType ? session.tokenType : "Bearer"} ${session.accessToken}`);
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

async function request<T>(path: string, init: RequestInit = {}, fallback = "요청에 실패했습니다."): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: init.headers ?? headers() });
  if (!response.ok) throw new Error(await message(response, fallback));
  return (await response.json() as { data: T }).data;
}

function query(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export function getCampaigns(input: CampaignSearchRequest, signal?: AbortSignal) {
  return request<SpringPage<Campaign>>(`/api/admin/campaigns?${query({ ...input })}`, { signal }, "캠페인 목록 조회에 실패했습니다.");
}

export function getCampaign(id: number, signal?: AbortSignal) {
  return request<Campaign>(`/api/admin/campaigns/${id}`, { signal }, "캠페인 상세 조회에 실패했습니다.");
}

export function getCampaignParticipants(id: number, page: number, size: number, signal?: AbortSignal) {
  return request<SpringPage<CampaignParticipant>>(`/api/admin/campaigns/${id}/participants?${query({ page, size })}`, { signal }, "참여 셀렉터스 조회에 실패했습니다.");
}

export function getProducts(input: { keyword?: string; status?: ProductStatusCode; page: number; size: number }, signal?: AbortSignal) {
  return request<SpringPage<CampaignProduct>>(`/api/admin/products?${query(input)}`, { signal }, "상품 조회에 실패했습니다.");
}

export function createCampaign(body: CampaignSaveRequest) {
  return request<Campaign>("/api/admin/campaigns", { method: "POST", headers: headers(true), body: JSON.stringify(body) }, "캠페인 생성에 실패했습니다.");
}

export function updateCampaign(id: number, body: CampaignSaveRequest) {
  return request<Campaign>(`/api/admin/campaigns/${id}`, { method: "PATCH", headers: headers(true), body: JSON.stringify(body) }, "캠페인 수정에 실패했습니다.");
}

export async function deleteCampaign(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/admin/campaigns/${id}`, { method: "DELETE", headers: headers() });
  if (!response.ok) throw new Error(await message(response, "캠페인 삭제에 실패했습니다."));
}
