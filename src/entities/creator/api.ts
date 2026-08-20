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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080")
  .replace(/\/$/, "");

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

export async function getCreators(input: CreatorSearchRequest, signal?: AbortSignal) {
  const response = await fetch(
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
