import { useState, type ReactNode } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { SelectorDetailPanel } from "../selectors/SelectorPages";
import { SELECTORS, type SelectorFixture } from "../selectors/fixtures";
import {
  SETTLEMENTS,
  formatWon,
  type PaymentStatus,
  type SettlementFixture,
} from "./fixtures";

const PAYMENT_STATUS_CATEGORIES: PaymentStatus[] = ["대기", "확정", "지급 완료"];
const SETTLEMENT_PAGE_SIZE = 20;

function selectorDetailForSettlement(settlement: SettlementFixture): SelectorFixture {
  const selector = SELECTORS.find((item) => item.id === settlement.selectorId);

  if (selector) {
    return selector;
  }

  const sequence = Number.parseInt(settlement.selectorId.replace(/\D/g, ""), 10) || 1;
  const channels = ["Instagram", "YouTube"] as const;

  return {
    id: settlement.selectorId,
    selectorCode: `SEL-${String(sequence).padStart(4, "0")}`,
    name: settlement.selectorName,
    shopNickname: `${settlement.selectorName}샵`,
    cohort: sequence % 5 === 0 ? "테스트기수53" : "테스트기수56",
    sns: channels[sequence % channels.length],
    status: sequence % 11 === 0 ? "경고" : "활동 중",
    contentCount: 8 + (sequence % 19),
    violationCount: sequence % 11 === 0 ? 1 : 0,
    clicks: 4200 + sequence * 317,
    conversions: 86 + sequence * 9,
    recentActivity: `2026-08-${String((sequence % 10) + 1).padStart(2, "0")}`,
  };
}

interface FilterFieldProps {
  children: ReactNode;
  htmlFor: string;
  label: string;
}

function FilterField({ children, htmlFor, label }: FilterFieldProps) {
  return (
    <label className="fuma-filter-field" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function SearchActions() {
  return (
    <>
      <Button variant="primary">조회</Button>
      <Button>초기화</Button>
    </>
  );
}

function paymentTone(status: PaymentStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "지급 완료") return "approved";
  if (status === "확정") return "pending";
  return "neutral";
}

function SettlementFilters({
  onMonthChange,
  selectedMonth,
}: {
  onMonthChange: (month: string) => void;
  selectedMonth: string;
}) {
  return (
    <div className="fuma-operations-search fuma-settlement-search">
      <SearchPanel actions={<SearchActions />}>
        <FilterField htmlFor="settlement-month" label="정산월">
          <TextInput
            aria-label="정산월"
            id="settlement-month"
            onChange={(event) => onMonthChange(event.target.value)}
            type="month"
            value={selectedMonth}
          />
        </FilterField>
        <FilterField htmlFor="settlement-selector" label="ID 또는 이름">
          <TextInput
            aria-label="ID 또는 이름"
            id="settlement-selector"
            placeholder="ID 또는 이름 검색"
          />
        </FilterField>
      </SearchPanel>
    </div>
  );
}

const SETTLEMENT_COLUMNS: DenseTableColumn<SettlementFixture>[] = [
  { key: "attributionMonth", header: "정산월", width: 92, align: "center" },
  { key: "selectorId", header: "셀렉터스 ID", width: 104, align: "center" },
  {
    id: "selector",
    header: "셀렉터스",
    width: 118,
    align: "center",
    render: (settlement) => (
      <div className="fuma-operation-person">
        <span className="hsas-visually-hidden">{settlement.id}</span>
        <strong>{settlement.selectorName}</strong>
      </div>
    ),
  },
  {
    key: "expectedAmount",
    header: "정산 금액",
    width: 122,
    align: "center",
    render: (settlement) => formatWon(settlement.expectedAmount),
  },
  {
    key: "paymentStatus",
    header: "지급 상태",
    width: 90,
    align: "center",
    render: (settlement) => (
      <StatusPill tone={paymentTone(settlement.paymentStatus)}>
        {settlement.paymentStatus}
      </StatusPill>
    ),
  },
];

export function SettlementManagementPage() {
  const [page, setPage] = useState(1);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementFixture | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("2026-08");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | null>(null);
  const monthlySettlements = SETTLEMENTS.filter(
    (settlement) => settlement.attributionMonth === selectedMonth,
  );
  const settlements = selectedPaymentStatus
    ? monthlySettlements.filter((settlement) => settlement.paymentStatus === selectedPaymentStatus)
    : monthlySettlements;
  const totalPages = Math.max(1, Math.ceil(settlements.length / SETTLEMENT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedSettlements = settlements.slice(
    (currentPage - 1) * SETTLEMENT_PAGE_SIZE,
    currentPage * SETTLEMENT_PAGE_SIZE,
  );
  const monthlyTotal = monthlySettlements.reduce(
    (total, settlement) => total + settlement.expectedAmount,
    0,
  );
  const [year, month] = selectedMonth.split("-");
  const monthLabel = selectedMonth ? `${year}년 ${Number(month)}월` : "정산월 미선택";

  return (
    <section className="fuma-page">
      <PageHeader screenCode="ST101" title="정산 지급 관리" />
      <div className="fuma-page__body">
        <SettlementFilters
          onMonthChange={(month) => {
            setSelectedMonth(month);
            setPage(1);
          }}
          selectedMonth={selectedMonth}
        />
        <nav aria-label="지급 상태" className="fuma-creator-category-filter fuma-settlement-status-filter">
          <div>
            <button
              aria-pressed={selectedPaymentStatus === null}
              className="fuma-creator-category-filter__option"
              onClick={() => {
                setSelectedPaymentStatus(null);
                setPage(1);
              }}
              type="button"
            >
              전체
            </button>
            {PAYMENT_STATUS_CATEGORIES.map((status) => (
              <button
                aria-pressed={selectedPaymentStatus === status}
                className="fuma-creator-category-filter__option"
                key={status}
                onClick={() => {
                  setSelectedPaymentStatus(status);
                  setPage(1);
                }}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
        </nav>
        <div className="fuma-result-toolbar fuma-simple-result-toolbar">
          <strong>정산 지급 목록</strong>
          <div className="fuma-settlement-result-meta">
            <span>{monthLabel}</span>
            <span>정산 총합 {formatWon(monthlyTotal)}</span>
            <span>총 {settlements.length}건</span>
          </div>
        </div>
        <div
          aria-label="정산 지급 목록"
          className="fuma-wide-table fuma-settlement-table"
          role="region"
        >
          <DenseTable
            columns={SETTLEMENT_COLUMNS}
            onRowClick={setSelectedSettlement}
            rowKey={(settlement) => settlement.id}
            rows={pagedSettlements}
            selectedRowKeys={selectedSettlement ? [selectedSettlement.id] : []}
          />
        </div>
        <Pagination
          onPageChange={setPage}
          page={currentPage}
          pageSize={SETTLEMENT_PAGE_SIZE}
          totalPages={totalPages}
        />
      </div>
      {selectedSettlement ? (
        <SelectorDetailPanel
          onClose={() => setSelectedSettlement(null)}
          selector={selectorDetailForSettlement(selectedSettlement)}
        />
      ) : null}
    </section>
  );
}
