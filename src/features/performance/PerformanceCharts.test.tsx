import { render, screen, within } from "@testing-library/react";
import {
  PerformanceBarChart,
  PerformanceKpiGrid,
  PerformanceRanking,
  PerformanceTrendChart,
} from "./PerformanceCharts";

const EMPTY_STATE = "표시할 성과 데이터가 없습니다";

test("renders supplied KPI no-result and all-zero values in a semantic description list", () => {
  render(
    <PerformanceKpiGrid
      ariaLabel="성과 요약"
      items={[
        { label: "조회 결과", value: "-" },
        { label: "구매 전환", value: "0", description: "선택 기간" },
      ]}
    />,
  );

  const grid = screen.getByRole("group", { name: "성과 요약" });
  expect(grid.tagName).toBe("DL");
  expect(grid).toHaveAttribute("data-visual-contract", "metric-strip");
  expect(within(grid).getByText("조회 결과").tagName).toBe("DT");
  expect(within(grid).getByText("-").tagName).toBe("DD");
  expect(within(grid).getByText("구매 전환")).toBeInTheDocument();
  expect(within(grid).getByText("0")).toBeInTheDocument();
  expect(within(grid).getByText("선택 기간")).toBeInTheDocument();
});

test("renders a labelled decorative trend SVG with distinct lines and complete accessible data", () => {
  render(
    <PerformanceTrendChart
      points={[
        {
          date: "2026-08-01",
          label: "8월 1일",
          clicks: 13_200,
          conversions: 410,
        },
        {
          date: "2026-08-02",
          label: "8월 2일",
          clicks: 14_100,
          conversions: 463,
        },
        {
          date: "2026-08-03",
          label: "8월 3일",
          clicks: 14_900,
          conversions: 526,
        },
      ]}
      title="선택 기간 성과 추이"
    />,
  );

  const figure = screen.getByRole("figure", { name: "선택 기간 성과 추이" });
  const caption = within(figure).getByText("선택 기간 성과 추이");
  expect(caption.tagName).toBe("FIGCAPTION");
  expect(figure).toHaveAttribute("aria-labelledby", caption.id);

  const svg = figure.querySelector("svg");
  expect(svg).toHaveAttribute("aria-hidden", "true");
  expect(svg).toHaveAttribute("data-click-axis-min", "0");
  expect(svg).toHaveAttribute("data-conversion-axis-min", "0");
  expect(svg?.querySelector('[data-series="clicks"]')).not.toHaveAttribute(
    "stroke-dasharray",
  );
  expect(svg?.querySelector('[data-series="conversions"]')).toHaveAttribute(
    "stroke-dasharray",
  );
  expect(within(figure).getByText("클릭")).toBeVisible();
  expect(within(figure).getByText("구매 전환")).toBeVisible();
  expect(
    svg?.querySelector(".fuma-performance-trend-chart__value--clicks"),
  ).toBeVisible();
  expect(
    svg?.querySelector(".fuma-performance-trend-chart__value--conversions"),
  ).toBeVisible();
  expect(svg?.querySelectorAll(".fuma-performance-trend-chart__value")).toHaveLength(
    6,
  );

  const dataList = figure.querySelector(".hsas-visually-hidden");
  expect(dataList).toHaveTextContent("8월 1일: 클릭 13,200, 구매 전환 410");
  expect(dataList).toHaveTextContent("8월 2일: 클릭 14,100, 구매 전환 463");
  expect(dataList).toHaveTextContent("8월 3일: 클릭 14,900, 구매 전환 526");
});

test("sanitizes non-finite trend metrics before scaling and exposing data", () => {
  render(
    <PerformanceTrendChart
      points={[
        { date: "finite", label: "정상", clicks: 10, conversions: 5 },
        {
          date: "non-finite",
          label: "비정상",
          clicks: Number.NaN,
          conversions: Number.POSITIVE_INFINITY,
        },
      ]}
      title="안전한 성과 추이"
    />,
  );

  const figure = screen.getByRole("figure", { name: "안전한 성과 추이" });
  const svgMarkup = figure.querySelector("svg")?.outerHTML ?? "";
  expect(svgMarkup).not.toMatch(/NaN|Infinity/);
  expect(figure.querySelector(".hsas-visually-hidden")).toHaveTextContent(
    "비정상: 클릭 0, 구매 전환 0",
  );
});

test("sorts and truncates bar rows while independently normalizing bars and dots", () => {
  render(
    <PerformanceBarChart
      items={[
        {
          id: "item-b",
          label: "두 번째지만 긴 전체 레이블",
          sortValue: 20,
          primaryValue: 50,
          secondaryValue: 100,
          primaryText: "조회 50",
          secondaryText: "전환 100",
        },
        {
          id: "item-a",
          label: "동률에서 먼저",
          sortValue: 20,
          primaryValue: 100,
          secondaryValue: 50,
          primaryText: "조회 100",
          secondaryText: "전환 50",
        },
        ...[19, 18, 17, 16, 15].map((sortValue, index) => ({
          id: `item-${index + 1}`,
          label: `항목 ${index + 1}`,
          sortValue,
          primaryValue: 10,
          secondaryValue: 10,
          primaryText: "조회 10",
          secondaryText: "전환 10",
        })),
      ]}
      mode="bar-dot"
      primaryLabel="조회 수"
      secondaryLabel="구매 전환 수"
      title="크리에이터 영향력 비교"
    />,
  );

  const figure = screen.getByRole("figure", { name: "크리에이터 영향력 비교" });
  const rows = figure.querySelectorAll(".fuma-performance-bar-chart__row");
  expect(rows).toHaveLength(5);
  expect(rows[0]).toHaveAttribute("data-item-id", "item-a");
  expect(rows[1]).toHaveAttribute("data-item-id", "item-b");
  expect(rows[0].querySelector(".fuma-performance-bar-chart__bar")).toHaveStyle({
    width: "100%",
  });
  expect(rows[0].querySelector(".fuma-performance-bar-chart__dot")).toHaveStyle({
    left: "50%",
  });
  expect(rows[1].querySelector(".fuma-performance-bar-chart__bar")).toHaveStyle({
    width: "50%",
  });
  expect(rows[1].querySelector(".fuma-performance-bar-chart__dot")).toHaveStyle({
    left: "100%",
  });
  expect(within(figure).getByTitle("두 번째지만 긴 전체 레이블")).toBeInTheDocument();
  expect(figure.querySelector(".hsas-visually-hidden")).toHaveTextContent(
    "두 번째지만 긴 전체 레이블: 조회 50, 전환 100",
  );
  expect(
    figure.querySelector(".fuma-performance-bar-chart__rows"),
  ).toHaveAttribute("aria-hidden", "true");
  expect(within(figure).getAllByRole("listitem")).toHaveLength(5);
});

test("sanitizes non-finite bar values before sorting and normalization", () => {
  render(
    <PerformanceBarChart
      items={[
        {
          id: "finite",
          label: "정상",
          sortValue: 1,
          primaryValue: 10,
          secondaryValue: 20,
          primaryText: "조회 10",
          secondaryText: "전환 20",
        },
        {
          id: "nan",
          label: "NaN",
          sortValue: Number.NaN,
          primaryValue: Number.NaN,
          secondaryValue: Number.NaN,
          primaryText: "조회 0",
          secondaryText: "전환 0",
        },
        {
          id: "infinity",
          label: "Infinity",
          sortValue: Number.POSITIVE_INFINITY,
          primaryValue: Number.POSITIVE_INFINITY,
          secondaryValue: Number.POSITIVE_INFINITY,
          primaryText: "조회 0",
          secondaryText: "전환 0",
        },
      ]}
      mode="bar-dot"
      primaryLabel="조회 수"
      secondaryLabel="구매 전환 수"
      title="안전한 비교"
    />,
  );

  const figure = screen.getByRole("figure", { name: "안전한 비교" });
  const rows = figure.querySelectorAll(".fuma-performance-bar-chart__row");
  expect(rows[0]).toHaveAttribute("data-item-id", "finite");
  expect(rows[1]).toHaveAttribute("data-item-id", "infinity");
  expect(rows[2]).toHaveAttribute("data-item-id", "nan");
  expect(rows[0].querySelector(".fuma-performance-bar-chart__bar")).toHaveStyle({
    width: "100%",
  });
  expect(rows[1].querySelector(".fuma-performance-bar-chart__bar")).toHaveStyle({
    width: "0%",
  });
  expect(rows[2].querySelector(".fuma-performance-bar-chart__dot")).toHaveStyle({
    left: "0%",
  });
  expect(figure.innerHTML).not.toMatch(/(?:width|left):\s*(?:NaN|Infinity)/);
});

test("models single and bar-dot inputs as separate prop variants", () => {
  const incompleteBarDot = (
    // @ts-expect-error bar-dot mode requires a secondary label and item values.
    <PerformanceBarChart
      items={[
        {
          id: "missing-secondary",
          label: "누락",
          sortValue: 1,
          primaryValue: 1,
          primaryText: "조회 1",
        },
      ]}
      mode="bar-dot"
      primaryLabel="조회 수"
      title="잘못된 비교"
    />
  );
  const invalidSingle = (
    // @ts-expect-error single mode does not accept secondary fields.
    <PerformanceBarChart
      items={[
        {
          id: "unexpected-secondary",
          label: "불필요",
          sortValue: 1,
          primaryValue: 1,
          secondaryValue: 1,
          primaryText: "조회 1",
          secondaryText: "전환 1",
        },
      ]}
      mode="single"
      primaryLabel="조회 수"
      secondaryLabel="구매 전환 수"
      title="잘못된 단일 막대"
    />
  );

  expect(incompleteBarDot).toBeDefined();
  expect(invalidSingle).toBeDefined();
});

test("shows visible zero text for mixed bar data and a common empty state for empty or zero charts", () => {
  const { rerender } = render(
    <PerformanceBarChart
      items={[
        {
          id: "positive",
          label: "성과 있음",
          sortValue: 1,
          primaryValue: 10,
          primaryText: "10회",
        },
        {
          id: "zero",
          label: "성과 없음",
          sortValue: 0,
          primaryValue: 0,
          primaryText: "0회",
        },
      ]}
      mode="single"
      primaryLabel="조회 수"
      title="혼합 성과"
    />,
  );
  expect(screen.getByText("0회")).toBeVisible();

  rerender(
    <PerformanceBarChart
      items={[]}
      mode="single"
      primaryLabel="조회 수"
      title="빈 성과"
    />,
  );
  expect(screen.getByText(EMPTY_STATE)).toBeVisible();

  rerender(
    <PerformanceBarChart
      items={[
        {
          id: "zero",
          label: "성과 없음",
          sortValue: 0,
          primaryValue: 0,
          primaryText: "0회",
        },
      ]}
      mode="single"
      primaryLabel="조회 수"
      title="0 성과"
    />,
  );
  expect(screen.getByText(EMPTY_STATE)).toBeVisible();
});

test("does not report an empty bar chart when a positive primary value sorts below the top five", () => {
  render(
    <PerformanceBarChart
      items={[
        ...[10, 9, 8, 7, 6].map((sortValue) => ({
          id: `zero-${sortValue}`,
          label: `0 성과 ${sortValue}`,
          sortValue,
          primaryValue: 0,
          primaryText: "0회",
        })),
        {
          id: "positive",
          label: "순위 밖 성과",
          sortValue: 1,
          primaryValue: 1,
          primaryText: "1회",
        },
      ]}
      mode="single"
      primaryLabel="조회 수"
      title="상위 5개 성과"
    />,
  );

  const figure = screen.getByRole("figure", { name: "상위 5개 성과" });
  expect(within(figure).queryByText(EMPTY_STATE)).not.toBeInTheDocument();
  expect(figure.querySelectorAll(".fuma-performance-bar-chart__row")).toHaveLength(5);
});

test("sorts rankings by conversions and ID, limits them to five, and shows explicit ranks", () => {
  render(
    <PerformanceRanking
      items={[
        { id: "selector-b", label: "박도윤", conversions: 20 },
        { id: "selector-a", label: "김서연", conversions: 20 },
        { id: "selector-c", label: "이지아", conversions: 15 },
        { id: "selector-d", label: "오하늘", conversions: 10 },
        { id: "selector-e", label: "최하나", conversions: 5 },
        { id: "selector-f", label: "노출 제외", conversions: 1 },
      ]}
      title="셀렉터스 성과 순위"
    />,
  );

  const figure = screen.getByRole("figure", { name: "셀렉터스 성과 순위" });
  const rows = figure.querySelectorAll(".fuma-performance-ranking__item");
  expect(rows).toHaveLength(5);
  expect(rows[0]).toHaveAttribute("data-item-id", "selector-a");
  expect(rows[1]).toHaveAttribute("data-item-id", "selector-b");
  expect(rows[0]).toHaveTextContent("1위");
  expect(rows[0]).toHaveTextContent("김서연");
  expect(rows[0]).toHaveTextContent("20");
  expect(figure).not.toHaveTextContent("노출 제외");
});

test("sanitizes non-finite ranking conversions before sorting and display", () => {
  const { rerender } = render(
    <PerformanceRanking
      items={[
        { id: "finite", label: "정상", conversions: 5 },
        { id: "nan", label: "NaN", conversions: Number.NaN },
        {
          id: "infinity",
          label: "Infinity",
          conversions: Number.POSITIVE_INFINITY,
        },
      ]}
      title="안전한 순위"
    />,
  );

  const figure = screen.getByRole("figure", { name: "안전한 순위" });
  const rows = figure.querySelectorAll(".fuma-performance-ranking__item");
  expect(rows[0]).toHaveAttribute("data-item-id", "finite");
  expect(rows[1]).toHaveAttribute("data-item-id", "infinity");
  expect(rows[2]).toHaveAttribute("data-item-id", "nan");
  expect(rows[1]).toHaveTextContent("0");
  expect(rows[2]).toHaveTextContent("0");

  rerender(
    <PerformanceRanking
      items={[
        { id: "nan", label: "NaN", conversions: Number.NaN },
        {
          id: "infinity",
          label: "Infinity",
          conversions: Number.POSITIVE_INFINITY,
        },
      ]}
      title="비정상 순위"
    />,
  );
  expect(screen.getByText(EMPTY_STATE)).toBeVisible();
});

test("uses the common empty state for empty and all-zero rankings and trends", () => {
  const { rerender } = render(
    <PerformanceRanking items={[]} title="빈 순위" />,
  );
  expect(screen.getByText(EMPTY_STATE)).toBeVisible();

  rerender(
    <PerformanceRanking
      items={[{ id: "zero", label: "성과 없음", conversions: 0 }]}
      title="0 순위"
    />,
  );
  expect(screen.getByText(EMPTY_STATE)).toBeVisible();

  rerender(
    <PerformanceTrendChart
      points={[{ date: "2026-08-01", label: "8월 1일", clicks: 0, conversions: 0 }]}
      title="0 추이"
    />,
  );
  expect(screen.getByText(EMPTY_STATE)).toBeVisible();
});
