export type ConfirmationStatus = "미확정" | "확정";
export type PaymentStatus = "지급 전" | "지급 대기" | "지급 완료";
export type NoticeStatus = "게시 예정" | "게시 중" | "게시 종료";

export interface SettlementFixture {
  id: string;
  attributionMonth: string;
  selectorId: string;
  selectorName: string;
  expectedAmount: number;
  confirmedAmount: number;
  editable: boolean;
  confirmationStatus: ConfirmationStatus;
  paymentStatus: PaymentStatus;
}

export interface NoticeFixture {
  id: string;
  title: string;
  target: "전체 셀렉터스" | "3기 셀렉터스" | "2기 셀렉터스";
  startDate: string;
  endDate: string;
  status: NoticeStatus;
  author: string;
  updatedAt: string;
  body: string;
}

export const SETTLEMENTS: readonly SettlementFixture[] = [
  {
    id: "st-001",
    attributionMonth: "2026-08",
    selectorId: "sl-001",
    selectorName: "김서연",
    expectedAmount: 486000,
    confirmedAmount: 486000,
    editable: true,
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
    editable: true,
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
    editable: false,
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
    editable: false,
    confirmationStatus: "확정",
    paymentStatus: "지급 완료",
  },
];

export const NOTICES: readonly NoticeFixture[] = [
  {
    id: "nt-001",
    title: "8월 셀렉터스 활동 안내",
    target: "전체 셀렉터스",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    status: "게시 중",
    author: "FUMA 운영자",
    updatedAt: "2026-08-03 14:20",
    body: "8월 셀렉터스 활동 일정과 콘텐츠 제출 기준을 확인해 주세요.",
  },
  {
    id: "nt-002",
    title: "3기 콘텐츠 제출 일정 안내",
    target: "3기 셀렉터스",
    startDate: "2026-08-10",
    endDate: "2026-08-24",
    status: "게시 예정",
    author: "FUMA 운영자",
    updatedAt: "2026-08-02 09:15",
    body: "3기 셀렉터스 콘텐츠 제출 일정을 확인해 주세요.",
  },
  {
    id: "nt-003",
    title: "2기 활동 종료 및 정산 일정 안내",
    target: "2기 셀렉터스",
    startDate: "2026-06-20",
    endDate: "2026-06-30",
    status: "게시 종료",
    author: "정산관리자",
    updatedAt: "2026-06-30 18:05",
    body: "2기 활동 종료 및 정산 일정을 안내합니다.",
  },
];

export function formatWon(amount: number) {
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}
