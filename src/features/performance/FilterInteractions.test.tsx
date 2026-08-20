import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COHORTS, QUALIFICATIONS } from "../../entities/selectors";
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

function json(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify({
    success: true,
    code: "OK",
    message: null,
    data,
  }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

test("selector, cohort, and qualification filters reset data and page bounds", async () => {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/generations")) return json([]);
    const nickname = url.searchParams.get("nickname");
    const matching = nickname
      ? API_SELECTORS.filter((selector) => selector.nickname.includes(nickname))
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
    within(selectorSearch).getByRole("textbox", { name: "닉네임" }),
    "김서연",
  );
  await user.click(within(selectorSearch).getByRole("button", { name: "조회" }));
  expect(await screen.findByText("총 1건")).toBeInTheDocument();
  expect(await screen.findByText("1 / 1 페이지")).toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: "셀렉터스 목록" })).getByText("김서연"))
    .toBeInTheDocument();
  await user.click(within(selectorSearch).getByRole("button", { name: "초기화" }));
  expect(await screen.findByText(paginationSummary(1, API_SELECTORS.length))).toBeInTheDocument();
  selectorView.unmount();

  const cohortView = renderRoute("/cohorts");
  const cohortSearch = await screen.findByRole("search", { name: "검색 조건" });
  await user.type(
    within(cohortSearch).getByRole("textbox", { name: "기수명" }),
    COHORTS[0].name,
  );
  await user.click(within(cohortSearch).getByRole("button", { name: "조회" }));
  expect(screen.getByText("총 1건")).toBeInTheDocument();
  await user.click(within(cohortSearch).getByRole("button", { name: "초기화" }));
  expect(screen.getByText(paginationSummary(1, COHORTS.length))).toBeInTheDocument();
  cohortView.unmount();

  renderRoute("/selectors/qualifications");
  const qualificationSearch = await screen.findByRole("search", { name: "검색 조건" });
  await user.type(
    within(qualificationSearch).getByRole("textbox", { name: "이름 / ID" }),
    QUALIFICATIONS[0].selectorId,
  );
  await user.click(within(qualificationSearch).getByRole("button", { name: "조회" }));
  expect(screen.getByText("총 1건")).toBeInTheDocument();
  await user.click(within(qualificationSearch).getByRole("button", { name: "초기화" }));
  expect(screen.getByText(paginationSummary(1, QUALIFICATIONS.length))).toBeInTheDocument();
  vi.unstubAllGlobals();
});
