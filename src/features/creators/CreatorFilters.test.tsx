import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CreatorListPage, ProposalHistoryPage } from "./CreatorPages";

function renderCreatorPage(path = "/creators") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CreatorListPage />
    </MemoryRouter>,
  );
}

function renderProposalPage(path = "/proposals") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ProposalHistoryPage />
    </MemoryRouter>,
  );
}

function acceptedProposal(runId: string) {
  return {
    currentStep: null,
    failedCount: 0,
    finishedAt: null,
    processedCount: 0,
    progressMessage: null,
    progressPercent: null,
    runId,
    skippedCount: 0,
    startedAt: null,
    startedBy: { adminId: 1, name: "관리자" },
    status: "QUEUED",
    succeededCount: 0,
    taskType: "PROPOSAL_EMAIL_SEND",
    totalCount: null,
    triggerType: "ADMIN_TRIGGERED",
  };
}

function resultCount(count: number) {
  return screen.getByText(`총 ${count}건`);
}

afterEach(() => vi.unstubAllGlobals());

describe("creator filters", () => {
  const creator = {
    id: 113,
    snsCode: "INSTAGRAM",
    accountId: "seo.yeon",
    creatorName: "김서연",
    profileImageUrl: "https://cdn.example.com/seo-yeon.jpg",
    followerCount: 82_400,
    engagementRate: 4.25,
    lastContentAt: "2026-08-12T20:00:00",
    category: "BEAUTY",
    recent90DayContentCount: 14,
  };
  const youtubeCreator = {
    ...creator,
    id: 114,
    snsCode: "YOUTUBE",
    accountId: "UCnMBn-PNx1M9TLF0s-sEDeQ",
    creatorName: "Clevr TV",
    profileImageUrl: "https://cdn.example.com/clevr-list.jpg",
    followerCount: 830_000,
    engagementRate: 0.92,
    recent90DayContentCount: 25,
    category: "SKINCARE",
  };
  const numericInstagramCreator = {
    ...creator,
    id: 115,
    accountId: "17841400602400210",
    creatorName: "numeric.instagram",
    profileImageUrl: null,
    followerCount: 12_345,
    engagementRate: 1.23,
    recent90DayContentCount: 4,
    category: "LEGACY_INTERNAL",
  };
  const creatorDetail = {
    ...creator,
    categoryShares: [
      { categoryCode: "BEAUTY", totalShare: 0.75 },
      { categoryCode: "FASHION", totalShare: 0.25 },
    ],
    brandScore: 0,
    brandHits: null,
    igHandle: null,
    igConfidence: null,
    registeredAt: "2026-08-01T09:00:00",
    firstDiscoveredAt: "2026-07-31T09:00:00",
    updatedAt: "2026-08-13T09:00:00",
  };
  const youtubeCreatorDetail = {
    ...youtubeCreator,
    profileImageUrl: "https://cdn.example.com/clevr-detail.jpg",
    categoryShares: [
      { categoryCode: "SKINCARE", totalShare: 0.7 },
      { categoryCode: "BEAUTY", totalShare: 0.3 },
    ],
    brandScore: 0,
    brandHits: null,
    igHandle: "clevr.instagram",
    igConfidence: 0.95,
    registeredAt: "2026-08-02T09:00:00",
    firstDiscoveredAt: "2026-08-01T09:00:00",
    updatedAt: "2026-08-13T09:00:00",
  };

  function ok(totalPages = 1) {
    return new Response(JSON.stringify({
      success: true,
      data: {
        content: [creator, youtubeCreator, numericInstagramCreator],
        totalElements: 3,
        totalPages,
        number: 0,
        size: 20,
      },
    }));
  }

  function mockCreatorApi(totalPages = 1, failedProposalIds: ReadonlySet<number> = new Set()) {
    return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith("/api/admin/creators/113")) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: creatorDetail })));
      }
      if (String(input).endsWith("/api/admin/creators/114")) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: youtubeCreatorDetail })));
      }
      if (String(input).endsWith("/api/admin/proposals") && init?.method === "POST") {
        const { creatorId } = JSON.parse(String(init.body)) as { creatorId: number };
        const failed = failedProposalIds.has(creatorId);
        return Promise.resolve(new Response(JSON.stringify({
          success: !failed,
          data: failed ? null : acceptedProposal(`proposal-run-${creatorId}`),
          message: failed ? "발송 실패" : null,
        }), { status: failed ? 502 : 202 }));
      }
      return Promise.resolve(
        String(input).endsWith("/api/admin/categories")
          ? new Response(JSON.stringify({
              success: true,
              data: [
                { id: 1, code: "TRAVEL", name: "여행", displayOrder: 1, enabled: true, keywords: [] },
                { id: 2, code: "SKINCARE", name: "스킨케어", displayOrder: 2, enabled: true, keywords: [] },
              ],
            }))
          : ok(totalPages),
      );
    });
  }

  function creatorRequests(fetchMock: ReturnType<typeof mockCreatorApi>) {
    return fetchMock.mock.calls.filter(([input, init]) => (
      String(input).includes("/api/admin/creators?") && init?.method !== "DELETE"
    ));
  }

  function proposalRequests(fetchMock: ReturnType<typeof mockCreatorApi>) {
    return fetchMock.mock.calls.filter(([input, init]) => (
      String(input).endsWith("/api/admin/proposals") && init?.method === "POST"
    ));
  }

  test("renders the API result as a read-only table and requests server pagination", async () => {
    const user = userEvent.setup();
    const fetchMock = mockCreatorApi(2);
    vi.stubGlobal("fetch", fetchMock);
    renderCreatorPage();

    const table = screen.getByRole("region", { name: "크리에이터 목록" });
    expect(await within(table).findByRole("button", { name: "김서연 프로필 보기" })).toBeInTheDocument();
    expect(within(table).getByRole("img", { name: "김서연 프로필 이미지" }))
      .toHaveAttribute("src", "https://cdn.example.com/seo-yeon.jpg");
    expect(within(table).getByRole("img", { name: "numeric.instagram 프로필 이미지 없음" }))
      .toBeInTheDocument();
    expect(within(table).getByRole("button", { name: "Clevr TV 프로필 보기" })).toBeInTheDocument();
    expect(within(table).getByText("82,400")).toBeInTheDocument();
    expect(within(table).getByText("4.25%")).toBeInTheDocument();
    expect(within(table).getByText("14건")).toBeInTheDocument();
    expect(within(table).getByText("25+건")).toBeInTheDocument();
    expect(await within(table).findByText("스킨케어")).toBeInTheDocument();
    expect(within(table).queryByText("LEGACY_INTERNAL")).not.toBeInTheDocument();
    expect(within(table).getByRole("button", { name: "numeric.instagram 프로필 보기" }).closest("tr"))
      .toHaveTextContent("기타");
    expect(within(table).queryByRole("columnheader", { name: "크리에이터 ID" }))
      .not.toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "플랫폼" }))
      .not.toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "SNS 계정" }))
      .not.toBeInTheDocument();
    expect(within(within(table).getByRole("button", { name: "김서연 프로필 보기" }))
      .getByRole("img", { name: "Instagram 플랫폼" })).toBeInTheDocument();
    expect(within(within(table).getByRole("button", { name: "Clevr TV 프로필 보기" }))
      .getByRole("img", { name: "YouTube 플랫폼" })).toBeInTheDocument();
    const seoLink = within(table).getByRole("link", { name: "김서연 SNS 계정 열기 (새 창)" });
    expect(seoLink)
      .toHaveAttribute("href", "https://www.instagram.com/seo.yeon");
    expect(seoLink).not.toHaveClass("hsas-button");
    expect(within(table).getByRole("link", { name: "Clevr TV SNS 계정 열기 (새 창)" }))
      .toHaveAttribute("href", "https://www.youtube.com/channel/UCnMBn-PNx1M9TLF0s-sEDeQ");
    expect(within(table).queryByText("UCnMBn-PNx1M9TLF0s-sEDeQ")).not.toBeInTheDocument();
    expect(within(table).getByRole("link", { name: "numeric.instagram SNS 계정 열기 (새 창)" }))
      .toHaveAttribute("href", "https://www.instagram.com/numeric.instagram");
    expect(screen.queryByRole("button", { name: "카드" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "선택 0명 제안 발송" })).toBeDisabled();

    const seoRow = within(table).getByRole("button", { name: "김서연 프로필 보기" }).closest("tr");
    const seoCheckbox = within(table).getByRole("checkbox", { name: "김서연 선택" });
    const selectAll = within(table).getByRole("checkbox", { name: "현재 페이지 전체 선택" });
    await user.click(seoCheckbox);
    expect(seoRow).toHaveAttribute("aria-selected", "true");
    expect(selectAll).toBePartiallyChecked();
    expect(screen.getByRole("button", { name: "선택 1명 제안 발송" })).toBeEnabled();

    await user.click(selectAll);
    expect(within(table).getAllByRole("checkbox")).toHaveLength(4);
    within(table).getAllByRole("checkbox").forEach((checkbox) => expect(checkbox).toBeChecked());
    expect(screen.getByRole("button", { name: "선택 3명 제안 발송" })).toBeEnabled();

    await user.click(selectAll);
    within(table).getAllByRole("checkbox").forEach((checkbox) => expect(checkbox).not.toBeChecked());
    expect(screen.getByRole("button", { name: "선택 0명 제안 발송" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    await waitFor(() => expect(creatorRequests(fetchMock)).toHaveLength(2));
    expect(String(creatorRequests(fetchMock)[1][0])).toContain("page=1");
  });

  test("opens a creator profile with public metrics and connected channels", async () => {
    const user = userEvent.setup();
    const fetchMock = mockCreatorApi();
    vi.stubGlobal("fetch", fetchMock);
    renderCreatorPage();
    const table = screen.getByRole("region", { name: "크리에이터 목록" });

    await user.click(await within(table).findByRole("checkbox", { name: "김서연 선택" }));
    await user.click(await within(table).findByRole("button", { name: "Clevr TV 프로필 보기" }));

    const panel = await screen.findByRole("dialog", { name: "크리에이터 프로필" });
    expect(await within(panel).findByRole("heading", { name: "Clevr TV" })).toBeInTheDocument();
    expect(within(panel).getByRole("img", { name: "Clevr TV 프로필 이미지" }))
      .toHaveAttribute("src", "https://cdn.example.com/clevr-detail.jpg");
    expect(within(panel).getByText("83만")).toBeInTheDocument();
    expect(within(panel).getByText("0.92%")).toBeInTheDocument();
    expect(within(panel).getByText("25+건")).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "YouTube 채널 ↗" }))
      .toHaveAttribute("href", "https://www.youtube.com/channel/UCnMBn-PNx1M9TLF0s-sEDeQ");
    expect(within(panel).getByRole("link", { name: "@clevr.instagram ↗" }))
      .toHaveAttribute("href", "https://www.instagram.com/clevr.instagram");
    expect(within(panel).getByText("프로필 URL에서 발견")).toBeInTheDocument();
    expect(within(panel).getByRole("progressbar", { name: "스킨케어 발굴 비중" }))
      .toHaveValue(70);
    expect(within(panel).getByRole("progressbar", { name: "뷰티 발굴 비중" }))
      .toHaveValue(30);
    expect(within(panel).queryByText("SKINCARE")).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([input]) => (
      String(input).endsWith("/api/admin/creators/114")
    ))).toHaveLength(1);

    await user.click(within(panel).getByRole("button", { name: "제안 작성" }));
    const proposalPanel = await screen.findByRole("dialog", { name: "제안 발송" });
    const target = within(proposalPanel).getByRole("complementary", { name: "제안 대상" });
    expect(target).toHaveTextContent("Clevr TV");
    expect(target).not.toHaveTextContent("김서연");
    await user.click(within(proposalPanel).getByRole("button", { name: "상세 패널 닫기" }));
    expect(screen.getByRole("button", { name: "선택 1명 제안 발송" })).toBeEnabled();
  });

  test("sends proposals to every selected creator from the side panel", async () => {
    const user = userEvent.setup();
    const fetchMock = mockCreatorApi();
    vi.stubGlobal("fetch", fetchMock);
    renderCreatorPage();
    const table = screen.getByRole("region", { name: "크리에이터 목록" });
    await within(table).findByRole("button", { name: "김서연 프로필 보기" });

    await user.click(within(table).getByRole("checkbox", { name: "김서연 선택" }));
    await user.click(within(table).getByRole("checkbox", { name: "Clevr TV 선택" }));
    await user.click(screen.getByRole("button", { name: "선택 2명 제안 발송" }));

    const panel = await screen.findByRole("dialog", { name: "제안 발송" });
    expect(panel).toHaveAttribute("data-visual-contract", "detail-side-panel");
    expect(within(panel).getByText("CREATOR OUTREACH")).toBeInTheDocument();
    expect(within(panel).getByRole("heading", {
      name: "2명의 크리에이터에게 보낼 제안을 작성합니다.",
    })).toBeInTheDocument();
    expect(within(panel).getByRole("heading", { name: "제안 내용" })).toBeInTheDocument();
    const target = within(panel).getByRole("complementary", { name: "제안 대상" });
    expect(target).toHaveTextContent("2명 선택됨");
    expect(within(target).getAllByRole("listitem")).toHaveLength(2);
    expect(within(target).getByText("김서연")).toBeInTheDocument();
    expect(within(target).getByText("Clevr TV")).toBeInTheDocument();
    expect(within(panel).getByText("https://hiselectors.shop/apply")).toBeInTheDocument();
    expect(panel).not.toHaveTextContent("?creatorId=");
    expect(panel).toHaveTextContent("셀렉터스 활동 지원을 제안드리는 안내");
    await user.click(within(panel).getByRole("button", { name: "수정" }));
    const subject = within(panel).getByRole("textbox", { name: "제목" });
    const message = within(panel).getByRole("textbox", { name: "제안 메시지" });
    expect(subject).toHaveAttribute("maxlength", "200");
    expect(message).toHaveAttribute("maxlength", "10000");
    expect((subject as HTMLInputElement).value).toContain("지원 제안");
    expect((subject as HTMLInputElement).value).toContain("${creatorName}");
    expect((message as HTMLTextAreaElement).value).toContain("${proposalLink}");
    await user.clear(subject);
    await user.type(subject, "   ");
    expect(within(panel).getByRole("button", { name: "2명에게 제안 발송" }))
      .toBeDisabled();
    expect(proposalRequests(fetchMock)).toHaveLength(0);
    await user.clear(subject);
    await user.type(subject, "맞춤 제목");
    await user.clear(message);
    await user.type(message, "맞춤 메시지");
    await user.click(within(panel).getByRole("button", { name: "2명에게 제안 발송" }));

    await waitFor(() => expect(proposalRequests(fetchMock)).toHaveLength(2));
    expect(proposalRequests(fetchMock).map(([, init]) => JSON.parse(String(init?.body))))
      .toEqual([
        { creatorId: 113, subject: "맞춤 제목", body: "맞춤 메시지" },
        { creatorId: 114, subject: "맞춤 제목", body: "맞춤 메시지" },
      ]);
    const requested = await screen.findByRole("alertdialog", { name: "제안 발송 요청" });
    expect(requested).toHaveTextContent("2명에게 제안 발송을 요청했습니다.");
    expect(requested).toHaveTextContent("작업 진행상황에서 확인해 주세요.");
    const idempotencyKeys = proposalRequests(fetchMock).map(([, init]) => (
      new Headers(init?.headers).get("Idempotency-Key")
    ));
    expect(idempotencyKeys).toHaveLength(2);
    idempotencyKeys.forEach((key) => expect(key).toMatch(/^[0-9a-f-]{36}$/));
    expect(new Set(idempotencyKeys).size).toBe(2);
    await user.click(within(requested).getByRole("button", { name: "확인" }));
    expect(screen.getByRole("button", { name: "선택 0명 제안 발송" })).toBeDisabled();
  });

  test("continues after a failed proposal and leaves only failures selected", async () => {
    const user = userEvent.setup();
    const fetchMock = mockCreatorApi(1, new Set([114]));
    vi.stubGlobal("fetch", fetchMock);
    renderCreatorPage();
    const table = screen.getByRole("region", { name: "크리에이터 목록" });
    await within(table).findByRole("button", { name: "김서연 프로필 보기" });

    await user.click(within(table).getByRole("checkbox", { name: "현재 페이지 전체 선택" }));
    await user.click(screen.getByRole("button", { name: "선택 3명 제안 발송" }));
    const panel = await screen.findByRole("dialog", { name: "제안 발송" });
    await user.click(within(panel).getByRole("button", { name: "수정" }));
    const subject = within(panel).getByRole("textbox", { name: "제목" });
    const message = within(panel).getByRole("textbox", { name: "제안 메시지" });
    await user.clear(subject);
    await user.type(subject, "재시도 제목");
    await user.clear(message);
    await user.type(message, "재시도 메시지");
    await user.click(within(panel).getByRole("button", { name: "3명에게 제안 발송" }));

    expect(await within(panel).findByRole("alert"))
      .toHaveTextContent("2명 요청됨, 1명 요청에 실패했습니다. 발송 실패");
    expect(proposalRequests(fetchMock).map(([, init]) => JSON.parse(String(init?.body))))
      .toEqual([113, 114, 115].map((creatorId) => ({
        creatorId,
        subject: "재시도 제목",
        body: "재시도 메시지",
      })));
    expect(within(panel).getByText("Clevr TV")).toBeInTheDocument();
    expect(within(panel).queryByText("김서연")).not.toBeInTheDocument();
    expect(subject).toHaveValue("재시도 제목");
    expect(message).toHaveValue("재시도 메시지");
    expect(within(panel).getByRole("button", { name: "1명에게 제안 발송" })).toBeEnabled();
  });

  test("sends quantitative and brand filters to the API and reset clears them", async () => {
    const user = userEvent.setup();
    const fetchMock = mockCreatorApi();
    vi.stubGlobal("fetch", fetchMock);
    renderCreatorPage();
    await screen.findByRole("button", { name: "김서연 프로필 보기" });
    const search = screen.getByRole("search", { name: "검색 조건" });
    const keyword = within(search).getByRole("textbox", { name: "키워드" });
    const minFollowers = within(search).getByRole("textbox", { name: "최소 팔로워·구독자" });
    const maxFollowers = within(search).getByRole("textbox", { name: "최대 팔로워·구독자" });
    const excludeBrands = screen.getByRole("checkbox", { name: "브랜드 계정 제외" });
    expect(excludeBrands).not.toBeChecked();
    expect(within(search).queryByRole("textbox", { name: "최소 ER" })).not.toBeInTheDocument();
    expect(within(search).queryByRole("textbox", { name: "최근 90일 최소 활동" })).not.toBeInTheDocument();
    const platform = within(search).getByRole("combobox", { name: "플랫폼" });
    const categories = screen.getByRole("navigation", { name: "크리에이터 카테고리" });
    const travel = await within(categories).findByRole("button", { name: "여행" });
    expect(within(categories).getByRole("button", { name: "스킨케어" })).toBeInTheDocument();

    await user.click(travel);
    await waitFor(() => expect(creatorRequests(fetchMock)).toHaveLength(2));
    expect(travel).toHaveAttribute("aria-pressed", "true");

    await user.type(keyword, "seo");
    await user.type(minFollowers, "600,000");
    await user.type(maxFollowers, "500,000");
    await user.selectOptions(platform, "INSTAGRAM");
    await user.click(excludeBrands);
    expect(excludeBrands).toBeChecked();
    await waitFor(() => expect(creatorRequests(fetchMock)).toHaveLength(3));
    await user.click(within(search).getByRole("button", { name: "조회" }));

    expect(creatorRequests(fetchMock)).toHaveLength(3);
    expect(screen.getByText("팔로워·구독자 범위를 올바르게 입력해 주세요."))
      .toBeInTheDocument();

    await user.clear(minFollowers);
    await user.type(minFollowers, "100,000");
    await user.click(within(search).getByRole("button", { name: "조회" }));

    await waitFor(() => expect(creatorRequests(fetchMock)).toHaveLength(4));
    const requestUrl = new URL(String(creatorRequests(fetchMock)[3][0]));
    expect(Object.fromEntries(requestUrl.searchParams)).toMatchObject({
      keyword: "seo",
      minFollower: "100000",
      maxFollower: "500000",
      maxBrandScore: "1",
      snsCode: "INSTAGRAM",
      categoryCode: "TRAVEL",
      page: "0",
      size: "20",
    });
    expect(requestUrl.searchParams.has("minEngagementRate")).toBe(false);
    expect(requestUrl.searchParams.has("minRecent90DayContentCount")).toBe(false);

    await user.click(within(search).getByRole("button", { name: "초기화" }));

    expect(keyword).toHaveValue("");
    expect(minFollowers).toHaveValue("");
    expect(maxFollowers).toHaveValue("");
    expect(platform).toHaveValue("");
    expect(excludeBrands).not.toBeChecked();
    expect(within(categories).getByRole("button", { name: "전체" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  test("runs the combined creator discovery batch and refreshes the list", async () => {
    const user = userEvent.setup();
    let resolveYoutube: (() => void) | undefined;
    const discoveryOk = () => new Response(JSON.stringify({ success: true, data: {} }));
    const fetchMock = vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
      void _init;
      const url = String(input);
      if (url.endsWith("/api/admin/categories")) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: [] })));
      }
      if (url.includes("/api/admin/creators?")) return Promise.resolve(ok());
      if (url.endsWith("/api/admin/discovery/youtube/run")) {
        return new Promise<Response>((resolve) => {
          resolveYoutube = () => resolve(discoveryOk());
        });
      }
      return Promise.resolve(discoveryOk());
    });
    vi.stubGlobal("fetch", fetchMock);
    renderCreatorPage();
    await screen.findByRole("button", { name: "김서연 프로필 보기" });

    await user.click(screen.getByRole("button", { name: "크리에이터 풀 구축" }));

    expect(screen.getByRole("button", { name: "풀 구축 중..." })).toBeDisabled();
    resolveYoutube?.();

    await waitFor(() => expect(screen.getByRole("status"))
      .toHaveTextContent("크리에이터 풀 구축을 완료했습니다."));
    const discoveryCalls = fetchMock.mock.calls.filter(([input]) => (
      String(input).includes("/api/admin/discovery/")
    ));
    expect(discoveryCalls.map(([input]) => new URL(String(input)).pathname)).toEqual([
      "/api/admin/discovery/youtube/run",
    ]);
    discoveryCalls.forEach(([, init]) => expect(init).toMatchObject({ method: "POST" }));
    await waitFor(() => expect(creatorRequests(fetchMock)).toHaveLength(2));
    expect(screen.getByRole("button", { name: "크리에이터 풀 구축" })).toBeEnabled();
  });

  test("shows the combined discovery error", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/admin/categories")) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: [] })));
      }
      if (url.includes("/api/admin/creators?")) return Promise.resolve(ok());
      if (url.endsWith("/api/admin/discovery/youtube/run")) {
        return Promise.resolve(new Response(JSON.stringify({
          success: false,
          data: null,
          message: "YouTube 발굴 실패",
        }), { status: 502 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true, data: {} })));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderCreatorPage();
    await screen.findByRole("button", { name: "김서연 프로필 보기" });

    await user.click(screen.getByRole("button", { name: "크리에이터 풀 구축" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("YouTube 발굴 실패"));
    expect(fetchMock.mock.calls.filter(([input]) => (
      String(input).includes("/api/admin/discovery/")
    )).map(([input]) => new URL(String(input)).pathname)).toEqual([
      "/api/admin/discovery/youtube/run",
    ]);
  });

  test("keeps the creator pool reset action in environment settings", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      if (String(input).endsWith("/api/admin/categories")) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: [] })));
      }
      return Promise.resolve(ok());
    }));
    renderCreatorPage();

    await screen.findByRole("button", { name: "김서연 프로필 보기" });
    expect(screen.queryByRole("button", { name: "기존 풀 초기화" })).not.toBeInTheDocument();
  });
});

describe("proposal history", () => {
  function proposalEntry(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      proposalHistoryId: 1,
      creatorId: 113,
      creatorName: "김서연",
      snsCode: "INSTAGRAM",
      accountId: "seo.yeon",
      email: "seoyeon@example.com",
      adminName: "김민지",
      createdAt: "2026-08-03T10:24:00",
      ...overrides,
    };
  }

  test("filters proposal history by platform tab without calling the API again", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        content: [
          proposalEntry(),
          proposalEntry({
            proposalHistoryId: 2,
            creatorId: 114,
            creatorName: "Clevr TV",
            snsCode: "YOUTUBE",
            accountId: "UCnMBn-PNx1M9TLF0s-sEDeQ",
            email: "clevr@example.com",
          }),
        ],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 100,
      },
    })));
    vi.stubGlobal("fetch", fetchMock);
    renderProposalPage();

    const table = screen.getByRole("region", { name: "제안 이력 목록" });
    expect(await within(table).findByText("김서연")).toBeInTheDocument();
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "순번",
      "크리에이터",
      "플랫폼",
      "SNS 계정",
      "이메일 주소",
      "발송 시각",
    ]);
    expect(within(table).queryByRole("columnheader", { name: "발송자" })).not.toBeInTheDocument();
    expect(within(table).getByText("Clevr TV")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "제안 플랫폼" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "YouTube" }));
    expect(within(table).queryByText("김서연")).not.toBeInTheDocument();
    expect(within(table).getByText("Clevr TV")).toBeInTheDocument();
    expect(resultCount(1)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Instagram" }));
    expect(within(table).getByText("김서연")).toBeInTheDocument();
    expect(within(table).queryByText("Clevr TV")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "전체" }));
    expect(within(table).getByText("김서연")).toBeInTheDocument();
    expect(within(table).getByText("Clevr TV")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.click(within(table).getByText("김서연"));
    const detail = await screen.findByRole("dialog", { name: "발송 내역" });
    expect(detail).toHaveTextContent("제안사더현대");
  });

  test("paginates loaded proposal history on the client", async () => {
    const user = userEvent.setup();
    const content = Array.from({ length: 21 }, (_, index) => proposalEntry({
      proposalHistoryId: index + 1,
      creatorName: index === 0 ? "김서연" : `크리에이터 ${index + 1}`,
      accountId: `creator-${index + 1}`,
      email: `creator-${index + 1}@example.com`,
    }));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        content,
        totalElements: 21,
        totalPages: 1,
        number: 0,
        size: 100,
      },
    })));
    vi.stubGlobal("fetch", fetchMock);
    renderProposalPage();

    const table = screen.getByRole("region", { name: "제안 이력 목록" });
    expect(await within(table).findByText("김서연")).toBeInTheDocument();
    expect(resultCount(21)).toBeInTheDocument();
    expect(screen.getByText("1 / 2 페이지")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    expect(screen.getByText("2 / 2 페이지")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("filters proposal history by sent period from the search panel", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        content: [
          proposalEntry(),
          proposalEntry({
            proposalHistoryId: 2,
            creatorName: "Clevr TV",
            createdAt: "2026-08-20T10:24:00",
            email: "clevr@example.com",
          }),
        ],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 100,
      },
    })));
    vi.stubGlobal("fetch", fetchMock);
    renderProposalPage();

    const table = screen.getByRole("region", { name: "제안 이력 목록" });
    expect(await within(table).findByText("Clevr TV")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    fireEvent.change(within(search).getByLabelText("발송 시작일"), {
      target: { value: "2026-08-10" },
    });
    fireEvent.change(within(search).getByLabelText("발송 종료일"), {
      target: { value: "2026-08-31" },
    });
    await user.click(within(search).getByRole("button", { name: "조회" }));

    expect(within(table).queryByText("김서연")).not.toBeInTheDocument();
    expect(within(table).getByText("Clevr TV")).toBeInTheDocument();
    expect(resultCount(1)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.click(within(search).getByRole("button", { name: "초기화" }));
    expect(within(table).getByText("김서연")).toBeInTheDocument();
    expect(within(table).getByText("Clevr TV")).toBeInTheDocument();
  });
});
