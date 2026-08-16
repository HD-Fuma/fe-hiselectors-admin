export const SETTLEMENT_STATUSES = [
  { label: "계산 중", value: "CALCULATING" },
  { label: "지급 대기", value: "PAYMENT_PENDING" },
  { label: "지급 보류", value: "PAYMENT_HOLD" },
  { label: "지급 완료", value: "SETTLED" },
] as const;

export type SettlementStatus = typeof SETTLEMENT_STATUSES[number]["value"];

export type SettlementSourceCode = "DAILY_BATCH" | "USER_REFRESH";

export type SettlementSnsCode = "YOUTUBE" | "INSTAGRAM";

export interface SettlementEstimate {
  calculatedAt: string;
  commissionRate: number;
  confirmedPurchaseCount: number;
  estimatedCommission: number;
  selectorsCode: string;
  selectorsId: number;
  selectorsNickname: string;
  settlementId: number;
  settlementMonth: string;
  settlementSourceCode: SettlementSourceCode;
  status: SettlementStatus;
  totalSales: number;
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
  month?: string;
  page: number;
  size: number;
  status?: SettlementStatus;
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
  nextPaymentMonth: string;
  nextPaymentSettlementStatus: SettlementStatus | null;
}

export interface SettlementSelectorDetail {
  histories: SpringPage<SettlementEstimate>;
  profile: SettlementSelectorProfile;
  settlementSummary: SettlementSummary;
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
