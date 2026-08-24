import { DenseTable, type DenseTableColumn } from "../../../components/ui/DenseTable";
import { StatusPill, type StatusPillProps } from "../../../components/ui/StatusPill";
import { formatNumber, formatWon } from "../../../lib/formatters";
import type { SelectorSalesPerformance } from "../api";

interface RankedSelectorSalesPerformance extends SelectorSalesPerformance {
  rank: number;
}

function statusLabel(roleId: string) {
  if (roleId === "ACTIVE") return "활동중";
  if (roleId === "INACTIVE") return "활동정지";
  if (roleId === "BLACKLIST") return "블랙리스트";
  return roleId;
}

function statusTone(roleId: string): NonNullable<StatusPillProps["tone"]> {
  if (roleId === "ACTIVE") return "approved";
  if (roleId === "BLACKLIST") return "rejected";
  return "neutral";
}

const SELECTOR_SALES_COLUMNS: DenseTableColumn<RankedSelectorSalesPerformance>[] = [
  { key: "rank", header: "순위", width: 72, align: "center" },
  { key: "selectorCode", header: "셀렉터스 ID", width: 130, align: "center" },
  { key: "nickname", header: "이름", width: 120, align: "center" },
  {
    key: "generationName",
    header: "기수",
    width: 100,
    align: "center",
    render: (selector) => selector.generationName || "-",
  },
  {
    key: "roleId",
    header: "활동 상태",
    width: 110,
    align: "center",
    render: (selector) => (
      <StatusPill tone={statusTone(selector.roleId)}>{statusLabel(selector.roleId)}</StatusPill>
    ),
  },
  {
    key: "confirmedOrderCount",
    header: "확정 주문",
    width: 110,
    align: "right",
    render: (selector) => `${formatNumber(selector.confirmedOrderCount)}건`,
  },
  {
    key: "totalSales",
    header: "총 매출액",
    width: 170,
    align: "right",
    render: (selector) => formatWon(selector.totalSales),
  },
];

const EXCELLENT_SELECTOR_COLUMNS: DenseTableColumn<SelectorSalesPerformance>[] = [
  { key: "selectorCode", header: "셀렉터스 ID", width: 130, align: "center" },
  { key: "nickname", header: "이름", width: 110, align: "center" },
  {
    key: "excellentGenerationName",
    header: "기수",
    width: 100,
    align: "center",
    render: (selector) => selector.excellentGenerationName || selector.generationName || "-",
  },
  {
    key: "excellentActivityType",
    header: "종류",
    width: 250,
    align: "center",
    render: (selector) => selector.excellentActivityType || "-",
  },
  {
    key: "totalSales",
    header: "총 매출액",
    width: 160,
    align: "right",
    render: (selector) => formatWon(
      selector.excellentGenerationSales ?? selector.totalSales,
    ),
  },
];

interface SelectorPerformanceTableProps {
  onRowClick?: (selector: SelectorSalesPerformance) => void;
  rows: readonly SelectorSalesPerformance[];
}

export function SelectorSalesPerformanceTable({
  onRowClick,
  rankOffset = 0,
  rows,
}: SelectorPerformanceTableProps & { rankOffset?: number }) {
  const rankedRows = rows.map((selector, index) => ({
    ...selector,
    rank: rankOffset + index + 1,
  }));

  return (
    <DenseTable
      columns={SELECTOR_SALES_COLUMNS}
      onRowClick={onRowClick}
      rowKey={(selector) => selector.selectorId}
      rows={rankedRows}
    />
  );
}

export function ExcellentSelectorTable({
  onRowClick,
  rows,
}: SelectorPerformanceTableProps) {
  return (
    <DenseTable
      columns={EXCELLENT_SELECTOR_COLUMNS}
      onRowClick={onRowClick}
      rowKey={(selector) => selector.selectorId}
      rows={[...rows]}
    />
  );
}
