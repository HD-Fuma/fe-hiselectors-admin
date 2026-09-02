import { useState } from "react";
import { BoxplotChart } from "../../components/charts/BoxplotChart";
import { CategoryBarChart } from "../../components/charts/CategoryBarChart";
import { COHORT_SERIES_COLORS } from "../../components/charts/chartColors";
import { PeriodComboChart } from "../../components/charts/PeriodComboChart";
import { SegmentedControl } from "../../components/ui/Controls";
import { CreatorProfilePhoto } from "../../components/ui/CreatorProfilePhoto";
import { formatNumber, formatWon } from "../../lib/formatters";
import {
  changeRate,
  compactDashboardNumber,
  compactDashboardWon,
  formatRankMovement,
  type RankMovement,
  type SelectorDashboardRow,
  type SelectorDashboardSummary,
  type SelectorDashboardTrendPoint,
  type SelectorTopRank,
  type WatchlistGroup,
  type WatchlistKey,
} from "./selectorDashboard";

type TrendMode = "all" | "totalSales" | "confirmedOrderCount";

const TREND_OPTIONS: readonly { label: string; value: TrendMode }[] = [
  { label: "종합", value: "all" },
  { label: "매출", value: "totalSales" },
  { label: "주문", value: "confirmedOrderCount" },
];

const TREND_SERIES = [
  {
    color: COHORT_SERIES_COLORS.confirmedSales,
    formatValue: compactDashboardNumber,
    id: "totalSales" as const,
    label: "매출",
    styleClass: "is-contentCount",
    type: "line" as const,
  },
  {
    color: COHORT_SERIES_COLORS.confirmedOrderCount,
    formatValue: formatNumber,
    id: "confirmedOrderCount" as const,
    label: "확정 주문",
    styleClass: "is-views is-bar",
    type: "bar" as const,
  },
];

const BUCKET_COLORS = [
  "var(--fuma-content-format-5)",
  "var(--fuma-content-format-3)",
  "var(--fuma-content-format-2)",
  "var(--fuma-content-format-1)",
  "var(--fuma-content-format-4)",
] as const;

interface SelectorPerformanceDashboardProps {
  loading: boolean;
  onSelectSelector: (row: SelectorDashboardRow) => void;
  onWatchlistChange: (key: WatchlistKey | null) => void;
  summary: SelectorDashboardSummary;
  trend: readonly SelectorDashboardTrendPoint[];
  watchlist: WatchlistKey | null;
}

export function SelectorPerformanceDashboard({
  loading,
  onSelectSelector,
  onWatchlistChange,
  summary,
  trend,
  watchlist,
}: SelectorPerformanceDashboardProps) {
  const [trendMode, setTrendMode] = useState<TrendMode>("all");
  const visibleSeries = trendMode === "all"
    ? TREND_SERIES
    : TREND_SERIES.filter((series) => series.id === trendMode);

  return (
    <section aria-label="셀렉터스 성과 요약" className="fuma-selector-dashboard">
      <article className="fuma-content-performance-panel fuma-selector-dashboard__kpis">
        <header>
          <span>OVERVIEW</span>
          <h2>기간 성과</h2>
        </header>
        <dl aria-busy={loading}>
          <Kpi
            change={null}
            hint={`${formatNumber(summary.producingCount)}명 매출 발생`}
            label="집계 대상 셀렉터스"
            value={loading ? "-" : `${formatNumber(summary.selectorCount)}명`}
          />
          <Kpi
            change={changeRate(summary.totalSales, summary.previousTotalSales)}
            hint={null}
            label="총 매출"
            value={loading ? "-" : compactDashboardWon(summary.totalSales)}
          />
          <Kpi
            change={changeRate(summary.confirmedOrderCount, summary.previousConfirmedOrderCount)}
            hint={null}
            label="확정 주문"
            value={loading ? "-" : `${formatNumber(summary.confirmedOrderCount)}건`}
          />
          <Kpi
            change={null}
            hint={`클릭 ${formatNumber(summary.clickCount)}회`}
            label="구매전환율"
            value={loading ? "-" : summary.conversionRate}
          />
          <Kpi
            change={changeRate(summary.earnedCommission, summary.previousEarnedCommission)}
            hint="지급 완료가 아닌 발생액"
            label="발생 수수료"
            value={loading ? "-" : compactDashboardWon(summary.earnedCommission)}
          />
          <Kpi
            change={changeRate(summary.averageSales, summary.previousAverageSales)}
            hint={`중앙값 ${compactDashboardWon(summary.medianSales)}`}
            label="1인 평균 매출"
            value={loading ? "-" : compactDashboardWon(summary.averageSales)}
          />
        </dl>
      </article>

      <div className="fuma-selector-dashboard__split">
        <article
          aria-label="기간별 셀렉터스 성과"
          className="fuma-content-performance-panel fuma-content-cohort-chart fuma-selector-dashboard__trend"
        >
          <header>
            <div>
              <span>TREND</span>
              <h2>성과 추이</h2>
            </div>
          </header>
          <div className="fuma-content-period-chart__toolbar">
            <SegmentedControl
              ariaLabel="기간별 셀렉터스 성과 지표"
              onChange={setTrendMode}
              options={TREND_OPTIONS}
              value={trendMode}
            />
            <ul aria-label="셀렉터스 성과 차트 범례" className="fuma-content-cohort-chart__legend">
              {visibleSeries.map((series) => (
                <li className={series.styleClass} key={series.id}><i />{series.label}</li>
              ))}
            </ul>
          </div>
          {loading ? (
            <p>성과 추이를 불러오는 중입니다.</p>
          ) : trend.length > 0 ? (
            <PeriodComboChart
              ariaLabel={trendMode === "all"
                ? "기간별 전체 셀렉터스 성과 추이"
                : `기간별 ${visibleSeries[0].label} 추이`}
              categories={trend.map((point) => point.date)}
              categoryLabels={trend.map((point) => point.label)}
              series={visibleSeries.map((series) => ({
                color: series.color,
                data: trend.map((point) => point[series.id]),
                formatValue: series.formatValue,
                id: series.id,
                name: series.label,
                type: series.type,
              }))}
            />
          ) : <p>조회 기간에 표시할 성과 추이가 없습니다.</p>}
        </article>

        <article aria-label="성과 TOP 5" className="fuma-content-performance-panel">
          <header>
            <span>RANKING</span>
            <h2>성과 TOP 5</h2>
          </header>
          <p className="fuma-selector-dashboard__note">
            이번 기간 매출 순위입니다. 등락은 동일한 길이의 직전 기간과 비교합니다.
          </p>
          {summary.top5.length === 0 ? (
            <p className="fuma-selector-dashboard__note">표시할 셀렉터스가 없습니다.</p>
          ) : (
            <div className="fuma-selector-dashboard__ranks">
              <div className="fuma-selector-dashboard__ranks-head">
                <span>순위</span>
                <span>셀렉터스</span>
                <span>매출</span>
                <span>등락</span>
              </div>
              <ol aria-label="성과 TOP 5 순위">
                {summary.top5.map((row) => (
                  <li key={row.selectorId}>
                    <button
                      aria-label={rankButtonLabel(row)}
                      onClick={() => onSelectSelector(row)}
                      type="button"
                    >
                      <span className="fuma-selector-dashboard__rank-index">{row.rank}</span>
                      <span className="fuma-selector-dashboard__rank-who">
                        <span className="fuma-selector-dashboard__rank-photo">
                          <CreatorProfilePhoto
                            creatorName={row.nickname}
                            src={row.profileImageUrl}
                          />
                        </span>
                        <span className="fuma-selector-dashboard__rank-name">
                          <strong>{row.nickname}</strong>
                          <small>{row.generationName || row.selectorCode}</small>
                        </span>
                      </span>
                      <span
                        className="fuma-selector-dashboard__rank-sales"
                        title={formatWon(row.totalSales)}
                      >
                        {compactDashboardWon(row.totalSales)}
                      </span>
                      <span className={`fuma-selector-dashboard__rank-move is-${row.movement.kind}`}>
                        {formatRankMovement(row.movement)}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </article>
      </div>

      <div className="fuma-selector-dashboard__split">
        <article aria-label="셀렉터스 성과 분포" className="fuma-content-performance-panel">
          <header>
            <span>DISTRIBUTION</span>
            <h2>성과 분포</h2>
          </header>
          <dl className="fuma-selector-dashboard__focus">
            <div>
              <dt>매출 발생</dt>
              <dd>{formatNumber(summary.producingCount)} / {formatNumber(summary.selectorCount)}명</dd>
            </div>
            <div>
              <dt>무매출</dt>
              <dd>{formatNumber(summary.zeroSalesCount)}명</dd>
            </div>
            <div>
              <dt>상위 집중도</dt>
              <dd>{(summary.concentrationShare * 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt>중앙 매출</dt>
              <dd>{compactDashboardWon(summary.medianSales)}</dd>
            </div>
          </dl>
          <p className="fuma-selector-dashboard__note">
            상위 집중도는 집계 대상 기준 상위 10%(50명 미만이면 상위 10명) 매출 비중입니다.
            막대 높이는 해당 매출 구간의 인원입니다.
          </p>
          <CategoryBarChart
            ariaLabel="매출 구간별 인원"
            bars={summary.buckets.map((bucket, index) => ({
              color: BUCKET_COLORS[index] ?? BUCKET_COLORS[0],
              label: bucket.label,
              value: bucket.count,
            }))}
            formatValue={formatNumber}
            name="인원"
          />
        </article>

        <article aria-label="셀렉터스 유형별 성과" className="fuma-content-performance-panel">
          <header>
            <span>TYPE</span>
            <h2>셀렉터스 유형별 성과</h2>
          </header>
          <p className="fuma-selector-dashboard__note">
            셀렉터스 대표 유형 기준입니다. 상자는 사분위, 점은 이상치입니다.
            인원 5명 미만은 참고 값입니다.
          </p>
          {summary.types.length === 0 ? (
            <p className="fuma-selector-dashboard__note">표시할 유형이 없습니다.</p>
          ) : (
            <BoxplotChart
              ariaLabel="유형별 매출 분포"
              categories={summary.types.flatMap((row, index) => (
                row.boxplot
                  ? [{
                      color: BUCKET_COLORS[index] ?? BUCKET_COLORS[0],
                      label: row.category,
                      outliers: row.boxplot.outliers,
                      value: row.boxplot.value,
                    }]
                  : []
              ))}
              formatValue={compactDashboardWon}
              height={220}
            />
          )}
        </article>
      </div>

      <div className="fuma-selector-dashboard__split">
        <WatchlistPanel
          activeKey={watchlist}
          groups={summary.watchlists.manage}
          onChange={onWatchlistChange}
          title="관리 필요"
          tone="manage"
        />
        <WatchlistPanel
          activeKey={watchlist}
          groups={summary.watchlists.discovery}
          onChange={onWatchlistChange}
          title="성과 발견"
          tone="discovery"
        />
      </div>
      <p className="fuma-selector-dashboard__footnote">
        등락은 선택한 기간과 동일한 길이의 직전 기간 매출 순위입니다. 이전 기간 매출이 없으면
        NEW, 변동이 없으면 - 입니다. 클릭·발생 수수료·유형은 집계 API 연동 전 미리보기입니다.
      </p>
    </section>
  );
}

function rankButtonLabel(row: SelectorTopRank) {
  const movement = rankMovementLabel(row.movement);
  return `${row.rank}위 ${row.nickname}, ${formatWon(row.totalSales)}, ${movement}`;
}

function rankMovementLabel(movement: RankMovement) {
  if (movement.kind === "new") return "이전 순위 없음, NEW";
  if (movement.kind === "same") return "순위 변동 없음";
  if (movement.kind === "up") return `${movement.delta}계단 상승`;
  return `${movement.delta}계단 하락`;
}

function Kpi({
  change,
  hint,
  label,
  value,
}: {
  change: string | null;
  hint: string | null;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {value}
        {change ? <small>{change}</small> : null}
      </dd>
      {hint ? <p>{hint}</p> : null}
    </div>
  );
}

function WatchlistPanel({
  activeKey,
  groups,
  onChange,
  title,
  tone,
}: {
  activeKey: WatchlistKey | null;
  groups: readonly WatchlistGroup[];
  onChange: (key: WatchlistKey | null) => void;
  title: string;
  tone: "manage" | "discovery";
}) {
  return (
    <article
      aria-label={title}
      className={`fuma-content-performance-panel fuma-selector-dashboard__watchlist is-${tone}`}
    >
      <header>
        <span>{tone === "manage" ? "ACTION" : "SIGNAL"}</span>
        <h2>{title}</h2>
      </header>
      <ul>
        {groups.map((group) => {
          const pressed = activeKey === group.key;
          return (
            <li key={group.key}>
              <button
                aria-pressed={pressed}
                onClick={() => onChange(pressed ? null : group.key)}
                type="button"
              >
                <span>{group.label}</span>
                <strong>{formatNumber(group.count)}명</strong>
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
