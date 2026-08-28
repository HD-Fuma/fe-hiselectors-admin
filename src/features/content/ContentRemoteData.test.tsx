import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
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
    latestVersionStoredAt: "2026-08-18T02:05:00.847815Z",
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
    storedAt: "2026-08-18T02:00:00.847815Z",
    texts: ["API 수정 콘텐츠", "욕설 검증용 문구 #광고"],
    ...overrides,
  };
}

function versionMedia(texts: string[]) {
  return [
    ...texts.map((text, index) => ({
      contentMediaId: 90100 + index,
      mediaType: "TEXT",
      mediaUrl: null,
      sequenceNo: index,
      snsMediaId: null,
      text,
    })),
    {
      contentMediaId: 90999,
      mediaType: "IMAGE",
      mediaUrl: "https://cdn.example.com/api-901.jpg",
      sequenceNo: texts.length,
      snsMediaId: "image-901",
      text: null,
    },
  ];
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

function detailResponse(overrides: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({
    code: "OK",
    data: {
      contentId: 901,
      contentType: "FEED",
      contentUrl: "https://instagram.com/p/api-901",
      selectedVersion: {
        contentReport: null,
        contentVersionId: 9010,
        creationReason: "SOURCE_CHANGE",
        createdAt: "2026-08-18T02:05:00.847815Z",
        inspectedAt: null,
        inspectionStatus: "PENDING",
        media: versionMedia(["API 수정 콘텐츠", "욕설 검증용 문구 #광고"]),
        violations: [],
        versionNo: 2,
      },
      selectorsId: 90,
      snsCode: "INSTAGRAM",
      snsContentId: "api-901",
      storedAt: "2026-08-18T02:00:00.847815Z",
      versions: [{
        contentVersionId: 9010,
        createdAt: "2026-08-18T02:05:00.847815Z",
        inspectedAt: null,
        inspectionStatus: "PENDING",
        versionNo: 2,
      }],
      ...overrides,
    },
    message: null,
    success: true,
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function requestPathname(input: RequestInfo | URL) {
  const raw = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
  try {
    return new URL(raw, "https://api.hiselectors.shop").pathname;
  } catch {
    return raw;
  }
}

function mockContentApis(
  contents: ReturnType<typeof contentItem>[],
  detail: Response | ((contentId: number) => Response) = () => detailResponse(),
  versionDetail?: Response | ((contentVersionId: number) => Response),
  inspection?: Response | (() => Response),
  confirmation?: Response | (() => Response),
) {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const pathname = requestPathname(input);
    if (/\/api\/admin\/contents\/\d+\/versions\/\d+\/inspection$/.test(pathname)) {
      if (!confirmation) return Promise.reject(new Error(`unexpected confirmation ${pathname}`));
      return Promise.resolve(typeof confirmation === "function" ? confirmation() : confirmation);
    }
    if (/\/api\/admin\/content-versions\/\d+\/inspect$/.test(pathname)) {
      if (!inspection) return Promise.reject(new Error(`unexpected inspection ${pathname}`));
      return Promise.resolve(typeof inspection === "function" ? inspection() : inspection);
    }
    const versionMatch = pathname.match(/\/api\/admin\/contents\/\d+\/versions\/(\d+)$/);
    if (versionMatch) {
      if (!versionDetail) {
        return Promise.reject(new Error(`unexpected version fetch ${pathname}`));
      }
      const contentVersionId = Number(versionMatch[1]);
      return Promise.resolve(
        typeof versionDetail === "function" ? versionDetail(contentVersionId) : versionDetail,
      );
    }
    if (/\/api\/admin\/contents\/\d+$/.test(pathname)) {
      const contentId = Number(pathname.split("/").at(-1));
      return Promise.resolve(typeof detail === "function" ? detail(contentId) : detail);
    }
    return Promise.resolve(pageResponse(contents));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("shows initial loading and empty collection states", async () => {
  const resolvers: Array<(response: Response) => void> = [];
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
    resolvers.push(resolve);
  })));

  renderRoute("/content/inspections");

  await waitFor(
    () => expect(screen.getByRole("main")).toHaveTextContent("콘텐츠를 불러오는 중입니다."),
    { timeout: 3_000 },
  );
  await waitFor(() => {
    resolvers.splice(0).forEach((resolve) => resolve(pageResponse([])));
    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
  });
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

test("shows a YouTube thumbnail when the video has no direct media URL", async () => {
  mockContentApis([contentItem({
    contentType: "LONG_FORM",
    contentUrl: "https://www.youtube.com/watch?v=youtube-901",
    media: [{
      mediaType: "VIDEO",
      mediaUrl: null,
      sequenceNo: 1,
      snsMediaId: "youtube-901",
    }],
    snsCode: "YOUTUBE",
    snsContentId: "youtube-901",
    texts: ["YouTube 콘텐츠"],
  })]);

  renderRoute("/content/inspections");

  expect(await screen.findByAltText("YouTube 콘텐츠 썸네일")).toHaveAttribute(
    "src",
    "https://i.ytimg.com/vi/youtube-901/hqdefault.jpg",
  );
});

test("loads a direct detail route and keeps pending analysis and decisions honest", async () => {
  const fetchMock = mockContentApis([contentItem()]);

  const { router } = renderRoute("/content/inspections/901");

  await waitFor(
    () => expect(screen.getByRole("heading", { name: "콘텐츠 원문" })).toBeInTheDocument(),
    { timeout: 3_000 },
  );
  expect(fetchMock.mock.calls.map(([input]) => new URL(String(input)).pathname)).toEqual(
    expect.arrayContaining(["/api/admin/contents", "/api/admin/contents/901"]),
  );
  expect(screen.getByRole("heading", { name: "AI 분석" })).toBeInTheDocument();
  expect(screen.getAllByText("@api-account")).not.toHaveLength(0);
  expect(screen.getAllByAltText("API 셀렉터 프로필 이미지")[0]).toHaveAttribute(
    "src",
    "https://cdn.example.com/api-profile.jpg",
  );
  expect(screen.getByText("26.08.18 11:00")).toBeInTheDocument();
  expect(screen.getByText("26.08.18 11:05")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "버전" })).toHaveDisplayValue("v2 · 최신 버전");

  const report = screen.getByRole("region", { name: "AI 분석" });
  expect(within(report).getByText("분석 대기")).toBeInTheDocument();
  expect(within(report).queryByText("미감지")).not.toBeInTheDocument();
  expect(within(report).queryByText("표시 확인")).not.toBeInTheDocument();

  const finalInspection = screen.getByRole("region", { name: "최종 검수" });
  expect(within(finalInspection).getByText("위반 정보 없음")).toBeInTheDocument();
  expect(within(finalInspection).getByRole("button", { name: "승인" })).toBeEnabled();
  expect(within(finalInspection).getByRole("button", { name: "반려" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "이전 콘텐츠" })).toBeDisabled();
  expect(screen.queryByText(/좋아요 [\d,]+개/)).not.toBeInTheDocument();
  expect(screen.queryByText(/조회수 [\d,]+회/)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "검수 목록" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/content/inspections"));
});

test("moves to the previous pending content from the detail toolbar", async () => {
  const contents = [
    contentItem({ contentId: 900, latestVersionId: 9000, snsContentId: "api-900" }),
    contentItem(),
    contentItem({ contentId: 902, latestVersionId: 9020, snsContentId: "api-902" }),
  ];
  mockContentApis(contents, (contentId) => detailResponse({ contentId }));

  const { router } = renderRoute("/content/inspections/901");

  const previous = await screen.findByRole("button", { name: "이전 콘텐츠" }, {
    timeout: 3_000,
  });
  await waitFor(() => expect(previous).toBeEnabled());
  expect(screen.getByRole("button", { name: "다음 콘텐츠" })).toBeEnabled();

  fireEvent.click(previous);
  await waitFor(() => expect(router.state.location.pathname).toBe("/content/inspections/902"));
});

test("shows completion dialog after confirming the final content", async () => {
  const confirmationResponse = new Response(JSON.stringify({
    code: "OK",
    data: { updatedCount: 0 },
    message: null,
    success: true,
  }), { headers: { "Content-Type": "application/json" }, status: 200 });
  mockContentApis([contentItem()], detailResponse(), undefined, undefined, confirmationResponse);
  const { router } = renderRoute("/content/inspections");

  const start = await screen.findByRole("button", { name: "검수 시작" }, { timeout: 3_000 });
  await waitFor(() => expect(start).toBeEnabled());
  fireEvent.click(start);
  const help = await screen.findByRole("status", { name: "검수 조작 도움말" });
  expect(help).toHaveTextContent(/마우스 휠\s*이전 \/ 다음/);
  expect(help).toHaveTextContent(/1\s*숫자 키\s*반려/);
  expect(help).toHaveTextContent(/2\s*숫자 키\s*승인/);
  expect(help).not.toHaveTextContent("항목 판정:");
  fireEvent.wheel(window, { deltaY: 20 });
  expect(screen.getByRole("status", { name: "검수 조작 도움말" })).toBeInTheDocument();
  const approve = await screen.findByRole("button", { name: /최종 승인/ }, { timeout: 3_000 });
  await waitFor(() => expect(approve).toBeEnabled());
  fireEvent.keyDown(window, { code: "Digit2", key: "2" });

  const completion = await screen.findByRole("alertdialog", {
    name: "콘텐츠 검수를 완료했습니다.",
  });
  expect(completion).toHaveTextContent("검수 목록으로 돌아갑니다.");
  fireEvent.click(within(completion).getByRole("button", { name: "확인" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/content/inspections"));
});

test("switches studio version cards and keeps the latest judgment state", async () => {
  const versions = [
    {
      contentVersionId: 9001,
      creationReason: "INITIAL",
      createdAt: "2026-08-17T09:00:00",
      inspectedAt: "2026-08-17T09:10:00",
      inspectionStatus: "COMPLETED",
      versionNo: 1,
    },
    {
      contentVersionId: 9010,
      creationReason: "SOURCE_CHANGE",
      createdAt: "2026-08-18T11:05:00",
      inspectedAt: "2026-08-18T11:06:00",
      inspectionStatus: "COMPLETED",
      versionNo: 2,
    },
  ];
  const latestViolation = {
    evidence: {
      confidence: 0.9,
      locations: [{
        bbox: null,
        contentMediaId: 90999,
        endIndex: null,
        endTime: null,
        excerpt: null,
        mediaType: "IMAGE",
        startIndex: null,
        startTime: null,
      }],
      reason: "최신 버전의 비교 근거를 확인해야 합니다.",
      source: "AI",
    },
    currentStatus: "PENDING",
    detectedAt: "2026-08-18T11:06:00",
    inspectionPolicyId: 9,
    violationEvidenceHistoryId: 31,
    violationItemId: 21,
    violationType: "FALSE_EXAGGERATED_CLAIM",
    violationTypeDescription: "허위·과장 표현",
  };
  const latestDetail = detailResponse({
    selectedVersion: {
      contentReport: {
        contentReportId: 11,
        flow: "최신 버전 전개",
        overallAssessment: "최신 버전 평가",
        purpose: "최신 버전 목적",
        summary: "최신 버전 요약",
      },
      contentVersionId: 9010,
      creationReason: "SOURCE_CHANGE",
      createdAt: "2026-08-18T11:05:00",
      inspectedAt: "2026-08-18T11:06:00",
      inspectionStatus: "COMPLETED",
      media: versionMedia(["최신 버전 본문"]),
      violations: [latestViolation],
      versionNo: 2,
    },
    versions,
  });
  mockContentApis([contentItem()], latestDetail, (contentVersionId) => {
    expect(contentVersionId).toBe(9001);
    return detailResponse({
      selectedVersion: {
        contentReport: {
          contentReportId: 10,
          flow: "과거 버전 전개",
          overallAssessment: "과거 버전 평가",
          purpose: "과거 버전 목적",
          summary: "과거 버전 요약",
        },
        contentVersionId: 9001,
        creationReason: "INITIAL",
        createdAt: "2026-08-17T09:00:00",
        inspectedAt: "2026-08-17T09:10:00",
        inspectionStatus: "COMPLETED",
        media: versionMedia(["과거 버전 본문"]),
        violations: [latestViolation],
        versionNo: 1,
      },
      versions,
    });
  });

  renderRoute("/content/inspections");

  const start = await screen.findByRole("button", { name: "검수 시작" }, { timeout: 3_000 });
  await waitFor(() => expect(start).toBeEnabled());
  fireEvent.click(start);
  fireEvent.pointerDown(window);

  const historicalSelection = await screen.findByRole("button", {
    name: "v1 과거 콘텐츠 선택",
  });
  const historicalCard = historicalSelection.closest<HTMLElement>(
    ".fuma-content-inspection-studio__version",
  );
  const latestCard = document.querySelector<HTMLElement>(
    '.fuma-content-inspection-studio__version[data-latest="true"]',
  );
  const historicalVersionCard = historicalCard?.querySelector(
    ".fuma-minimal-version-card",
  );
  const latestVersionCard = latestCard?.querySelector(".fuma-minimal-version-card");
  expect(historicalVersionCard).toHaveClass("fuma-platform-content-card");
  expect(historicalVersionCard).toHaveAttribute("data-platform-card", "instagram-feed");
  expect(latestCard).toHaveAttribute("data-selected", "true");
  expect(historicalVersionCard).toHaveAttribute("inert");
  expect(latestVersionCard).not.toHaveAttribute("inert");
  const report = screen.getByRole("complementary", { name: "AI 검수 리포트" });
  expect(within(report).getByText("최신 버전 요약")).toBeInTheDocument();

  const latestJudgment = await within(report).findByRole("group", { name: "허위·과장 표현 판정" });
  fireEvent.click(within(latestJudgment).getByRole("button", { name: "위반 허용" }));
  expect(within(report).getByText("위반 아님")).toBeInTheDocument();
  const initialFinalInspection = screen.getByRole("group", { name: "최종 검수" });
  await waitFor(() => expect(document.activeElement).toBe(initialFinalInspection));

  fireEvent.click(historicalSelection);
  await waitFor(() => expect(within(report).getByText("과거 버전 요약")).toBeInTheDocument());
  expect(historicalCard).toHaveAttribute("data-selected", "true");
  expect(historicalVersionCard).not.toHaveAttribute("inert");
  expect(latestVersionCard).toHaveAttribute("inert");
  expect(within(historicalCard as HTMLElement).getByLabelText("위반 1: 허위·과장 표현").tagName)
    .toBe("SPAN");
  expect(within(historicalCard as HTMLElement).queryByRole("button", {
    name: "위반 1: 허위·과장 표현",
  })).not.toBeInTheDocument();
  expect(within(report).queryByRole("button", { name: "리포트 생성" })).not.toBeInTheDocument();
  expect(within(report).queryByRole("group", { name: /판정/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("group", { name: "최종 검수" })).not.toBeInTheDocument();
  const latestSelection = within(latestCard as HTMLElement).getByRole("button", {
    name: "v2 최신 콘텐츠 선택",
  });
  const historicalMenu = within(historicalCard as HTMLElement).getByRole("button", {
    name: "게시물 메뉴",
  });
  historicalMenu.focus();
  fireEvent.click(historicalMenu);
  expect(historicalCard).toHaveAttribute("data-selected", "true");
  expect(document.activeElement).toBe(historicalMenu);
  expect(within(historicalCard as HTMLElement).getByRole("button", { name: "좋아요" }))
    .toBeVisible();

  fireEvent.click(latestSelection);
  await waitFor(() => expect(within(report).getByText("최신 버전 요약")).toBeInTheDocument());
  expect(latestCard).toHaveAttribute("data-selected", "true");
  expect(await within(historicalCard as HTMLElement).findByRole("button", {
    name: "v1 과거 콘텐츠 선택",
  })).toBeInTheDocument();
  expect(within(report).getByText("위반 아님")).toBeInTheDocument();
  const finalInspection = screen.getByRole("group", { name: "최종 검수" });
  await waitFor(() => expect(document.activeElement).toBe(finalInspection));
  expect(within(latestCard as HTMLElement).queryByRole("button", {
    name: "v2 최신 콘텐츠 선택",
  })).not.toBeInTheDocument();
  expect(within(latestCard as HTMLElement).getByText("v2 · 최신 콘텐츠").tagName)
    .toBe("SPAN");

  const historicalSelectionAgain = within(historicalCard as HTMLElement).getByRole("button", {
    name: "v1 과거 콘텐츠 선택",
  });
  fireEvent.click(historicalSelectionAgain);
  await waitFor(() => expect(within(report).getByText("과거 버전 요약")).toBeInTheDocument());
  expect(within(historicalCard as HTMLElement).queryByRole("button", {
    name: "v1 과거 콘텐츠 선택",
  })).not.toBeInTheDocument();
  expect(within(historicalCard as HTMLElement).getByText("v1 · 과거 콘텐츠").tagName)
    .toBe("SPAN");
  fireEvent.click(within(latestCard as HTMLElement).getByRole("button", {
    name: "v2 최신 콘텐츠 선택",
  }));
  await waitFor(() => expect(within(report).getByText("최신 버전 요약")).toBeInTheDocument());
  fireEvent.click(within(latestCard as HTMLElement).getByRole("button", { name: "게시물 메뉴" }));
  expect(latestCard).toHaveAttribute("data-selected", "true");
});

test("loads violations and submits the final judgment in one request", async () => {
  const selectedVersion = {
      contentReport: {
        contentReportId: 11,
        flow: "본문에서 상품을 소개한 뒤 링크를 안내합니다.",
        overallAssessment: "과장 표현 수정 후 재검수가 필요합니다.",
        purpose: "상품 소개",
        summary: "광고 표기는 확인됐고 최저가 단정 표현이 있습니다.",
      },
      contentVersionId: 9010,
      creationReason: "SOURCE_CHANGE",
      createdAt: "2026-08-18T11:05:00",
      inspectedAt: "2026-08-18T11:06:00",
      inspectionStatus: "COMPLETED",
      media: versionMedia(["API 수정 콘텐츠", "지금 가장 저렴한 가격 #광고"]),
      violations: [{
        evidence: {
          confidence: 0.9,
          locations: [{
            bbox: null,
            contentMediaId: 90101,
            endIndex: 103,
            endTime: null,
            excerpt: "가장 저렴한",
            mediaType: "TEXT",
            startIndex: 100,
            startTime: null,
          }],
          reason: "비교 근거 없이 최저가를 단정했습니다.",
          source: "AI",
        },
        currentStatus: "PENDING",
        detectedAt: "2026-08-18T11:06:00",
        inspectionPolicyId: 9,
        violationEvidenceHistoryId: 31,
        violationItemId: 21,
        violationType: "FALSE_EXAGGERATED_CLAIM",
        violationTypeDescription: "허위·과장 표현",
      }],
      versionNo: 2,
  };
  const selectedDetail = () => detailResponse({ selectedVersion });
  const confirmedDetail = () => detailResponse({
    selectedVersion: {
      ...selectedVersion,
      inspectionDecision: "REJECTED",
      violations: selectedVersion.violations.map((violation) => ({
        ...violation,
        currentStatus: "VIOLATION_CONFIRMED",
      })),
    },
  });
  const confirmationResponse = () => new Response(JSON.stringify({
    code: "OK",
    data: { updatedCount: 1 },
    message: null,
    success: true,
  }), { headers: { "Content-Type": "application/json" }, status: 200 });
  const fetchMock = mockContentApis(
    [contentItem()], selectedDetail, confirmedDetail, undefined, confirmationResponse,
  );

  renderRoute("/content/inspections/901");

  await waitFor(
    () => expect(screen.getAllByText("광고 표기는 확인됐고 최저가 단정 표현이 있습니다.").length).toBeGreaterThan(0),
    { timeout: 3_000 },
  );
  expect(fetchMock.mock.calls.some(([input]) => (
    new URL(String(input)).pathname === "/api/admin/contents/901"
  ))).toBe(true);
  expect(screen.getAllByText("상품 소개").length).toBeGreaterThan(0);
  expect(screen.getAllByText("본문에서 상품을 소개한 뒤 링크를 안내합니다.").length).toBeGreaterThan(0);
  expect(screen.queryByText("과장 표현 수정 후 재검수가 필요합니다.")).not.toBeInTheDocument();

  const report = screen.getByRole("region", { name: "AI 분석" });
  expect(within(report).getByText("광고 표기는 확인됐고 최저가 단정 표현이 있습니다.")).toBeInTheDocument();
  expect(within(report).getByRole("heading", { name: "위반 내역" })).toBeInTheDocument();
  expect(within(report).getByText("① 허위·과장 표현")).toBeInTheDocument();
  expect(within(report).queryByText("게시물 본문(TEXT)")).not.toBeInTheDocument();
  expect(within(report).getByText("광고 수수료 안내문구 표시")).toBeInTheDocument();
  expect(within(report).getByText("제휴링크 누락·불일치")).toBeInTheDocument();
  expect(within(report).getByText("욕설/비속어")).toBeInTheDocument();
  expect(within(report).queryByText("허위/과장 표현")).not.toBeInTheDocument();
  expect(within(report).getByText("위반 항목 1 · 정상 9")).toBeInTheDocument();
  const compliantItemsLabel = within(report).getByText("가이드 준수 항목");
  const compliantItems = compliantItemsLabel.closest("details");
  expect(compliantItems).not.toHaveAttribute("open");
  expect(within(report).getAllByText("정상")).toHaveLength(9);
  fireEvent.click(compliantItemsLabel);
  expect(compliantItems).toHaveAttribute("open");
  expect(within(report).queryByText("분석 대기")).not.toBeInTheDocument();
  expect(within(report).queryByText("2026-08-18T11:06:00")).not.toBeInTheDocument();

  const textStartMarker = screen.getByRole("button", { name: "위반 1: 허위·과장 표현" });
  expect(textStartMarker).toHaveClass("fuma-inspection-violation-bubble");
  expect(within(textStartMarker).getByText("허위·과장 표현")).toBeInTheDocument();
  expect(textStartMarker.parentElement).toHaveTextContent("지금 가장 저렴한 가격 #광고");
  expect(textStartMarker.parentElement?.tagName).toBe("P");

  const finalInspection = screen.getByRole("region", { name: "최종 검수" });
  expect(within(finalInspection).getByText("검수 정책")).toBeInTheDocument();
  expect(within(finalInspection).getByText("정책 #9")).toBeInTheDocument();
  expect(within(finalInspection).queryByText("AI")).not.toBeInTheDocument();
  expect(within(finalInspection).getByText("① 허위·과장 표현")).toBeInTheDocument();
  expect(within(finalInspection).getByText("“가장 저렴한”")).toBeInTheDocument();
  const markViolation = within(finalInspection).getByRole("button", { name: "위반" });
  const markNormal = within(finalInspection).getByRole("button", { name: "정상" });
  const approve = within(finalInspection).getByRole("button", { name: "승인" });
  const reject = within(finalInspection).getByRole("button", { name: "반려" });
  expect(approve).toBeDisabled();
  expect(reject).toBeDisabled();
  expect(within(finalInspection).getByText("0 / 1")).toBeInTheDocument();

  fireEvent.click(within(report).getByRole("button", { name: /① 허위·과장 표현/ }));
  expect(document.querySelector('[data-violation-anchor="1"][data-focused="true"]')).not.toBeNull();

  fireEvent.click(within(report).getByRole("button", { name: /① 허위·과장 표현/ }));
  expect(document.querySelector('[data-violation-anchor="1"][data-focused="true"]')).toBeNull();

  fireEvent.click(markViolation);
  expect(markViolation).toHaveAttribute("aria-pressed", "true");
  expect(markViolation).toHaveClass("hsas-button--secondary");
  expect(within(finalInspection).getByText("1 / 1")).toBeInTheDocument();
  expect(approve).toBeDisabled();
  expect(reject).toBeEnabled();

  fireEvent.click(markNormal);
  expect(markNormal).toHaveAttribute("aria-pressed", "true");
  expect(approve).toBeEnabled();
  expect(reject).toBeDisabled();

  fireEvent.click(markNormal);
  expect(markNormal).toHaveAttribute("aria-pressed", "false");
  expect(markViolation).toHaveAttribute("aria-pressed", "false");
  expect(within(finalInspection).getByText("0 / 1")).toBeInTheDocument();
  expect(approve).toBeDisabled();
  expect(reject).toBeDisabled();

  fireEvent.click(markViolation);
  fireEvent.click(reject);

  await waitFor(() => expect(within(finalInspection).getByRole("status"))
    .toHaveTextContent("반려 처리했습니다. 위반 항목 1건을 갱신했습니다."));
  expect(within(finalInspection).getByRole("button", { name: "반려" })).toBeDisabled();
  expect(within(finalInspection).queryByRole("button", { name: "승인" }))
    .not.toBeInTheDocument();
  expect(within(finalInspection).queryByText("① 허위·과장 표현")).not.toBeInTheDocument();
  expect(within(report).getByText("① 허위·과장 표현")).toBeInTheDocument();
  const confirmationCall = fetchMock.mock.calls.find(([input]) => (
    requestPathname(input) === "/api/admin/contents/901/versions/9010/inspection"
  ));
  expect(confirmationCall).toBeDefined();
  expect(JSON.parse(String((confirmationCall?.[1] as RequestInit).body))).toEqual({
    decision: "REJECTED",
    violations: [{ status: "VIOLATION_CONFIRMED", violationItemId: 21 }],
  });
});

test("keeps the inspection viewport fixed when the media carousel moves", async () => {
  const scrollIntoView = vi.fn();
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = scrollIntoView;
  const carouselMedia = [
    {
      contentMediaId: 90991,
      mediaType: "IMAGE",
      mediaUrl: "https://cdn.example.com/api-901-1.jpg",
      sequenceNo: 0,
      snsMediaId: "image-901-1",
      text: null,
    },
    {
      contentMediaId: 90992,
      mediaType: "IMAGE",
      mediaUrl: "https://cdn.example.com/api-901-2.jpg",
      sequenceNo: 1,
      snsMediaId: "image-901-2",
      text: null,
    },
  ];
  const selectedVersion = {
    contentReport: {
      contentReportId: 11,
      flow: "이미지 순서대로 상품을 소개합니다.",
      overallAssessment: "첫 이미지에 위반 후보가 있습니다.",
      purpose: "상품 소개",
      summary: "캐러셀 검수",
    },
    contentVersionId: 9010,
    creationReason: "SOURCE_CHANGE",
    createdAt: "2026-08-18T11:05:00",
    inspectedAt: "2026-08-18T11:06:00",
    inspectionStatus: "COMPLETED",
    media: carouselMedia,
    violations: [{
      evidence: {
        confidence: 0.9,
        locations: [{
          bbox: { height: 20, width: 20, x: 10, y: 10 },
          contentMediaId: 90991,
          endIndex: null,
          endTime: null,
          excerpt: null,
          mediaType: "IMAGE",
          startIndex: null,
          startTime: null,
        }],
        reason: "첫 이미지 위반 후보",
        source: "AI",
      },
      currentStatus: "PENDING",
      detectedAt: "2026-08-18T11:06:00",
      inspectionPolicyId: 9,
      violationEvidenceHistoryId: 31,
      violationItemId: 21,
      violationType: "FALSE_EXAGGERATED_CLAIM",
      violationTypeDescription: "허위·과장 표현",
    }],
    versionNo: 2,
  };

  try {
    mockContentApis([contentItem()], detailResponse({ selectedVersion }));
    renderRoute("/content/inspections/901");

    const nextPhoto = await screen.findByRole("button", { name: "다음 사진" }, {
      timeout: 3_000,
    });
    const carouselStage = document.querySelector(
      ".fuma-platform-inspection-frame__carousel-track",
    )?.closest<HTMLElement>(".fuma-platform-inspection-frame__asset-stage");
    expect(carouselStage).toBeDefined();
    expect(carouselStage?.style.aspectRatio).toBe("");
    const report = screen.getByRole("region", { name: "AI 분석" });
    fireEvent.click(within(report).getByRole("button", { name: /① 허위·과장 표현/ }));
    await waitFor(() => expect(
      document.querySelector('[data-violation-anchor="1"][data-focused="true"]'),
    ).not.toBeNull());
    await waitFor(() => expect(document.activeElement).toHaveAttribute(
      "data-violation-anchor",
      "1",
    ));
    scrollIntoView.mockClear();

    fireEvent.click(nextPhoto);

    await waitFor(() => expect(screen.getByText("2 / 2")).toBeInTheDocument());
    await act(async () => new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
    }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
  } finally {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  }
});

test("shows an accessible fallback when a fetched detail has no profile image", async () => {
  mockContentApis([contentItem({ profileImageUrl: null })]);

  renderRoute("/content/inspections/901");

  await waitFor(
    () => expect(screen.getByRole("heading", { name: "콘텐츠 원문" })).toBeInTheDocument(),
    { timeout: 3_000 },
  );
  expect(screen.getAllByRole("img", { name: "API 셀렉터 프로필 이미지 없음" })).toHaveLength(2);
  expect(document.querySelector('img[src=""]')).not.toBeInTheDocument();
});

test("loads a past content version when the version select changes", async () => {
  const versions = [
    {
      contentVersionId: 9001,
      createdAt: "2026-08-17T09:00:00",
      inspectedAt: "2026-08-17T09:10:00",
      inspectionStatus: "COMPLETED",
      versionNo: 1,
    },
    {
      contentVersionId: 9010,
      creationReason: "SOURCE_CHANGE",
      createdAt: "2026-08-18T11:05:00",
      inspectedAt: "2026-08-18T11:06:00",
      inspectionStatus: "COMPLETED",
      versionNo: 2,
    },
  ];
  const latestDetail = detailResponse({
    selectedVersion: {
      contentReport: {
        contentReportId: 11,
        flow: "본문에서 상품을 소개한 뒤 링크를 안내합니다.",
        overallAssessment: "과장 표현 수정 후 재검수가 필요합니다.",
        purpose: "상품 소개",
        summary: "광고 표기는 확인됐고 최저가 단정 표현이 있습니다.",
      },
      contentVersionId: 9010,
      createdAt: "2026-08-18T11:05:00",
      inspectedAt: "2026-08-18T11:06:00",
      inspectionDecision: "APPROVED",
      inspectionStatus: "COMPLETED",
      media: versionMedia(["지금 가장 저렴한 가격 #광고"]),
      violations: [],
      versionNo: 2,
    },
    versions,
  });
  const fetchMock = mockContentApis([contentItem()], latestDetail, (contentVersionId) => {
    expect(contentVersionId).toBe(9001);
    return detailResponse({
      selectedVersion: {
        contentReport: {
          contentReportId: 10,
          flow: "이전 버전 전개",
          overallAssessment: "이전 버전 평가",
          purpose: "이전 버전 목적",
          summary: "이전 버전 요약",
        },
        contentVersionId: 9001,
        creationReason: "INITIAL",
        createdAt: "2026-08-17T09:00:00",
        inspectedAt: "2026-08-17T09:10:00",
        inspectionStatus: "COMPLETED",
        media: versionMedia(["이전 버전 본문"]),
        violations: [],
        versionNo: 1,
      },
      versions,
    });
  });

  renderRoute("/content/inspections/901");

  await waitFor(
    () => expect(screen.getAllByText("지금 가장 저렴한 가격 #광고").length).toBeGreaterThan(0),
    { timeout: 3_000 },
  );
  const versionSelect = screen.getByRole("combobox", { name: "버전" });
  expect(versionSelect).toHaveDisplayValue("v2 · 콘텐츠 수정 · 최신 버전");
  const finalInspection = screen.getByRole("region", { name: "최종 검수" });
  expect(within(finalInspection).getByText("검수 상태").nextElementSibling)
    .toHaveTextContent("승인");
  expect(within(finalInspection).getByRole("button", { name: "승인" })).toBeDisabled();
  expect(within(finalInspection).queryByRole("button", { name: "반려" }))
    .not.toBeInTheDocument();

  fireEvent.change(versionSelect, { target: { value: "9001" } });

  await waitFor(() => expect(screen.getAllByText("이전 버전 본문").length).toBeGreaterThan(0));
  expect(screen.getAllByText("이전 버전 요약").length).toBeGreaterThan(0);
  expect(screen.getByText("26.08.17 09:00")).toBeInTheDocument();
  expect(versionSelect).toHaveDisplayValue("v1");
  expect(screen.queryByText("지금 가장 저렴한 가격 #광고")).not.toBeInTheDocument();
  const historicalFinalInspection = screen.getByRole("region", { name: "최종 검수" });
  expect(within(historicalFinalInspection).queryByRole("button", { name: "반려" }))
    .not.toBeInTheDocument();
  expect(within(historicalFinalInspection).queryByRole("button", { name: "승인" }))
    .not.toBeInTheDocument();
  expect(fetchMock.mock.calls.map(([input]) => requestPathname(input))).toEqual(
    expect.arrayContaining(["/api/admin/contents/901/versions/9001"]),
  );

  fireEvent.change(versionSelect, { target: { value: "9010" } });
  expect(screen.getAllByText("지금 가장 저렴한 가격 #광고").length).toBeGreaterThan(0);
  const latestFinalInspection = screen.getByRole("region", { name: "최종 검수" });
  expect(within(latestFinalInspection).queryByRole("button", { name: "반려" }))
    .not.toBeInTheDocument();
  expect(within(latestFinalInspection).getByRole("button", { name: "승인" })).toBeDisabled();
  expect(fetchMock.mock.calls.filter(([input]) => (
    requestPathname(input) === "/api/admin/contents/901/versions/9001"
  ))).toHaveLength(1);
});

test("moves to the actual extraction-change version after one inspection", async () => {
  const inspectionResponse = new Response(JSON.stringify({
    code: "OK",
    data: {
      creationReason: "EXTRACTION_CHANGE",
      inspectedContentVersionId: 9011,
      requestedContentVersionId: 9010,
      versionCreated: true,
      violationCount: 0,
    },
    message: null,
    success: true,
  }), { headers: { "Content-Type": "application/json" }, status: 200 });
  const fetchMock = mockContentApis(
    [contentItem()],
    detailResponse(),
    (contentVersionId) => {
      expect(contentVersionId).toBe(9011);
      return detailResponse({
        selectedVersion: {
          contentReport: {
            contentReportId: 12,
            flow: "새 추출 흐름",
            overallAssessment: "정상",
            purpose: "상품 소개",
            summary: "새 추출 버전 분석",
          },
          contentVersionId: 9011,
          creationReason: "EXTRACTION_CHANGE",
          createdAt: "2026-08-18T12:00:00",
          inspectedAt: "2026-08-18T12:01:00",
          inspectionStatus: "COMPLETED",
          media: versionMedia(["새 추출 본문"]),
          violations: [],
          versionNo: 3,
        },
        versions: [
          {
            contentVersionId: 9011,
            creationReason: "EXTRACTION_CHANGE",
            createdAt: "2026-08-18T12:00:00",
            inspectedAt: "2026-08-18T12:01:00",
            inspectionStatus: "COMPLETED",
            versionNo: 3,
          },
          {
            contentVersionId: 9010,
            creationReason: "SOURCE_CHANGE",
            createdAt: "2026-08-18T02:05:00.847815Z",
            inspectedAt: null,
            inspectionStatus: "PENDING",
            versionNo: 2,
          },
        ],
      });
    },
    inspectionResponse,
  );

  renderRoute("/content/inspections/901");
  await waitFor(() => expect(screen.getByRole("button", { name: "자동 검수 실행" })).toBeEnabled());

  fireEvent.click(screen.getByRole("button", { name: "자동 검수 실행" }));

  await waitFor(() => expect(screen.getAllByText("새 추출 본문").length).toBeGreaterThan(0));
  expect(screen.getByRole("combobox", { name: "버전" }))
    .toHaveDisplayValue("v3 · 추출 변경 · 최신 버전");
  expect(screen.getByRole("status")).toHaveTextContent(
    "추출 정책 변경으로 v3을 생성해 검수했습니다.",
  );
  expect(fetchMock.mock.calls.map(([input]) => requestPathname(input))).toEqual(
    expect.arrayContaining([
      "/api/admin/content-versions/9010/inspect",
      "/api/admin/contents/901/versions/9011",
    ]),
  );
});
