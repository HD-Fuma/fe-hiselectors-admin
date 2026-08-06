import type { ReactNode } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import {
  SETTLEMENTS,
  formatWon,
  type PaymentStatus,
  type SettlementFixture,
} from "./fixtures";

function options(labels: string[]) {
  return labels.map((label) => ({ label, value: label === "전체" ? "" : label }));
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

function SettlementFilters() {
  return (
    <div className="fuma-operations-search fuma-settlement-search">
      <SearchPanel actions={<SearchActions />}>
        <FilterField htmlFor="settlement-month" label="정산월">
          <TextInput
            aria-label="정산월"
            defaultValue="2026-08"
            id="settlement-month"
            type="month"
          />
        </FilterField>
        <FilterField htmlFor="settlement-selector" label="ID 또는 이름">
          <TextInput
            aria-label="ID 또는 이름"
            id="settlement-selector"
            placeholder="ID 또는 이름 검색"
          />
        </FilterField>
        <FilterField htmlFor="settlement-confirmed" label="확정 상태">
          <Select
            aria-label="확정 상태"
            id="settlement-confirmed"
            options={options(["전체", "미확정", "확정"])}
          />
        </FilterField>
        <FilterField htmlFor="settlement-payment" label="지급 상태">
          <Select
            aria-label="지급 상태"
            id="settlement-payment"
            options={options(["전체", "대기", "확정", "지급 완료"])}
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
    render: (settlement) => (
      <div className="fuma-operation-person">
        <span className="hsas-visually-hidden">{settlement.id}</span>
        <strong>{settlement.selectorName}</strong>
      </div>
    ),
  },
  {
    key: "expectedAmount",
    header: "예상액",
    width: 122,
    align: "right",
    render: (settlement) => formatWon(settlement.expectedAmount),
  },
  {
    key: "confirmedAmount",
    header: "확정액",
    width: 142,
    align: "right",
    render: (settlement) => formatWon(settlement.confirmedAmount),
  },
  {
    key: "confirmationStatus",
    header: "확정 상태",
    width: 86,
    align: "center",
    render: (settlement) => (
      <StatusPill tone={settlement.confirmationStatus === "확정" ? "approved" : "pending"}>
        {settlement.confirmationStatus}
      </StatusPill>
    ),
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
  return (
    <section className="fuma-page">
      <PageHeader screenCode="ST101" title="정산 지급 관리" />
      <div className="fuma-page__body">
        <SettlementFilters />
        <div className="fuma-result-toolbar">
          <strong>정산 지급 목록</strong>
          <span>총 {SETTLEMENTS.length}건</span>
        </div>
        <div
          aria-label="정산 지급 목록"
          className="fuma-wide-table fuma-settlement-table"
          role="region"
        >
          <DenseTable
            columns={SETTLEMENT_COLUMNS}
            rowKey={(settlement) => settlement.id}
            rows={[...SETTLEMENTS]}
          />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
  );
}
