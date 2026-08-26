import {
  getRecentTaskRuns,
  getTaskRun,
  getTaskRunPanel,
  streamTaskRunProgress,
} from "./api";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify({
    success: status < 400,
    code: status < 400 ? "OK" : "ERROR",
    message: status < 400 ? null : "작업 목록을 불러오지 못했습니다.",
    data: status < 400 ? data : null,
  }), { status, headers: { "Content-Type": "application/json" } });
}

function eventStream(chunks: readonly string[]) {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  }), { headers: { "Content-Type": "text/event-stream; charset=utf-8" } });
}

function progressFrame(value: unknown, eventName = "task-run-progress") {
  return `event: ${eventName}\ndata: ${JSON.stringify(value)}\n\n`;
}

describe("task run panel api", () => {
  beforeEach(() => {
    localStorage.setItem("selectors-auth", JSON.stringify({
      accessToken: "admin.jwt",
      tokenType: "Bearer",
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  test("loads the server panel DTO with authorization and abort signal", async () => {
    const panel = { items: [], serverTime: "2026-08-23T00:00:00Z" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(panel)));
    const controller = new AbortController();

    await expect(getTaskRunPanel(controller.signal)).resolves.toEqual(panel);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toMatch(/\/api\/admin\/task-runs\/panel$/);
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer admin.jwt");
    expect(init?.signal).toBe(controller.signal);
  });

  test("loads one task run by id", async () => {
    const run = { runId: "run/id", status: "SUCCEEDED" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(run)));

    await expect(getTaskRun("run/id")).resolves.toEqual(run);

    const [request] = vi.mocked(fetch).mock.calls[0];
    expect(new URL(String(request)).pathname).toBe("/api/admin/task-runs/run%2Fid");
  });

  test("rejects an unsuccessful or malformed API envelope", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(json(null, 500))
      .mockResolvedValueOnce(json({ items: "not-an-array", serverTime: null })));

    await expect(getTaskRunPanel()).rejects.toThrow("작업 목록을 불러오지 못했습니다.");
    await expect(getTaskRunPanel()).rejects.toThrow("작업 목록을 불러오지 못했습니다.");
  });

  test("loads one-based recent history as a zero-based Spring page", async () => {
    const taskRun = {
      runId: "task-run-1",
      taskType: "SETTLEMENT_CALCULATION",
      triggerType: "ADMIN_TRIGGERED",
      status: "SUCCEEDED",
      currentStep: null,
      progressMessage: "신규 1건",
      totalCount: 1,
      processedCount: 1,
      succeededCount: 1,
      failedCount: 0,
      skippedCount: 0,
      progressPercent: 100,
      startedBy: { adminId: 7, name: null },
      startedAt: null,
      finishedAt: "2026-08-24T00:00:00Z",
    };
    const page = {
      content: [taskRun],
      number: 2,
      size: 20,
      totalElements: 41,
      totalPages: 3,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(page)));
    const controller = new AbortController();

    await expect(getRecentTaskRuns(3, controller.signal)).resolves.toEqual(page);

    const [request, init] = vi.mocked(fetch).mock.calls[0];
    const url = new URL(String(request));
    expect(url.pathname).toBe("/api/admin/task-runs/recent");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("size")).toBe("20");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer admin.jwt");
    expect(init?.signal).toBe(controller.signal);
  });

  test.each([
    ["content", { content: null, number: 0, size: 20, totalElements: 0, totalPages: 0 }],
    ["number", { content: [], number: -1, size: 20, totalElements: 0, totalPages: 0 }],
    ["size", { content: [], number: 0, size: "20", totalElements: 0, totalPages: 0 }],
    ["totalElements", { content: [], number: 0, size: 20, totalElements: 0.5, totalPages: 0 }],
    ["totalPages", { content: [], number: 0, size: 20, totalElements: 0, totalPages: null }],
  ])("rejects malformed recent page field %s", async (_field, page) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(page)));

    await expect(getRecentTaskRuns(1)).rejects.toThrow(
      "작업 실행 이력을 불러오지 못했습니다.",
    );
  });

  test("rejects an unsuccessful or malformed recent history envelope", async () => {
    const validPage = {
      content: [], number: 0, size: 20, totalElements: 0, totalPages: 0,
    };
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(json(null, 500))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: "true",
        message: null,
        data: validPage,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("not-json", { status: 200 })));

    await expect(getRecentTaskRuns(1)).rejects.toThrow(
      "작업 목록을 불러오지 못했습니다.",
    );
    await expect(getRecentTaskRuns(1)).rejects.toThrow(
      "작업 실행 이력을 불러오지 못했습니다.",
    );
    await expect(getRecentTaskRuns(1)).rejects.toThrow(
      "작업 실행 이력을 불러오지 못했습니다.",
    );
  });
});

describe("task run progress stream api", () => {
  beforeEach(() => {
    localStorage.setItem("selectors-auth", JSON.stringify({
      accessToken: "admin.jwt",
      tokenType: "Bearer",
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  test("parses split CRLF frames and awaits callbacks in stream order", async () => {
    const first = JSON.stringify({
      runId: "11111111-1111-4111-8111-111111111111",
      stepKey: "NEW_CONTENT_SYNC",
      totalCount: 3,
      processedCount: 1,
    });
    const second = JSON.stringify({
      runId: "11111111-1111-4111-8111-111111111111",
      stepKey: "NEW_CONTENT_SYNC",
      totalCount: 3,
      processedCount: 2,
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(eventStream([
      ": heartbeat\r\n\r\nevent: task-run-pro",
      `gress\r\ndata: ${first}\r\n\r\nevent: task-run-progress\r\ndata: ${second}\r\n\r\n`,
    ])));
    const callbackOrder: number[] = [];
    let releaseFirst!: () => void;
    let markFirstStarted!: () => void;
    const firstCallback = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const firstStarted = new Promise<void>((resolve) => {
      markFirstStarted = resolve;
    });
    const onEvent = vi.fn(async (event: { processedCount: number }) => {
      callbackOrder.push(event.processedCount);
      if (event.processedCount === 1) {
        markFirstStarted();
        await firstCallback;
      }
    });

    const streamPromise = streamTaskRunProgress(onEvent, new AbortController().signal);
    await firstStarted;
    expect(callbackOrder).toEqual([1]);

    releaseFirst();
    await expect(streamPromise).resolves.toEqual({ type: "retryable", reason: "eof" });
    expect(callbackOrder).toEqual([1, 2]);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toMatch(/\/api\/admin\/task-runs\/stream$/);
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer admin.jwt");
    expect(new Headers(init?.headers).get("Accept")).toBe("text/event-stream");
  });

  test("preserves CRLF delimiters split exactly across chunk boundaries", async () => {
    const event = {
      runId: "33333333-3333-4333-8333-333333333333",
      stepKey: "NEW_CONTENT_SYNC",
      totalCount: 1,
      processedCount: 1,
    } as const;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(eventStream([
      "event: task-run-progress\r",
      `\ndata: ${JSON.stringify(event)}\r`,
      "\n\r",
      "\n",
    ])));
    const onEvent = vi.fn();

    await streamTaskRunProgress(onEvent, new AbortController().signal);

    expect(onEvent).toHaveBeenCalledOnce();
    expect(onEvent).toHaveBeenCalledWith(event);
  });

  test("reports task lifecycle changes separately from progress", async () => {
    const runId = "33333333-3333-4333-8333-333333333333";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(eventStream([
      `event: task-run-changed\ndata: ${runId}\n\n`,
    ])));
    const onProgress = vi.fn();
    const onChanged = vi.fn();

    await streamTaskRunProgress(
      onProgress,
      new AbortController().signal,
      onChanged,
    );

    expect(onProgress).not.toHaveBeenCalled();
    expect(onChanged).toHaveBeenCalledOnce();
  });

  test("isolates unrelated and invalid frames while preserving later valid progress", async () => {
    const runId = "22222222-2222-4222-8222-222222222222";
    const valid = {
      runId,
      stepKey: "STORED_CONTENT_SYNC",
      totalCount: null,
      processedCount: 7,
    };
    const invalidValues = [
      { ...valid, runId: "   " },
      { ...valid, stepKey: "CREATOR_SYNC" },
      { ...valid, totalCount: -1 },
      { ...valid, processedCount: -1 },
      { ...valid, totalCount: 6 },
      { ...valid, extra: true },
    ];
    const body = [
      progressFrame(valid, "unrelated-event"),
      "event: task-run-progress\ndata: {invalid json}\n\n",
      ...invalidValues.map((value) => progressFrame(value)),
      progressFrame(valid),
    ].join("");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(eventStream([body])));
    const onEvent = vi.fn();

    await streamTaskRunProgress(onEvent, new AbortController().signal);

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith(valid);
  });

  test.each([
    [500, { type: "retryable", reason: "http", status: 500 }],
    [401, { type: "terminal", reason: "unauthorized", status: 401 }],
    [403, { type: "terminal", reason: "forbidden", status: 403 }],
  ] as const)("returns a typed outcome for HTTP %s", async (status, expected) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status })));

    await expect(streamTaskRunProgress(vi.fn(), new AbortController().signal))
      .resolves.toEqual(expected);
    if (status === 401) expect(localStorage.getItem("selectors-auth")).toBeNull();
  });

  test("returns retryable outcomes for a wrong content type and missing body", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("plain", {
        headers: { "Content-Type": "text/plain" },
      }))
      .mockResolvedValueOnce(new Response(null, {
        headers: { "Content-Type": "text/event-stream" },
      })));

    await expect(streamTaskRunProgress(vi.fn(), new AbortController().signal))
      .resolves.toEqual({ type: "retryable", reason: "content-type" });
    await expect(streamTaskRunProgress(vi.fn(), new AbortController().signal))
      .resolves.toEqual({ type: "retryable", reason: "missing-body" });
  });

  test("returns retryable network failures and terminal aborts", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockRejectedValueOnce(new DOMException("aborted", "AbortError")));

    await expect(streamTaskRunProgress(vi.fn(), new AbortController().signal))
      .resolves.toEqual({ type: "retryable", reason: "network" });
    await expect(streamTaskRunProgress(vi.fn(), new AbortController().signal))
      .resolves.toEqual({ type: "terminal", reason: "aborted" });
  });
});
