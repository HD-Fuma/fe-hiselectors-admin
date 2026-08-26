import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { SelectorDetail } from "../../entities/selectors";
import type { SettlementSelectorDetail } from "../../entities/settlement";
import { renderRoute } from "../../test/renderRoute";

const summary = {
  id: 7,
  selectorsCode: "SEL0007",
  nickname: "홍길동",
  roleId: "ACTIVE",
  roleName: "활성",
  snsCode: "INSTAGRAM",
  snsAccountId: "hong.selector",
  snsDisplayName: "hong.selector",
  followerCount: 12345,
  profileImageUrl: null,
  createdAt: "2026-08-19T10:00:00",
};

const youtubeSummary = {
  ...summary,
  id: 8,
  selectorsCode: "SEL0008",
  nickname: "정하린",
  snsCode: "YOUTUBE",
  snsAccountId: "UC1111111111111111111111",
  snsDisplayName: "하린의 생활연구소",
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
  snsVerifiedAt: "2026-07-01T11:00:00",
  privacyAgreedAt: "2026-07-01T11:05:00",
  alimtalkAgreed: true,
  generations: [{
    generationId: 3,
    generationName: "3기",
    startDate: "2026-07-01T00:00:00",
    endDate: "2026-08-31T23:59:59",
    activityStartDate: "2026-08-01T00:00:00",
    activityEndDate: "2026-10-31T23:59:59",
    status: "ACTIVE",
    joinedAt: "2026-07-02T12:00:00",
    totalSales: 1_500_000,
    confirmedPurchaseCount: 12,
    paidCommissionAmount: 320000,
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
    title: "여름 스타일링 추천",
    contentType: "REELS",
    createdAt: "2026-08-18T10:00:00",
    viewCount: 12000,
    likeCount: 800,
    commentCount: 0,
  }],
  performance: {
    contentCount: 1,
    totalViewCount: 12000,
    totalLikeCount: 800,
    totalCommentCount: 0,
  },
} satisfies SelectorDetail;

let selectorDetail: SelectorDetail = detail;

const settlementDetail = {
  accountRegistered: true,
  profile: {
    selectorsId: 7,
    selectorsCode: "SEL0007",
    selectorsNickname: "홍길동",
    snsCode: "INSTAGRAM",
    accountId: "hong.selector",
    followerCount: 12345,
    profileImageUrl: null,
    lastCollectedAt: "2026-08-20T08:00:00",
  },
  settlementSummary: {
    cumulativePurchaseConversionCount: 12,
    cumulativePaidCommission: 320000,
    currentMonth: "2026-08",
    currentMonthPurchaseConversionCount: 3,
    nextMonthScheduledCommission: 75000,
    nextPaymentMonth: "2026-09",
    nextPaymentSettlementStatus: "PAYMENT_PENDING",
    cumulativeSalesAmount: 1_500_000,
  },
  histories: {
    content: [{
      activityMonth: "2026-08",
      calculatedAt: "2026-08-21T10:00:00",
      confirmedPurchaseCount: 3,
      confirmedSalesAmount: 1500000,
      paymentMonth: "2026-09",
      selectorsCode: "SEL0007",
      selectorsId: 7,
      selectorsNickname: "홍길동",
      settlementAmount: 75000,
      settlementId: 501,
      settlementRate: 5,
      settlementMonth: "2026-08",
      settlementSourceCode: "DAILY_BATCH",
      status: "PAYMENT_PENDING",
      updatedAt: "2026-08-21T10:00:00",
    }],
    number: 0,
    size: 12,
    totalElements: 1,
    totalPages: 1,
  },
} satisfies SettlementSelectorDetail;

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
  selectorDetail = detail;
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/admin/settlements/selectors/7/detail")) return json(settlementDetail);
    if (/\/api\/admin\/selectors\/7$/.test(url)) return json(selectorDetail);
    if (url.endsWith("/api/admin/generations") && init?.method === "POST") {
      return json({ ...generation, id: 4, generationName: "4기" });
    }
    if (url.endsWith("/api/admin/generations/3/status")) {
      return json({ ...generation, status: "ACTIVE" });
    }
    if (url.endsWith("/api/admin/generations/3") && init?.method === "PATCH") return json(generation);
    if (url.includes("/api/admin/generations")) return json([generation]);
    return json({ content: [summary, youtubeSummary], number: 0, size: 20, totalElements: 2, totalPages: 1 });
  }));
});

describe("selector api pages", () => {
  test("requests list filters and renders server results", async () => {
    renderRoute("/selectors");
    const search = await screen.findByRole("search", { name: "검색 조건" }, { timeout: 3000 });

    expect(await screen.findByRole("img", { name: "셀렉터스 발견 풀" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "활동 상태" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "보기 방식" }));

    expect(screen.getByRole("navigation", { name: "활동 상태" })).toBeInTheDocument();
    expect(await screen.findByText("SEL0007")).toBeInTheDocument();
    const list = screen.getByRole("region", { name: "셀렉터스 목록" });
    expect(within(list).queryByRole("columnheader", { name: "닉네임" })).not.toBeInTheDocument();
    expect(within(list).getByRole("columnheader", { name: "SNS 계정" })).toBeInTheDocument();
    expect(within(list).getByText("hong.selector")).toBeInTheDocument();
    expect(within(list).queryByText("홍길동")).not.toBeInTheDocument();
    expect(within(list).getByText("하린의 생활연구소")).toBeInTheDocument();
    expect(within(list).queryByText("UC1111111111111111111111")).not.toBeInTheDocument();
    expect(within(list).queryByText("정하린")).not.toBeInTheDocument();

    fireEvent.change(within(search).getByRole("textbox", { name: "SNS 계정" }), {
      target: { value: "hong.selector" },
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
    expect(screen.queryByText("총 2건")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "블랙리스트" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/roleId=BLACKLIST.*generationId=3.*nickname=.*snsCode=INSTAGRAM/),
      expect.anything(),
    ));
    expect(screen.getByText("블랙리스트 목록")).toBeInTheDocument();
  }, 15000);

  test("renders enhanced selector detail and settlement information", async () => {
    renderRoute("/selectors/7");
    const panel = await screen.findByRole("dialog", { name: "셀렉터스 상세" });

    expect(await within(panel).findByRole("heading", { name: "홍길동" })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "@hong.selector" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/hong.selector",
    );
    expect(within(panel).getByText("팔로워 1.2만명")).toBeInTheDocument();
    expect(within(panel).queryByLabelText("셀렉터스 정보")).not.toBeInTheDocument();
    expect(within(panel).queryByText(/등록 2026-/)).not.toBeInTheDocument();
    expect(within(panel).queryByRole("region", { name: "셀렉터스 SNS 계정" })).not.toBeInTheDocument();
    expect(within(panel).getByRole("region", { name: "셀렉터스 참여 기수 이력" })).toHaveTextContent("3기");
    expect(within(panel).getByRole("region", { name: "셀렉터스 참여 기수 이력" })).toHaveTextContent("2026-08-01 ~ 2026-10-31");
    expect(within(panel).getByRole("region", { name: "셀렉터스 참여 기수 이력" })).toHaveTextContent("12건");
    expect(within(panel).getByRole("region", { name: "셀렉터스 참여 기수 이력" })).toHaveTextContent("1,500,000원");
    expect(within(panel).getByRole("region", { name: "셀렉터스 참여 기수 이력" })).toHaveTextContent("320,000원");
    expect(within(panel).getByText("총 1건")).toBeInTheDocument();
    expect(within(panel).getByLabelText("셀렉터스 기수")).toHaveTextContent("3기");
    expect(within(panel).getByText("셀렉터스 코드").parentElement).toHaveTextContent("SEL0007");
    expect(within(panel).getByText("셀렉터스명").parentElement).toHaveTextContent("홍길동");
    expect(within(panel).getByText("누적 구매수").parentElement).toHaveTextContent("12건");
    expect(within(panel).getByText("누적 매출").parentElement).toHaveTextContent("1,500,000원");
    const consent = within(panel).getByRole("region", { name: "셀렉터스 동의 및 수신 정보" });
    expect(consent).toHaveTextContent("2026-07-01 11:00");
    expect(consent).toHaveTextContent("2026-07-01 11:05");
    expect(within(consent).getByText("광고성 정보 수신동의")).toBeInTheDocument();
    expect(within(consent).getByText("동의")).toHaveClass("hsas-status-pill");
    expect(consent).toHaveTextContent("2026-08-20 09:00");
    const performance = within(panel).getByRole("region", { name: "셀렉터스 성과" });
    expect(within(panel).getByText("3기 기준")).toBeInTheDocument();
    expect(performance).toHaveTextContent("12건");
    expect(performance).toHaveTextContent("1,500,000원");
    expect(performance).toHaveTextContent("320,000원");
    expect(performance).toHaveTextContent("2026-08-01 ~ 2026-10-31");
    const contents = within(panel).getByRole("region", { name: "셀렉터스 콘텐츠" });
    expect(within(contents).getByText("REELS")).toHaveClass("hsas-status-pill");
    expect(within(contents).getByRole("link", { name: /여름 스타일링 추천/ }))
      .toHaveAttribute("title", "여름 스타일링 추천");
    expect(within(panel).getByText("최근 1건 · 전체 1건")).toBeInTheDocument();
    expect(within(panel).getByText("마지막 갱신 2026-08-21 10:00")).toBeInTheDocument();
    const settlements = within(panel).getByRole("region", { name: "셀렉터스 정산 내역" });
    expect(settlements).toHaveTextContent("75,000원");
    expect(within(panel).getByText("누적 지급 수수료").parentElement).toHaveTextContent("320,000원");
    expect(within(panel).queryByText("정산정보 등록 여부")).not.toBeInTheDocument();
    expect(within(panel).queryByText("현재 활동월")).not.toBeInTheDocument();
    expect(within(panel).queryByText("다음 지급월")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/admin\/settlements\/selectors\/7\/detail\?page=0&size=12$/),
      expect.anything(),
    );
  });

  test("keeps selector detail visible when settlement lookup fails", async () => {
    const currentFetch = vi.mocked(fetch);
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => (
      String(input).includes("/api/admin/settlements/selectors/7/detail")
        ? json(null, 500)
        : currentFetch(input, init)
    )));

    renderRoute("/selectors/7");
    const panel = await screen.findByRole("dialog", { name: "셀렉터스 상세" });

    expect(await within(panel).findByRole("heading", { name: "홍길동" })).toBeInTheDocument();
    expect(within(within(panel).getByRole("region", { name: "셀렉터스 정산 내역" }))
      .getByRole("alert")).toHaveTextContent("셀렉터스 상세 정보 조회에 실패했습니다.");
  });

  test("renders uncollected performance as unavailable instead of zero", async () => {
    selectorDetail = {
      ...detail,
      contents: [],
      performance: {
        contentCount: null,
        totalViewCount: null,
        totalLikeCount: null,
        totalCommentCount: null,
      },
    };

    renderRoute("/selectors/7");
    const panel = await screen.findByRole("dialog", { name: "셀렉터스 상세" });

    expect(within(panel).getByText("최근 0건 · 전체 -")).toBeInTheDocument();
    expect(within(panel).getByRole("region", { name: "셀렉터스 콘텐츠" }))
      .toHaveTextContent("콘텐츠 수집 전입니다.");
  });

  test("shows brief performance only for the active generation", async () => {
    selectorDetail = {
      ...detail,
      generations: [
        {
          ...detail.generations[0],
          generationId: 4,
          generationName: "2기",
          status: "INACTIVE",
          totalSales: 9_000_000,
          confirmedPurchaseCount: 99,
          paidCommissionAmount: 900000,
        },
        detail.generations[0],
      ],
    };

    renderRoute("/selectors/7");
    const panel = await screen.findByRole("dialog", { name: "셀렉터스 상세" });
    const performance = within(panel).getByRole("region", { name: "셀렉터스 성과" });

    expect(within(panel).getByText("3기 기준")).toBeInTheDocument();
    expect(performance).toHaveTextContent("12건");
    expect(performance).not.toHaveTextContent("9,000,000원");
    expect(performance).not.toHaveTextContent("2기");
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
