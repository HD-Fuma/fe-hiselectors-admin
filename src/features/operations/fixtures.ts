export type ConfirmationStatus = "미확정" | "확정";
export type PaymentStatus = "지급 전" | "지급 대기" | "지급 완료";

export interface SettlementFixture {
  id: string;
  attributionMonth: string;
  selectorId: string;
  selectorName: string;
  expectedAmount: number;
  confirmedAmount: number;
  confirmationStatus: ConfirmationStatus;
  paymentStatus: PaymentStatus;
}

export const SETTLEMENTS: readonly SettlementFixture[] = [
  {
    id: "st-001",
    attributionMonth: "2026-08",
    selectorId: "sl-001",
    selectorName: "김서연",
    expectedAmount: 486000,
    confirmedAmount: 486000,
    confirmationStatus: "미확정",
    paymentStatus: "지급 전",
  },
  {
    id: "st-002",
    attributionMonth: "2026-08",
    selectorId: "sl-002",
    selectorName: "박도윤",
    expectedAmount: 352000,
    confirmedAmount: 340000,
    confirmationStatus: "미확정",
    paymentStatus: "지급 전",
  },
  {
    id: "st-003",
    attributionMonth: "2026-08",
    selectorId: "sl-003",
    selectorName: "이지아",
    expectedAmount: 275000,
    confirmedAmount: 275000,
    confirmationStatus: "확정",
    paymentStatus: "지급 대기",
  },
  {
    id: "st-004",
    attributionMonth: "2026-07",
    selectorId: "sl-004",
    selectorName: "오하늘",
    expectedAmount: 410000,
    confirmedAmount: 410000,
    confirmationStatus: "확정",
    paymentStatus: "지급 완료",
  },
];

export function formatWon(amount: number) {
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}
