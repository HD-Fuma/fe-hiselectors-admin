export const SETTLEMENT_PAYMENT_STATUSES = ["대기", "확정", "지급 완료"] as const;

export type SettlementPaymentStatus = typeof SETTLEMENT_PAYMENT_STATUSES[number];

export type SettlementConfirmationStatus = "미확정" | "확정";

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

export type SettlementTableRow = Pick<
  Settlement,
  | "attributionMonth"
  | "expectedAmount"
  | "id"
  | "paymentStatus"
  | "selectorId"
  | "selectorName"
>;
