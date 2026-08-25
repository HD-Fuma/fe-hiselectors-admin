import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { HsECharts, type EChartsOption } from "../../components/charts/HsECharts";
import { PageHeader } from "../../components/shell/PageHeader";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { TextInput } from "../../components/ui/Controls";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill } from "../../components/ui/StatusPill";
import { formatCompactCount, formatNumber, formatWon } from "../../lib/formatters";
import "../../styles/settlements.css";
import {
  apiStatusesForFilter,
  getSettlementEstimates,
  getSettlementEstimateSummary,
  getSettlementSelectorDetail,
  SETTLEMENT_STATUS_FILTERS,
  settlementStatusTone,
  SettlementTable,
  type SettlementEstimate,
  type SettlementEstimateSummary,
  type SettlementMonthlySummary,
  type SettlementSelectorDetail,
  type SettlementStatusFilter,
  type SettlementTableRow,
  type SpringPage,
} from "../../entities/settlement";
import {
  getSelector,
  SelectorDetailPanel,
  type SelectorDetail,
} from "../../entities/selectors";

const SETTLEMENT_PAGE_SIZE = 20;

function currentSettlementMonth(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function emptySettlementPage(): SpringPage<SettlementEstimate> {
  return {
    content: [],
    number: 0,
    size: SETTLEMENT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  };
}

function activityMonthLabel(activityMonth: string) {
  const [year, monthNumber] = activityMonth.split("-");
  return `${year}년 ${Number(monthNumber)}월`;
}

function formatSettlementRate(rate: number) {
  return `${rate.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}%`;
}

function formatSignedWon(amount: number) {
  return `${amount > 0 ? "+" : ""}${formatWon(amount)}`;
}

function monthChartLabel(activityMonth: string) {
  const [, monthNumber] = activityMonth.split("-");
  return `${Number(monthNumber)}월`;
}

interface TrendTooltipPoint {
  axisValueLabel?: unknown;
  seriesName?: unknown;
  value?: unknown;
}

function trendTooltip(params: unknown) {
  const points = (Array.isArray(params) ? params : [params]).filter(
    (point): point is TrendTooltipPoint => typeof point === "object" && point !== null,
  );
  const title = typeof points[0]?.axisValueLabel === "string"
    ? points[0].axisValueLabel
    : "";
  const values = points.map((point) => {
    const seriesName = typeof point.seriesName === "string" ? point.seriesName : "";
    const value = Number(point.value ?? 0);
    return `${seriesName}: ${seriesName === "확정 매출" ? formatWon(value) : formatSettlementRate(value)}`;
  });
  return [title, ...values].filter(Boolean).join("<br/>");
}

interface SettlementDetailState {
  selector: SelectorDetail | null;
  selectorError: string;
  settlementDetail: SettlementSelectorDetail | null;
  settlementDetailError: boolean;
  loading: boolean;
}

function SettlementFilters({
  onMonthChange,
  onReset,
  onSearch,
  selectedMonth,
}: {
  onMonthChange: (month: string) => void;
  onReset: () => void;
  onSearch: () => void;
  selectedMonth: string;
}) {
  return (
    <div className="fuma-operations-search fuma-settlement-search fuma-settlement-search--month-only">
      <SearchPanel actions={<SearchActions onReset={onReset} onSearch={onSearch} />}>
        <FilterField htmlFor="settlement-month" label="활동월">
          <TextInput
            aria-label="활동월"
            id="settlement-month"
            onChange={(event) => onMonthChange(event.target.value)}
            type="month"
            value={selectedMonth}
          />
        </FilterField>
      </SearchPanel>
    </div>
  );
}

function SettlementTrendChart({
  monthlyTrend,
}: {
  monthlyTrend: readonly SettlementMonthlySummary[];
}) {
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    grid: {
      bottom: 34,
      left: 58,
      right: 54,
      top: 40,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: trendTooltip,
    },
    xAxis: {
      type: "category",
      data: monthlyTrend.map((month) => monthChartLabel(month.activityMonth)),
      axisLine: { lineStyle: { color: "#dfe7e3" } },
      axisTick: { show: false },
      axisLabel: {
        color: "#596166",
        fontSize: 10,
        fontWeight: 700,
        margin: 12,
      },
    },
    yAxis: [
      {
        type: "value",
        min: 0,
        name: "확정 매출 (원)",
        nameTextStyle: { color: "#596166", fontSize: 9, fontWeight: 700 },
        axisLabel: {
          color: "#718078",
          fontSize: 9,
          formatter: (value: number) => `${formatCompactCount(value)}원`,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "#edf1ef" } },
      },
      {
        type: "value",
        min: 0,
        name: "수수료율 (%)",
        nameTextStyle: { color: "#1e9d8b", fontSize: 9, fontWeight: 700 },
        axisLabel: {
          color: "#1e9d8b",
          fontSize: 9,
          formatter: (value: number) => `${value}%`,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        type: "bar",
        name: "확정 매출",
        data: monthlyTrend.map((month) => month.confirmedSalesAmount),
        barMaxWidth: 34,
        itemStyle: {
          color: "#536963",
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        type: "line",
        name: "수수료율",
        data: monthlyTrend.map((month) => month.commissionToSalesRate),
        yAxisIndex: 1,
        smooth: 0.3,
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { color: "#1e9d8b", width: 3 },
        itemStyle: {
          color: "#ffffff",
          borderColor: "#1e9d8b",
          borderWidth: 2,
        },
      },
    ],
  }), [monthlyTrend]);
  const accessibleSummary = monthlyTrend.map((month) => (
    `${month.activityMonth} 확정 매출 ${formatWon(month.confirmedSalesAmount)}, 수수료율 ${formatSettlementRate(month.commissionToSalesRate)}`
  )).join(". ");

  return (
    <figure aria-labelledby="settlement-trend-title" className="fuma-settlement-dashboard__panel fuma-settlement-trend">
      <figcaption>
        <div>
          <span>{monthlyTrend.length > 0 ? `${monthlyTrend.length}개월 흐름` : "월별 흐름"}</span>
          <h3 id="settlement-trend-title">확정 매출과 수수료율</h3>
        </div>
        <ul aria-label="정산 추이 차트 범례" className="fuma-settlement-trend__legend">
          <li><i className="is-sales" />확정 매출</li>
          <li><i className="is-rate" />수수료율</li>
        </ul>
      </figcaption>
      {monthlyTrend.length > 0 ? (
        <div
          aria-label={`최근 ${monthlyTrend.length}개월 확정 매출 및 수수료율 추이. ${accessibleSummary}`}
          className="fuma-settlement-trend__plot"
          role="img"
        >
          <HsECharts height={204} option={option} style={{ height: "204px", width: "100%" }} />
        </div>
      ) : (
        <p className="fuma-settlement-dashboard__empty">표시할 월별 추이 데이터가 없습니다.</p>
      )}
    </figure>
  );
}

function SettlementStatusOverview({ summary }: { summary: SettlementEstimateSummary }) {
  const groups = SETTLEMENT_STATUS_FILTERS.map((filter) => {
    const statuses = apiStatusesForFilter(filter.value) ?? [];
    const entries = summary.statusDistribution.filter((item) => statuses.includes(item.status));
    return {
      ...filter,
      settlementAmount: entries.reduce((total, item) => total + item.settlementAmount, 0),
      settlementCount: entries.reduce((total, item) => total + item.settlementCount, 0),
      tone: settlementStatusTone(statuses[0]),
    };
  });
  const hold = groups.find((group) => group.value === "SETTLEMENT_HOLD");

  return (
    <article aria-labelledby="settlement-status-title" className="fuma-settlement-dashboard__panel fuma-settlement-status-overview">
      <header>
        <span>지급 흐름</span>
        <h3 id="settlement-status-title">지급 상태 현황</h3>
      </header>
      {summary.statusDistribution.length > 0 ? (
        <>
          <ul className="fuma-settlement-status-overview__list">
            {groups.map((group) => (
              <li key={group.value}>
                <StatusPill tone={group.tone}>{group.label}</StatusPill>
                <strong>{formatNumber(group.settlementCount)}건</strong>
                <span>{formatWon(group.settlementAmount)}</span>
              </li>
            ))}
          </ul>
          {hold && hold.settlementCount > 0 ? (
            <div aria-label="정산 보류 확인 필요" className="fuma-settlement-status-overview__attention">
              <TriangleAlert aria-hidden="true" size={16} />
              <div>
                <strong>정산 보류 {formatNumber(hold.settlementCount)}건 · {formatWon(hold.settlementAmount)}</strong>
                <span>계좌 정보와 블랙리스트 여부를 확인해 주세요.</span>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="fuma-settlement-dashboard__empty">표시할 지급 상태 데이터가 없습니다.</p>
      )}
    </article>
  );
}

function SettlementSummaryDashboard({
  hasError,
  isLoading,
  summary,
}: {
  hasError: boolean;
  isLoading: boolean;
  summary: SettlementEstimateSummary | null;
}) {
  const currentTrendIndex = summary?.monthlyTrend.findIndex(
    (month) => month.activityMonth === summary.activityMonth,
  ) ?? -1;
  const previousMonth = summary && currentTrendIndex > 0
    ? summary.monthlyTrend[currentTrendIndex - 1]
    : null;
  const settlementDifference = summary && previousMonth
    ? summary.settlementAmount - previousMonth.settlementAmount
    : null;
  const settlementChangeRate = settlementDifference !== null && previousMonth
    && previousMonth.settlementAmount !== 0
    ? settlementDifference / previousMonth.settlementAmount * 100
    : null;

  return (
    <section aria-label="정산 요약" className="fuma-settlement-dashboard" role="region">
      {isLoading ? (
        <p aria-live="polite" className="fuma-settlement-summary__state" role="status">
          정산 요약을 불러오는 중입니다.
        </p>
      ) : hasError ? (
        <p className="fuma-settlement-summary__state fuma-settlement-summary__state--error" role="alert">
          정산 요약 조회에 실패했습니다.
        </p>
      ) : summary ? (
        <>
          <header className="fuma-settlement-dashboard__header">
            <div>
              <span>MONTHLY SETTLEMENT</span>
              <h2>{activityMonthLabel(summary.activityMonth)} 정산 요약</h2>
            </div>
            <small>지급 상태 필터와 무관한 월 전체 기준</small>
          </header>
          <div className="fuma-settlement-dashboard__top">
            <article aria-label="예상 정산액" className="fuma-settlement-dashboard__spotlight">
              <span className="fuma-settlement-dashboard__spotlight-icon">
                <WalletCards aria-hidden="true" size={20} />
              </span>
              <div>
                <span>예상 정산액</span>
                <strong title={formatWon(summary.settlementAmount)}>
                  {formatWon(summary.settlementAmount)}
                </strong>
                {settlementDifference !== null ? (
                  <p data-direction={settlementDifference > 0 ? "up" : settlementDifference < 0 ? "down" : "flat"}>
                    {settlementDifference > 0 ? <ArrowUpRight aria-hidden="true" size={14} /> : null}
                    {settlementDifference < 0 ? <ArrowDownRight aria-hidden="true" size={14} /> : null}
                    {settlementDifference === 0 ? <Minus aria-hidden="true" size={14} /> : null}
                    <span>
                      전월 대비 {settlementChangeRate === null
                        ? formatSignedWon(settlementDifference)
                        : `${settlementChangeRate > 0 ? "+" : ""}${formatSettlementRate(settlementChangeRate)}`}
                    </span>
                    <small>전월 {formatWon(previousMonth?.settlementAmount ?? 0)}</small>
                  </p>
                ) : <p><span>전월 비교 데이터 없음</span></p>}
              </div>
            </article>
            <dl className="fuma-settlement-dashboard__kpis">
              <div>
                <dt>확정 매출</dt>
                <dd title={formatWon(summary.confirmedSalesAmount)}>
                  {formatWon(summary.confirmedSalesAmount)}
                </dd>
              </div>
              <div>
                <dt>매출 대비 수수료율</dt>
                <dd title={formatSettlementRate(summary.commissionToSalesRate)}>
                  {formatSettlementRate(summary.commissionToSalesRate)}
                </dd>
                <small>수수료 ÷ 매출 × 100</small>
              </div>
              <div>
                <dt>구매 확정</dt>
                <dd title={`${formatNumber(summary.confirmedPurchaseCount)}건`}>
                  {formatNumber(summary.confirmedPurchaseCount)}건
                </dd>
              </div>
              <div>
                <dt>정산 대상</dt>
                <dd title={`${formatNumber(summary.settlementCount)}건`}>
                  {formatNumber(summary.settlementCount)}건
                </dd>
              </div>
            </dl>
          </div>
          <div className="fuma-settlement-dashboard__analytics">
            <SettlementTrendChart monthlyTrend={summary.monthlyTrend} />
            <SettlementStatusOverview summary={summary} />
          </div>
        </>
      ) : null}
    </section>
  );
}

export function SettlementManagementPage() {
  const [defaultMonth] = useState(currentSettlementMonth);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [appliedMonth, setAppliedMonth] = useState(defaultMonth);
  const [selectedStatus, setSelectedStatus] = useState<SettlementStatusFilter | null>(null);
  const [page, setPage] = useState(1);
  const [tableRequestVersion, setTableRequestVersion] = useState(0);
  const [summaryRequestVersion, setSummaryRequestVersion] = useState(0);
  const [settlementPage, setSettlementPage] = useState(emptySettlementPage);
  const [settlementSummary, setSettlementSummary] = useState<SettlementEstimateSummary | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [hasTableError, setHasTableError] = useState(false);
  const [hasSummaryError, setHasSummaryError] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementTableRow | null>(null);
  const [settlementDetailState, setSettlementDetailState] = useState<SettlementDetailState | null>(null);
  const latestTableRequestId = useRef(0);
  const latestSummaryRequestId = useRef(0);
  const detailAbortController = useRef<AbortController | null>(null);
  const detailRequestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = latestTableRequestId.current + 1;
    latestTableRequestId.current = requestId;

    getSettlementEstimates({
      activityMonth: appliedMonth,
      page: page - 1,
      size: SETTLEMENT_PAGE_SIZE,
      statuses: apiStatusesForFilter(selectedStatus),
    }, controller.signal)
      .then((pageResult) => {
        if (latestTableRequestId.current !== requestId) return;
        setSettlementPage(pageResult);
        setHasTableError(false);
      })
      .catch((error: unknown) => {
        if (
          latestTableRequestId.current !== requestId
          || (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }

        setSettlementPage(emptySettlementPage());
        setHasTableError(true);
      })
      .finally(() => {
        if (latestTableRequestId.current === requestId) setIsTableLoading(false);
      });

    return () => controller.abort();
  }, [appliedMonth, page, selectedStatus, tableRequestVersion]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = latestSummaryRequestId.current + 1;
    latestSummaryRequestId.current = requestId;

    getSettlementEstimateSummary({ activityMonth: appliedMonth }, controller.signal)
      .then((summaryResult) => {
        if (latestSummaryRequestId.current !== requestId) return;
        setSettlementSummary(summaryResult);
        setHasSummaryError(false);
      })
      .catch((error: unknown) => {
        if (
          latestSummaryRequestId.current !== requestId
          || (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }

        setSettlementSummary(null);
        setHasSummaryError(true);
      })
      .finally(() => {
        if (latestSummaryRequestId.current === requestId) setIsSummaryLoading(false);
      });

    return () => controller.abort();
  }, [appliedMonth, summaryRequestVersion]);

  useEffect(() => () => detailAbortController.current?.abort(), []);

  const closeSettlementDetail = () => {
    detailAbortController.current?.abort();
    detailAbortController.current = null;
    detailRequestId.current += 1;
    setSelectedSettlement(null);
    setSettlementDetailState(null);
  };

  const openSettlementDetail = (settlement: SettlementTableRow) => {
    detailAbortController.current?.abort();
    const controller = new AbortController();
    const requestId = detailRequestId.current + 1;
    detailRequestId.current = requestId;
    detailAbortController.current = controller;
    setSelectedSettlement(settlement);
    setSettlementDetailState({
      loading: true,
      selector: null,
      selectorError: "",
      settlementDetail: null,
      settlementDetailError: false,
    });

    Promise.allSettled([
      getSelector(settlement.selectorsId, controller.signal),
      getSettlementSelectorDetail(settlement.selectorsId, controller.signal),
    ]).then(([selectorResult, settlementResult]) => {
      if (controller.signal.aborted || detailRequestId.current !== requestId) return;
      if (selectorResult.status === "rejected") {
        const reason = selectorResult.reason as unknown;
        setSettlementDetailState({
          loading: false,
          selector: null,
          selectorError: reason instanceof Error ? reason.message : "셀렉터스 상세 조회에 실패했습니다.",
          settlementDetail: null,
          settlementDetailError: settlementResult.status === "rejected",
        });
        return;
      }

      setSettlementDetailState({
        loading: false,
        selector: selectorResult.value,
        selectorError: "",
        settlementDetail: settlementResult.status === "fulfilled" ? settlementResult.value : null,
        settlementDetailError: settlementResult.status === "rejected",
      });
    });
  };

  const prepareTableRequest = () => {
    latestTableRequestId.current += 1;
    closeSettlementDetail();
    setSettlementPage(emptySettlementPage());
    setHasTableError(false);
    setIsTableLoading(true);
    setTableRequestVersion((version) => version + 1);
  };

  const prepareSummaryRequest = () => {
    latestSummaryRequestId.current += 1;
    setSettlementSummary(null);
    setHasSummaryError(false);
    setIsSummaryLoading(true);
    setSummaryRequestVersion((version) => version + 1);
  };

  const applyFilters = () => {
    const nextMonth = selectedMonth || defaultMonth;
    setSelectedMonth(nextMonth);
    setAppliedMonth(nextMonth);
    setPage(1);
    prepareTableRequest();
    prepareSummaryRequest();
  };

  const resetFilters = () => {
    setSelectedMonth(defaultMonth);
    setAppliedMonth(defaultMonth);
    setSelectedStatus(null);
    setPage(1);
    prepareTableRequest();
    prepareSummaryRequest();
  };

  const changeStatus = (status: SettlementStatusFilter | null) => {
    setSelectedStatus(status);
    setPage(1);
    prepareTableRequest();
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    prepareTableRequest();
  };

  const rows = settlementPage.content.map((settlement, rowIndex) => ({
    ...settlement,
    ordinal: settlementPage.number * settlementPage.size + rowIndex + 1,
  }));
  const emptyMessage = isTableLoading ? (
    <span aria-live="polite" role="status">정산 내역을 불러오는 중입니다.</span>
  ) : hasTableError ? (
    <span role="alert">정산 내역 조회에 실패했습니다.</span>
  ) : "조회된 정산 내역이 없습니다.";

  return (
    <section className="fuma-page">
      <PageHeader title="정산 지급 관리" />
      <div className="fuma-page__body">
        <SettlementFilters
          onMonthChange={setSelectedMonth}
          onReset={resetFilters}
          onSearch={applyFilters}
          selectedMonth={selectedMonth}
        />
        <SettlementSummaryDashboard
          hasError={hasSummaryError}
          isLoading={isSummaryLoading}
          summary={settlementSummary}
        />
        <ChoiceTabs
          ariaLabel="지급 상태"
          className="fuma-settlement-status-filter"
          emptyOption={{
            label: "전체",
            onSelect: () => changeStatus(null),
          }}
          onChange={(status) => changeStatus(status)}
          options={SETTLEMENT_STATUS_FILTERS}
          value={selectedStatus}
        />
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          meta={
            <>
              <span>{activityMonthLabel(appliedMonth)}</span>
              <span>총 {settlementPage.totalElements.toLocaleString("ko-KR")}건</span>
            </>
          }
          title="정산 지급 목록"
        />
        <SettlementTable
          emptyMessage={emptyMessage}
          onRowClick={openSettlementDetail}
          rows={rows}
          selectedRowKeys={selectedSettlement ? [selectedSettlement.settlementId] : []}
        />
        {!isTableLoading && !hasTableError && settlementPage.totalPages > 0 ? (
          <Pagination
            onPageChange={changePage}
            page={settlementPage.number + 1}
            pageSize={settlementPage.size}
            totalPages={settlementPage.totalPages}
          />
        ) : null}
      </div>
      {selectedSettlement ? (
        <SelectorDetailPanel
          onClose={closeSettlementDetail}
          selectorDetail={settlementDetailState?.selector}
          selectorDetailError={settlementDetailState?.selectorError}
          selectorDetailLoading={settlementDetailState?.loading ?? false}
          settlementDetail={settlementDetailState?.settlementDetail ?? null}
          settlementDetailError={settlementDetailState?.settlementDetailError ?? false}
          settlementDetailLoading={settlementDetailState?.loading ?? false}
          settlementOnly
        />
      ) : null}
    </section>
  );
}
