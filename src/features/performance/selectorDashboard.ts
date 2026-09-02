import { categoryLabel } from "../../entities/creator";
import { formatRate } from "../../entities/performance";
import type {
  Generation,
  SelectorPerformanceSummary,
  SelectorPerformanceTrend,
  SelectorSalesPerformance,
} from "../../entities/selectors";
import { formatNumber } from "../../lib/formatters";

export const SELECTOR_TYPE_MIN_COUNT = 5;
export const SALES_SWING_FLOOR = 100_000;

const SELECTOR_TYPES = ["뷰티", "패션", "리빙", "푸드", "기타"] as const;
const COMMISSION_RATES = [0.03, 0.05, 0.07, 0.1] as const;
const PREVIOUS_SALES_RATIOS = [0.3, 0.45, 1, 2.2, 3] as const;

const SALES_BUCKETS = [
  { key: "zero", label: "0원", max: 0 },
  { key: "to10", label: "1~10만원", max: 100_000 },
  { key: "to50", label: "10~50만원", max: 500_000 },
  { key: "to100", label: "50~100만원", max: 1_000_000 },
  { key: "over100", label: "100만원 이상", max: Number.POSITIVE_INFINITY },
] as const;

const SUMMARY_SALES_BUCKETS = [
  { key: "ZERO", label: "0원" },
  { key: "UP_TO_100000", label: "1~10만원" },
  { key: "UP_TO_500000", label: "10~50만원" },
  { key: "UP_TO_1000000", label: "50~100만원" },
  { key: "OVER_1000000", label: "100만원 이상" },
] as const;

export type WatchlistKey =
  | "noClicks"
  | "noUploads"
  | "clicksNoPurchase"
  | "salesDrop"
  | "salesRise"
  | "newTop10";

export interface SelectorDashboardRow {
  accruedCommission: number;
  category: string;
  clickCount: number;
  confirmedOrderCount: number;
  contentCount: number;
  generationName: string | null;
  nickname: string;
  previousPeriodSales: number;
  profileImageUrl: string;
  selectorCode: string;
  selectorId: number;
  source: SelectorSalesPerformance;
  totalSales: number;
}

export interface BoxplotStats {
  outliers: readonly number[];
  value: readonly [number, number, number, number, number];
}

export interface SelectorTypePerformance {
  averageSales: number;
  boxplot: BoxplotStats | null;
  category: string;
  clickCount: number;
  confirmedOrderCount: number;
  conversionRate: string;
  medianSales: number;
  reference: boolean;
  selectorCount: number;
}

export interface SalesBucket {
  count: number;
  key: string;
  label: string;
}

export interface WatchlistGroup {
  count: number;
  key: WatchlistKey;
  label: string;
}

export interface SelectorDashboardTrendPoint {
  confirmedOrderCount: number;
  date: string;
  label: string;
  totalSales: number;
}

export type RankMovement =
  | { kind: "new" }
  | { kind: "same" }
  | { kind: "up"; delta: number }
  | { kind: "down"; delta: number };

export interface SelectorTopRank extends SelectorDashboardRow {
  movement: RankMovement;
  rank: number;
}

export interface SelectorDashboardSummary {
  averageSales: number;
  buckets: readonly SalesBucket[];
  clickCount: number;
  concentrationShare: number;
  confirmedOrderCount: number;
  conversionRate: string;
  earnedCommission: number;
  medianSales: number;
  previousAverageSales: number;
  previousConfirmedOrderCount: number;
  previousEarnedCommission: number;
  previousTotalSales: number;
  producingCount: number;
  selectorCount: number;
  top5: readonly SelectorTopRank[];
  totalSales: number;
  types: readonly SelectorTypePerformance[];
  watchlists: {
    discovery: readonly WatchlistGroup[];
    manage: readonly WatchlistGroup[];
  };
  zeroSalesCount: number;
}

export function compactDashboardNumber(value: number) {
  if (Math.abs(value) >= 100_000_000) {
    const eok = value / 100_000_000;
    return `${eok.toFixed(eok >= 10 || value % 100_000_000 === 0 ? 0 : 2)}억`;
  }
  if (Math.abs(value) >= 10_000) {
    const man = value / 10_000;
    return `${man.toFixed(man >= 100 || value % 10_000 === 0 ? 0 : 1)}만`;
  }
  return formatNumber(value);
}

export function compactDashboardWon(value: number) {
  if (Math.abs(value) >= 10_000) return `${compactDashboardNumber(value)}원`;
  return `${formatNumber(value)}원`;
}

export function changeRate(current: number, previous: number) {
  if (previous === 0) return current === 0 ? "0%" : "신규";
  const delta = ((current - previous) / previous) * 100;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export function rankMovement(currentRank: number, previousRank: number | null): RankMovement {
  if (previousRank == null) return { kind: "new" };
  if (previousRank === currentRank) return { kind: "same" };
  if (previousRank > currentRank) return { kind: "up", delta: previousRank - currentRank };
  return { kind: "down", delta: currentRank - previousRank };
}

export function formatRankMovement(movement: RankMovement) {
  if (movement.kind === "new") return "NEW";
  if (movement.kind === "same") return "-";
  if (movement.kind === "up") return `▲${movement.delta}`;
  return `▼${movement.delta}`;
}

export const EMPTY_SELECTOR_DASHBOARD_SUMMARY: SelectorDashboardSummary = {
  averageSales: 0,
  buckets: SUMMARY_SALES_BUCKETS.map((bucket) => ({ ...bucket, count: 0 })),
  clickCount: 0,
  concentrationShare: 0,
  confirmedOrderCount: 0,
  conversionRate: "0.00%",
  earnedCommission: 0,
  medianSales: 0,
  previousAverageSales: 0,
  previousConfirmedOrderCount: 0,
  previousEarnedCommission: 0,
  previousTotalSales: 0,
  producingCount: 0,
  selectorCount: 0,
  top5: [],
  totalSales: 0,
  types: [],
  watchlists: watchlistsFromApi({
    clicksWithoutPurchase: 0,
    newTop10: 0,
    noClicks: 0,
    noUploads: 0,
    salesDrop: 0,
    salesSurge: 0,
  }),
  zeroSalesCount: 0,
};

export function adaptSelectorPerformanceSummary(
  summary: SelectorPerformanceSummary,
): SelectorDashboardSummary {
  const selectorCount = asNumber(summary.universe.selectorCount);
  const sharePercent = asNumber(summary.distribution.topShareRate);
  const bucketCounts = new Map(
    summary.distribution.buckets.map((bucket) => [bucket.key, asNumber(bucket.selectorCount)]),
  );

  return {
    averageSales: asNumber(summary.kpis.averageSales),
    buckets: SUMMARY_SALES_BUCKETS.map((bucket) => ({
      count: bucketCounts.get(bucket.key) ?? 0,
      key: bucket.key,
      label: bucket.label,
    })),
    clickCount: asNumber(summary.kpis.clickCount),
    concentrationShare: sharePercent / 100,
    confirmedOrderCount: asNumber(summary.kpis.confirmedOrderCount),
    conversionRate: `${asNumber(summary.kpis.conversionRate).toFixed(2)}%`,
    earnedCommission: asNumber(summary.kpis.accruedCommissionAmount),
    medianSales: asNumber(summary.kpis.medianSales),
    previousAverageSales: asNumber(summary.kpis.previousAverageSales),
    previousConfirmedOrderCount: asNumber(summary.kpis.previousConfirmedOrderCount),
    previousEarnedCommission: asNumber(summary.kpis.previousAccruedCommissionAmount),
    previousTotalSales: asNumber(summary.kpis.previousTotalSales),
    producingCount: asNumber(summary.distribution.sellingSelectorCount),
    selectorCount,
    top5: summary.top5.flatMap(adaptRankItem),
    totalSales: asNumber(summary.kpis.totalSales),
    types: summary.categories.map((row) => ({
      averageSales: asNumber(row.averageSales),
      category: labeledCategory(row.category),
      clickCount: 0,
      confirmedOrderCount: 0,
      conversionRate: "-",
      medianSales: asNumber(row.medianSales),
      boxplot: adaptTypeBoxplot(row),
      reference: row.reference,
      selectorCount: asNumber(row.selectorCount),
    })),
    watchlists: watchlistsFromApi(summary.watchlist),
    zeroSalesCount: asNumber(summary.distribution.zeroSalesSelectorCount),
  };
}

export function adaptSelectorPerformanceTrend(
  trend: SelectorPerformanceTrend,
): SelectorDashboardTrendPoint[] {
  const bucket = trend.bucket === "MONTH" ? "month" : "day";
  return trend.points.map((point) => {
    const date = point.date.slice(0, 10);
    return {
      confirmedOrderCount: asNumber(point.confirmedOrderCount),
      date,
      label: trendLabel(date, bucket),
      totalSales: asNumber(point.totalSales),
    };
  });
}

export function defaultSelectorPerformancePeriod(
  generations: readonly Generation[],
  now = new Date(),
) {
  const periodEnd = formatIsoDate(now);
  const current = currentSelectorGeneration(generations, now);
  const cohortStart = current
    ? current.activityStartDate.slice(0, 10)
    : undefined;
  return {
    cohort: current ? String(current.id) : "",
    periodEnd,
    periodStart: cohortStart && cohortStart <= periodEnd
      ? cohortStart
      : formatIsoDate(addMonths(now, -5)),
  };
}

function currentSelectorGeneration(
  generations: readonly Generation[],
  now: Date,
) {
  const today = formatIsoDate(now);
  const inWindow = generations.filter((generation) => (
    generation.activityStartDate.slice(0, 10) <= today
    && today <= generation.activityEndDate.slice(0, 10)
  ));
  const inWindowActive = inWindow.filter((generation) => generation.status === "ACTIVE");
  const active = generations.filter((generation) => generation.status === "ACTIVE");
  const pool = inWindowActive.length > 0
    ? inWindowActive
    : inWindow.length > 0
      ? inWindow
      : active;
  return [...pool].sort((left, right) => {
    const start = right.activityStartDate.slice(0, 10)
      .localeCompare(left.activityStartDate.slice(0, 10));
    if (start !== 0) return start;
    return right.id - left.id;
  })[0];
}

export function previousPerformanceRange(input: {
  generations: readonly Generation[];
  periodStart: string;
  selectedGenerationName: string;
}) {
  if (!input.periodStart) return null;
  const previousEnd = shiftIsoDate(input.periodStart, -1);
  const targets = input.selectedGenerationName
    ? input.generations.filter((generation) => (
      generation.generationName === input.selectedGenerationName
    ))
    : input.generations.filter((generation) => generation.status === "ACTIVE");
  if (targets.length === 0) return null;
  const startDate = earliestActivityStart(targets);
  if (!startDate || previousEnd < startDate) return null;
  return { endDate: previousEnd, startDate };
}

function earliestActivityStart(generations: readonly Generation[]) {
  return [...generations]
    .map((generation) => generation.activityStartDate.slice(0, 10))
    .sort()[0];
}

export function withPreviousPeriodSales(
  rows: readonly SelectorDashboardRow[],
  previousRows: readonly SelectorSalesPerformance[] | null,
) {
  if (previousRows == null) return rows;
  const previousSales = new Map(previousRows.map((row) => [row.selectorId, row.totalSales]));
  return rows.map((row) => ({
    ...row,
    previousPeriodSales: previousSales.get(row.selectorId) ?? 0,
  }));
}

export function medianSales(values: readonly number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }
  return sorted[middle];
}

export function boxplotFromValues(values: readonly number[]): BoxplotStats | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const q1 = quantile(sorted, 0.25);
  const q2 = medianSales(sorted);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const fenceLow = q1 - 1.5 * iqr;
  const fenceHigh = q3 + 1.5 * iqr;
  const inliers = sorted.filter((value) => value >= fenceLow && value <= fenceHigh);
  const outliers = sorted.filter((value) => value < fenceLow || value > fenceHigh);
  return {
    outliers,
    value: [
      inliers[0] ?? sorted[0],
      q1,
      q2,
      q3,
      inliers[inliers.length - 1] ?? sorted[sorted.length - 1],
    ],
  };
}

export function concentrationShare(sales: readonly number[]) {
  const total = sales.reduce((sum, value) => sum + value, 0);
  if (sales.length === 0 || total === 0) return 0;
  const ranked = [...sales].sort((left, right) => right - left);
  const take = sales.length < 50
    ? Math.min(10, sales.length)
    : Math.ceil(sales.length * 0.1);
  const focused = ranked.slice(0, take).reduce((sum, value) => sum + value, 0);
  return focused / total;
}

export function enrichSelectorSales(row: SelectorSalesPerformance): SelectorDashboardRow {
  const seed = row.selectorId;
  const fallbackClicks = row.confirmedOrderCount === 0
    ? (seed % 4 === 0 ? 0 : 24 + seed * 7)
    : Math.max(row.confirmedOrderCount * 18, 80 + seed * 11);
  const clickCount = row.clickCount ?? fallbackClicks;
  const contentCount = row.contentCount ?? (
    clickCount === 0 && seed % 2 === 0 ? 0 : 1 + (seed % 6)
  );
  const previousRatio = PREVIOUS_SALES_RATIOS[seed % PREVIOUS_SALES_RATIOS.length];
  const previousPeriodSales = row.previousPeriodSales
    ?? Math.round(row.totalSales * previousRatio);
  const commissionRate = COMMISSION_RATES[seed % COMMISSION_RATES.length];

  return {
    accruedCommission: row.accruedCommissionAmount
      ?? Math.round(row.totalSales * commissionRate),
    category: row.category?.trim() || SELECTOR_TYPES[seed % SELECTOR_TYPES.length],
    clickCount,
    confirmedOrderCount: row.confirmedOrderCount,
    contentCount,
    generationName: row.generationName,
    nickname: row.nickname,
    previousPeriodSales,
    profileImageUrl: row.profileImageUrl?.trim() || "",
    selectorCode: row.selectorCode,
    selectorId: row.selectorId,
    source: row,
    totalSales: row.totalSales,
  };
}

export function activeGenerationNames(generations: readonly Generation[]) {
  return generations
    .filter((generation) => generation.status === "ACTIVE")
    .map((generation) => generation.generationName);
}

export function filterSelectorUniverse(
  rows: readonly SelectorSalesPerformance[],
  generations: readonly Generation[],
  selectedGenerationName: string,
) {
  if (selectedGenerationName) {
    return rows.filter((row) => membershipGenerationName(row) === selectedGenerationName);
  }

  const activeNames = new Set(activeGenerationNames(generations));
  if (generations.length === 0) return [...rows];
  if (activeNames.size === 0) return [];
  return rows.filter((row) => {
    const generationName = membershipGenerationName(row);
    return generationName != null && activeNames.has(generationName);
  });
}

export function membershipGenerationName(row: SelectorSalesPerformance) {
  return row.generationName;
}

export function matchesWatchlist(row: SelectorDashboardRow, key: WatchlistKey) {
  if (key === "noClicks") return row.clickCount === 0;
  if (key === "noUploads") return row.contentCount === 0;
  if (key === "clicksNoPurchase") {
    return row.clickCount > 0 && row.confirmedOrderCount === 0;
  }
  if (key === "salesDrop") {
    return row.previousPeriodSales >= SALES_SWING_FLOOR
      && row.totalSales < row.previousPeriodSales * 0.5;
  }
  if (key === "salesRise") {
    return row.previousPeriodSales >= SALES_SWING_FLOOR
      && row.totalSales >= row.previousPeriodSales * 2;
  }
  return false;
}

export function summarizeSelectorDashboard(
  rows: readonly SelectorDashboardRow[],
  previousRankingAvailable = false,
): SelectorDashboardSummary {
  const selectorCount = rows.length;
  const totalSales = sumBy(rows, (row) => row.totalSales);
  const confirmedOrderCount = sumBy(rows, (row) => row.confirmedOrderCount);
  const clickCount = sumBy(rows, (row) => row.clickCount);
  const earnedCommission = sumBy(rows, (row) => row.accruedCommission);
  const previousTotalSales = sumBy(rows, (row) => row.previousPeriodSales);
  const previousConfirmedOrderCount = sumBy(rows, (row) => (
    Math.round(row.confirmedOrderCount * previousRatio(row))
  ));
  const previousEarnedCommission = sumBy(rows, (row) => (
    Math.round(row.accruedCommission * previousRatio(row))
  ));
  const sales = rows.map((row) => row.totalSales);
  const ranked = [...rows].sort(compareSalesRank);
  const currentRank = rankMap(ranked);
  const previousRank = rankMap([...rows].sort((left, right) => (
    right.previousPeriodSales - left.previousPeriodSales
    || left.selectorCode.localeCompare(right.selectorCode)
  )));
  const previousRankedSales = rankMap([...rows]
    .filter((row) => row.previousPeriodSales > 0)
    .sort((left, right) => (
      right.previousPeriodSales - left.previousPeriodSales
      || left.selectorCode.localeCompare(right.selectorCode)
    )));
  const newTop10 = ranked.filter((row) => (
    (currentRank.get(row.selectorId) ?? 99) <= 10
    && (previousRank.get(row.selectorId) ?? 0) > 10
  ));

  return {
    averageSales: selectorCount === 0 ? 0 : Math.round(totalSales / selectorCount),
    buckets: SALES_BUCKETS.map((bucket, index) => ({
      count: rows.filter((row) => inBucket(row.totalSales, index)).length,
      key: bucket.key,
      label: bucket.label,
    })),
    clickCount,
    concentrationShare: concentrationShare(sales),
    confirmedOrderCount,
    conversionRate: formatRate(confirmedOrderCount, clickCount),
    earnedCommission,
    medianSales: medianSales(sales),
    previousAverageSales: selectorCount === 0
      ? 0
      : Math.round(previousTotalSales / selectorCount),
    previousConfirmedOrderCount,
    previousEarnedCommission,
    previousTotalSales,
    producingCount: rows.filter((row) => row.totalSales > 0).length,
    selectorCount,
    top5: ranked.slice(0, 5).map((row, index) => {
      const rank = index + 1;
      const previousRankValue = previousRankingAvailable
        ? previousRankedSales.get(row.selectorId) ?? null
        : rank;
      return {
        ...row,
        movement: rankMovement(rank, previousRankValue),
        rank,
      };
    }),
    totalSales,
    types: typePerformances(rows),
    watchlists: {
      discovery: [
        watchlist("salesRise", "직전 동일 기간 대비 매출 100% 이상 증가", rows.filter((row) => (
          matchesWatchlist(row, "salesRise")
        )).length),
        watchlist("newTop10", "신규 TOP 10 진입", newTop10.length),
      ],
      manage: [
        watchlist("noClicks", "기간 내 클릭 없음", rows.filter((row) => (
          matchesWatchlist(row, "noClicks")
        )).length),
        watchlist("noUploads", "기간 내 업로드 없음", rows.filter((row) => (
          matchesWatchlist(row, "noUploads")
        )).length),
        watchlist("clicksNoPurchase", "클릭 있으나 구매 없음", rows.filter((row) => (
          matchesWatchlist(row, "clicksNoPurchase")
        )).length),
        watchlist("salesDrop", "직전 동일 기간 대비 매출 50% 이상 감소", rows.filter((row) => (
          matchesWatchlist(row, "salesDrop")
        )).length),
      ],
    },
    zeroSalesCount: rows.filter((row) => row.totalSales === 0).length,
  };
}

export function matchesNewTop10(
  rows: readonly SelectorDashboardRow[],
  row: SelectorDashboardRow,
) {
  const currentRank = rankMap([...rows].sort(compareSalesRank));
  const previousRank = rankMap([...rows].sort((left, right) => (
    right.previousPeriodSales - left.previousPeriodSales
    || left.selectorCode.localeCompare(right.selectorCode)
  )));
  return (currentRank.get(row.selectorId) ?? 99) <= 10
    && (previousRank.get(row.selectorId) ?? 0) > 10;
}

export function filterWatchlistRows(
  rows: readonly SelectorDashboardRow[],
  key: WatchlistKey | null,
) {
  if (key == null) return rows;
  if (key === "newTop10") return rows.filter((row) => matchesNewTop10(rows, row));
  return rows.filter((row) => matchesWatchlist(row, key));
}

export function buildSelectorTrend(
  rows: readonly SelectorDashboardRow[],
  periodStart: string,
  periodEnd: string,
  now = new Date(),
): { bucket: "day" | "month"; points: readonly SelectorDashboardTrendPoint[] } {
  const end = periodEnd || formatIsoDate(now);
  const start = periodStart || formatIsoDate(addMonths(now, -5));
  const dayCount = inclusiveDayCount(start, end);
  const bucket: "day" | "month" = dayCount <= 31 ? "day" : "month";
  const dates = bucket === "day" ? eachDay(start, end) : eachMonth(start, end);
  const sales = distribute(sumBy(rows, (row) => row.totalSales), dates.length);
  const orders = distribute(sumBy(rows, (row) => row.confirmedOrderCount), dates.length);

  return {
    bucket,
    points: dates.map((date, index) => ({
      confirmedOrderCount: orders[index] ?? 0,
      date,
      label: trendLabel(date, bucket),
      totalSales: sales[index] ?? 0,
    })),
  };
}

function previousRatio(row: SelectorDashboardRow) {
  if (row.totalSales === 0) return 1;
  return row.previousPeriodSales / row.totalSales;
}

function compareSalesRank(left: SelectorDashboardRow, right: SelectorDashboardRow) {
  return right.totalSales - left.totalSales
    || right.confirmedOrderCount - left.confirmedOrderCount
    || left.selectorCode.localeCompare(right.selectorCode);
}

function rankMap(ranked: readonly SelectorDashboardRow[]) {
  const ranks = new Map<number, number>();
  ranked.forEach((row, index) => {
    ranks.set(row.selectorId, index + 1);
  });
  return ranks;
}

function typePerformances(rows: readonly SelectorDashboardRow[]) {
  const grouped = new Map<string, SelectorDashboardRow[]>();
  rows.forEach((row) => {
    const current = grouped.get(row.category) ?? [];
    current.push(row);
    grouped.set(row.category, current);
  });

  return [...grouped.entries()]
    .map(([category, members]) => {
      const sales = members.map((row) => row.totalSales);
      const clickCount = sumBy(members, (row) => row.clickCount);
      const confirmedOrderCount = sumBy(members, (row) => row.confirmedOrderCount);
      return {
        averageSales: Math.round(sumBy(members, (row) => row.totalSales) / members.length),
        boxplot: boxplotFromValues(sales),
        category,
        clickCount,
        confirmedOrderCount,
        conversionRate: formatRate(confirmedOrderCount, clickCount),
        medianSales: medianSales(sales),
        reference: members.length < SELECTOR_TYPE_MIN_COUNT,
        selectorCount: members.length,
      };
    })
    .sort((left, right) => (
      Number(left.reference) - Number(right.reference)
      || right.averageSales - left.averageSales
      || left.category.localeCompare(right.category)
    ));
}

function inBucket(sales: number, index: number) {
  const min = index === 0 ? Number.NEGATIVE_INFINITY : SALES_BUCKETS[index - 1].max;
  const max = SALES_BUCKETS[index].max;
  if (index === 0) return sales <= 0;
  return sales > min && sales <= max;
}

function watchlist(key: WatchlistKey, label: string, count: number): WatchlistGroup {
  return { count, key, label };
}

function watchlistsFromApi(watchlistCounts: {
  clicksWithoutPurchase: number;
  newTop10: number;
  noClicks: number;
  noUploads: number;
  salesDrop: number;
  salesSurge: number;
}): SelectorDashboardSummary["watchlists"] {
  return {
    discovery: [
      watchlist(
        "salesRise",
        "직전 동일 기간 대비 매출 100% 이상 증가",
        asNumber(watchlistCounts.salesSurge),
      ),
      watchlist("newTop10", "신규 TOP 10 진입", asNumber(watchlistCounts.newTop10)),
    ],
    manage: [
      watchlist("noClicks", "기간 내 클릭 없음", asNumber(watchlistCounts.noClicks)),
      watchlist("noUploads", "기간 내 업로드 없음", asNumber(watchlistCounts.noUploads)),
      watchlist(
        "clicksNoPurchase",
        "클릭 있으나 구매 없음",
        asNumber(watchlistCounts.clicksWithoutPurchase),
      ),
      watchlist(
        "salesDrop",
        "직전 동일 기간 대비 매출 50% 이상 감소",
        asNumber(watchlistCounts.salesDrop),
      ),
    ],
  };
}

function labeledCategory(category: string | null | undefined) {
  if (!category?.trim()) return "기타";
  return categoryLabel(category) || "기타";
}

function adaptTypeBoxplot(
  row: SelectorPerformanceSummary["categories"][number],
): BoxplotStats | null {
  const value = row.boxplot?.value;
  if (value && value.length >= 5) {
    return {
      outliers: (row.boxplot?.outliers ?? []).map(asNumber),
      value: [
        asNumber(value[0]),
        asNumber(value[1]),
        asNumber(value[2]),
        asNumber(value[3]),
        asNumber(value[4]),
      ],
    };
  }
  return boxplotFromAverageMedian(asNumber(row.averageSales), asNumber(row.medianSales));
}

function boxplotFromAverageMedian(average: number, median: number): BoxplotStats {
  const spread = Math.max(Math.abs(average - median), Math.round(median * 0.2), 1);
  const q1 = Math.max(0, median - spread);
  const q3 = median + spread;
  const min = Math.max(0, q1 - spread);
  const max = q3 + spread;
  return {
    outliers: [],
    value: [
      Math.min(min, q1, median),
      Math.min(q1, median),
      median,
      Math.max(q3, median),
      Math.max(max, q3, median),
    ],
  };
}

function quantile(sorted: readonly number[], percentile: number) {
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * percentile;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  if (low === high) return sorted[low] ?? 0;
  const start = sorted[low] ?? 0;
  const end = sorted[high] ?? start;
  return start + (end - start) * (position - low);
}

function adaptRankItem(
  row: SelectorPerformanceSummary["top5"][number],
): SelectorTopRank[] {
  if (row.selectorId == null) return [];
  const totalSales = asNumber(row.totalSales);
  const category = labeledCategory(row.category);
  return [{
    accruedCommission: 0,
    category,
    clickCount: 0,
    confirmedOrderCount: 0,
    contentCount: 0,
    generationName: row.generationName,
    movement: rankMovement(row.rank, row.previousRank),
    nickname: row.nickname,
    previousPeriodSales: 0,
    profileImageUrl: row.profileImageUrl?.trim() || "",
    rank: row.rank,
    selectorCode: "",
    selectorId: row.selectorId,
    source: {
      confirmedOrderCount: 0,
      excellentActivityType: null,
      excellentGenerationName: null,
      excellentGenerationSales: null,
      generationName: row.generationName,
      isExcellent: false,
      nickname: row.nickname,
      roleId: "ACTIVE",
      selectorCode: "",
      selectorId: row.selectorId,
      totalSales,
    },
    totalSales,
  }];
}

function asNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function sumBy<T>(items: readonly T[], value: (item: T) => number) {
  return items.reduce((sum, item) => sum + value(item), 0);
}

function distribute(total: number, count: number) {
  if (count <= 0) return [];
  if (total === 0) return Array.from({ length: count }, () => 0);
  const weights = Array.from({ length: count }, (_, index) => index + 1);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const values = weights.map((weight) => Math.floor((total * weight) / weightSum));
  values[values.length - 1] += total - values.reduce((sum, value) => sum + value, 0);
  return values;
}

function inclusiveDayCount(start: string, end: string) {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
}

function eachDay(start: string, end: string) {
  const dates: string[] = [];
  const cursor = parseIsoDate(start);
  const last = parseIsoDate(end);
  while (cursor.getTime() <= last.getTime()) {
    dates.push(formatIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function eachMonth(start: string, end: string) {
  const dates: string[] = [];
  const cursor = parseIsoDate(start);
  cursor.setDate(1);
  const last = parseIsoDate(end);
  last.setDate(1);
  while (cursor.getTime() <= last.getTime()) {
    dates.push(formatIsoDate(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return dates;
}

function trendLabel(date: string, bucket: "day" | "month") {
  const [, month, day] = date.split("-");
  if (bucket === "month") return `${Number(month)}월`;
  return `${Number(month)}.${Number(day)}`;
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function shiftIsoDate(value: string, days: number) {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatIsoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
