import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
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
    followerCount: 58_420,
    engagementRate: 2.55,
    totalContentCount: 126,
    recent90DayContentCount: 29,
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
    snsAccountId: "harin-lab",
    followerCount: 83_100,
    engagementRate: 3.1,
    totalContentCount: 94,
    recent90DayContentCount: 23,
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
    followerCount: 400,
    engagementRate: null,
    totalContentCount: null,
    recent90DayContentCount: 2,
    status: "PENDING",
    mediaCollectionStatus: "DONE",
    appliedAt: "2026-08-03T10:46:00",
    mediaCollectedAt: "2026-08-05T10:00:00",
    updatedAt: "2026-08-05T10:00:00",
  },
] as const;

const applicantDetail = {
  ...applicants[0],
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
    mediaUrl: null,
    contentType: "FEED",
    sequenceNo: 0,
    publishedAt: "2026-08-02T12:00:00",
    viewCount: null,
    likeCount: 120,
    commentCount: 0,
    collectedAt: "2026-08-05T10:00:00",
  }],
};

const applicantAiReport = {
  applicationId: 1,
  summary: "",
  category: "",
  keywords: [],
  contentStyle: "",
  tone: "",
  strength: "",
  warning: "",
  brandHistory: "",
  status: "COMPLETED",
  createdAt: "2026-08-05T10:00:00",
};

const pendingApplicantDetail = {
  ...applicantDetail,
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
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/keyword=.*snsCode=YOUTUBE.*status=APPROVED.*generationId=3.*page=0.*size=20/),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ));
    expect(screen.getByText("총 1건")).toBeInTheDocument();
    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
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

    expect(screen.getByText("정하린")).toBeInTheDocument();
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
    expect(within(panel).getByRole("status")).toHaveTextContent("지원자 정보를 불러오는 중입니다.");

    await act(async () => pendingDetail.resolve(await json(applicantDetail)));
    expect(await within(panel).findByRole("heading", { name: "김민지" })).toBeInTheDocument();
    const report = within(panel).getByRole("region", { name: "지원자 분석 리포트" });
    expect(within(report).getByText("- · 표본 0건")).toBeInTheDocument();
    expect(within(report).getByText("평균 댓글").parentElement)
      .toHaveTextContent("0 · 표본 3건");
    expect(within(report).getAllByText("미분류")).not.toHaveLength(0);
    expect(within(report).getByText("전체 공개 콘텐츠").parentElement).toHaveTextContent("126건");
    expect(within(panel).getByText("최종 업데이트").parentElement)
      .toHaveTextContent("2026.08.05 10:00");
  });

  test.each([
    ["PENDING", "SNS 정량 지표 수집을 기다리고 있습니다."],
    ["FAILED", "SNS 정량 지표를 수집하지 못했습니다."],
  ] as const)("renders a %s detail without zero samples", async (mediaCollectionStatus, summary) => {
    const uncollectedDetail = { ...pendingApplicantDetail, mediaCollectionStatus };
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
    expect(within(report).getByText("업로드 주기").parentElement)
      .toHaveTextContent("-");
    expect(report).not.toHaveTextContent("표본 0건");
    expect(within(report).getByText("최장 게시 공백").parentElement).toHaveTextContent("-");
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

    expect(within(report).getByText("업로드 주기").parentElement)
      .toHaveTextContent("주 0.0회 · 표본 0건");
    expect(within(formats).getByText("0건")).toBeInTheDocument();
  });

  test("approves a pending applicant, disables both actions, and refetches the detail", async () => {
    const statusResponse = deferredResponse();
    let detailRequests = 0;
    let listRequests = 0;
    let serverStatus: "PENDING" | "APPROVED" = "PENDING";
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/api/admin/generations")) return json([]);
      if (path.endsWith("/api/admin/applications/1/status") && init?.method === "PATCH") {
        return statusResponse.promise;
      }
      if (path.endsWith("/api/admin/applications/1/ai-report")) return json(applicantAiReport);
      if (path.endsWith("/api/admin/applications/1")) {
        detailRequests += 1;
        return json(detailRequests === 1
          ? applicantDetail
          : { ...applicantDetail, status: "APPROVED" });
      }
      listRequests += 1;
      return json(page(applicants.map((applicant) => (
        applicant.id === 1 ? { ...applicant, status: serverStatus } : applicant
      ))));
    }));
    const user = userEvent.setup();
    renderApplicantPage("/applicants?detail=1");
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });
    const approve = await within(panel).findByRole("button", { name: "승인" });

    await user.click(approve);

    expect(within(panel).getByRole("button", { name: "승인 처리 중..." })).toBeDisabled();
    expect(within(panel).getByRole("button", { name: "반려" })).toBeDisabled();
    serverStatus = "APPROVED";
    await act(async () => statusResponse.resolve(await json({ id: 1, status: "APPROVED" })));

    await waitFor(() => {
      expect(detailRequests).toBe(2);
      expect(listRequests).toBe(2);
    });
    expect(within(panel).queryByRole("button", { name: "승인" })).not.toBeInTheDocument();
    const completion = within(panel).getByText("승인 처리가 완료됐습니다.").closest("section");
    expect(completion).toHaveAttribute("role", "status");
    expect(completion).toHaveFocus();
    await user.click(within(panel).getByRole("button", { name: "상세 패널 닫기" }));
    const list = await screen.findByRole("region", { name: "지원자 목록" });
    expect(within(within(list).getAllByRole("row")[1]).getByText("승인")).toBeInTheDocument();
  });

  test("keeps a completed decision when the detail refresh fails", async () => {
    let detailRequests = 0;
    const alert = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/api/admin/generations")) return json([]);
      if (path.endsWith("/api/admin/applications/1/status") && init?.method === "PATCH") {
        return json({ id: 1, status: "APPROVED" });
      }
      if (path.endsWith("/api/admin/applications/1")) {
        detailRequests += 1;
        return detailRequests === 1 ? json(applicantDetail) : json(null, 500);
      }
      return json(page(applicants));
    }));
    const user = userEvent.setup();
    renderApplicantPage("/applicants?detail=1");
    const panel = await screen.findByRole("dialog", { name: "지원자 상세" });

    await user.click(await within(panel).findByRole("button", { name: "승인" }));

    await waitFor(() => expect(alert).toHaveBeenCalledWith(
      "심사 처리는 완료됐지만 최신 지원자 정보를 불러오지 못했습니다.",
    ));
    const completion = within(panel).getByText("승인 처리가 완료됐습니다.").closest("section");
    expect(completion).toHaveFocus();
    expect(within(panel).queryByRole("button", { name: "승인" })).not.toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: "반려" })).not.toBeInTheDocument();
    alert.mockRestore();
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

    await waitFor(() => expect(listPages).toEqual([0, 1, 0]));
    await user.click(within(panel).getByRole("button", { name: "상세 패널 닫기" }));
    expect(await screen.findByText("1 / 1 페이지")).toBeInTheDocument();
    expect(screen.getByText("정하린")).toBeInTheDocument();
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

    await waitFor(() => expect(alert).toHaveBeenCalledWith("조회에 실패했습니다."));
    expect(within(panel).getByRole("button", { name: "승인" })).toBeEnabled();
    expect(within(panel).getByRole("button", { name: "반려" })).toBeEnabled();
    alert.mockRestore();
  });

  test("announces list errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => json(null, 500)));
    renderApplicantPage();

    expect(within(await screen.findByRole("alert")).getByText("조회에 실패했습니다."))
      .toBeInTheDocument();
  });
});
