import type { Key } from "react";
import { formatWon } from "../../lib/formatters";
import { DenseTable, type DenseTableColumn } from "./DenseTable";
import { StatusPill, type StatusPillProps } from "./StatusPill";

export type SettlementPaymentStatus = "대기" | "확정" | "지급 완료";

export interface SettlementTableRow {
  attributionMonth: string;
  expectedAmount: number;
  id: string;
  paymentStatus: SettlementPaymentStatus;
  selectorId: string;
  selectorName: string;
}

export interface SettlementTableProps<T extends SettlementTableRow> {
  ariaLabel?: string;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (settlement: T) => void;
  rows: T[];
  selectedRowKeys?: readonly Key[];
}

function paymentTone(status: SettlementPaymentStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "지급 완료") return "approved";
  if (status === "확정") return "pending";
  return "neutral";
}

const SETTLEMENT_TABLE_COLUMNS: DenseTableColumn<SettlementTableRow>[] = [
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

export function SettlementTable<T extends SettlementTableRow>({
  ariaLabel = "정산 지급 목록",
  className,
  emptyMessage,
  onRowClick,
  rows,
  selectedRowKeys,
}: SettlementTableProps<T>) {
  return (
    <div
      aria-label={ariaLabel}
      className={["fuma-wide-table", "fuma-settlement-table", className].filter(Boolean).join(" ")}
      role="region"
    >
      <DenseTable
        columns={SETTLEMENT_TABLE_COLUMNS as DenseTableColumn<T>[]}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
        rowKey={(settlement) => settlement.id}
        rows={rows}
        selectedRowKeys={selectedRowKeys}
      />
    </div>
  );
}
