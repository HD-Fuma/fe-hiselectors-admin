import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

function contentItem(contentId: number, storedAt: string) {
  return {
    accountId: `account-${contentId}`,
    contentId,
    contentType: "FEED",
    contentUrl: `https://instagram.com/p/${contentId}`,
    generationName: "4기",
    inspectedAt: null,
    inspectionStatus: null,
    latestVersionId: contentId * 10,
    latestVersionNo: 1,
    latestVersionStoredAt: storedAt,
    media: [],
    profileImageUrl: null,
    selectorsId: contentId,
    selectorsNickname: `셀렉터 ${contentId}`,
    snsCode: "INSTAGRAM",
    snsContentId: `post-${contentId}`,
    storedAt,
    texts: [`콘텐츠 ${contentId}`],
  };
}

function pageResponse(contents: ReturnType<typeof contentItem>[]) {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      content: contents,
      number: 0,
      size: 100,
      totalElements: contents.length,
      totalPages: 1,
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function detailResponse(contentId: number) {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      contentId,
      contentType: "FEED",
      contentUrl: `https://instagram.com/p/${contentId}`,
      selectedVersion: {
        contentReport: null,
        contentVersionId: contentId * 10,
        createdAt: "2026-08-18T10:00:00",
        inspectedAt: null,
        inspectionStatus: "PENDING",
        texts: [`콘텐츠 ${contentId}`],
        violations: [],
        versionNo: 1,
      },
      selectorsId: contentId,
      snsCode: "INSTAGRAM",
      snsContentId: `post-${contentId}`,
      storedAt: "2026-08-18T10:00:00",
      versions: [{
        contentVersionId: contentId * 10,
        createdAt: "2026-08-18T10:00:00",
        inspectedAt: null,
        inspectionStatus: "PENDING",
        versionNo: 1,
      }],
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("shows fetched contents newest first while keeping inspection start oldest first", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const raw = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
    const pathname = new URL(raw, "https://api.hiselectors.shop").pathname;
    const detailMatch = /\/api\/admin\/contents\/(\d+)$/.exec(pathname);
    if (detailMatch) return Promise.resolve(detailResponse(Number(detailMatch[1])));
    return Promise.resolve(pageResponse([
      contentItem(303, "2026-08-18T12:00:00"),
      contentItem(202, "2026-08-18T11:00:00"),
      { ...contentItem(101, "2026-08-18T10:00:00"), latestVersionNo: 2 },
    ]));
  }));
  const { router } = renderRoute("/content/inspections?view=list");

  await waitFor(
    () => expect(screen.getByRole("main")).toHaveTextContent("콘텐츠 303"),
    { timeout: 3_000 },
  );
  const list = screen.getByRole("region", { name: "수집 콘텐츠 리스트" });
  const visibleIds = within(list).getAllByRole("row").slice(1, 6).map((row) => (
    within(row).getAllByRole("cell")[0].textContent
  ));
  expect(visibleIds).toEqual(["303", "202", "101"]);

  fireEvent.click(screen.getByRole("button", { name: "검수 시작" }));
  await waitFor(() => {
    expect(router.state.location.pathname).toBe("/content/inspections/101");
  });
  expect(router.state.location.state).toEqual(expect.objectContaining({ inspectionSession: true }));
  expect(router.state.location.state).not.toEqual(expect.objectContaining({ singleInspection: true }));
  expect(await screen.findByRole("navigation", { name: "검수 콘텐츠 이동" }))
    .toHaveTextContent("검수 진행");
});
