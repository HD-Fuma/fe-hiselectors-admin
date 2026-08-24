import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CreatorListPage, ProposalComposePage, ProposalHistoryPage } from "./CreatorPages";

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

function renderProposalComposePage(path = "/proposals/new?creator=113") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ProposalComposePage />
    </MemoryRouter>,
  );
}

function acceptedProposal(runId: string) {
  return {
    currentStep: null,
    failedCount: 0,
    processedCount: 0,
    progressPercent: null,
    runId,
    skippedCount: 0,
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
    followerCount: 12_345,
    engagementRate: 1.23,
    recent90DayContentCount: 4,
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
    return fetchMock.mock.calls.filter(([input]) => String(input).includes("/api/admin/creators?"));
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
    expect(await within(table).findByText("김서연 ↗")).toBeInTheDocument();
    expect(within(table).getByText("Clevr TV ↗")).toBeInTheDocument();
    expect(within(table).getByText("82,400")).toBeInTheDocument();
    expect(within(table).getByText("4.25%")).toBeInTheDocument();
    expect(within(table).getByText("14건")).toBeInTheDocument();
    expect(within(table).getByText("25+건")).toBeInTheDocument();
    expect(await within(table).findByText("스킨케어")).toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "SNS 계정" }))
      .not.toBeInTheDocument();
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

    const seoRow = within(table).getByText("김서연 ↗").closest("tr");
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

  test("sends proposals to every selected creator from the side panel", async () => {
    const user = userEvent.setup();
    const fetchMock = mockCreatorApi();
    vi.stubGlobal("fetch", fetchMock);
    renderCreatorPage();
    const table = screen.getByRole("region", { name: "크리에이터 목록" });
    await within(table).findByText("김서연 ↗");

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
    expect(within(panel).getByText("김서연")).toBeInTheDocument();
    expect(within(panel).getByText("Clevr TV")).toBeInTheDocument();
    expect(target).toHaveTextContent("82,400");
    expect(target).toHaveTextContent("830,000");
    expect(target).toHaveTextContent("뷰티");
    await waitFor(() => expect(target).toHaveTextContent("스킨케어"));
    expect(within(panel).getByRole("combobox", { name: "제안 채널" }))
      .toBeDisabled();
    expect(within(panel).getByText("이메일 자동 발송")).toBeInTheDocument();
    const subject = within(panel).getByRole("textbox", { name: "제목" });
    const message = within(panel).getByRole("textbox", { name: "제안 메시지" });
    expect(subject).toHaveAttribute("maxlength", "200");
    expect(message).toHaveAttribute("maxlength", "10000");
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
    await within(table).findByText("김서연 ↗");

    await user.click(within(table).getByRole("checkbox", { name: "현재 페이지 전체 선택" }));
    await user.click(screen.getByRole("button", { name: "선택 3명 제안 발송" }));
    const panel = await screen.findByRole("dialog", { name: "제안 발송" });
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

  test("sends quantitative filters to the API and reset clears them", async () => {
    const user = userEvent.setup();
    const fetchMock = mockCreatorApi();
    vi.stubGlobal("fetch", fetchMock);
    renderCreatorPage();
    await screen.findByText("김서연 ↗");
    const search = screen.getByRole("search", { name: "검색 조건" });
    const keyword = within(search).getByRole("textbox", { name: "키워드" });
    const minFollowers = within(search).getByRole("textbox", { name: "최소 팔로워·구독자" });
    const maxFollowers = within(search).getByRole("textbox", { name: "최대 팔로워·구독자" });
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
    await user.click(within(search).getByRole("button", { name: "조회" }));

    expect(creatorRequests(fetchMock)).toHaveLength(2);
    expect(screen.getByText("팔로워·구독자 범위를 올바르게 입력해 주세요."))
      .toBeInTheDocument();

    await user.clear(minFollowers);
    await user.type(minFollowers, "100,000");
    await user.click(within(search).getByRole("button", { name: "조회" }));

    await waitFor(() => expect(creatorRequests(fetchMock)).toHaveLength(3));
    const requestUrl = new URL(String(creatorRequests(fetchMock)[2][0]));
    expect(Object.fromEntries(requestUrl.searchParams)).toMatchObject({
      keyword: "seo",
      minFollower: "100000",
      maxFollower: "500000",
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
    expect(within(categories).getByRole("button", { name: "전체" }))
      .toHaveAttribute("aria-pressed", "true");
  });
});

test("single proposal acceptance does not append a completed history entry", async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/admin/proposals" && init?.method === "POST") {
      return Promise.resolve(new Response(JSON.stringify({
        success: true,
        data: acceptedProposal("proposal-run-single"),
      }), { status: 202 }));
    }
    if (url.pathname === "/api/admin/proposals") {
      return Promise.resolve(new Response(JSON.stringify({
        success: true,
        data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 100 },
      })));
    }
    return Promise.resolve(new Response(JSON.stringify({
      success: true,
      data: {
        id: 113,
        snsCode: "INSTAGRAM",
        accountId: "seo.yeon",
        creatorName: "김서연",
        email: "seoyeon@example.com",
        followerCount: 82_400,
        engagementRate: 4.25,
        lastContentAt: "2026-08-12T20:00:00",
        category: "BEAUTY",
      },
    })));
  });
  vi.stubGlobal("fetch", fetchMock);
  renderProposalComposePage();

  await screen.findByText("이전에 발송한 제안 이력이 없습니다.");
  expect(screen.getByText("발송 작업을 요청하고 작업 진행상황에서 확인할 수 있습니다."))
    .toBeInTheDocument();
  expect(screen.getByText("요청 후 작업 진행상황에서 처리 상태를 확인할 수 있습니다."))
    .toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "제안 발송" }));

  const requested = await screen.findByRole("alertdialog", { name: "제안 발송 요청" });
  expect(requested).toHaveTextContent("작업 진행상황에서 확인해 주세요.");
  expect(screen.getByText("이전에 발송한 제안 이력이 없습니다.")).toBeInTheDocument();
  const proposalRequest = fetchMock.mock.calls.find(([input, init]) => (
    new URL(String(input)).pathname === "/api/admin/proposals" && init?.method === "POST"
  ));
  expect(proposalRequest).toBeDefined();
  expect(new Headers(proposalRequest?.[1]?.headers).get("Idempotency-Key"))
    .toMatch(/^[0-9a-f-]{36}$/);
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

  test("requests server pagination and renders the API result as a read-only table", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        content: [proposalEntry()],
        totalElements: 21,
        totalPages: 2,
        number: 0,
        size: 20,
      },
    })));
    vi.stubGlobal("fetch", fetchMock);
    renderProposalPage();

    const table = screen.getByRole("region", { name: "제안 이력 목록" });
    expect(await within(table).findByText("김서연")).toBeInTheDocument();
    expect(within(table).getByText("seoyeon@example.com")).toBeInTheDocument();
    expect(resultCount(21)).toBeInTheDocument();
    expect(screen.getByText("1 / 2 페이지")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(String(fetchMock.mock.calls[1][0])).toContain("page=1");
  });
});
