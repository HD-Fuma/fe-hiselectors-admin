import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";

const SELECTOR_PERFORMANCE_ROWS = [
  {
    confirmedOrderCount: 3,
    excellentActivityType: null,
    excellentGenerationName: null,
    excellentGenerationSales: null,
    generationName: "3기",
    isExcellent: false,
    nickname: "낮은매출",
    roleId: "INACTIVE",
    selectorCode: "SEL0003",
    selectorId: 3,
    totalSales: 900_000,
  },
  {
    confirmedOrderCount: 31,
    excellentActivityType: "3기 활동 누적 1위 · 누적 매출 1,000만원 이상 달성",
    excellentGenerationName: "3기",
    excellentGenerationSales: 19_000_000,
    generationName: "5기",
    isExcellent: true,
    nickname: "최고매출",
    roleId: "ACTIVE",
    selectorCode: "SEL0001",
    selectorId: 1,
    totalSales: 24_500_000,
  },
  {
    confirmedOrderCount: 14,
    excellentActivityType: null,
    excellentGenerationName: null,
    excellentGenerationSales: null,
    generationName: "2기",
    isExcellent: false,
    nickname: "중간매출",
    roleId: "BLACKLIST",
    selectorCode: "SEL0002",
    selectorId: 2,
    totalSales: 8_400_000,
  },
] as const;

const GENERATIONS = [
  {
    activityEndDate: "2026-06-30T23:59:59",
    activityStartDate: "2026-04-01T00:00:00",
    endDate: "2026-03-31T23:59:59",
    generationName: "5기",
    id: 5,
    startDate: "2026-01-01T00:00:00",
    status: "ACTIVE",
  },
  {
    activityEndDate: "2026-06-30T23:59:59",
    activityStartDate: "2026-04-01T00:00:00",
    endDate: "2026-03-31T23:59:59",
    generationName: "3기",
    id: 3,
    startDate: "2026-01-01T00:00:00",
    status: "ACTIVE",
  },
  {
    activityEndDate: "2026-06-30T23:59:59",
    activityStartDate: "2026-04-01T00:00:00",
    endDate: "2026-03-31T23:59:59",
    generationName: "2기",
    id: 2,
    startDate: "2026-01-01T00:00:00",
    status: "INACTIVE",
  },
] as const;

function json(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify({
    code: "OK",
    data,
    message: null,
    success: true,
  }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/admin/selectors/")) {
      return new Promise<Response>(() => {});
    }
    if (url.includes("/api/admin/generations")) {
      return json(GENERATIONS);
    }
    return json(SELECTOR_PERFORMANCE_ROWS);
  }));
});

test("shows the cohort dashboard without a ranked sales list", async () => {
  renderRoute("/performance/selectors");

  expect(await screen.findByRole(
    "heading",
    { name: "셀렉터스 성과" },
    { timeout: 3_000 },
  )).toBeInTheDocument();
  expect(screen.queryByText("업로드 현황")).not.toBeInTheDocument();
  expect(screen.queryByText("기간별 콘텐츠 성과")).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "셀렉터스 성과 목록" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "전체 셀렉터스 성과 목록" })).not.toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "셀렉터스 구분" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "우수 활동자" })).not.toBeInTheDocument();

  const searches = screen.getAllByRole("search", { name: "검색 조건" });
  expect(searches).toHaveLength(1);
  expect(searches[0].parentElement).toHaveAttribute("data-visual-contract", "list-search-panel");
  expect(searches[0].closest(".fuma-performance-top-filter")).not.toBeNull();
  expect(within(searches[0]).getByRole("combobox", { name: "기수" })).toBeInTheDocument();
  expect(within(searches[0]).getByLabelText("집계 시작일")).toBeInTheDocument();
  expect(within(searches[0]).getByLabelText("집계 종료일")).toBeInTheDocument();
  expect(within(searches[0]).queryByLabelText("셀렉터스명")).not.toBeInTheDocument();
});

test("opens selector detail from the top 5 table without navigating away", async () => {
  const user = userEvent.setup();
  const { router } = renderRoute("/performance/selectors");

  const ranking = await screen.findByRole(
    "article",
    { name: "성과 TOP 5" },
    { timeout: 3_000 },
  );
  await user.click(within(ranking).getAllByRole("button")[0]);

  expect(router.state.location.pathname).toBe("/performance/selectors");
  expect(screen.getByTestId("admin-shell")).toHaveTextContent("셀렉터스 성과");
  expect(screen.getByRole("dialog", { name: "셀렉터스 상세" })).toBeInTheDocument();
});

test("shows the cohort dashboard and keeps watchlist selection on the summary", async () => {
  const user = userEvent.setup();
  renderRoute("/performance/selectors");

  const overview = await screen.findByRole("region", { name: "셀렉터스 성과 요약" }, { timeout: 3_000 });
  expect(within(overview).getByRole("heading", { name: "기간 성과" })).toBeInTheDocument();
  expect(within(overview).queryByRole("form", { name: "셀렉터스 성과 기간 검색" }))
    .not.toBeInTheDocument();
  const topFilter = screen.getAllByRole("search", { name: "검색 조건" })[0];
  expect(within(topFilter).getByRole("combobox", { name: "기수" })).toBeInTheDocument();
  expect(within(topFilter).getByLabelText("집계 시작일")).toBeInTheDocument();
  expect(within(overview).getByText("집계 대상 셀렉터스")).toBeInTheDocument();
  expect(within(overview).getByText("2명")).toBeInTheDocument();
  expect(within(overview).getByText("발생 수수료")).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "성과 추이" })).toBeInTheDocument();
  expect(within(overview).getByRole("img", { name: "기간별 전체 셀렉터스 성과 추이" })).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "성과 분포" })).toBeInTheDocument();
  expect(within(overview).getByRole("img", { name: "매출 구간별 인원" })).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "성과 TOP 5" })).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "셀렉터스 유형별 성과" })).toBeInTheDocument();
  expect(within(overview).getByRole("img", { name: "유형별 평균·중앙 매출" })).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "관리 필요" })).toBeInTheDocument();
  expect(within(overview).getByRole("heading", { name: "성과 발견" })).toBeInTheDocument();
  expect(within(overview).queryByText("업로드 현황")).not.toBeInTheDocument();
  expect(within(overview).queryByText("중간매출")).not.toBeInTheDocument();

  const rise = within(overview).getByRole("button", { name: /전월 대비 매출 100% 이상 증가/ });
  await user.click(rise);
  expect(rise).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("region", { name: "전체 셀렉터스 성과 목록" })).not.toBeInTheDocument();
});
