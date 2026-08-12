import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COHORTS, QUALIFICATIONS, SELECTORS } from "../../entities/selector/model/fixtures";
import { SETTLEMENTS } from "../../entities/settlement";
import { renderRoute } from "../../test/renderRoute";

function paginationSummary(page: number, count: number) {
  return `${page} / ${Math.max(1, Math.ceil(count / 20))} 페이지`;
}

test("selector, cohort, and qualification filters reset data and page bounds", async () => {
  const user = userEvent.setup();
  const selectorView = renderRoute("/selectors");
  const selectorSearch = screen.getByRole("search", { name: "검색 조건" });

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
  const cohortSearch = screen.getByRole("search", { name: "검색 조건" });
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
  const qualificationSearch = screen.getByRole("search", { name: "검색 조건" });
  await user.type(
    within(qualificationSearch).getByRole("textbox", { name: "이름 / ID" }),
    QUALIFICATIONS[0].selectorId,
  );
  await user.click(within(qualificationSearch).getByRole("button", { name: "조회" }));
  expect(screen.getByText("총 1건")).toBeInTheDocument();
  await user.click(within(qualificationSearch).getByRole("button", { name: "초기화" }));
  expect(screen.getByText(paginationSummary(1, QUALIFICATIONS.length))).toBeInTheDocument();
});
test("settlement query, status, and reset control the rows and pagination", async () => {
  const user = userEvent.setup();
  renderRoute("/settlements");
  const search = screen.getByRole("search", { name: "검색 조건" });
  const keyword = within(search).getByRole("textbox", { name: "ID 또는 이름" });

  await user.type(keyword, "박도윤");
  await user.click(within(search).getByRole("button", { name: "조회" }));
  expect(screen.getByText("총 1건")).toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: "정산 지급 목록" })).getByText("박도윤"))
    .toBeInTheDocument();

  await user.click(within(search).getByRole("button", { name: "초기화" }));
  expect(keyword).toHaveValue("");
  expect(within(search).getByLabelText("정산월")).toHaveValue("");
  expect(screen.getByText(paginationSummary(1, SETTLEMENTS.length))).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "지급 완료" }));
  const paidCount = SETTLEMENTS.filter((settlement) => (
    settlement.paymentStatus === "지급 완료"
  )).length;
  expect(screen.getByText(`총 ${paidCount}건`)).toBeInTheDocument();
  expect(screen.getByText(paginationSummary(1, paidCount))).toBeInTheDocument();
});
