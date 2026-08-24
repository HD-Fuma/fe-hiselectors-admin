import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import type { SpringPage, TaskRun, TaskRunPanel } from "./model";

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

function requestHeaders() {
  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);
  return headers;
}

async function readApiResult<T>(response: Response, fallbackMessage: string) {
  let result: ApiResult<T>;
  try {
    const body: unknown = await response.json();
    if (
      body == null
      || typeof body !== "object"
      || !("success" in body)
      || typeof body.success !== "boolean"
      || !("message" in body)
      || (body.message !== null && typeof body.message !== "string")
      || !("data" in body)
    ) {
      throw new Error();
    }
    result = body as ApiResult<T>;
  } catch {
    throw new Error(fallbackMessage);
  }
  if (!response.ok || !result.success || result.data == null) {
    throw new Error(result.message || fallbackMessage);
  }
  return result.data;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

export async function getTaskRunPanel(signal?: AbortSignal): Promise<TaskRunPanel> {
  const response = await adminFetch(`${API_BASE_URL}/api/admin/task-runs/panel`, {
    headers: requestHeaders(),
    signal,
  });
  const data = await readApiResult<TaskRunPanel>(
    response,
    "작업 목록을 불러오지 못했습니다.",
  );
  if (!Array.isArray(data.items) || typeof data.serverTime !== "string") {
    throw new Error("작업 목록을 불러오지 못했습니다.");
  }
  return data;
}

export async function getRecentTaskRuns(
  page: number,
  signal?: AbortSignal,
): Promise<SpringPage<TaskRun>> {
  const search = new URLSearchParams({
    page: String(Math.max(0, page - 1)),
    size: "20",
  });
  const response = await adminFetch(
    `${API_BASE_URL}/api/admin/task-runs/recent?${search}`,
    { headers: requestHeaders(), signal },
  );
  const data = await readApiResult<SpringPage<TaskRun>>(
    response,
    "작업 실행 이력을 불러오지 못했습니다.",
  );

  if (
    !Array.isArray(data.content)
    || !isNonNegativeInteger(data.number)
    || !isPositiveInteger(data.size)
    || !isNonNegativeInteger(data.totalElements)
    || !isNonNegativeInteger(data.totalPages)
  ) {
    throw new Error("작업 실행 이력을 불러오지 못했습니다.");
  }
  return data;
}
