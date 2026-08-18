import { screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

function contentItem(overrides: Record<string, unknown> = {}) {
  return {
    accountId: "@api-account",
    contentId: 901,
    contentType: "FEED",
    contentUrl: "https://instagram.com/p/api-901",
    generationName: "4기",
    inspectedAt: null,
    inspectionStatus: null,
    latestVersionId: 9010,
    latestVersionNo: 2,
    latestVersionStoredAt: "2026-08-18T11:05:00",
    media: [{
      mediaType: "IMAGE",
      mediaUrl: "https://cdn.example.com/api-901.jpg",
      sequenceNo: 1,
      snsMediaId: "image-901",
    }],
    profileImageUrl: "https://cdn.example.com/api-profile.jpg",
    selectorsId: 90,
    selectorsNickname: "API 셀렉터",
    snsCode: "INSTAGRAM",
    snsContentId: "api-901",
    storedAt: "2026-08-18T11:00:00",
    texts: ["API 수정 콘텐츠", "욕설 검증용 문구 #광고"],
    ...overrides,
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

afterEach(() => {
  vi.unstubAllGlobals();
});

test("shows initial loading and empty collection states", async () => {
  let resolveRequest: ((response: Response) => void) | undefined;
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
    resolveRequest = resolve;
  })));

  renderRoute("/content/inspections");

  await waitFor(
    () => expect(screen.getByRole("main")).toHaveTextContent("콘텐츠를 불러오는 중입니다."),
    { timeout: 3_000 },
  );
  resolveRequest?.(pageResponse([]));
  expect(await screen.findByText("검색 결과가 없습니다.")).toBeInTheDocument();
});

test("shows the backend list error inline", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "INTERNAL_SERVER_ERROR",
    data: null,
    message: "콘텐츠 목록 서버 오류",
    success: false,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 500,
  })));

  renderRoute("/content/inspections");

  expect(await screen.findByRole("alert")).toHaveTextContent("콘텐츠 목록 서버 오류");
});

test("loads a direct detail route and keeps pending analysis and decisions honest", async () => {
  const fetchMock = vi.fn().mockResolvedValue(pageResponse([contentItem()]));
  vi.stubGlobal("fetch", fetchMock);

  renderRoute("/content/inspections/901");

  await waitFor(
    () => expect(screen.getByRole("heading", { name: "API 수정 콘텐츠" })).toBeInTheDocument(),
    { timeout: 3_000 },
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(screen.getByText("이전 버전 정보 없음")).toBeInTheDocument();
  expect(screen.getByText("현재 버전")).toBeInTheDocument();
  expect(screen.getAllByText("@api-account")).not.toHaveLength(0);
  expect(screen.getByAltText("API 셀렉터 프로필 이미지")).toHaveAttribute(
    "src",
    "https://cdn.example.com/api-profile.jpg",
  );

  const report = screen.getByRole("region", { name: "분석 리포트" });
  expect(within(report).getByText("분석 대기")).toBeInTheDocument();
  expect(within(report).queryByText("미감지")).not.toBeInTheDocument();
  expect(within(report).queryByText("표시 확인")).not.toBeInTheDocument();

  const finalInspection = screen.getByRole("region", { name: "최종 검수" });
  expect(within(finalInspection).getByText("위반 정보 없음")).toBeInTheDocument();
  expect(within(finalInspection).getByRole("button", { name: "승인" })).toBeDisabled();
  expect(within(finalInspection).getByRole("button", { name: "반려" })).toBeDisabled();
  expect(screen.queryByText(/좋아요 [\d,]+개/)).not.toBeInTheDocument();
  expect(screen.queryByText(/조회수 [\d,]+회/)).not.toBeInTheDocument();
});

test("shows an accessible fallback when a fetched detail has no profile image", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(pageResponse([
    contentItem({ profileImageUrl: null }),
  ])));

  renderRoute("/content/inspections/901");

  await waitFor(
    () => expect(screen.getByRole("heading", { name: "API 수정 콘텐츠" })).toBeInTheDocument(),
    { timeout: 3_000 },
  );
  expect(screen.getAllByRole("img", { name: "API 셀렉터 프로필 이미지 없음" })).toHaveLength(1);
  expect(document.querySelector('img[src=""]')).not.toBeInTheDocument();
});
