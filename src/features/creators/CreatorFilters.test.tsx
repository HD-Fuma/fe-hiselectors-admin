import { render, screen, waitFor, within } from "@testing-library/react";
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
    creatorName: "숫자형 인스타 계정",
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

  function mockCreatorApi(totalPages = 1) {
    return vi.fn((input: RequestInfo | URL) => Promise.resolve(
      String(input).endsWith("/api/admin/categories")
        ? new Response(JSON.stringify({
            success: true,
            data: [
              { id: 1, code: "TRAVEL", name: "여행", displayOrder: 1, enabled: true, keywords: [] },
              { id: 2, code: "SKINCARE", name: "스킨케어", displayOrder: 2, enabled: true, keywords: [] },
            ],
          }))
        : ok(totalPages),
    ));
  }

  function creatorRequests(fetchMock: ReturnType<typeof mockCreatorApi>) {
    return fetchMock.mock.calls.filter(([input]) => String(input).includes("/api/admin/creators?"));
  }

  test("renders the API result as a read-only table and requests server pagination", async () => {
    const user = userEvent.setup();
    const fetchMock = mockCreatorApi(2);
    vi.stubGlobal("fetch", fetchMock);
    renderCreatorPage();

    const table = screen.getByRole("region", { name: "크리에이터 목록" });
    expect(await within(table).findByText("김서연")).toBeInTheDocument();
    expect(within(table).getAllByText("채널 열기 ↗")).toHaveLength(2);
    expect(within(table).getByText("82,400")).toBeInTheDocument();
    expect(within(table).getByText("4.25%")).toBeInTheDocument();
    expect(within(table).getByText("14건")).toBeInTheDocument();
    expect(within(table).getByText("25+건")).toBeInTheDocument();
    expect(await within(table).findByText("스킨케어")).toBeInTheDocument();
    expect(within(table).getByRole("link", { name: "김서연 채널 열기 (새 창)" }))
      .toHaveAttribute("href", "https://www.instagram.com/seo.yeon");
    expect(within(table).getByRole("link", { name: "Clevr TV 채널 열기 (새 창)" }))
      .toHaveAttribute("href", "https://www.youtube.com/channel/UCnMBn-PNx1M9TLF0s-sEDeQ");
    expect(within(table).queryByText("UCnMBn-PNx1M9TLF0s-sEDeQ")).not.toBeInTheDocument();
    const numericInstagramRow = within(table).getByText("숫자형 인스타 계정").closest("tr");
    expect(numericInstagramRow).not.toBeNull();
    expect(within(numericInstagramRow!).queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "카드" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    await waitFor(() => expect(creatorRequests(fetchMock)).toHaveLength(2));
    expect(String(creatorRequests(fetchMock)[1][0])).toContain("page=1");
  });

  test("sends quantitative filters to the API and reset clears them", async () => {
    const user = userEvent.setup();
    const fetchMock = mockCreatorApi();
    vi.stubGlobal("fetch", fetchMock);
    renderCreatorPage();
    await screen.findByText("김서연");
    const search = screen.getByRole("search", { name: "검색 조건" });
    const keyword = within(search).getByRole("textbox", { name: "키워드" });
    const followers = within(search).getByRole("textbox", { name: "최소 팔로워·구독자" });
    const engagement = within(search).getByRole("textbox", { name: "최소 ER" });
    const activity = within(search).getByRole("textbox", { name: "최근 90일 최소 활동" });
    expect(activity).toHaveAttribute("max", "25");
    const platform = within(search).getByRole("combobox", { name: "플랫폼" });
    const categories = screen.getByRole("navigation", { name: "크리에이터 카테고리" });
    const travel = await within(categories).findByRole("button", { name: "여행" });
    expect(within(categories).getByRole("button", { name: "스킨케어" })).toBeInTheDocument();

    await user.click(travel);
    await waitFor(() => expect(creatorRequests(fetchMock)).toHaveLength(2));
    expect(travel).toHaveAttribute("aria-pressed", "true");

    await user.type(keyword, "seo");
    await user.type(followers, "100,000");
    await user.type(engagement, "2.5");
    await user.type(activity, "26");
    await user.selectOptions(platform, "INSTAGRAM");
    await user.click(within(search).getByRole("button", { name: "조회" }));

    expect(creatorRequests(fetchMock)).toHaveLength(2);
    expect(screen.getByText("최근 90일 최소 활동은 0~25 사이의 숫자로 입력해 주세요."))
      .toBeInTheDocument();

    await user.clear(activity);
    await user.type(activity, "3");
    await user.click(within(search).getByRole("button", { name: "조회" }));

    await waitFor(() => expect(creatorRequests(fetchMock)).toHaveLength(3));
    const requestUrl = new URL(String(creatorRequests(fetchMock)[2][0]));
    expect(Object.fromEntries(requestUrl.searchParams)).toMatchObject({
      keyword: "seo",
      minFollower: "100000",
      minEngagementRate: "2.5",
      minRecent90DayContentCount: "3",
      snsCode: "INSTAGRAM",
      categoryCode: "TRAVEL",
      page: "0",
      size: "20",
    });

    await user.click(within(search).getByRole("button", { name: "초기화" }));

    expect(keyword).toHaveValue("");
    expect(followers).toHaveValue("");
    expect(engagement).toHaveValue("");
    expect(activity).toHaveValue("");
    expect(platform).toHaveValue("");
    expect(within(categories).getByRole("button", { name: "전체" }))
      .toHaveAttribute("aria-pressed", "true");
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

  test("requests server pagination and renders the API result as a read-only table", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((_input: RequestInfo | URL) => Promise.resolve(new Response(JSON.stringify({
      success: true,
      data: {
        content: [proposalEntry()],
        totalElements: 21,
        totalPages: 2,
        number: 0,
        size: 20,
      },
    }))));
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
