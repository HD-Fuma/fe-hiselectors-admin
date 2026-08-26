import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import type {
  SpringPage,
  TaskRun,
  TaskRunPanel,
  TaskRunProgressEvent,
  TaskRunProgressStreamOutcome,
} from "./model";

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

function isTaskRunProgressEvent(value: unknown): value is TaskRunProgressEvent {
  if (value == null || typeof value !== "object") return false;
  const keys = Object.keys(value);
  if (
    keys.length !== 4
    || !keys.includes("runId")
    || !keys.includes("stepKey")
    || !keys.includes("totalCount")
    || !keys.includes("processedCount")
  ) return false;
  const event = value as Partial<TaskRunProgressEvent>;
  return typeof event.runId === "string"
    && event.runId.trim().length > 0
    && (event.stepKey === "NEW_CONTENT_SYNC" || event.stepKey === "STORED_CONTENT_SYNC")
    && (event.totalCount === null || isNonNegativeInteger(event.totalCount))
    && isNonNegativeInteger(event.processedCount)
    && (event.totalCount === null || event.processedCount <= event.totalCount);
}

async function dispatchStreamFrame(
  eventName: string,
  dataLines: readonly string[],
  onEvent: (event: TaskRunProgressEvent) => void | Promise<void>,
  onChanged?: () => void | Promise<void>,
) {
  if (dataLines.length === 0) return;
  if (eventName === "task-run-changed") {
    if (dataLines.join("\n").trim().length > 0) await onChanged?.();
    return;
  }
  try {
    const value: unknown = JSON.parse(dataLines.join("\n"));
    if (eventName === "task-run-progress" && isTaskRunProgressEvent(value)) {
      await onEvent(value);
    }
  } catch {
    // A malformed frame does not invalidate the remaining stream.
  }
}

export async function streamTaskRunProgress(
  onEvent: (event: TaskRunProgressEvent) => void | Promise<void>,
  signal: AbortSignal,
  onChanged?: () => void | Promise<void>,
): Promise<TaskRunProgressStreamOutcome> {
  const headers = requestHeaders();
  headers.set("Accept", "text/event-stream");
  try {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/task-runs/stream`, {
      headers,
      signal,
    });
    if (!response.ok) {
      if (response.status === 401) {
        return { type: "terminal", reason: "unauthorized", status: 401 };
      }
      if (response.status === 403) {
        return { type: "terminal", reason: "forbidden", status: 403 };
      }
      return { type: "retryable", reason: "http", status: response.status };
    }
    const contentType = response.headers.get("Content-Type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase();
    if (contentType !== "text/event-stream") {
      return { type: "retryable", reason: "content-type" };
    }
    if (!response.body) return { type: "retryable", reason: "missing-body" };

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let eventName = "";
    let dataLines: string[] = [];

    const consumeLine = async (line: string) => {
      if (line === "") {
        await dispatchStreamFrame(eventName, dataLines, onEvent, onChanged);
        eventName = "";
        dataLines = [];
        return;
      }
      if (line.startsWith(":")) return;
      const separator = line.indexOf(":");
      const field = separator === -1 ? line : line.slice(0, separator);
      let fieldValue = separator === -1 ? "" : line.slice(separator + 1);
      if (fieldValue.startsWith(" ")) fieldValue = fieldValue.slice(1);
      if (field === "event") eventName = fieldValue;
      if (field === "data") dataLines.push(fieldValue);
    };

    const consumeBufferedLines = async (flush: boolean) => {
      while (true) {
        let lineEnd = -1;
        let delimiterLength = 0;
        for (let index = 0; index < buffer.length; index += 1) {
          const character = buffer[index];
          if (character === "\n") {
            lineEnd = index;
            delimiterLength = 1;
            break;
          }
          if (character !== "\r") continue;
          if (index === buffer.length - 1 && !flush) return;
          lineEnd = index;
          delimiterLength = buffer[index + 1] === "\n" ? 2 : 1;
          break;
        }
        if (lineEnd === -1) return;
        const line = buffer.slice(0, lineEnd);
        buffer = buffer.slice(lineEnd + delimiterLength);
        await consumeLine(line);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        await consumeBufferedLines(true);
        return { type: "retryable", reason: "eof" };
      }
      buffer += decoder.decode(value, { stream: true });
      await consumeBufferedLines(false);
    }
  } catch (error) {
    if (
      signal.aborted
      || (error instanceof DOMException && error.name === "AbortError")
    ) return { type: "terminal", reason: "aborted" };
    return { type: "retryable", reason: "network" };
  }
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

export async function getTaskRun(runId: string, signal?: AbortSignal): Promise<TaskRun> {
  const response = await adminFetch(
    `${API_BASE_URL}/api/admin/task-runs/${encodeURIComponent(runId)}`,
    { headers: requestHeaders(), signal },
  );
  return readApiResult<TaskRun>(response, "작업 상태를 불러오지 못했습니다.");
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
