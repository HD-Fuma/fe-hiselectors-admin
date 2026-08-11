export type ConfirmationStatus = "미확정" | "확정";
export type PaymentStatus = "대기" | "확정" | "지급 완료";

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

const ADDITIONAL_SETTLEMENT_SEEDS = [
  ["김하린", 328000],
  ["윤서준", 415000],
  ["박다은", 267000],
  ["최민호", 593000],
  ["이수아", 348000],
  ["정현우", 721000],
  ["한유진", 386000],
  ["오지민", 452000],
  ["서도현", 319000],
  ["문채원", 648000],
  ["류시온", 274000],
  ["장예린", 536000],
  ["신태윤", 401000],
  ["권나연", 685000],
  ["배준호", 359000],
  ["임소율", 492000],
  ["문가영", 308000],
  ["노지훈", 574000],
  ["권소연", 433000],
  ["홍예준", 762000],
  ["유하은", 289000],
  ["안태민", 517000],
  ["전수아", 376000],
  ["고은찬", 624000],
  ["양서윤", 341000],
  ["백지호", 468000],
  ["허예은", 297000],
  ["남도현", 556000],
  ["심채린", 389000],
  ["류민준", 704000],
  ["차유나", 323000],
  ["주성민", 487000],
  ["진서현", 365000],
  ["민하준", 612000],
  ["엄지민", 278000],
  ["채도윤", 529000],
  ["원예린", 394000],
  ["구태호", 671000],
  ["성나은", 346000],
  ["표준서", 458000],
] as const;

const ADDITIONAL_SETTLEMENTS = ADDITIONAL_SETTLEMENT_SEEDS.map(
  ([selectorName, expectedAmount], index): SettlementFixture => {
    const paymentStatus: PaymentStatus =
      index % 3 === 0 ? "대기" : index % 3 === 1 ? "확정" : "지급 완료";
    const sequence = index + 5;

    return {
      id: `st-${String(sequence).padStart(3, "0")}`,
      attributionMonth: index < 32 ? "2026-08" : index < 36 ? "2026-07" : "2026-06",
      selectorId: `sl-${String(sequence).padStart(3, "0")}`,
      selectorName,
      expectedAmount,
      confirmedAmount: expectedAmount,
      confirmationStatus: paymentStatus === "대기" ? "미확정" : "확정",
      paymentStatus,
    };
  },
);

export const SETTLEMENTS: readonly SettlementFixture[] = [
  {
    id: "st-001",
    attributionMonth: "2026-08",
    selectorId: "sl-001",
    selectorName: "김서연",
    expectedAmount: 486000,
    confirmedAmount: 486000,
    confirmationStatus: "미확정",
    paymentStatus: "대기",
  },
  {
    id: "st-002",
    attributionMonth: "2026-08",
    selectorId: "sl-002",
    selectorName: "박도윤",
    expectedAmount: 352000,
    confirmedAmount: 340000,
    confirmationStatus: "미확정",
    paymentStatus: "확정",
  },
  {
    id: "st-003",
    attributionMonth: "2026-08",
    selectorId: "sl-003",
    selectorName: "이지아",
    expectedAmount: 275000,
    confirmedAmount: 275000,
    confirmationStatus: "확정",
    paymentStatus: "대기",
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
  ...ADDITIONAL_SETTLEMENTS,
];

export function formatWon(amount: number) {
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}
