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

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    if (String(input).includes("/api/admin/selectors/")) {
      return new Promise<Response>(() => {});
    }
    return Promise.resolve(new Response(JSON.stringify({
      code: "OK",
      data: SELECTOR_PERFORMANCE_ROWS,
      message: null,
      success: true,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
  }));
});

test("shows a sales-sorted table without the content overview sections", async () => {
  renderRoute("/performance/selectors");

  expect(await screen.findByRole(
    "heading",
    { name: "셀렉터스 성과" },
    { timeout: 3_000 },
  )).toBeInTheDocument();
  expect(screen.queryByText("업로드 현황")).not.toBeInTheDocument();
  expect(screen.queryByText("기간별 콘텐츠 성과")).not.toBeInTheDocument();
  expect(screen.queryByText("셀렉터스 성과 목록")).not.toBeInTheDocument();
  expect(screen.getByRole("search", { name: "검색 조건" }).parentElement)
    .toHaveAttribute("data-visual-contract", "list-search-panel");

  const tabs = screen.getByRole("navigation", { name: "셀렉터스 구분" });
  expect(within(tabs).getByRole("button", { name: "전체" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(within(tabs).queryByText("확정 매출액이 높은 순으로 셀렉터스를 보여줍니다."))
    .not.toBeInTheDocument();

  const table = await screen.findByRole(
    "region",
    { name: "전체 셀렉터스 성과 목록" },
    { timeout: 3_000 },
  );
  expect(within(table).getByRole("columnheader", { name: "총 매출액" })).toBeInTheDocument();
  const rows = within(table).getAllByRole("row").slice(1);
  expect(rows).toHaveLength(3);
  expect(rows[0]).toHaveTextContent("최고매출");
  expect(rows[1]).toHaveTextContent("중간매출");
  expect(rows[2]).toHaveTextContent("낮은매출");
  expect(within(table).queryByRole("img")).not.toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: "셀렉터스 성과 목록" }))
    .queryByRole("button", { name: "목록" })).not.toBeInTheDocument();
});

test("opens selector detail over the performance page without navigating away", async () => {
  const user = userEvent.setup();
  const { router } = renderRoute("/performance/selectors");

  const table = await screen.findByRole(
    "region",
    { name: "전체 셀렉터스 성과 목록" },
    { timeout: 3_000 },
  );
  await user.click(within(table).getAllByRole("row")[1]);

  expect(router.state.location.pathname).toBe("/performance/selectors");
  expect(screen.getByTestId("admin-shell")).toHaveTextContent("셀렉터스 성과");
  expect(screen.getByRole("dialog", { name: "셀렉터스 상세" })).toBeInTheDocument();
});

test("switches to the shared excellent-selector table", async () => {
  const user = userEvent.setup();
  renderRoute("/performance/selectors");

  const tabs = await screen.findByRole(
    "navigation",
    { name: "셀렉터스 구분" },
    { timeout: 3_000 },
  );
  const excellentTab = within(tabs).getByRole("button", { name: "우수 활동자" });
  await user.click(excellentTab);

  expect(excellentTab).toHaveAttribute("aria-pressed", "true");
  expect(within(tabs).queryByText("매출 성과 기준을 충족한 우수 활동자입니다."))
    .not.toBeInTheDocument();
  expect(screen.queryByText("우수 셀렉터스 목록")).not.toBeInTheDocument();
  expect(screen.queryByText("매출 성과 기준을 충족한 우수 셀렉터스입니다."))
    .not.toBeInTheDocument();
  const table = screen.getByRole("region", { name: "우수 활동자 목록" });
  expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "셀렉터스 ID",
    "이름",
    "기수",
    "종류",
    "총 매출액",
  ]);
  expect(within(table).getByText("최고매출")).toBeInTheDocument();
  expect(within(table).getByText("3기")).toBeInTheDocument();
  expect(within(table).queryByText("5기")).not.toBeInTheDocument();
  expect(within(table).getByText("19,000,000원")).toBeInTheDocument();
  expect(within(table).queryByText("24,500,000원")).not.toBeInTheDocument();
  expect(within(table).queryByText("중간매출")).not.toBeInTheDocument();
  expect(within(table).queryByText("낮은매출")).not.toBeInTheDocument();
  expect(within(table).queryByRole("img")).not.toBeInTheDocument();
  const cohortFilter = screen.getByRole("combobox", { name: "기수" });
  expect(within(cohortFilter).getByRole("option", { name: "3기" })).toBeInTheDocument();
  expect(within(cohortFilter).queryByRole("option", { name: "5기" })).not.toBeInTheDocument();
  expect(within(cohortFilter).queryByRole("option", { name: "2기" })).not.toBeInTheDocument();

  await user.click(within(tabs).getByRole("button", { name: "전체" }));
  expect(screen.getByRole("region", { name: "전체 셀렉터스 성과 목록" })).toBeInTheDocument();
});
