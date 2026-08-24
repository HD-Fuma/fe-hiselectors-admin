import * as contentEntity from ".";

type GetCurrentGenerationContents = (
  signal?: AbortSignal,
) => Promise<Array<{ contentId: number }>>;

function pageResponse(contentIds: number[], number: number, totalPages: number) {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      content: contentIds.map((contentId) => ({ contentId })),
      number,
      size: 100,
      totalElements: 3,
      totalPages,
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("selectors-auth", JSON.stringify({
    accessToken: "admin.jwt",
    tokenType: "Bearer",
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("requests an asynchronous content batch with authentication and idempotency", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "OK",
    data: {
      currentStep: null,
      failedCount: 0,
      processedCount: 0,
      progressPercent: null,
      runId: "run-content-1",
      skippedCount: 0,
      startedBy: { adminId: 1, name: "관리자" },
      status: "QUEUED",
      succeededCount: 0,
      taskType: "CONTENT_SYNC",
      totalCount: null,
      triggerType: "ADMIN_TRIGGERED",
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 202,
  }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(contentEntity.runContentBatch()).resolves.toMatchObject({
    runId: "run-content-1",
    status: "QUEUED",
  });

  expect(fetchMock).toHaveBeenCalledWith(
    "https://api.hiselectors.shop/api/admin/content-batch/run",
    expect.objectContaining({ method: "POST" }),
  );
  const [, init] = fetchMock.mock.calls[0];
  const headers = new Headers(init.headers);
  expect(headers.get("Authorization")).toBe("Bearer admin.jwt");
  expect(headers.get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/);
});

test("retrieves every current-generation content page with authentication and cancellation", async () => {
  const getCurrentGenerationContents = (
    contentEntity as unknown as { getCurrentGenerationContents?: GetCurrentGenerationContents }
  ).getCurrentGenerationContents;

  expect(getCurrentGenerationContents).toBeTypeOf("function");
  if (!getCurrentGenerationContents) return;

  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const page = Number(new URL(String(input)).searchParams.get("page"));
    return Promise.resolve(page === 0
      ? pageResponse([3, 2], 0, 2)
      : pageResponse([1], 1, 2));
  });
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();

  const contents = await getCurrentGenerationContents(controller.signal);

  expect(contents.map(({ contentId }) => contentId)).toEqual([3, 2, 1]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  fetchMock.mock.calls.forEach(([input, init], page) => {
    const url = new URL(String(input));
    expect(url.pathname).toBe("/api/admin/contents");
    expect(url.searchParams.get("page")).toBe(String(page));
    expect(url.searchParams.get("size")).toBe("100");
    expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe(
      "Bearer admin.jwt",
    );
    expect((init as RequestInit).signal).toBe(controller.signal);
  });
});
