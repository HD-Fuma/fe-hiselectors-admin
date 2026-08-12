import { useState } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { TextInput } from "../../components/ui/Controls";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SettlementTable } from "../../components/ui/SettlementTable";
import { formatWon } from "../../lib/formatters";
import { paginate } from "../../lib/pagination";
import { SelectorDetailPanel } from "../selectors/SelectorPages";
import { SELECTORS, type SelectorFixture } from "../selectors/fixtures";
import {
  SETTLEMENTS,
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

function SettlementFilters({
  keyword,
  onKeywordChange,
  onMonthChange,
  onReset,
  onSearch,
  selectedMonth,
}: {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onMonthChange: (month: string) => void;
  onReset: () => void;
  onSearch: () => void;
  selectedMonth: string;
}) {
  return (
    <div className="fuma-operations-search fuma-settlement-search">
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
        <FilterField htmlFor="settlement-selector" label="ID 또는 이름">
          <TextInput
            aria-label="ID 또는 이름"
            id="settlement-selector"
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="ID 또는 이름 검색"
            value={keyword}
          />
        </FilterField>
      </SearchPanel>
    </div>
  );
}

export function SettlementManagementPage() {
  const [page, setPage] = useState(1);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementFixture | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("2026-08");
  const [keyword, setKeyword] = useState("");
  const [appliedMonth, setAppliedMonth] = useState("2026-08");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | null>(null);
  const normalizedKeyword = appliedKeyword.trim().toLowerCase();
  const monthlySettlements = appliedMonth
    ? SETTLEMENTS.filter((settlement) => settlement.attributionMonth === appliedMonth)
    : [...SETTLEMENTS];
  const settlements = monthlySettlements.filter((settlement) => (
    (!normalizedKeyword || [settlement.selectorId, settlement.selectorName].some((value) => (
      value.toLowerCase().includes(normalizedKeyword)
    )))
    && (!selectedPaymentStatus || settlement.paymentStatus === selectedPaymentStatus)
  ));
  const {
    currentPage,
    pagedItems: pagedSettlements,
    totalPages,
  } = paginate(settlements, page, SETTLEMENT_PAGE_SIZE);
  const settlementTotal = settlements.reduce(
    (total, settlement) => total + settlement.expectedAmount,
    0,
  );
  const [year, month] = appliedMonth.split("-");
  const monthLabel = appliedMonth ? `${year}년 ${Number(month)}월` : "전체 정산월";

  const applyFilters = () => {
    setAppliedMonth(selectedMonth);
    setAppliedKeyword(keyword);
    setPage(1);
  };

  const resetFilters = () => {
    setSelectedMonth("");
    setKeyword("");
    setAppliedMonth("");
    setAppliedKeyword("");
    setSelectedPaymentStatus(null);
    setPage(1);
  };

  return (
    <section className="fuma-page">
      <PageHeader screenCode="ST101" title="정산 지급 관리" />
      <div className="fuma-page__body">
        <SettlementFilters
          keyword={keyword}
          onKeywordChange={setKeyword}
          onMonthChange={setSelectedMonth}
          onReset={resetFilters}
          onSearch={applyFilters}
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
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          meta={
            <>
              <span>{monthLabel}</span>
              <span>정산 총합 {formatWon(settlementTotal)}</span>
              <span>총 {settlements.length}건</span>
            </>
          }
          title="정산 지급 목록"
        />
        <SettlementTable
          onRowClick={setSelectedSettlement}
          rows={pagedSettlements}
          selectedRowKeys={selectedSettlement ? [selectedSettlement.id] : []}
        />
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
