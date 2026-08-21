import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";

test("content performance defaults to independently flippable cards and can switch to the list", async () => {
  const user = userEvent.setup();
  renderRoute("/performance/contents");

  const results = await screen.findByRole(
    "region",
    { name: "콘텐츠 성과 및 추이" },
    { timeout: 3_000 },
  );
  expect(within(results).getByText("콘텐츠 성과 및 추이")).toBeInTheDocument();
  const uploadStatus = screen.getByRole("heading", { name: "업로드 현황" }).closest("article");
  expect(uploadStatus).not.toBeNull();
  expect([...uploadStatus!.querySelectorAll("dt")].map((term) => term.textContent)).toEqual([
    "전체",
    "이번 기수",
    "이전 대비",
  ]);
  expect(screen.getByText("기수별 누적 콘텐츠 성과")).toBeInTheDocument();
  const cohortChart = screen.getByRole("article", { name: "기수별 누적 콘텐츠 성과" });
  expect(within(cohortChart).getByRole("button", { name: "종합" })).toHaveAttribute("aria-pressed", "true");
  expect(within(cohortChart).getByRole("img", { name: "기수별 전체 성과 추이" })).toBeInTheDocument();
  expect(cohortChart.querySelectorAll("[data-series]")).toHaveLength(4);
  expect(within(cohortChart).getByRole("list", { name: "차트 범례" }).children).toHaveLength(4);
  const cohortPoints = [...cohortChart.querySelectorAll<SVGGElement>("[data-cohort]")];
  const cohortNames = cohortPoints.map((point) => point.dataset.cohort ?? "");
  expect(cohortPoints.length).toBeGreaterThan(0);
  expect(cohortNames).toEqual(
    [...cohortNames].sort((left, right) => right.localeCompare(left, "ko", { numeric: true })),
  );
  await user.click(within(cohortChart).getByRole("button", { name: "댓글 수" }));
  expect(within(cohortChart).getByRole("img", { name: "기수별 댓글 수 추이" })).toBeInTheDocument();
  expect(cohortChart.querySelectorAll("[data-series]")).toHaveLength(1);
  const selectedLegend = within(cohortChart).getByRole("list", { name: "차트 범례" });
  expect(selectedLegend.children).toHaveLength(1);
  expect(within(selectedLegend).getByText("댓글 수")).toBeInTheDocument();
  expect(screen.getByText("콘텐츠 유형")).toBeInTheDocument();

  const flipButtons = within(results).getAllByRole("button", { name: /성과 상세 보기$/ });
  const firstTrigger = flipButtons[0];
  const firstCard = firstTrigger.closest("article");
  expect(firstCard).not.toBeNull();
  expect(firstTrigger.tagName).toBe("BUTTON");
  expect(firstTrigger.parentElement).toBe(firstCard);
  expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
  expect(firstTrigger).toHaveAttribute("aria-pressed", "false");
  expect(firstCard!.querySelector(".fuma-content-performance-card__front")).not.toHaveAttribute("hidden");
  expect(firstCard!.querySelector(".fuma-content-performance-card__back")).toHaveAttribute("hidden");
  expect(within(firstCard!).queryByRole("heading", { name: "조회 및 반응 추이" }))
    .not.toBeInTheDocument();

  await user.click(firstTrigger);
  expect(firstTrigger).toHaveAttribute("aria-expanded", "true");
  expect(firstTrigger).toHaveAttribute("aria-pressed", "true");
  expect(firstCard!.querySelector(".fuma-content-performance-card__front")).toHaveAttribute("hidden");
  expect(firstCard!.querySelector(".fuma-content-performance-card__back")).not.toHaveAttribute("hidden");
  expect(within(firstCard!).getByRole("heading", { name: "조회 및 반응 추이" }))
    .toBeInTheDocument();

  await user.click(firstTrigger);
  expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
  expect(within(firstCard!).queryByRole("heading", { name: "조회 및 반응 추이" }))
    .not.toBeInTheDocument();

  await user.click(within(results).getByRole("button", { name: "목록" }));
  expect(within(results).getByRole("region", { name: "콘텐츠 성과 목록" }))
    .toBeInTheDocument();
});

test("upload activity chart only plots canonical activity dates inside the applied period", async () => {
  const user = userEvent.setup();
  renderRoute("/performance/contents");

  await screen.findByRole("heading", { name: "콘텐츠 성과" });
  fireEvent.change(screen.getByLabelText("집계 시작일"), {
    target: { value: "2026-07-22" },
  });
  fireEvent.change(screen.getByLabelText("집계 종료일"), {
    target: { value: "2026-07-24" },
  });
  await user.click(within(screen.getByRole("search", { name: "검색 조건" })).getByRole(
    "button",
    { name: "조회" },
  ));

  const chart = screen.getByRole("figure", { name: "신규/수정 콘텐츠 업로드 추이" });
  expect(
    [...chart.querySelectorAll<HTMLElement>("[data-activity-date]")].map(
      (point) => point.dataset.activityDate,
    ),
  ).toEqual(["2026-07-22", "2026-07-23", "2026-07-24"]);
});
