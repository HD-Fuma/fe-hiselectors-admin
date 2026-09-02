import type { Generation, SelectorSalesPerformance } from "../../entities/selectors";
import {
  boxplotFromValues,
  buildSelectorTrend,
  concentrationShare,
  defaultSelectorPerformancePeriod,
  enrichSelectorSales,
  filterSelectorUniverse,
  filterWatchlistRows,
  matchesWatchlist,
  medianSales,
  summarizeSelectorDashboard,
} from "./selectorDashboard";

const ROWS: SelectorSalesPerformance[] = [
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
    excellentActivityType: "3기 활동 누적 1위",
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
];

function generation(
  name: string,
  status: Generation["status"],
  id: number,
  activityStartDate = "2026-04-01T00:00:00",
): Generation {
  return {
    activityEndDate: "2026-06-30T23:59:59",
    activityStartDate,
    endDate: "2026-03-31T23:59:59",
    generationName: name,
    id,
    startDate: "2026-01-01T00:00:00",
    status,
  };
}

test("defaults the query period to the active generation activity start through today", () => {
  const now = new Date(2026, 8, 3);

  expect(defaultSelectorPerformancePeriod([
    generation("5기", "ACTIVE", 5, "2026-08-01T00:00:00"),
    generation("2기", "INACTIVE", 2, "2026-01-01T00:00:00"),
  ], now)).toEqual({
    periodEnd: "2026-09-03",
    periodStart: "2026-08-01",
  });
});

test("falls back to six months when there is no active generation", () => {
  const now = new Date(2026, 8, 3);

  expect(defaultSelectorPerformancePeriod([
    generation("2기", "INACTIVE", 2, "2026-01-01T00:00:00"),
  ], now)).toEqual({
    periodEnd: "2026-09-03",
    periodStart: "2026-04-01",
  });
});

test("keeps the median below the average when sales are concentrated", () => {
  expect(medianSales([0, 180_000, 700_000])).toBe(180_000);
  expect(medianSales([100, 200, 300, 400])).toBe(250);
});

test("uses top 10 people for concentration when the pool is small", () => {
  expect(concentrationShare([10, 10, 80])).toBe(1);
  expect(concentrationShare([0, 0, 0])).toBe(0);
});

test("marks extreme sales as boxplot outliers and keeps the median", () => {
  const stats = boxplotFromValues([0, 10, 20, 30, 40, 50, 1000]);
  expect(stats).not.toBeNull();
  expect(stats?.value[2]).toBe(30);
  expect(stats?.outliers).toEqual([1000]);
  expect(stats?.value[0]).toBe(0);
  expect(stats?.value[4]).toBe(50);
});

test("limits the default universe to active generation members", () => {
  const universe = filterSelectorUniverse(ROWS, [
    generation("5기", "ACTIVE", 5),
    generation("3기", "ACTIVE", 3),
    generation("2기", "INACTIVE", 2),
  ], "");

  expect(universe.map((row) => row.nickname)).toEqual(["낮은매출", "최고매출"]);
});

test("classifies swing only when previous sales clear the floor", () => {
  const high = enrichSelectorSales(ROWS[1]);
  const low = enrichSelectorSales(ROWS[0]);

  expect(matchesWatchlist(high, "salesRise")).toBe(true);
  expect(matchesWatchlist(low, "salesDrop")).toBe(true);
  expect(matchesWatchlist({
    ...high,
    previousPeriodSales: 50_000,
    totalSales: 200_000,
  }, "salesRise")).toBe(false);
});

test("marks types with fewer than 5 people as reference", () => {
  const summary = summarizeSelectorDashboard(ROWS.map(enrichSelectorSales));
  expect(summary.types.every((type) => type.reference)).toBe(true);
  expect(summary.selectorCount).toBe(3);
  expect(summary.types.every((type) => type.boxplot)).toBe(true);
  expect(summary.watchlists.discovery[0]?.key).toBe("salesRise");
});

test("filters the watchlist without changing the dashboard universe", () => {
  const rows = filterSelectorUniverse(ROWS, [
    generation("5기", "ACTIVE", 5),
    generation("3기", "ACTIVE", 3),
    generation("2기", "INACTIVE", 2),
  ], "").map(enrichSelectorSales);

  expect(filterWatchlistRows(rows, "salesRise").map((row) => row.nickname)).toEqual(["최고매출"]);
  expect(filterWatchlistRows(rows, "salesDrop").map((row) => row.nickname)).toEqual(["낮은매출"]);
});

test("buckets a short period by day and a longer period by month", () => {
  const rows = [enrichSelectorSales(ROWS[1])];
  const daily = buildSelectorTrend(rows, "2026-08-01", "2026-08-26", new Date(2026, 7, 26));
  const monthly = buildSelectorTrend(rows, "", "", new Date(2026, 7, 26));

  expect(daily.bucket).toBe("day");
  expect(daily.points).toHaveLength(26);
  expect(monthly.bucket).toBe("month");
  expect(monthly.points.map((point) => point.label)).toEqual([
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
  ]);
});
