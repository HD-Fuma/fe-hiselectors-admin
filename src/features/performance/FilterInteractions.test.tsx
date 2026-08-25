import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";

function paginationSummary(page: number, count: number) {
  return `${page} / ${Math.max(1, Math.ceil(count / 20))} 페이지`;
}

const API_SELECTORS = Array.from({ length: 41 }, (_, index) => ({
  id: index + 1,
  selectorsCode: `SEL${String(index + 1).padStart(4, "0")}`,
  nickname: index === 0 ? "김서연" : `셀렉터${index + 1}`,
  roleId: "ACTIVE",
  roleName: "활성",
  snsCode: "INSTAGRAM",
  snsAccountId: `selector${index + 1}`,
  followerCount: 1000 + index,
  profileImageUrl: null,
  createdAt: "2026-08-01T00:00:00",
}));

const API_GENERATIONS = Array.from({ length: 41 }, (_, index) => ({
  id: index + 1,
  generationName: `${index + 1}기`,
  startDate: `2026-01-01T00:00:00`,
  endDate: `2026-01-31T23:59:59`,
  activityStartDate: `2026-02-01T00:00:00`,
  activityEndDate: `2026-04-30T23:59:59`,
  status: "INACTIVE",
}));

function json(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify({
    success: true,
    code: "OK",
    message: null,
    data,
  }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

test("selector and cohort filters reset data and page bounds", async () => {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/generations")) return json(API_GENERATIONS);
    const nickname = url.searchParams.get("nickname");
    const matching = nickname
      ? API_SELECTORS.filter((selector) => selector.snsAccountId.includes(nickname))
      : API_SELECTORS;
    const page = Number(url.searchParams.get("page") ?? 0);
    return json({
      content: matching.slice(page * 20, page * 20 + 20),
      number: page,
      size: 20,
      totalElements: matching.length,
      totalPages: Math.ceil(matching.length / 20),
    });
  }));
  const user = userEvent.setup();
  const selectorView = renderRoute("/selectors");
  const selectorSearch = await screen.findByRole("search", { name: "검색 조건" });

  expect(await screen.findByText(paginationSummary(1, API_SELECTORS.length))).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "다음 페이지" }));
  expect(await screen.findByText(paginationSummary(2, API_SELECTORS.length))).toBeInTheDocument();
  await user.type(
    within(selectorSearch).getByRole("textbox", { name: "SNS 계정" }),
    "selector41",
  );
  await user.click(within(selectorSearch).getByRole("button", { name: "조회" }));
  expect(await screen.findByText("총 1건")).toBeInTheDocument();
  expect(await screen.findByText("1 / 1 페이지")).toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: "셀렉터스 목록" })).getByText("selector41"))
    .toBeInTheDocument();
  await user.click(within(selectorSearch).getByRole("button", { name: "초기화" }));
  expect(await screen.findByText(paginationSummary(1, API_SELECTORS.length))).toBeInTheDocument();
  selectorView.unmount();

  renderRoute("/cohorts");
  const cohortSearch = await screen.findByRole("search", { name: "검색 조건" });
  await user.type(
    within(cohortSearch).getByRole("textbox", { name: "기수명" }),
    API_GENERATIONS[40].generationName,
  );
  await user.click(within(cohortSearch).getByRole("button", { name: "조회" }));
  expect(await screen.findByText("총 1건")).toBeInTheDocument();
  await user.click(within(cohortSearch).getByRole("button", { name: "초기화" }));
  expect(await screen.findByText(paginationSummary(1, API_GENERATIONS.length))).toBeInTheDocument();
  vi.unstubAllGlobals();
});
