import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";

export interface CreatorSummary {
  id: number;
  snsCode: "INSTAGRAM" | "YOUTUBE";
  accountId: string;
  creatorName: string | null;
  followerCount: number | null;
  engagementRate: number | null;
  lastContentAt: string | null;
  category: string | null;
  recent90DayContentCount: number | null;
}

export interface CreatorSearchRequest {
  keyword?: string;
  categoryCode?: string;
  snsCode?: string;
  minFollower?: number;
  maxFollower?: number;
  maxBrandScore?: number;
  minEngagementRate?: number;
  minRecent90DayContentCount?: number;
  page: number;
  size: number;
}

export interface CreatorPage {
  content: CreatorSummary[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreatorDetail {
  id: number;
  snsCode: "INSTAGRAM" | "YOUTUBE";
  accountId: string;
  creatorName: string | null;
  email: string;
  followerCount: number | null;
  engagementRate: number | null;
  lastContentAt: string | null;
  category: string | null;
}

export interface ProposalHistoryEntry {
  proposalHistoryId: number;
  creatorId: number;
  creatorName: string;
  snsCode: "INSTAGRAM" | "YOUTUBE";
  accountId: string;
  email: string;
  adminName: string;
  createdAt: string;
}

export interface ProposalHistoryPage {
  content: ProposalHistoryEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

function headers() {
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
  return result;
}

function query(input: CreatorSearchRequest) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  params.set("sort", "followerCount,desc");
  return params.toString();
}

async function request<T>(
  path: string,
  fallback: string,
  signal?: AbortSignal,
  init?: RequestInit,
) {
  const response = await adminFetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: init?.body !== undefined
      ? (() => { const h = headers(); h.set("Content-Type", "application/json"); return h; })()
      : headers(),
    signal,
  });
  const body = await response.json() as { data?: T | null; message?: string | null; success?: boolean };
  if (!response.ok || !body.success || body.data == null) throw new Error(body.message || fallback);
  return body.data;
}

export async function getCreators(input: CreatorSearchRequest, signal?: AbortSignal) {
  const response = await adminFetch(
    `${API_BASE_URL}/api/admin/creators?${query(input)}`,
    { headers: headers(), signal },
  );
  if (!response.ok) throw new Error("크리에이터 목록 조회에 실패했습니다.");
  const body = await response.json() as {
    data?: CreatorPage | null;
    message?: string | null;
    success?: boolean;
  };
  if (!body.success || body.data == null) {
    throw new Error(body.message || "크리에이터 목록 조회에 실패했습니다.");
  }
  return body.data;
}

export function getCreator(id: number, signal?: AbortSignal) {
  return request<CreatorDetail>(
    `/api/admin/creators/${id}`,
    "크리에이터 상세 조회에 실패했습니다.",
    signal,
  );
}

export function getAdminProposals(page: number, size: number, signal?: AbortSignal) {
  return request<ProposalHistoryPage>(
    `/api/admin/proposals?page=${page}&size=${size}`,
    "제안 이력 조회에 실패했습니다.",
    signal,
  );
}

export function postAdminProposal(
  creatorId: number,
  content?: { subject: string; body: string },
) {
  return request<ProposalHistoryEntry>(
    "/api/admin/proposals",
    "제안 메일 발송에 실패했습니다.",
    undefined,
    { method: "POST", body: JSON.stringify({ creatorId, ...content }) },
  );
}
