export const SETTLEMENT_STATUSES = [
  { label: "집계 예정", value: "CALCULATING" },
  { label: "지급 이월", value: "PAYMENT_CARRYOVER" },
  { label: "지급 대기", value: "PAYMENT_PENDING" },
  { label: "정산 보류", value: "PAYMENT_HOLD_INFO" },
  { label: "정산 보류", value: "PAYMENT_HOLD_BLACK" },
  { label: "지급 완료", value: "SETTLED" },
  { label: "지급 만료", value: "EXPIRED" },
] as const;

export type SettlementStatus = typeof SETTLEMENT_STATUSES[number]["value"];

export const SETTLEMENT_HOLD_STATUSES = [
  "PAYMENT_HOLD_INFO",
  "PAYMENT_HOLD_BLACK",
] as const satisfies readonly SettlementStatus[];

export const SETTLEMENT_STATUS_FILTERS = [
  { label: "집계 예정", value: "CALCULATING" },
  { label: "지급 이월", value: "PAYMENT_CARRYOVER" },
  { label: "지급 대기", value: "PAYMENT_PENDING" },
  { label: "정산 보류", value: "SETTLEMENT_HOLD" },
  { label: "지급 완료", value: "SETTLED" },
  { label: "지급 만료", value: "EXPIRED" },
] as const;

export type SettlementStatusFilter = typeof SETTLEMENT_STATUS_FILTERS[number]["value"];

export type SettlementStatusTone =
  | "approved"
  | "danger"
  | "pending"
  | "rejected"
  | "neutral";

const SETTLEMENT_STATUS_TONES: Record<SettlementStatus, SettlementStatusTone> = {
  CALCULATING: "neutral",
  EXPIRED: "rejected",
  PAYMENT_CARRYOVER: "pending",
  PAYMENT_HOLD_BLACK: "danger",
  PAYMENT_HOLD_INFO: "danger",
  PAYMENT_PENDING: "pending",
  SETTLED: "approved",
};

export function settlementStatusTone(
  status: SettlementStatus | null | undefined,
): SettlementStatusTone {
  return status ? SETTLEMENT_STATUS_TONES[status] ?? "neutral" : "neutral";
}

export function settlementStatusLabel(
  status: SettlementStatus | null | undefined,
): string {
  if (!status) return "-";
  if (status === "PAYMENT_HOLD_INFO" || status === "PAYMENT_HOLD_BLACK") return "정산 보류";
  return SETTLEMENT_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function settlementHoldReason(
  status: SettlementStatus | null | undefined,
): string | null {
  if (status === "PAYMENT_HOLD_BLACK") return "블랙리스트";
  if (status === "PAYMENT_HOLD_INFO") return "정산 계좌 정보 없음";
  return null;
}

export function primarySettlementPaymentStatus(
  statuses: Array<SettlementStatus | null | undefined>,
): SettlementStatus | null {
  const present = new Set(
    statuses.filter((status): status is SettlementStatus => status != null),
  );
  if (present.has("PAYMENT_HOLD_BLACK")) return "PAYMENT_HOLD_BLACK";
  if (present.has("PAYMENT_HOLD_INFO")) return "PAYMENT_HOLD_INFO";
  if (present.has("PAYMENT_PENDING")) return "PAYMENT_PENDING";
  if (present.has("PAYMENT_CARRYOVER")) return "PAYMENT_CARRYOVER";
  if (present.has("CALCULATING")) return "CALCULATING";
  if (present.has("SETTLED")) return "SETTLED";
  if (present.has("EXPIRED")) return "EXPIRED";
  return null;
}

export function apiStatusesForFilter(
  filter: SettlementStatusFilter | null | undefined,
): SettlementStatus[] | undefined {
  if (!filter) return undefined;
  if (filter === "SETTLEMENT_HOLD") return [...SETTLEMENT_HOLD_STATUSES];
  return [filter];
}

export type SettlementSourceCode = "DAILY_BATCH" | "USER_REFRESH";

export type SettlementSnsCode = "YOUTUBE" | "INSTAGRAM";

export interface SettlementEstimate {
  activityMonth: string;
  calculatedAt: string;
  confirmedPurchaseCount: number;
  confirmedSalesAmount: number;
  paymentMonth: string | null;
  selectorsCode: string;
  selectorsId: number;
  selectorsNickname: string;
  settlementAmount: number;
  settlementId: number;
  settlementRate: number;
  settlementMonth: string;
  settlementSourceCode: SettlementSourceCode;
  status: SettlementStatus;
  updatedAt: string;
}

export interface SettlementTableRow extends SettlementEstimate {
  ordinal: number;
}

export interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResult<T> {
  code: string;
  data: T;
  message: string | null;
  success: boolean;
}

export interface SettlementEstimateRequest {
  activityMonth?: string;
  page: number;
  selectorsId?: number;
  size: number;
  status?: SettlementStatus;
  statuses?: readonly SettlementStatus[];
}

export type SettlementEstimateSummaryRequest = Pick<
  SettlementEstimateRequest,
  "activityMonth" | "selectorsId"
>;

export interface SettlementMonthlySummary {
  activityMonth: string;
  commissionToSalesRate: number;
  confirmedPurchaseCount: number;
  confirmedSalesAmount: number;
  settlementAmount: number;
  settlementCount: number;
}

export interface SettlementStatusDistribution {
  settlementAmount: number;
  settlementCount: number;
  status: SettlementStatus;
}

export interface SettlementEstimateSummary extends SettlementMonthlySummary {
  monthlyTrend: SettlementMonthlySummary[];
  statusDistribution: SettlementStatusDistribution[];
}

export interface SettlementSelectorProfile {
  accountId: string | null;
  followerCount: number | null;
  lastCollectedAt: string | null;
  profileImageUrl: string | null;
  selectorsCode: string;
  selectorsId: number;
  selectorsNickname: string;
  snsCode: SettlementSnsCode | null;
}

export interface SettlementSummary {
  cumulativePaidCommission: number;
  cumulativePurchaseConversionCount: number;
  currentMonth: string;
  currentMonthPurchaseConversionCount: number;
  nextMonthScheduledCommission: number;
  nextPaymentMonth: string | null;
  nextPaymentSettlementStatus: SettlementStatus | null;
  cumulativeSalesAmount?: number;
}

export interface SettlementSelectorDetail {
  accountRegistered: boolean;
  histories: SpringPage<SettlementEstimate>;
  profile: SettlementSelectorProfile;
  settlementSummary: SettlementSummary;
}

export type PurchaseHistoryStatus =
  | "PURCHASED"
  | "PURCHASE_CONFIRMED"
  | "CANCEL_REQUESTED"
  | "RETURN_REQUESTED"
  | "CANCELED"
  | "RETURNED";

export interface SettlementPurchaseHistory {
  confirmedAt: string | null;
  orderNo: string;
  paidAmount: number;
  productCode: string;
  purchaseHistoryId: number;
  purchasedAt: string;
  quantity: number;
  selectorsCode: string;
  selectorsId: number;
  selectorsNickname: string;
  status: PurchaseHistoryStatus;
  userHiId: string;
  userId: number;
}

export interface SettlementPurchaseHistoryRequest {
  allMonths: boolean;
  month?: string;
  page: number;
  selectorsId?: number;
  size: number;
}

const PURCHASE_HISTORY_STATUS_LABELS: Record<PurchaseHistoryStatus, string> = {
  CANCELED: "취소 완료",
  CANCEL_REQUESTED: "취소 요청",
  PURCHASED: "구매 완료",
  PURCHASE_CONFIRMED: "구매 확정",
  RETURNED: "반품 완료",
  RETURN_REQUESTED: "반품 요청",
};

export function purchaseHistoryStatusLabel(status: PurchaseHistoryStatus) {
  return PURCHASE_HISTORY_STATUS_LABELS[status] ?? status;
}

export function purchaseHistoryStatusTone(
  status: PurchaseHistoryStatus,
): SettlementStatusTone {
  if (status === "PURCHASE_CONFIRMED") return "approved";
  if (status === "PURCHASED"
    || status === "CANCEL_REQUESTED"
    || status === "RETURN_REQUESTED") return "pending";
  return "rejected";
}

/** @deprecated 셀렉터스 상세 화면의 기존 정산 이력 fixture 전용 모델입니다. */
export type SettlementPaymentStatus = "대기" | "확정" | "지급 완료";

/** @deprecated 셀렉터스 상세 화면의 기존 정산 이력 fixture 전용 모델입니다. */
export type SettlementConfirmationStatus = "미확정" | "확정";

/** @deprecated 셀렉터스 상세 화면의 기존 정산 이력 fixture 전용 모델입니다. */
export interface Settlement {
  attributionMonth: string;
  confirmationStatus: SettlementConfirmationStatus;
  confirmedAmount: number;
  expectedAmount: number;
  id: string;
  paymentStatus: SettlementPaymentStatus;
  selectorId: string;
  selectorName: string;
}
