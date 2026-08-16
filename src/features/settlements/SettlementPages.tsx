import { useEffect, useRef, useState } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { TextInput } from "../../components/ui/Controls";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import {
  getSettlementEstimates,
  getSettlementSelectorDetail,
  SETTLEMENT_STATUSES,
  SettlementTable,
  type SettlementEstimate,
  type SettlementSelectorDetail,
  type SettlementStatus,
  type SettlementTableRow,
  type SpringPage,
} from "../../entities/settlement";
import {
  SELECTORS,
  SelectorDetailPanel,
  type SelectorFixture,
} from "../../entities/selectors";

const SETTLEMENT_PAGE_SIZE = 20;

function previousSettlementMonth(date = new Date()) {
  const previousMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return [
    previousMonth.getFullYear(),
    String(previousMonth.getMonth() + 1).padStart(2, "0"),
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

function settlementMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year}년 ${Number(monthNumber)}월`;
}

function selectorDetailForSettlement(settlement: SettlementTableRow): SelectorFixture {
  const fixtureId = `sl-${String(settlement.selectorsId).padStart(3, "0")}`;
  const selector = SELECTORS.find((item) => (
    item.selectorCode === settlement.selectorsCode
    || item.name === settlement.selectorsNickname
    || item.id === fixtureId
  ));

  if (selector) return selector;

  const sequence = settlement.selectorsId || 1;
  const selectorName = settlement.selectorsNickname || "셀렉터스";

  return {
    clicks: 0,
    cohort: "-",
    contentCount: 0,
    conversions: 0,
    id: fixtureId,
    name: selectorName,
    recentActivity: settlement.updatedAt?.slice(0, 10) || "-",
    selectorCode: settlement.selectorsCode || `SEL-${String(sequence).padStart(4, "0")}`,
    shopNickname: selectorName,
    sns: sequence % 2 === 0 ? "YouTube" : "Instagram",
    status: "활동 중",
    violationCount: 0,
  };
}

interface SettlementDetailState {
  detail: SettlementSelectorDetail | null;
  error: boolean;
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
        <FilterField htmlFor="settlement-month" label="정산월">
          <TextInput
            aria-label="정산월"
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

export function SettlementManagementPage() {
  const [defaultMonth] = useState(previousSettlementMonth);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [appliedMonth, setAppliedMonth] = useState(defaultMonth);
  const [selectedStatus, setSelectedStatus] = useState<SettlementStatus | null>(null);
  const [page, setPage] = useState(1);
  const [requestVersion, setRequestVersion] = useState(0);
  const [settlementPage, setSettlementPage] = useState(emptySettlementPage);
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

    getSettlementEstimates({
      month: appliedMonth,
      page: page - 1,
      size: SETTLEMENT_PAGE_SIZE,
      status: selectedStatus ?? undefined,
    }, controller.signal)
      .then((result) => {
        if (latestRequestId.current !== requestId) return;
        setSettlementPage(result);
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
    setSettlementDetailState({ detail: null, error: false, loading: true });

    getSettlementSelectorDetail(settlement.selectorsId, controller.signal)
      .then((result) => {
        if (detailRequestId.current !== requestId) return;
        setSettlementDetailState({ detail: result, error: false, loading: false });
      })
      .catch((error: unknown) => {
        if (
          detailRequestId.current !== requestId
          || (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }

        setSettlementDetailState({ detail: null, error: true, loading: false });
      });
  };

  const prepareRequest = () => {
    latestRequestId.current += 1;
    closeSettlementDetail();
    setSettlementPage(emptySettlementPage());
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

  const changeStatus = (status: SettlementStatus | null) => {
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
        <ChoiceTabs
          ariaLabel="정산 상태"
          className="fuma-settlement-status-filter"
          emptyOption={{
            label: "전체",
            onSelect: () => changeStatus(null),
          }}
          onChange={(status) => changeStatus(status)}
          options={SETTLEMENT_STATUSES}
          value={selectedStatus}
        />
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          meta={
            <>
              <span>{settlementMonthLabel(appliedMonth)}</span>
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
          selector={selectorDetailForSettlement(selectedSettlement)}
          settlementDetail={settlementDetailState?.detail ?? null}
          settlementDetailError={settlementDetailState?.error ?? false}
          settlementDetailLoading={settlementDetailState?.loading ?? false}
        />
      ) : null}
    </section>
  );
}
