import { fireEvent, screen, waitFor, within } from "@testing-library/react";
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
        createdAt: "2026-08-18T02:05:00.847815Z",
        inspectedAt: null,
        inspectionStatus: "PENDING",
        texts: ["API 수정 콘텐츠", "욕설 검증용 문구 #광고"],
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
  detail: Response | (() => Response) = () => detailResponse(),
  versionDetail?: Response | ((contentVersionId: number) => Response),
) {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const pathname = requestPathname(input);
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
      return Promise.resolve(typeof detail === "function" ? detail() : detail);
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

test("loads a direct detail route and keeps pending analysis and decisions honest", async () => {
  const fetchMock = mockContentApis([contentItem()]);

  renderRoute("/content/inspections/901");

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
  expect(within(finalInspection).getByRole("button", { name: "승인" })).toBeDisabled();
  expect(within(finalInspection).getByRole("button", { name: "반려" })).toBeDisabled();
  expect(screen.queryByText(/좋아요 [\d,]+개/)).not.toBeInTheDocument();
  expect(screen.queryByText(/조회수 [\d,]+회/)).not.toBeInTheDocument();
});

test("loads the latest version report and active violations on a direct detail route", async () => {
  const fetchMock = mockContentApis([contentItem()], detailResponse({
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
      inspectionStatus: "COMPLETED",
      texts: ["API 수정 콘텐츠", "지금 가장 저렴한 가격 #광고"],
      violations: [{
        evidence: {
          confidence: 0.9,
          locations: [{
            bbox: null,
            contentMediaId: null,
            endIndex: 11,
            endTime: null,
            excerpt: "가장 저렴한",
            mediaType: "TEXT",
            startIndex: 3,
            startTime: null,
          }],
          reason: "비교 근거 없이 최저가를 단정했습니다.",
        },
        status: "PENDING",
        violationItemId: 21,
        violationType: "FALSE_EXAGGERATED_CLAIM",
        violationTypeDescription: "허위·과장 표현",
      }],
      versionNo: 2,
    },
  }));

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
  expect(screen.getAllByText("과장 표현 수정 후 재검수가 필요합니다.").length).toBeGreaterThan(0);

  const report = screen.getByRole("region", { name: "AI 분석" });
  expect(within(report).getByText("광고 표기는 확인됐고 최저가 단정 표현이 있습니다.")).toBeInTheDocument();
  expect(within(report).getByRole("heading", { name: "검수 근거" })).toBeInTheDocument();
  expect(within(report).getByText("① 허위·과장 표현")).toBeInTheDocument();
  expect(within(report).queryByText("분석 대기")).not.toBeInTheDocument();
  expect(within(report).queryByText("2026-08-18T11:06:00")).not.toBeInTheDocument();

  const finalInspection = screen.getByRole("region", { name: "최종 검수" });
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

  fireEvent.click(markViolation);
  expect(markViolation).toHaveAttribute("aria-pressed", "true");
  expect(within(finalInspection).getByText("1 / 1")).toBeInTheDocument();
  expect(approve).toBeDisabled();
  expect(reject).toBeEnabled();

  fireEvent.click(markNormal);
  expect(markNormal).toHaveAttribute("aria-pressed", "true");
  expect(approve).toBeEnabled();
  expect(reject).toBeDisabled();
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
      inspectionStatus: "COMPLETED",
      texts: ["지금 가장 저렴한 가격 #광고"],
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
        createdAt: "2026-08-17T09:00:00",
        inspectedAt: "2026-08-17T09:10:00",
        inspectionStatus: "COMPLETED",
        texts: ["이전 버전 본문"],
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
  expect(versionSelect).toHaveDisplayValue("v2 · 최신 버전");

  fireEvent.change(versionSelect, { target: { value: "9001" } });

  await waitFor(() => expect(screen.getAllByText("이전 버전 본문").length).toBeGreaterThan(0));
  expect(screen.getAllByText("이전 버전 요약").length).toBeGreaterThan(0);
  expect(screen.getByText("26.08.17 09:00")).toBeInTheDocument();
  expect(versionSelect).toHaveDisplayValue("v1");
  expect(screen.queryByText("지금 가장 저렴한 가격 #광고")).not.toBeInTheDocument();
  expect(fetchMock.mock.calls.map(([input]) => requestPathname(input))).toEqual(
    expect.arrayContaining(["/api/admin/contents/901/versions/9001"]),
  );

  fireEvent.change(versionSelect, { target: { value: "9010" } });
  expect(screen.getAllByText("지금 가장 저렴한 가격 #광고").length).toBeGreaterThan(0);
  expect(fetchMock.mock.calls.filter(([input]) => (
    requestPathname(input) === "/api/admin/contents/901/versions/9001"
  ))).toHaveLength(1);
});
