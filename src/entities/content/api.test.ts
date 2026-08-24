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

test("runs the content batch manually with authentication", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "OK",
    data: {
      engagementCount: 5,
      newContentCount: 2,
      newContentSucceeded: true,
      storedContentSucceeded: true,
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  }));
  vi.stubGlobal("fetch", fetchMock);

  await contentEntity.runContentBatch();

  expect(new URL(String(fetchMock.mock.calls[0][0])).pathname)
    .toBe("/api/admin/content-batch/run");
  expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ method: "POST" }));
  const [, init] = fetchMock.mock.calls[0];
  expect(new Headers(init.headers).get("Authorization")).toBe("Bearer admin.jwt");
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

test("retrieves a content detail with authentication and cancellation", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "OK",
    data: {
      contentId: 901,
      selectedVersion: {
        contentVersionId: 9010,
        versionNo: 2,
      },
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  }));
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();

  await expect(contentEntity.getContentDetail(901, controller.signal)).resolves.toMatchObject({
    contentId: 901,
    selectedVersion: { contentVersionId: 9010, versionNo: 2 },
  });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [input, init] = fetchMock.mock.calls[0];
  expect(new URL(String(input)).pathname).toBe("/api/admin/contents/901");
  expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe("Bearer admin.jwt");
  expect((init as RequestInit).signal).toBe(controller.signal);
});

test("retrieves a content version detail with authentication and cancellation", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "OK",
    data: {
      contentId: 901,
      selectedVersion: {
        contentVersionId: 9001,
        versionNo: 1,
      },
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  }));
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();

  await expect(contentEntity.getContentVersionDetail(901, 9001, controller.signal)).resolves.toMatchObject({
    contentId: 901,
    selectedVersion: { contentVersionId: 9001, versionNo: 1 },
  });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [input, init] = fetchMock.mock.calls[0];
  expect(new URL(String(input)).pathname).toBe("/api/admin/contents/901/versions/9001");
  expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe("Bearer admin.jwt");
  expect((init as RequestInit).signal).toBe(controller.signal);
});

test("runs one inspection and returns the actual inspected version", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "OK",
    data: {
      creationReason: "EXTRACTION_CHANGE",
      inspectedContentVersionId: 9011,
      requestedContentVersionId: 9010,
      versionCreated: true,
      violationCount: 2,
    },
    message: null,
    success: true,
  }), { headers: { "Content-Type": "application/json" }, status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();

  await expect(contentEntity.inspectContentVersion(9010, controller.signal))
    .resolves.toMatchObject({
      inspectedContentVersionId: 9011,
      requestedContentVersionId: 9010,
      versionCreated: true,
    });

  const [input, init] = fetchMock.mock.calls[0];
  expect(new URL(String(input)).pathname)
    .toBe("/api/admin/content-versions/9010/inspect");
  expect(init).toEqual(expect.objectContaining({ method: "POST", signal: controller.signal }));
  expect(new Headers(init.headers).get("Authorization")).toBe("Bearer admin.jwt");
});

test("confirms all violation judgments in one PATCH request", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "OK",
    data: { updatedCount: 2 },
    message: null,
    success: true,
  }), { headers: { "Content-Type": "application/json" }, status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();
  const request = {
    decision: "REJECTED" as const,
    violations: [
      { status: "VIOLATION_CONFIRMED" as const, violationItemId: 21 },
      { status: "DISMISSED" as const, violationItemId: 22 },
    ],
  };

  await expect(contentEntity.confirmContentInspection(901, 9010, request, controller.signal))
    .resolves.toEqual({ updatedCount: 2 });

  const [input, init] = fetchMock.mock.calls[0];
  expect(new URL(String(input)).pathname)
    .toBe("/api/admin/contents/901/versions/9010/inspection");
  expect(init).toEqual(expect.objectContaining({
    body: JSON.stringify(request),
    method: "PATCH",
    signal: controller.signal,
  }));
  expect(new Headers(init.headers).get("Authorization")).toBe("Bearer admin.jwt");
  expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
});
