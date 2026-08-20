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
  followerCount: number | null;
  profileImageUrl: string | null;
  createdAt: string;
}

export interface SelectorGeneration {
  generationId: number;
  generationName: string;
  startDate: string;
  endDate: string;
  status: string;
  joinedAt: string;
}

export interface SelectorSnsAccount {
  id: number;
  snsCode: SelectorSnsCode | null;
  accountId: string | null;
  followerCount: number | null;
  profileImageUrl: string | null;
  lastCollectedAt: string | null;
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
  generations: SelectorGeneration[];
  snsAccounts: SelectorSnsAccount[];
}

export interface SelectorSearchRequest {
  roleId?: string;
  generationId?: number;
  nickname?: string;
  snsCode?: SelectorSnsCode;
  page: number;
  size: number;
}

export interface SelectorFilterGeneration {
  id: number;
  generationName: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

function headers() {
  const result = new Headers();
  const stored = localStorage.getItem("selectors-auth");
  if (!stored) return result;

  try {
    const session = JSON.parse(stored) as { accessToken?: unknown; tokenType?: unknown };
    if (typeof session.accessToken === "string" && session.accessToken) {
      const tokenType = typeof session.tokenType === "string" && session.tokenType
        ? session.tokenType
        : "Bearer";
      result.set("Authorization", `${tokenType} ${session.accessToken}`);
    }
  } catch { /* malformed sessions are treated as signed out */ }
  return result;
}

async function message(response: Response, fallback: string) {
  try {
    const body = await response.json() as { message?: unknown };
    return typeof body.message === "string" && body.message.trim() ? body.message : fallback;
  } catch { return fallback; }
}

async function request<T>(path: string, fallback: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: headers(), signal });
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
    signal,
  );
}

export function getSelector(id: number, signal?: AbortSignal) {
  return request<SelectorDetail>(
    `/api/admin/selectors/${id}`,
    "셀렉터스 상세 조회에 실패했습니다.",
    signal,
  );
}

export function getSelectorFilterGenerations(signal?: AbortSignal) {
  return request<SelectorFilterGeneration[]>(
    "/api/admin/generations",
    "기수 목록 조회에 실패했습니다.",
    signal,
  );
}
