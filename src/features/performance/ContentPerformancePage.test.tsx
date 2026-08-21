import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CONTENT_INFLUENCE } from "../../entities/performance";
import { renderRoute } from "../../test/renderRoute";

test("content performance opens card and list details in a side panel", async () => {
  const user = userEvent.setup();
  renderRoute("/performance/contents");

  const results = await screen.findByRole(
    "region",
    { name: "콘텐츠 성과 및 추이" },
    { timeout: 3_000 },
  );
  expect(within(results).getByText("콘텐츠 성과 및 추이")).toBeInTheDocument();
  const sort = within(results).getByRole("combobox", { name: "콘텐츠 성과 정렬" });
  expect(sort).toHaveValue("latest");
  await user.selectOptions(sort, "views");
  const highestViewContent = [...CONTENT_INFLUENCE].sort((left, right) => right.views - left.views)[0];
  expect(within(results).getAllByRole("button", { name: /콘텐츠 상세 보기$/ })[0])
    .toHaveAccessibleName(new RegExp(`${highestViewContent.title} 콘텐츠 상세 보기$`));
  const uploadStatus = screen.getByRole("heading", { name: "업로드 현황" }).closest("article");
  expect(uploadStatus).not.toBeNull();
  expect([...uploadStatus!.querySelectorAll("dt")].map((term) => term.textContent)).toEqual([
    "전체",
    "이번 기수",
    "이전 대비",
  ]);
  expect(screen.getByText("기간별 누적 콘텐츠 성과")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "기간별 누적 콘텐츠 성과 그래프 좌우 이동" })).toHaveClass(
    "fuma-content-cohort-chart__scroll--draggable",
  );
  const cohortChart = screen.getByRole("article", { name: "기간별 누적 콘텐츠 성과" });
  expect(within(cohortChart).getByRole("button", { name: "종합" })).toHaveAttribute("aria-pressed", "true");
  expect(within(cohortChart).getByRole("img", { name: "기간별 전체 성과 추이" })).toBeInTheDocument();
  expect(cohortChart.querySelectorAll("[data-series]")).toHaveLength(4);
  expect(within(cohortChart).getByRole("list", { name: "차트 범례" }).children).toHaveLength(4);
  const cohortPoints = [...cohortChart.querySelectorAll<SVGGElement>("[data-period-date]")];
  const cohortNames = cohortPoints.map((point) => point.dataset.periodDate ?? "");
  expect(cohortPoints.length).toBeGreaterThan(0);
  expect(cohortNames).toEqual(
    [...cohortNames].sort((left, right) => left.localeCompare(right)),
  );
  await user.click(within(cohortChart).getByRole("button", { name: "댓글 수" }));
  expect(within(cohortChart).getByRole("img", { name: "기간별 댓글 수 추이" })).toBeInTheDocument();
  expect(cohortChart.querySelectorAll("[data-series]")).toHaveLength(1);
  const selectedLegend = within(cohortChart).getByRole("list", { name: "차트 범례" });
  expect(selectedLegend.children).toHaveLength(1);
  expect(within(selectedLegend).getByText("댓글 수")).toBeInTheDocument();
  const formatPanel = within(uploadStatus!).getByRole("region", { name: "콘텐츠 유형" });
  expect(within(formatPanel).queryByText("전체 콘텐츠")).not.toBeInTheDocument();
  expect(screen.queryByText(/조회 결과 [\d,]+건/)).not.toBeInTheDocument();

  const detailButtons = within(results).getAllByRole("button", { name: /콘텐츠 상세 보기$/ });
  const firstTrigger = detailButtons[0];
  const firstCard = firstTrigger.closest("article");
  expect(firstCard).not.toBeNull();
  expect(firstTrigger.tagName).toBe("BUTTON");
  expect(firstTrigger.parentElement).toBe(firstCard);
  expect(firstCard!.querySelector(".fuma-content-performance-card__back")).not.toBeInTheDocument();

  await user.click(firstTrigger);
  const cardDetail = screen.getByRole("dialog", { name: "콘텐츠 상세" });
  expect(within(cardDetail).getByRole("heading", { name: highestViewContent.title })).toBeInTheDocument();
  expect(within(cardDetail).getByRole("heading", { name: "조회 및 반응 추이" })).toBeInTheDocument();
  const detailTrend = within(cardDetail).getByRole("img", { name: "콘텐츠 조회 및 반응 추이" });
  expect(detailTrend.querySelectorAll("[data-series]")).toHaveLength(3);
  await user.click(within(cardDetail).getByRole("button", { name: "좋아요" }));
  expect(detailTrend.querySelectorAll("[data-series]")).toHaveLength(1);
  expect(detailTrend.querySelectorAll(".fuma-content-cohort-chart__label").length).toBeGreaterThan(0);
  await user.click(within(cardDetail).getByRole("button", { name: "상세 패널 닫기" }));
  expect(screen.queryByRole("dialog", { name: "콘텐츠 상세" })).not.toBeInTheDocument();

  await user.click(within(results).getByRole("button", { name: "목록" }));
  const list = within(results).getByRole("region", { name: "콘텐츠 성과 목록" });
  expect(within(list).getByRole("columnheader", { name: "조회수 · 좋아요 추이" })).toBeInTheDocument();
  expect(within(list).queryByRole("columnheader", { name: "조회수 추이" })).not.toBeInTheDocument();
  expect(within(list).queryByRole("columnheader", { name: "좋아요 수 추이" })).not.toBeInTheDocument();
  const firstListRow = within(list).getAllByRole("row")[1];
  const tableTrend = within(firstListRow).getByRole("img", { name: "날짜별 조회수 및 좋아요 추이" });
  expect(tableTrend.querySelectorAll("[data-series]")).toHaveLength(2);
  await user.click(firstListRow);
  expect(screen.getByRole("dialog", { name: "콘텐츠 상세" })).toBeInTheDocument();
});

test("period performance chart applies its local date range", async () => {
  const user = userEvent.setup();
  renderRoute("/performance/contents");

  await screen.findByRole("heading", { name: "콘텐츠 성과" });
  expect(screen.queryByLabelText("집계 시작일")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("집계 종료일")).not.toBeInTheDocument();
  expect(screen.queryByRole("figure", { name: "기간별 업로드 추이" })).not.toBeInTheDocument();

  const chart = screen.getByRole("article", { name: "기간별 누적 콘텐츠 성과" });
  fireEvent.change(within(chart).getByLabelText("성과 시작일"), {
    target: { value: "2026-07-22" },
  });
  fireEvent.change(within(chart).getByLabelText("성과 종료일"), {
    target: { value: "2026-07-24" },
  });
  await user.click(within(chart).getByRole("button", { name: "조회" }));

  expect(
    [...chart.querySelectorAll<HTMLElement>("[data-period-date]")].map(
      (point) => point.dataset.periodDate,
    ),
  ).toEqual(["2026-07-22", "2026-07-23", "2026-07-24"]);

  fireEvent.change(within(chart).getByLabelText("성과 시작일"), {
    target: { value: "2026-07-23" },
  });
  await user.click(within(chart).getByRole("button", { name: "조회" }));
  expect(
    [...chart.querySelectorAll<HTMLElement>("[data-period-date]")].map(
      (point) => point.dataset.periodDate,
    ),
  ).toEqual(["2026-07-23", "2026-07-24"]);
});
