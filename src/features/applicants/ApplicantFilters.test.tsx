import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { prefetchAdminApplication } from "../../entities/application";
import { ApplicantListPage } from "./ApplicantPages";

const applicants = [
  {
    id: 1,
    userId: 101,
    hiId: "HI-0001",
    applicantName: "김민지",
    email: "minji@example.com",
    phone: "010-0000-0001",
    generationId: 3,
    generationName: "3기",
    snsCode: "INSTAGRAM",
    snsAccountId: "minji.daily",
    snsDisplayName: "minji.daily",
    profileImageUrl: "https://cdn.example.com/minji-profile.jpg",
    followerCount: 58_420,
    engagementRate: 2.55,
    totalContentCount: 126,
    recent90DayContentCount: 29,
    lastPublishedAt: "2026-08-02T12:00:00",
    status: "PENDING",
    mediaCollectionStatus: "DONE",
    appliedAt: "2026-08-03T09:12:00",
    mediaCollectedAt: "2026-08-05T10:00:00",
    updatedAt: "2026-08-05T10:00:00",
  },
  {
    id: 2,
    userId: 102,
    hiId: "HI-0002",
    applicantName: "정하린",
    email: "harin@example.com",
    phone: "010-0000-0002",
    generationId: 3,
    generationName: "3기",
    snsCode: "YOUTUBE",
    snsAccountId: "UC1111111111111111111111",
    snsDisplayName: "하린의 생활연구소",
    profileImageUrl: "https://cdn.example.com/harin-profile.jpg",
    followerCount: 83_100,
    engagementRate: 3.1,
    totalContentCount: 94,
    recent90DayContentCount: 23,
    lastPublishedAt: "2026-08-01T16:40:00",
    status: "APPROVED",
    mediaCollectionStatus: "DONE",
    appliedAt: "2026-08-02T16:40:00",
    mediaCollectedAt: "2026-08-05T10:00:00",
    updatedAt: "2026-08-05T10:00:00",
  },
  {
    id: 3,
    userId: 103,
    hiId: "HI-0003",
    applicantName: "윤소라",
    email: "sora@example.com",
    phone: "010-0000-0003",
    generationId: 3,
    generationName: "3기",
    snsCode: "INSTAGRAM",
    snsAccountId: "sora.daily",
    snsDisplayName: "sora.daily",
    profileImageUrl: null,
    followerCount: 400,
    engagementRate: null,
    totalContentCount: null,
    recent90DayContentCount: 2,
    lastPublishedAt: null,
    status: "PENDING",
    mediaCollectionStatus: "DONE",
    appliedAt: "2026-08-03T10:46:00",
    mediaCollectedAt: "2026-08-05T10:00:00",
    updatedAt: "2026-08-05T10:00:00",
  },
] as const;

const applicantDetail = {
  ...applicants[0],
  analysisStatus: "DONE",
  profileImageUrl: "https://cdn.example.com/minji-profile.jpg",
  metrics: {
    analysisWindowDays: 90,
    totalContentCount: 126,
    recent90DayContentCount: 3,
    lastPublishedAt: "2026-08-02T12:00:00",
    uploadCadence: {
      sampleCount: 3,
      dailyAverage: 0.03,
      weeklyAverage: 0.2,
      maximumGapDays: 4,
    },
    averageViewCount: { value: null, sampleCount: 0 },
    averageLikeCount: { value: 120.5, sampleCount: 2 },
    averageCommentCount: { value: 0, sampleCount: 3 },
    engagementRate: { value: 2.55, sampleCount: 2 },
    contentFormats: [
      { contentType: "FEED", count: 2 },
      { contentType: "UNKNOWN", count: 1 },
    ],
  },
  contents: [{
    id: 11,
    applicationId: 1,
    snsCode: "INSTAGRAM",
    snsContentId: "post-11",
    contentUrl: "https://www.instagram.com/p/post-11",
    mediaUrl: "https://cdn.example.com/post-11-image.jpg",
    thumbnailUrl: "https://cdn.example.com/post-11-thumbnail.jpg",
    contentType: "FEED",
    mediaType: "IMAGE",
    title: null,
    caption: "대표 피드 캡션",
    description: null,
    sequenceNo: 0,
    publishedAt: "2026-08-02T12:00:00",
    viewCount: null,
    likeCount: 120,
    commentCount: 0,
    collectedAt: "2026-08-05T10:00:00",
  }, {
    id: 12,
    applicationId: 1,
    snsCode: "INSTAGRAM",
    snsContentId: "post-11",
    contentUrl: "https://www.instagram.com/p/post-11",
    mediaUrl: "https://cdn.example.com/post-11-second-image.jpg",
    thumbnailUrl: "https://cdn.example.com/post-11-second-thumbnail.jpg",
    contentType: "FEED",
    mediaType: "IMAGE",
    title: "중복 미디어",
    caption: null,
    description: null,
    sequenceNo: 0,
    publishedAt: "2026-08-02T12:00:00",
    viewCount: null,
    likeCount: 120,
    commentCount: 0,
    collectedAt: "2026-08-05T10:00:00",
  }],
};

const youtubeApplicantDetail = {
  ...applicantDetail,
  ...applicants[1],
};

const pendingApplicantDetail = {
  ...applicantDetail,
  analysisStatus: "PENDING",
  mediaCollectionStatus: "PENDING",
  mediaCollectedAt: null,
  metrics: {
    ...applicantDetail.metrics,
    totalContentCount: null,
    recent90DayContentCount: null,
    lastPublishedAt: null,
    uploadCadence: {
      sampleCount: 0,
      dailyAverage: null,
      weeklyAverage: null,
      maximumGapDays: null,
    },
    averageViewCount: { value: null, sampleCount: 0 },
    averageLikeCount: { value: null, sampleCount: 0 },
    averageCommentCount: { value: null, sampleCount: 0 },
    engagementRate: { value: null, sampleCount: 0 },
    contentFormats: [],
  },
  contents: [],
};

const applicantAiReport = {
  applicationId: 1,
  summary: "일상 콘텐츠의 반응이 안정적입니다.",
  category: "라이프스타일",
  keywords: ["일상", "브이로그", "패션", "카페", "여행", "뷰티", "리빙"],
  contentStyle: "정보형",
  tone: "친근함",
  strength: "꾸준한 소통",
  cautions: "광고 비중 확인",
  risks: "",
  brandHistory: "브랜드 A",
  status: "DONE",
  createdAt: "2026-08-05T10:30:00",
  representativeContentUrl: "https://www.instagram.com/p/post-11",
  representativeContentType: "FEED",
  representativeViewCount: null,
  representativeCategory: null,
  representativeKeywords: null,
} as const;

function json(data: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify({
    success: status < 400,
    code: status < 400 ? "OK" : "ERROR",
    message: status < 400 ? null : "조회에 실패했습니다.",
    data: status < 400 ? data : null,
  }), { status, headers: { "Content-Type": "application/json" } }));
}

function page(content: readonly unknown[]) {
  return {
    content,
    number: 0,
    size: 20,
    totalElements: content.length,
    totalPages: content.length === 0 ? 0 : 1,
  };
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((done) => { resolve = done; });
  return { promise, resolve };
}

function renderApplicantPage(path = "/applicants") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ApplicantListPage />
    </MemoryRouter>,
  );
}

function mockApi() {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/api/admin/generations")) {
      return json([{ id: 3, generationName: "3기" }]);
    }
    if (/\/api\/admin\/applications\/1$/.test(url.pathname)) return json(applicantDetail);
    if (/\/api\/admin\/applications\/2$/.test(url.pathname)) return json(youtubeApplicantDetail);
    if (url.searchParams.get("minimumCriteriaOnly") === "true") return json(page([applicants[2]]));
    if (url.searchParams.get("keyword") === "하린") return json(page([applicants[1]]));
    return json(page(applicants));
  }));
}

describe("applicant api pages", () => {
  test("requests combined filters and renders server results", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApplicantPage();
    expect(await screen.findByText("김민지")).toBeInTheDocument();
    const search = screen.getByRole("search", { name: "검색 조건" });

    await user.type(within(search).getByRole("textbox", { name: "검색어" }), "하린");
    await user.selectOptions(within(search).getByRole("combobox", { name: "SNS 채널" }), "YouTube");
    await user.selectOptions(within(search).getByRole("combobox", { name: "심사 상태" }), "승인");
    await user.selectOptions(within(search).getByRole("combobox", { name: "기수" }), "3");
    await user.click(within(search).getByRole("button", { name: "조회" }));

    expect(await screen.findByText("정하린")).toBeInTheDocument();
    const applicantList = screen.getByRole("region", { name: "지원자 목록" });
    expect(within(applicantList).getAllByRole("columnheader").map((header) => header.textContent))
      .toEqual(["계정", "팔로워/구독자", "ER", "최근 90일 활동", "최근 활동일", "신청일", "심사 상태"]);
    expect(within(applicantList).getByText("하린의 생활연구소")).toBeInTheDocument();
    expect(within(applicantList).queryByText("UC1111111111111111111111"))
      .not.toBeInTheDocument();
    expect(within(applicantList).getByRole("img", { name: "정하린 프로필 이미지" }))
      .toHaveAttribute("src", "https://cdn.example.com/harin-profile.jpg");
    expect(within(applicantList).getByRole("img", { name: "YouTube 플랫폼" }))
      .toBeInTheDocument();
    expect(within(applicantList).getByRole("link", { name: "정하린 SNS 계정 열기 (새 창)" }))
      .toHaveAttribute("href", "https://www.youtube.com/channel/UC1111111111111111111111");
    expect(within(applicantList).getByText("2026-08-01")).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/keyword=.*snsCode=YOUTUBE.*status=APPROVED.*generationId=3.*page=0.*size=20/),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ));
    expect(screen.getByText("총 1건")).toBeInTheDocument();
    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();

    await user.click(within(applicantList).getByRole("button", { name: "정하린 프로필 보기" }));
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });
    expect(await within(panel).findByRole("link", { name: "하린의 생활연구소 ↗" }))
      .toHaveAttribute("href", "https://www.youtube.com/channel/UC1111111111111111111111");
    expect(panel).not.toHaveTextContent("UC1111111111111111111111");
  });

  test("uses the server minimum-criteria query and derives automatic rejection", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApplicantPage();
    await screen.findByText("김민지");

    await user.click(screen.getByRole("checkbox", { name: "최저 기준 필터링" }));

    expect(await screen.findByText("윤소라")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "지원자 목록" }))
      .getByText("자동 반려")).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("minimumCriteriaOnly=true"),
      expect.anything(),
    ));
    const minimumCriteriaRequest = vi.mocked(fetch).mock.calls
      .map(([input]) => new URL(String(input)))
      .find((url) => url.searchParams.get("minimumCriteriaOnly") === "true");
    expect(minimumCriteriaRequest?.searchParams.get("status")).toBe("PENDING");
  });

  test("limits the automatic-rejection status filter to pending minimum-criteria applications", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApplicantPage();
    await screen.findByText("김민지");
    const search = screen.getByRole("search", { name: "검색 조건" });

    await user.selectOptions(
      within(search).getByRole("combobox", { name: "심사 상태" }),
      "자동 반려",
    );
    await user.click(within(search).getByRole("button", { name: "조회" }));

    expect(await screen.findByText("윤소라")).toBeInTheDocument();
    await waitFor(() => {
      const automaticRejectionRequest = vi.mocked(fetch).mock.calls
        .map(([input]) => new URL(String(input)))
        .find((url) => url.searchParams.get("minimumCriteriaOnly") === "true");
      expect(automaticRejectionRequest?.searchParams.get("status")).toBe("PENDING");
    });
  });

  test("defaults to pending applications outside the minimum criteria unless the toolbar overrides it", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApplicantPage();
    await screen.findByText("김민지");
    const search = screen.getByRole("search", { name: "검색 조건" });

    expect(within(search).getByRole("combobox", { name: "심사 상태" }))
      .toHaveValue("검토 대기");

    await waitFor(() => expect(vi.mocked(fetch).mock.calls
      .map(([input]) => new URL(String(input)))
      .some((url) => url.searchParams.get("status") === "PENDING"
        && url.searchParams.get("minimumCriteriaOnly") === "false"))
      .toBe(true));

    await user.click(screen.getByRole("checkbox", { name: "최저 기준 필터링" }));

    await waitFor(() => expect(vi.mocked(fetch).mock.calls
      .map(([input]) => new URL(String(input)))
      .some((url) => url.searchParams.get("status") === "PENDING"
        && url.searchParams.get("minimumCriteriaOnly") === "true"))
      .toBe(true));
  });

  test("keeps confirmed review statuses ahead of automatic-rejection criteria", async () => {
    const confirmedApplicants = [
      { ...applicants[1], followerCount: 400, recent90DayContentCount: 2 },
      { ...applicants[2], status: "REJECTED" },
    ];
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => (
      new URL(String(input)).pathname.endsWith("/api/admin/generations")
        ? json([])
        : json(page(confirmedApplicants))
    )));
    renderApplicantPage();
    const region = screen.getByRole("region", { name: "지원자 목록" });
    await within(region).findByText("정하린");
    const rows = within(region).getAllByRole("row");

    expect(within(rows[1]).getByText("승인")).toBeInTheDocument();
    expect(within(rows[2]).getByText("반려")).toBeInTheDocument();
    expect(within(region).queryByText("자동 반려")).not.toBeInTheDocument();
  });

  test("ignores an aborted stale list response", async () => {
    const initial = deferredResponse();
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/api/admin/generations")) {
        return json([{ id: 3, generationName: "3기" }]);
      }
      return url.searchParams.get("keyword") === "하린"
        ? json(page([applicants[1]]))
        : initial.promise;
    }));
    const user = userEvent.setup();
    renderApplicantPage();
    expect(screen.getByText("지원자를 불러오는 중입니다.")).toHaveAttribute("role", "status");
    const search = screen.getByRole("search", { name: "검색 조건" });

    await user.type(within(search).getByRole("textbox", { name: "검색어" }), "하린");
    await user.click(within(search).getByRole("button", { name: "조회" }));
    expect(await screen.findByText("정하린")).toBeInTheDocument();
    await act(async () => initial.resolve(await json(page([applicants[0]]))));

    expect(await screen.findByText("정하린")).toBeInTheDocument();
    expect(screen.queryByText("김민지")).not.toBeInTheDocument();
  });

  test("loads real detail metrics and keeps unavailable values distinct from zero", async () => {
    const pendingDetail = deferredResponse();
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => (
      new URL(String(input)).pathname.endsWith("/api/admin/generations")
        ? json([{ id: 3, generationName: "3기" }])
        : /\/api\/admin\/applications\/1$/.test(new URL(String(input)).pathname)
          ? pendingDetail.promise
          : json(page(applicants))
    )));
    renderApplicantPage("/applicants?detail=1");
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });
    expect(await within(panel).findByRole("heading", { name: "김민지" })).toBeInTheDocument();
    expect(within(panel).getByRole("status")).toHaveTextContent("상세 분석 리포트를 불러오는 중입니다...");

    await act(async () => pendingDetail.resolve(await json(applicantDetail)));
    expect(await within(panel).findByRole("heading", { name: "김민지" })).toBeInTheDocument();
    expect(within(panel).getByRole("img", { name: "김민지 프로필 이미지" }))
      .toHaveAttribute("src", "https://cdn.example.com/minji-profile.jpg");
    const representativeContents = within(panel).getByLabelText("대표 콘텐츠");
    const thumbnailLink = within(representativeContents).getByRole("link", {
      name: "김민지 대표 게시글: 대표 피드 캡션 원본 열기",
    });
    expect(thumbnailLink).toHaveAttribute("href", "https://www.instagram.com/p/post-11");
    expect(thumbnailLink).toHaveAttribute("target", "_blank");
    expect(within(thumbnailLink).getByRole("img", {
      name: "김민지 대표 게시글: 대표 피드 캡션",
    })).toHaveAttribute("src", "https://cdn.example.com/post-11-thumbnail.jpg");
    expect(representativeContents.children).toHaveLength(1);
    const report = within(panel).getByRole("region", { name: "지원자 분석 리포트" });
    expect(within(report).queryByText("평균 조회")).not.toBeInTheDocument();
    expect(within(report).getByText("평균 좋아요").parentElement).toHaveTextContent("120.5건");
    expect(within(report).getByText("평균 댓글").parentElement).toHaveTextContent("0건");
    expect(within(report).getAllByText("미분류")).not.toHaveLength(0);
    expect(within(report).getByText("전체 공개 콘텐츠").parentElement).toHaveTextContent("126건");
    expect(within(panel).getByText("최종 업데이트").parentElement)
      .toHaveTextContent("2026.08.05 10:00");
  });

  test("uses the stored thumbnail as the representative-content link and keeps AI metadata visible", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/api/admin/generations")) return json([]);
      if (path.endsWith("/api/admin/applications/1/ai-report")) return json(applicantAiReport);
      if (path.endsWith("/api/admin/applications/1")) return json(applicantDetail);
      return json(page(applicants));
    }));

    renderApplicantPage("/applicants?detail=1");
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });
    const analysisReport = await within(panel).findByRole("region", { name: "지원자 분석 리포트" });
    const representativeContent = await within(analysisReport).findByRole("region", { name: "대표 콘텐츠" });
    const thumbnailLink = within(representativeContent).getByRole("link", {
      name: "김민지 대표 콘텐츠 원본 열기",
    });

    expect(representativeContent.querySelector(".fuma-representative-card"))
      .toHaveAttribute("data-design", "adaptive-b");
    expect(representativeContent.querySelector(".fuma-representative-card"))
      .toHaveAttribute("data-media", "image");
    expect(thumbnailLink).toHaveAttribute("href", "https://www.instagram.com/p/post-11");
    expect(within(thumbnailLink).getByRole("img", { name: "김민지 대표 콘텐츠" }))
      .toHaveAttribute("src", "https://cdn.example.com/post-11-thumbnail.jpg");
    expect(within(representativeContent).getByText("라이프스타일")).toBeInTheDocument();
    expect(within(representativeContent).getByText("일상")).toBeInTheDocument();
    expect(within(representativeContent).getByText("브이로그")).toBeInTheDocument();
    expect(representativeContent.querySelectorAll(".fuma-representative-card__keyword"))
      .toHaveLength(5);
    expect(within(representativeContent).queryByText("뷰티")).not.toBeInTheDocument();
    expect(within(analysisReport).getByText("AI 리포트 산정 완료 2026.08.05 10:30"))
      .toBeInTheDocument();
    expect(within(analysisReport).queryByText("협업 이력")).not.toBeInTheDocument();
    expect(within(analysisReport).queryByText("브랜드 A")).not.toBeInTheDocument();
    expect(within(analysisReport).queryByText(/원본에서 확인하기/)).not.toBeInTheDocument();
    expect(within(analysisReport).queryByText(/수집 시각/)).not.toBeInTheDocument();
  });

  test("emphasizes video comparison and still shows keywords", async () => {
    const videoDetail = {
      ...applicantDetail,
      metrics: {
        ...applicantDetail.metrics,
        averageViewCount: { value: 500, sampleCount: 3 },
      },
      contents: applicantDetail.contents.map((content) => ({
        ...content,
        contentType: "SHORT_FORM",
        mediaType: "VIDEO",
      })),
    };
    const videoReport = {
      ...applicantAiReport,
      representativeContentType: "SHORT_FORM",
      representativeViewCount: 1_200,
    };
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/api/admin/generations")) return json([]);
      if (path.endsWith("/api/admin/applications/1/ai-report")) return json(videoReport);
      if (path.endsWith("/api/admin/applications/1")) return json(videoDetail);
      return json(page(applicants));
    }));

    renderApplicantPage("/applicants?detail=1");
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });
    const representativeContent = await within(panel).findByRole("region", { name: "대표 콘텐츠" });
    const featuredBasis = representativeContent.querySelector(".fuma-representative-basis--featured");

    expect(featuredBasis).toHaveTextContent("AI PICK POINT");
    expect(featuredBasis).toHaveTextContent("대표 콘텐츠1,200회");
    expect(featuredBasis).toHaveTextContent("평균 콘텐츠500회");
    expect(featuredBasis).toHaveTextContent("평균보다 2.4배 높은 조회수예요.");
    expect(within(representativeContent).queryByText("라이프스타일")).not.toBeInTheDocument();
    expect(representativeContent.querySelectorAll(".fuma-representative-card__keyword"))
      .toHaveLength(5);
  });

  test.each([
    { status: "PENDING", analysisStatus: "DONE", message: applicantAiReport.summary },
    { status: "PENDING", analysisStatus: "FAILED", message: "AI 리포트 생성에 실패했습니다." },
    { status: "REJECTED", analysisStatus: "PENDING", message: "반려된 지원서는 AI 분석 대상에서 제외됩니다." },
  ] as const)("refreshes a pending applicant without prefetching its report and stops at $status/$analysisStatus", async ({ status, analysisStatus, message }) => {
    vi.useFakeTimers();
    let finished = false;
    let detailRequests = 0;
    let reportRequests = 0;
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/api/admin/generations")) return json([]);
      if (path.endsWith("/api/admin/applications/1/ai-report")) {
        reportRequests += 1;
        return finished && analysisStatus === "DONE" ? json(applicantAiReport) : json(null, 404);
      }
      if (path.endsWith("/api/admin/applications/1")) {
        detailRequests += 1;
        return json({
          ...applicantDetail,
          status: finished ? status : "PENDING",
          analysisStatus: finished ? analysisStatus : "PENDING",
        });
      }
      return json(page(applicants));
    }));

    try {
      await act(async () => {
        prefetchAdminApplication(1);
        await vi.advanceTimersByTimeAsync(0);
        prefetchAdminApplication(1);
        await vi.advanceTimersByTimeAsync(0);
      });
      renderApplicantPage("/applicants?detail=1");
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      const panel = screen.getByRole("dialog", { name: "지원자 상세" });
      expect(within(panel).getByText("AI 리포트를 생성하는 중입니다. 잠시 후 다시 확인해주세요."))
        .toBeInTheDocument();
      expect(within(panel).getByRole("button", { name: "승인" })).toBeEnabled();
      expect(within(panel).getByRole("button", { name: "반려" })).toBeEnabled();
      expect(reportRequests).toBe(0);

      finished = true;
      await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });

      expect(detailRequests).toBe(2);
      expect(within(panel).getByText(message)).toBeInTheDocument();
      await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
      expect(detailRequests).toBe(2);
      expect(reportRequests).toBe(analysisStatus === "DONE" ? 1 : 0);
    } finally {
      vi.useRealTimers();
    }
  });

  test.each([
    ["PENDING", "SNS 정량 지표 수집을 기다리고 있습니다.", "AI 리포트를 생성하는 중입니다. 잠시 후 다시 확인해주세요."],
    ["FAILED", "SNS 정량 지표를 수집하지 못했습니다.", "SNS 콘텐츠 수집에 실패해 AI 분석을 시작하지 못했습니다."],
  ] as const)("renders a %s detail without zero samples", async (mediaCollectionStatus, summary, qualitativeStatus) => {
    const uncollectedDetail = {
      ...pendingApplicantDetail,
      mediaCollectionStatus,
      contents: mediaCollectionStatus === "FAILED" ? applicantDetail.contents : [],
    };
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/api/admin/generations")) return json([]);
      if (/\/api\/admin\/applications\/1$/.test(path)) return json(uncollectedDetail);
      return json(page(applicants));
    }));
    renderApplicantPage("/applicants?detail=1");
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });
    const report = await within(panel).findByRole("region", { name: "지원자 분석 리포트" });

    expect(within(report).getByText(summary)).toBeInTheDocument();
    expect(within(report).getByText(qualitativeStatus)).toBeInTheDocument();
    expect(within(report).getByText("업로드 주기").parentElement)
      .toHaveTextContent("-");
    expect(report).not.toHaveTextContent("표본 0건");
    const formats = within(report).getByRole("group", { name: "콘텐츠 형식 합계 미수집" });
    expect(within(formats).getByText("-")).toBeInTheDocument();
  });

  test("renders a collected zero format total as zero rather than unavailable", async () => {
    const emptyCollectedDetail = {
      ...applicantDetail,
      metrics: {
        ...applicantDetail.metrics,
        recent90DayContentCount: 0,
        uploadCadence: {
          sampleCount: 0,
          dailyAverage: 0,
          weeklyAverage: 0,
          maximumGapDays: null,
        },
        contentFormats: [],
      },
      contents: [],
    };
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/api/admin/generations")) return json([]);
      if (/\/api\/admin\/applications\/1$/.test(path)) return json(emptyCollectedDetail);
      return json(page(applicants));
    }));
    renderApplicantPage("/applicants?detail=1");
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });
    const report = await within(panel).findByRole("region", { name: "지원자 분석 리포트" });
    const formats = within(report).getByRole("group", { name: "콘텐츠 형식 총 0건" });

    const uploadCadenceMetric = within(report).getByText("업로드 주기").parentElement;
    expect(uploadCadenceMetric).toHaveTextContent("주 0.0회");
    expect(uploadCadenceMetric).not.toHaveTextContent("표본");
    expect(within(formats).getByText("0건")).toBeInTheDocument();
  });

  test("approves a pending applicant, closes the panel, and shows a confirmation modal", async () => {
    const statusResponse = deferredResponse();
    let serverStatus: "PENDING" | "APPROVED" = "PENDING";
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/api/admin/generations")) return json([]);
      if (path.endsWith("/api/admin/applications/1/status") && init?.method === "PATCH") {
        return statusResponse.promise;
      }
      if (path.endsWith("/api/admin/applications/1/ai-report")) return json(applicantAiReport);
      if (path.endsWith("/api/admin/applications/1")) {
        return json(applicantDetail);
      }
      return json(page(applicants.map((applicant) => (
        applicant.id === 1 ? { ...applicant, status: serverStatus } : applicant
      ))));
    }));
    const user = userEvent.setup();
    renderApplicantPage("/applicants?detail=1");
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });
    const approve = await within(panel).findByRole("button", { name: "승인" });
    const reject = within(panel).getByRole("button", { name: "반려" });

    await user.click(approve);

    let decisionDialog = screen.getByRole("alertdialog", { name: "승인하시겠습니까?" });
    expect(within(decisionDialog).getByText("승인하면 김민지님께 승인 알림톡이 발송됩니다."))
      .toBeInTheDocument();
    const cancelDecision = within(decisionDialog).getByRole("button", { name: "취소" });
    const confirmDecision = within(decisionDialog).getByRole("button", { name: "확인" });
    expect(cancelDecision).toHaveFocus();
    await user.tab();
    expect(confirmDecision).toHaveFocus();
    await user.tab();
    expect(cancelDecision).toHaveFocus();
    expect(vi.mocked(fetch).mock.calls.filter(([input, init]) => (
      new URL(String(input)).pathname.endsWith("/api/admin/applications/1/status")
      && init?.method === "PATCH"
    ))).toHaveLength(0);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog", { name: "승인하시겠습니까?" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "지원자 상세" })).toBeInTheDocument();

    await user.click(approve);
    decisionDialog = screen.getByRole("alertdialog", { name: "승인하시겠습니까?" });
    await user.click(within(decisionDialog).getByRole("button", { name: "확인" }));

    expect(approve).toHaveTextContent("승인 처리 중...");
    expect(approve).toBeDisabled();
    expect(reject).toBeDisabled();
    expect(within(decisionDialog).getByRole("button", { name: "승인 처리 중..." }))
      .toBeDisabled();
    serverStatus = "APPROVED";
    await act(async () => statusResponse.resolve(await json({ id: 1, status: "APPROVED" })));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "지원자 상세" })).not.toBeInTheDocument();
    });
    const modal = await screen.findByRole("alertdialog", { name: "심사 처리 완료" });
    expect(modal).toHaveClass("hsas-bubble-dialog");
    expect(within(modal).getByText("김민지")).toBeInTheDocument();
    expect(within(modal).getByText(/승인 처리했습니다/)).toBeInTheDocument();

    await user.click(within(modal).getByRole("button", { name: "확인" }));
    const list = await screen.findByRole("region", { name: "지원자 목록" });
    expect(within(within(list).getAllByRole("row")[1]).getByText("승인")).toBeInTheDocument();
  });

  test("returns to the first list page after deciding the last applicant", async () => {
    const listPages: number[] = [];
    let approved = false;
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const path = url.pathname;
      if (path.endsWith("/api/admin/generations")) return json([]);
      if (path.endsWith("/api/admin/applications/1/status") && init?.method === "PATCH") {
        approved = true;
        return json({ id: 1, status: "APPROVED" });
      }
      if (path.endsWith("/api/admin/applications/1/ai-report")) return json(applicantAiReport);
      if (path.endsWith("/api/admin/applications/1")) {
        return json({ ...applicantDetail, status: approved ? "APPROVED" : "PENDING" });
      }
      const requestedPage = Number(url.searchParams.get("page"));
      listPages.push(requestedPage);
      return json({
        content: requestedPage === 0 ? [applicants[1]] : [applicants[0]],
        number: requestedPage,
        size: 20,
        totalElements: approved ? 1 : 2,
        totalPages: approved ? 1 : 2,
      });
    }));
    const user = userEvent.setup();
    renderApplicantPage();
    await screen.findByText("정하린");

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    await user.click(await screen.findByText("김민지"));
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });
    await user.click(await within(panel).findByRole("button", { name: "승인" }));
    await user.click(within(screen.getByRole("alertdialog", { name: "승인하시겠습니까?" }))
      .getByRole("button", { name: "확인" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "지원자 상세" })).not.toBeInTheDocument());
    await waitFor(() => expect(listPages.at(-1)).toBe(0));
    expect(await screen.findByText("1 / 1 페이지")).toBeInTheDocument();
    expect(screen.getByText("정하린")).toBeInTheDocument();
  });

  test("stays on the current page after deciding an applicant when other pages still remain", async () => {
    let approved = false;
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const path = url.pathname;
      if (path.endsWith("/api/admin/generations")) return json([]);
      if (path.endsWith("/api/admin/applications/1/status") && init?.method === "PATCH") {
        approved = true;
        return json({ id: 1, status: "APPROVED" });
      }
      if (path.endsWith("/api/admin/applications/1")) {
        return json({ ...applicantDetail, status: approved ? "APPROVED" : "PENDING" });
      }
      const requestedPage = Number(url.searchParams.get("page"));
      return json({
        content: requestedPage === 0 ? [applicants[1]] : [applicants[0]],
        number: requestedPage,
        size: 20,
        totalElements: 3,
        totalPages: 2,
      });
    }));
    const user = userEvent.setup();
    renderApplicantPage();
    await screen.findByText("정하린");

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    await user.click(await screen.findByText("김민지"));
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });
    await user.click(await within(panel).findByRole("button", { name: "승인" }));
    await user.click(within(screen.getByRole("alertdialog", { name: "승인하시겠습니까?" }))
      .getByRole("button", { name: "확인" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "지원자 상세" })).not.toBeInTheDocument());
    const modal = await screen.findByRole("alertdialog", { name: "심사 처리 완료" });
    await user.click(within(modal).getByRole("button", { name: "확인" }));

    expect(await screen.findByText("2 / 2 페이지")).toBeInTheDocument();
    const list = screen.getByRole("region", { name: "지원자 목록" });
    expect(within(list).getByText("김민지")).toBeInTheDocument();
  });

  test("alerts on a failed applicant decision and leaves the actions available", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/api/admin/generations")) return json([]);
      if (path.endsWith("/api/admin/applications/1/status") && init?.method === "PATCH") {
        return json(null, 500);
      }
      if (path.endsWith("/api/admin/applications/1")) return json(applicantDetail);
      return json(page(applicants));
    }));
    const user = userEvent.setup();
    renderApplicantPage("/applicants?detail=1");
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });

    await user.click(await within(panel).findByRole("button", { name: "반려" }));

    const decisionDialog = screen.getByRole("alertdialog", { name: "반려하시겠습니까?" });
    expect(within(decisionDialog).getByText("반려하면 김민지님께 반려 알림톡이 발송됩니다."))
      .toBeInTheDocument();
    await user.click(within(decisionDialog).getByRole("button", { name: "확인" }));

    await waitFor(() => expect(alert).toHaveBeenCalledWith("조회에 실패했습니다."));
    expect(within(decisionDialog).getByRole("button", { name: "취소" })).toBeEnabled();
    expect(within(decisionDialog).getByRole("button", { name: "확인" })).toBeEnabled();
    alert.mockRestore();
  });

  test("announces list errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => json(null, 500)));
    renderApplicantPage();

    expect(within(await screen.findByRole("alert")).getByText("조회에 실패했습니다."))
      .toBeInTheDocument();
  });
});
