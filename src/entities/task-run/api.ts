import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import type { TaskRunPanel } from "./model";

const AUTH_STORAGE_KEY = "selectors-auth";

interface StoredAuthSession {
  accessToken?: unknown;
  tokenType?: unknown;
}

interface ApiResult<T> {
  success: boolean;
  message: string | null;
  data: T | null;
}

function authorizationHeader() {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
    const session = JSON.parse(stored) as StoredAuthSession;
    if (typeof session.accessToken !== "string" || !session.accessToken) return null;
    const tokenType = typeof session.tokenType === "string" && session.tokenType
      ? session.tokenType
      : "Bearer";
    return `${tokenType} ${session.accessToken}`;
  } catch {
    return null;
  }
}

export async function getTaskRunPanel(signal?: AbortSignal): Promise<TaskRunPanel> {
  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);
  const response = await adminFetch(`${API_BASE_URL}/api/admin/task-runs/panel`, {
    headers,
    signal,
  });
  let result: ApiResult<TaskRunPanel>;
  try {
    const body: unknown = await response.json();
    if (body == null || typeof body !== "object") throw new Error();
    result = body as ApiResult<TaskRunPanel>;
  } catch {
    throw new Error("작업 목록을 불러오지 못했습니다.");
  }
  if (!response.ok || !result.success || !result.data
      || !Array.isArray(result.data.items)
      || typeof result.data.serverTime !== "string") {
    throw new Error(result.message || "작업 목록을 불러오지 못했습니다.");
  }
  return result.data;
}
