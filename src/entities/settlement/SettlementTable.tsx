import type { Key, ReactNode } from "react";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { formatNumber, formatWon } from "../../lib/formatters";
import type { SettlementStatus, SettlementTableRow } from "./model";

export interface SettlementTableProps {
  ariaLabel?: string;
  className?: string;
  emptyMessage?: ReactNode;
  onRowClick?: (settlement: SettlementTableRow) => void;
  rows: SettlementTableRow[];
  selectedRowKeys?: readonly Key[];
}

const STATUS_LABELS: Record<SettlementStatus, string> = {
  CALCULATING: "계산 중",
  PAYMENT_HOLD: "지급 보류",
  PAYMENT_PENDING: "지급 대기",
  SETTLED: "지급 완료",
};

const STATUS_TONES: Record<
  SettlementStatus,
  NonNullable<StatusPillProps["tone"]>
> = {
  CALCULATING: "neutral",
  PAYMENT_HOLD: "danger",
  PAYMENT_PENDING: "pending",
  SETTLED: "approved",
};

function displayText(value: string | number | null | undefined) {
  return value == null || value === "" ? "-" : String(value);
}

function displayNumber(value: number | null | undefined) {
  return value == null ? "-" : formatNumber(value);
}

function displayWon(value: number | null | undefined) {
  return value == null ? "-" : formatWon(value);
}

function displayRate(value: number | null | undefined) {
  return value == null ? "-" : `${formatNumber(value)}%`;
}

const SETTLEMENT_TABLE_COLUMNS: DenseTableColumn<SettlementTableRow>[] = [
  {
    key: "ordinal",
    header: "순번",
    width: 60,
    align: "center",
    render: (settlement) => displayNumber(settlement.ordinal),
  },
  {
    key: "activityMonth",
    header: "활동월",
    width: 90,
    align: "center",
    render: (settlement) => displayText(settlement.activityMonth),
  },
  {
    key: "selectorsCode",
    header: "셀렉터스코드",
    width: 120,
    align: "center",
    render: (settlement) => displayText(settlement.selectorsCode),
  },
  {
    key: "selectorsNickname",
    header: "셀렉터스명",
    width: 120,
    align: "center",
    render: (settlement) => displayText(settlement.selectorsNickname),
  },
  {
    key: "confirmedPurchaseCount",
    header: "정산 건수",
    width: 110,
    align: "center",
    render: (settlement) => displayNumber(settlement.confirmedPurchaseCount),
  },
  {
    key: "confirmedSalesAmount",
    header: "매출 실적",
    width: 130,
    align: "center",
    render: (settlement) => displayWon(settlement.confirmedSalesAmount),
  },
  {
    key: "settlementRate",
    header: "수수료율",
    width: 80,
    align: "center",
    render: (settlement) => displayRate(settlement.settlementRate),
  },
  {
    key: "settlementAmount",
    header: "정산 수수료",
    width: 120,
    align: "center",
    render: (settlement) => displayWon(settlement.settlementAmount),
  },
  {
    key: "status",
    header: "지급 상태",
    width: 90,
    align: "center",
    render: (settlement) => (
      settlement.status ? (
        <StatusPill tone={STATUS_TONES[settlement.status]}>
          {STATUS_LABELS[settlement.status]}
        </StatusPill>
      ) : "-"
    ),
  },
];

export function SettlementTable({
  ariaLabel = "정산 지급 목록",
  className,
  emptyMessage,
  onRowClick,
  rows,
  selectedRowKeys,
}: SettlementTableProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={[
        "fuma-wide-table",
        "fuma-settlement-table",
        "fuma-settlement-estimates-table",
        className,
      ].filter(Boolean).join(" ")}
      role="region"
    >
      <DenseTable
        columns={SETTLEMENT_TABLE_COLUMNS}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
        rowKey={(settlement) => settlement.settlementId}
        rows={rows}
        selectedRowKeys={selectedRowKeys}
      />
    </div>
  );
}
