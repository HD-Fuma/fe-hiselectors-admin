import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COHORTS, QUALIFICATIONS, SELECTORS } from "../../entities/selectors";
import { renderRoute } from "../../test/renderRoute";

function paginationSummary(page: number, count: number) {
  return `${page} / ${Math.max(1, Math.ceil(count / 20))} 페이지`;
}

test("selector, cohort, and qualification filters reset data and page bounds", async () => {
  const user = userEvent.setup();
  const selectorView = renderRoute("/selectors");
  const selectorSearch = await screen.findByRole("search", { name: "검색 조건" });

  expect(screen.getByText(paginationSummary(1, SELECTORS.length))).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "다음 페이지" }));
  expect(screen.getByText(paginationSummary(2, SELECTORS.length))).toBeInTheDocument();
  await user.type(
    within(selectorSearch).getByRole("textbox", { name: "이름 / ID" }),
    "김서연",
  );
  await user.click(within(selectorSearch).getByRole("button", { name: "조회" }));
  expect(screen.getByText("총 1건")).toBeInTheDocument();
  expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: "셀렉터스 목록" })).getByText("김서연"))
    .toBeInTheDocument();
  await user.click(within(selectorSearch).getByRole("button", { name: "초기화" }));
  expect(screen.getByText(paginationSummary(1, SELECTORS.length))).toBeInTheDocument();
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
});
