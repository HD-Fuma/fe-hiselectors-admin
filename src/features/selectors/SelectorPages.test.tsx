import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

const summary = {
  id: 7,
  selectorsCode: "SEL0007",
  nickname: "홍길동",
  roleId: "ACTIVE",
  roleName: "활성",
  snsCode: "INSTAGRAM",
  snsAccountId: "hong.selector",
  followerCount: 12345,
  profileImageUrl: null,
  createdAt: "2026-08-19T10:00:00",
};

const detail = {
  id: 7,
  selectorsCode: "SEL0007",
  nickname: "홍길동",
  roleId: "ACTIVE",
  roleName: "활성",
  applicationId: 70,
  userId: 700,
  createdAt: "2026-08-19T10:00:00",
  updatedAt: "2026-08-20T09:00:00",
  generations: [{
    generationId: 3,
    generationName: "3기",
    startDate: "2026-07-01T00:00:00",
    endDate: "2026-08-31T23:59:59",
    status: "ACTIVE",
    joinedAt: "2026-07-02T12:00:00",
  }],
  snsAccount: {
    id: 11,
    snsCode: "INSTAGRAM",
    accountId: "hong.selector",
    followerCount: 12345,
    profileImageUrl: null,
    lastCollectedAt: "2026-08-20T08:00:00",
  },
  totalPenaltyCount: 3,
  activePenaltyCount: 2,
  blacklistTarget: true,
  contents: [{
    id: 101,
    snsCode: "INSTAGRAM",
    contentUrl: "https://www.instagram.com/p/example",
    contentType: "REELS",
    createdAt: "2026-08-18T10:00:00",
    viewCount: 12000,
    likeCount: 800,
    commentCount: 35,
  }],
  performance: {
    contentCount: 1,
    totalViewCount: 12000,
    totalLikeCount: 800,
    totalCommentCount: 35,
  },
};

const generation = {
  id: 3,
  generationName: "3기",
  startDate: "2026-07-01T00:00:00",
  endDate: "2026-08-31T23:59:59",
  activityStartDate: "2026-09-01T00:00:00",
  activityEndDate: "2026-11-30T23:59:59",
  status: "INACTIVE",
};

function json(data: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify({
    success: status < 400,
    code: status < 400 ? "OK" : "ERROR",
    message: status < 400 ? null : "조회에 실패했습니다.",
    data: status < 400 ? data : null,
  }), { status, headers: { "Content-Type": "application/json" } }));
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((done) => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (/\/api\/admin\/selectors\/7$/.test(url)) return json(detail);
    if (url.endsWith("/api/admin/generations") && init?.method === "POST") {
      return json({ ...generation, id: 4, generationName: "4기" });
    }
    if (url.endsWith("/api/admin/generations/3/status")) {
      return json({ ...generation, status: "ACTIVE" });
    }
    if (url.endsWith("/api/admin/generations/3") && init?.method === "PATCH") return json(generation);
    if (url.includes("/api/admin/generations")) return json([generation]);
    return json({ content: [summary], number: 0, size: 20, totalElements: 1, totalPages: 1 });
  }));
});

describe("selector api pages", () => {
  test("requests list filters and renders server results", async () => {
    renderRoute("/selectors");
    const search = await screen.findByRole("search", { name: "검색 조건" });

    expect(await screen.findByText("SEL0007")).toBeInTheDocument();
    fireEvent.change(within(search).getByRole("textbox", { name: "닉네임" }), {
      target: { value: "홍길동" },
    });
    fireEvent.change(within(search).getByRole("combobox", { name: "SNS" }), {
      target: { value: "INSTAGRAM" },
    });
    fireEvent.change(within(search).getByRole("combobox", { name: "기수" }), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "활동중" }));
    fireEvent.click(within(search).getByRole("button", { name: "조회" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/roleId=ACTIVE.*generationId=3.*nickname=.*snsCode=INSTAGRAM/),
      expect.anything(),
    ));
    expect(screen.getByText("총 1건")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "블랙리스트" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/roleId=BLACKLIST.*generationId=3.*nickname=.*snsCode=INSTAGRAM/),
      expect.anything(),
    ));
    expect(screen.getByText("블랙리스트 목록")).toBeInTheDocument();
  });

  test("renders selector detail account, penalties, contents, and performance", async () => {
    renderRoute("/selectors/7");
    const panel = await screen.findByRole("dialog", { name: "셀렉터스 상세" });

    expect(await within(panel).findByRole("heading", { name: "홍길동" })).toBeInTheDocument();
    expect(within(panel).getByRole("region", { name: "셀렉터스 SNS 계정" })).toHaveTextContent("hong.selector");
    expect(within(panel).getByRole("region", { name: "셀렉터스 참여 기수 이력" })).toHaveTextContent("3기");
    expect(within(panel).getByText("누적 패널티").parentElement).toHaveTextContent("3건");
    expect(within(panel).getByRole("region", { name: "셀렉터스 성과" })).toHaveTextContent("12,000");
    expect(within(panel).getByRole("region", { name: "셀렉터스 콘텐츠" })).toHaveTextContent("REELS");
  });

  test("creates and changes the status of a server generation", async () => {
    renderRoute("/cohorts");

    fireEvent.click(await screen.findByText("3기"));
    const panel = await screen.findByRole("dialog", { name: "3기 상세" });
    fireEvent.click(within(panel).getByRole("button", { name: "활성화" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/admin\/generations\/3\/status$/),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "ACTIVE" }) }),
    ));
    fireEvent.click(within(panel).getByRole("button", { name: "상세 패널 닫기" }));

    fireEvent.click(screen.getByRole("button", { name: "기수 생성" }));
    const modal = await screen.findByRole("dialog", { name: "새 기수 생성" });
    fireEvent.change(within(modal).getByRole("textbox", { name: "기수명" }), { target: { value: "4기" } });
    fireEvent.change(within(modal).getByRole("group", { name: /모집 시작일/ }).querySelector("input")!, { target: { value: "2026-09-01" } });
    fireEvent.change(within(modal).getByRole("group", { name: /모집 종료일/ }).querySelector("input")!, { target: { value: "2026-09-30" } });
    fireEvent.change(within(modal).getByRole("group", { name: /활동 시작일/ }).querySelector("input")!, { target: { value: "2026-10-01" } });
    fireEvent.change(within(modal).getByRole("group", { name: /활동 종료일/ }).querySelector("input")!, { target: { value: "2026-12-31" } });
    fireEvent.click(within(modal).getByRole("button", { name: "생성" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/admin\/generations$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          generationName: "4기",
          startDate: "2026-09-01T00:00:00",
          endDate: "2026-09-30T23:59:59",
          activityStartDate: "2026-10-01T00:00:00",
          activityEndDate: "2026-12-31T23:59:59",
        }),
      }),
    ));
    expect(await screen.findByText("4기")).toBeInTheDocument();
  });

  test("allows one-day and overlapping recruitment and activity periods", async () => {
    renderRoute("/cohorts");

    fireEvent.click(await screen.findByRole("button", { name: "기수 생성" }));
    const modal = await screen.findByRole("dialog", { name: "새 기수 생성" });
    const input = (label: RegExp) => (
      within(modal).getByRole("group", { name: label }).querySelector("input")!
    );
    fireEvent.change(within(modal).getByRole("textbox", { name: "기수명" }), { target: { value: "4기" } });
    fireEvent.change(input(/모집 시작일/), { target: { value: "2026-09-01" } });
    fireEvent.change(input(/모집 종료일/), { target: { value: "2026-09-01" } });
    fireEvent.change(input(/활동 시작일/), { target: { value: "2026-09-01" } });
    fireEvent.change(input(/활동 종료일/), { target: { value: "2026-09-01" } });
    fireEvent.click(within(modal).getByRole("button", { name: "생성" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/admin\/generations$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          generationName: "4기",
          startDate: "2026-09-01T00:00:00",
          endDate: "2026-09-01T23:59:59",
          activityStartDate: "2026-09-01T00:00:00",
          activityEndDate: "2026-09-01T23:59:59",
        }),
      }),
    ));
  });

  test("distinguishes cohort loading from an empty successful response", async () => {
    const pending = deferredResponse();
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => (
      String(input).includes("/api/admin/generations") ? pending.promise : json(null)
    )));

    renderRoute("/cohorts");

    expect(await screen.findByText("기수를 불러오는 중입니다.")).toHaveAttribute("role", "status");
    expect(screen.getByRole("button", { name: "기수 생성" })).toBeDisabled();
    await act(async () => pending.resolve(await json([])));
    expect(await screen.findByText("조회된 기수가 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "기수 생성" })).toBeEnabled();
  });

  test("keeps a newer cohort panel open and preserves server ordering after mutations", async () => {
    const pendingStatus = deferredResponse();
    const secondGeneration = {
      ...generation,
      id: 2,
      generationName: "2기",
      startDate: "2026-06-01T00:00:00",
      endDate: "2026-06-30T23:59:59",
    };
    const oldGeneration = {
      ...generation,
      id: 4,
      generationName: "4기",
      startDate: "2026-01-01T00:00:00",
      endDate: "2026-01-31T23:59:59",
    };
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/admin/generations/3/status")) return pendingStatus.promise;
      if (url.endsWith("/api/admin/generations") && init?.method === "POST") return json(oldGeneration);
      if (url.endsWith("/api/admin/generations")) return json([secondGeneration, generation]);
      return json(null);
    }));

    renderRoute("/cohorts");
    const region = await screen.findByRole("region", { name: "기수 목록" });
    expect(await within(region).findByText("3기")).toBeInTheDocument();
    expect(within(region).getAllByRole("row").slice(1).map((row) => (
      within(row).getAllByRole("cell")[1].textContent
    ))).toEqual(["3기", "2기"]);

    fireEvent.click(within(region).getByText("3기"));
    const firstPanel = await screen.findByRole("dialog", { name: "3기 상세" });
    fireEvent.click(within(firstPanel).getByRole("button", { name: "활성화" }));
    fireEvent.click(within(firstPanel).getByRole("button", { name: "상세 패널 닫기" }));
    fireEvent.click(within(region).getByText("2기"));
    expect(await screen.findByRole("dialog", { name: "2기 상세" })).toBeInTheDocument();
    await act(async () => pendingStatus.resolve(await json({ ...generation, status: "ACTIVE" })));
    const secondPanel = screen.getByRole("dialog", { name: "2기 상세" });
    expect(secondPanel).toBeInTheDocument();
    await waitFor(() => expect(within(secondPanel).getByRole("button", { name: "활성화" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "상세 패널 닫기" }));

    fireEvent.click(screen.getByRole("button", { name: "기수 생성" }));
    const modal = await screen.findByRole("dialog", { name: "새 기수 생성" });
    fireEvent.change(within(modal).getByRole("textbox", { name: "기수명" }), { target: { value: "4기" } });
    fireEvent.change(within(modal).getByRole("group", { name: /모집 시작일/ }).querySelector("input")!, { target: { value: "2026-01-01" } });
    fireEvent.change(within(modal).getByRole("group", { name: /모집 종료일/ }).querySelector("input")!, { target: { value: "2026-01-31" } });
    fireEvent.change(within(modal).getByRole("group", { name: /활동 시작일/ }).querySelector("input")!, { target: { value: "2026-02-01" } });
    fireEvent.change(within(modal).getByRole("group", { name: /활동 종료일/ }).querySelector("input")!, { target: { value: "2026-04-30" } });
    fireEvent.click(within(modal).getByRole("button", { name: "생성" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "새 기수 생성" })).not.toBeInTheDocument());
    await waitFor(() => expect(within(screen.getByRole("region", { name: "기수 목록" }))
      .getAllByRole("row").slice(1).map((row) => (
        within(row).getAllByRole("cell")[1].textContent
      ))).toEqual(["3기", "2기", "4기"]));
  });

  test("redirects the removed blacklist screen to the selector list", async () => {
    const { router } = renderRoute("/selectors/qualifications");

    expect(await screen.findByRole("heading", { name: "셀렉터스 목록" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/selectors");
    expect(screen.queryByRole("heading", { name: "블랙리스트 관리" })).not.toBeInTheDocument();
  });

  test("announces cohort request failures", async () => {
    vi.stubGlobal("fetch", vi.fn(() => json(null, 500)));
    renderRoute("/cohorts");
    expect(await screen.findByRole("alert")).toHaveTextContent("조회에 실패했습니다.");
  });

  test("shows the backend list error", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => (
      String(input).includes("/api/admin/generations")
        ? json([])
        : json(null, 500)
    )));

    renderRoute("/selectors");

    expect(await screen.findByRole("heading", { name: "목록을 불러오지 못했습니다" })).toBeInTheDocument();
    expect(screen.getByText("조회에 실패했습니다.")).toBeInTheDocument();
  });
});
