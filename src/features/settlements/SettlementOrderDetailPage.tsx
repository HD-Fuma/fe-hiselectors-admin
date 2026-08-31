import { useEffect, useState } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { Checkbox, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill } from "../../components/ui/StatusPill";
import {
  getSettlementPurchaseHistories,
  purchaseHistoryStatusLabel,
  purchaseHistoryStatusTone,
  type SettlementPurchaseHistory,
  type SpringPage,
} from "../../entities/settlement";
import { formatNumber, formatWon } from "../../lib/formatters";
import "../../styles/settlements.css";

const ORDER_PAGE_SIZE = 20;

interface OrderFilters {
  allMonths: boolean;
  month: string;
  selectorsId: string;
}

interface OrderTableRow extends SettlementPurchaseHistory {
  ordinal: number;
}

function currentMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function emptyOrderPage(size = ORDER_PAGE_SIZE): SpringPage<SettlementPurchaseHistory> {
  return {
    content: [],
    number: 0,
    size,
    totalElements: 0,
    totalPages: 0,
  };
}

function formatOrderDate(value: string | null) {
  return value ? value.replace("T", " ").slice(0, 16) : "-";
}

const ORDER_COLUMNS: DenseTableColumn<OrderTableRow>[] = [
  { key: "ordinal", header: "순번", width: 64, align: "center" },
  { key: "selectorsCode", header: "셀렉터스코드", width: 120 },
  { key: "selectorsNickname", header: "셀렉터스명", width: 120 },
  { key: "userId", header: "주문고객번호", width: 110, align: "center" },
  { key: "userHiId", header: "주문고객ID", width: 130 },
  { key: "orderNo", header: "주문번호", width: 150 },
  { key: "productCode", header: "상품코드", width: 120 },
  {
    key: "quantity",
    header: "수량",
    width: 72,
    align: "right",
    render: (order) => formatNumber(order.quantity),
  },
  {
    key: "paidAmount",
    header: "결제금액",
    width: 120,
    align: "right",
    render: (order) => formatWon(order.paidAmount),
  },
  {
    key: "status",
    header: "주문상태",
    width: 110,
    align: "center",
    render: (order) => (
      <StatusPill tone={purchaseHistoryStatusTone(order.status)}>
        {purchaseHistoryStatusLabel(order.status)}
      </StatusPill>
    ),
  },
  {
    key: "purchasedAt",
    header: "주문일자",
    width: 150,
    align: "center",
    render: (order) => formatOrderDate(order.purchasedAt),
  },
  {
    key: "confirmedAt",
    header: "구매확정일자",
    width: 150,
    align: "center",
    render: (order) => formatOrderDate(order.confirmedAt),
  },
];

export function SettlementOrderDetailPage() {
  const defaultMonth = currentMonth();
  const defaultFilters: OrderFilters = {
    allMonths: false,
    month: defaultMonth,
    selectorsId: "",
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ORDER_PAGE_SIZE);
  const [orders, setOrders] = useState(() => emptyOrderPage());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const selectorsId = Number(appliedFilters.selectorsId);

    void getSettlementPurchaseHistories({
      allMonths: appliedFilters.allMonths,
      month: appliedFilters.month,
      page: page - 1,
      selectorsId: Number.isInteger(selectorsId) && selectorsId > 0 ? selectorsId : undefined,
      size: pageSize,
    }, controller.signal)
      .then((result) => setOrders(result))
      .catch((reason: unknown) => {
        if (controller.signal.aborted
          || (reason instanceof Error && reason.name === "AbortError")) return;
        setOrders(emptyOrderPage(pageSize));
        setError(reason instanceof Error ? reason.message : "주문 상세 내역 조회에 실패했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [appliedFilters, page, pageSize, requestVersion]);

  const startLoading = () => {
    setIsLoading(true);
    setError("");
    setRequestVersion((current) => current + 1);
  };
  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
    startLoading();
  };
  const resetFilters = () => {
    setPage(1);
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    startLoading();
  };
  const rows: OrderTableRow[] = orders.content.map((order, index) => ({
    ...order,
    ordinal: orders.number * orders.size + index + 1,
  }));
  const emptyMessage = isLoading ? (
    <span aria-live="polite" role="status">주문 상세 내역을 불러오는 중입니다.</span>
  ) : error ? (
    <span role="alert">{error}</span>
  ) : "조회된 주문 상세 내역이 없습니다.";

  return (
    <section className="fuma-page fuma-settlement-page fuma-order-detail-page">
      <PageHeader title="주문 상세" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-order-detail-search">
          <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
            <FilterField htmlFor="order-detail-month" label="주문월">
              <TextInput
                aria-label="주문월"
                disabled={filters.allMonths}
                id="order-detail-month"
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  month: event.target.value,
                }))}
                type="month"
                value={filters.month}
              />
            </FilterField>
            <FilterField htmlFor="order-detail-selectors-id" label="셀렉터스 ID">
              <TextInput
                aria-label="셀렉터스 ID"
                id="order-detail-selectors-id"
                inputMode="numeric"
                min="1"
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  selectorsId: event.target.value,
                }))}
                placeholder="전체"
                type="number"
                value={filters.selectorsId}
              />
            </FilterField>
            <div className="fuma-filter-field">
              <span>조회 범위</span>
              <Checkbox
                checked={filters.allMonths}
                id="order-detail-all-months"
                label="전체 기간"
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  allMonths: event.target.checked,
                }))}
              />
            </div>
          </SearchPanel>
        </div>
        <section aria-labelledby="order-detail-list-title" className="fuma-order-detail-list">
          <ResultToolbar
            className="fuma-simple-result-toolbar"
            meta={(
              <>
                <span>{appliedFilters.allMonths ? "전체 기간" : appliedFilters.month}</span>
                <span>총 {formatNumber(orders.totalElements)}건</span>
              </>
            )}
            title="주문 상세 목록"
            titleId="order-detail-list-title"
          />
          <DenseTable
            emptyMessage={emptyMessage}
            rowKey={(order) => order.purchaseHistoryId}
            rows={rows}
            columns={ORDER_COLUMNS}
          />
        </section>
        {!isLoading && !error && orders.totalPages > 0 ? (
          <Pagination
            onPageChange={(nextPage) => {
              setPage(nextPage);
              startLoading();
            }}
            onPageSizeChange={(nextPageSize) => {
              setPage(1);
              setPageSize(nextPageSize);
              startLoading();
            }}
            page={page}
            pageSize={pageSize}
            totalPages={orders.totalPages}
          />
        ) : null}
      </div>
    </section>
  );
}
