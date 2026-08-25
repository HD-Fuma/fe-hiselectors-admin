import { useEffect, useRef, useState } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { TextInput } from "../../components/ui/Controls";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { formatNumber, formatWon } from "../../lib/formatters";
import "../../styles/settlements.css";
import {
  apiStatusesForFilter,
  getSettlementEstimates,
  getSettlementEstimateSummary,
  getSettlementSelectorDetail,
  SETTLEMENT_STATUS_FILTERS,
  SettlementTable,
  type SettlementEstimate,
  type SettlementEstimateSummary,
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

function SettlementSummaryMetrics({
  hasError,
  isLoading,
  summary,
}: {
  hasError: boolean;
  isLoading: boolean;
  summary: SettlementEstimateSummary | null;
}) {
  return (
    <section aria-label="정산 요약" className="fuma-settlement-summary" role="region">
      {isLoading ? (
        <p aria-live="polite" className="fuma-settlement-summary__state" role="status">
          정산 요약을 불러오는 중입니다.
        </p>
      ) : hasError ? (
        <p className="fuma-settlement-summary__state fuma-settlement-summary__state--error" role="alert">
          정산 요약 조회에 실패했습니다.
        </p>
      ) : summary ? (
        <dl className="fuma-metric-strip">
          <div className="fuma-metric-strip__item">
            <dt>총 매출액</dt>
            <dd>{formatWon(summary.confirmedSalesAmount)}</dd>
          </div>
          <div className="fuma-metric-strip__item">
            <dt>총 수수료</dt>
            <dd>{formatWon(summary.settlementAmount)}</dd>
          </div>
          <div className="fuma-metric-strip__item">
            <dt>
              매출 대비 수수료율
              <small className="fuma-settlement-summary__formula">
                총 수수료 ÷ 총 매출액 × 100
              </small>
            </dt>
            <dd>{formatSettlementRate(summary.commissionToSalesRate)}</dd>
          </div>
          <div className="fuma-metric-strip__item">
            <dt>구매 확정</dt>
            <dd>{formatNumber(summary.confirmedPurchaseCount)}건</dd>
          </div>
        </dl>
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
  const [requestVersion, setRequestVersion] = useState(0);
  const [settlementPage, setSettlementPage] = useState(emptySettlementPage);
  const [settlementSummary, setSettlementSummary] = useState<SettlementEstimateSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementTableRow | null>(null);
  const [settlementDetailState, setSettlementDetailState] = useState<SettlementDetailState | null>(null);
  const latestRequestId = useRef(0);
  const detailAbortController = useRef<AbortController | null>(null);
  const detailRequestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    const filters = {
      activityMonth: appliedMonth,
      statuses: apiStatusesForFilter(selectedStatus),
    };

    Promise.all([
      getSettlementEstimates({
        ...filters,
        page: page - 1,
        size: SETTLEMENT_PAGE_SIZE,
      }, controller.signal),
      getSettlementEstimateSummary(filters, controller.signal),
    ])
      .then(([pageResult, summaryResult]) => {
        if (latestRequestId.current !== requestId) return;
        setSettlementPage(pageResult);
        setSettlementSummary(summaryResult);
        setHasError(false);
      })
      .catch((error: unknown) => {
        if (
          latestRequestId.current !== requestId
          || (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }

        setSettlementPage(emptySettlementPage());
        setSettlementSummary(null);
        setHasError(true);
      })
      .finally(() => {
        if (latestRequestId.current === requestId) setIsLoading(false);
      });

    return () => controller.abort();
  }, [appliedMonth, page, requestVersion, selectedStatus]);

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

  const prepareRequest = () => {
    latestRequestId.current += 1;
    closeSettlementDetail();
    setSettlementPage(emptySettlementPage());
    setSettlementSummary(null);
    setHasError(false);
    setIsLoading(true);
    setRequestVersion((version) => version + 1);
  };

  const applyFilters = () => {
    const nextMonth = selectedMonth || defaultMonth;
    setSelectedMonth(nextMonth);
    setAppliedMonth(nextMonth);
    setPage(1);
    prepareRequest();
  };

  const resetFilters = () => {
    setSelectedMonth(defaultMonth);
    setAppliedMonth(defaultMonth);
    setSelectedStatus(null);
    setPage(1);
    prepareRequest();
  };

  const changeStatus = (status: SettlementStatusFilter | null) => {
    setSelectedStatus(status);
    setPage(1);
    prepareRequest();
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    prepareRequest();
  };

  const rows = settlementPage.content.map((settlement, rowIndex) => ({
    ...settlement,
    ordinal: settlementPage.number * settlementPage.size + rowIndex + 1,
  }));
  const emptyMessage = isLoading ? (
    <span aria-live="polite" role="status">정산 내역을 불러오는 중입니다.</span>
  ) : hasError ? (
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
        <SettlementSummaryMetrics
          hasError={hasError}
          isLoading={isLoading}
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
        {!isLoading && !hasError && settlementPage.totalPages > 0 ? (
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
