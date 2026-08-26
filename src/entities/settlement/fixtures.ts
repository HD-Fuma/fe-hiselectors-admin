import type {
  Settlement,
  SettlementEstimate,
  SettlementEstimateSummary,
  SettlementPaymentStatus,
  SettlementSelectorDetail,
  SettlementStatus,
  SpringPage,
} from "./model";

// 셀렉터스 상세 이력과 API 월 데이터가 없을 때의 샘플 화면에 재사용합니다.

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
  ([selectorName, expectedAmount], index): Settlement => {
    const paymentStatus: SettlementPaymentStatus =
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

export const SETTLEMENTS: readonly Settlement[] = [
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

const DEMO_STATUSES: readonly SettlementStatus[] = [
  "PAYMENT_PENDING",
  "SETTLED",
  "SETTLED",
  "PAYMENT_HOLD_INFO",
  "PAYMENT_CARRYOVER",
  "SETTLED",
  "EXPIRED",
  "PAYMENT_HOLD_BLACK",
  "CALCULATING",
];

function shiftMonth(activityMonth: string, offset: number) {
  const [year, month] = activityMonth.split("-").map(Number);
  const shifted = new Date(year, month - 1 + offset, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
}

function demoEstimates(activityMonth: string): SettlementEstimate[] {
  return SETTLEMENTS.map((settlement, index) => {
    const settlementRate = 3 + index % 5 * 0.5;
    const status = DEMO_STATUSES[index % DEMO_STATUSES.length];
    const selectorsId = index + 1;

    return {
      activityMonth,
      calculatedAt: `${activityMonth}-01T03:00:00`,
      confirmedPurchaseCount: 28 + index * 7 % 240,
      confirmedSalesAmount: Math.round(settlement.expectedAmount / (settlementRate / 100)),
      paymentMonth: status === "PAYMENT_CARRYOVER" ? null : shiftMonth(activityMonth, 1),
      selectorsCode: `SEL-${String(selectorsId).padStart(4, "0")}`,
      selectorsId,
      selectorsNickname: settlement.selectorName,
      settlementAmount: settlement.expectedAmount,
      settlementId: -selectorsId,
      settlementMonth: shiftMonth(activityMonth, 1),
      settlementRate,
      settlementSourceCode: index % 4 === 0 ? "USER_REFRESH" : "DAILY_BATCH",
      status,
      updatedAt: `${activityMonth}-01T03:00:00`,
    };
  });
}

function monthlySummary(activityMonth: string, scale: number) {
  const estimates = demoEstimates(activityMonth).slice(0, Math.round(SETTLEMENTS.length * scale));
  const confirmedPurchaseCount = estimates.reduce(
    (total, settlement) => total + settlement.confirmedPurchaseCount,
    0,
  );
  const confirmedSalesAmount = estimates.reduce(
    (total, settlement) => total + settlement.confirmedSalesAmount,
    0,
  );
  const settlementAmount = estimates.reduce(
    (total, settlement) => total + settlement.settlementAmount,
    0,
  );

  return {
    activityMonth,
    commissionToSalesRate: confirmedSalesAmount === 0
      ? 0
      : Math.round(settlementAmount / confirmedSalesAmount * 10_000) / 100,
    confirmedPurchaseCount,
    confirmedSalesAmount,
    settlementAmount,
    settlementCount: estimates.length,
  };
}

export function getDemoSettlementPage({
  activityMonth,
  page,
  size,
  statuses,
}: {
  activityMonth: string;
  page: number;
  size: number;
  statuses?: readonly SettlementStatus[];
}): SpringPage<SettlementEstimate> {
  const estimates = demoEstimates(activityMonth).filter(
    (settlement) => !statuses?.length || statuses.includes(settlement.status),
  );
  const start = page * size;

  return {
    content: estimates.slice(start, start + size),
    number: page,
    size,
    totalElements: estimates.length,
    totalPages: Math.ceil(estimates.length / size),
  };
}

export function getDemoSettlementSummary(activityMonth: string): SettlementEstimateSummary {
  const scales = [0.7, 0.77, 0.82, 0.89, 0.95, 1];
  const monthlyTrend = scales.map((scale, index) => (
    monthlySummary(shiftMonth(activityMonth, index - scales.length + 1), scale)
  ));
  const current = monthlyTrend.at(-1) ?? monthlySummary(activityMonth, 1);
  const statusDistribution = DEMO_STATUSES.filter(
    (status, index, statuses) => statuses.indexOf(status) === index,
  ).map((status) => {
    const estimates = demoEstimates(activityMonth).filter((item) => item.status === status);
    return {
      settlementAmount: estimates.reduce((total, item) => total + item.settlementAmount, 0),
      settlementCount: estimates.length,
      status,
    };
  });

  return { ...current, monthlyTrend, statusDistribution };
}

export function isDemoSettlement(settlement: SettlementEstimate) {
  return settlement.settlementId < 0;
}

export function getDemoSettlementSelectorDetail(
  settlement: SettlementEstimate,
): SettlementSelectorDetail {
  const histories = Array.from({ length: 6 }, (_, index): SettlementEstimate => {
    const activityMonth = shiftMonth(settlement.activityMonth, -index);
    const scale = 1 - index * 0.06;
    return {
      ...settlement,
      activityMonth,
      calculatedAt: `${activityMonth}-01T03:00:00`,
      confirmedPurchaseCount: Math.round(settlement.confirmedPurchaseCount * scale),
      confirmedSalesAmount: Math.round(settlement.confirmedSalesAmount * scale),
      paymentMonth: index === 0 ? settlement.paymentMonth : shiftMonth(activityMonth, 1),
      settlementAmount: Math.round(settlement.settlementAmount * scale),
      settlementId: settlement.settlementId * 10 - index,
      settlementMonth: shiftMonth(activityMonth, 1),
      status: index === 0 ? settlement.status : "SETTLED",
      updatedAt: `${activityMonth}-01T03:00:00`,
    };
  });
  const scheduledForPayment = settlement.status === "PAYMENT_PENDING"
    || settlement.status === "PAYMENT_CARRYOVER";
  const nextPaymentMonth = settlement.status === "PAYMENT_PENDING"
    ? settlement.paymentMonth
    : null;
  const nextPaymentSettlementStatus = settlement.status === "SETTLED"
    || settlement.status === "EXPIRED"
    ? null
    : settlement.status;

  return {
    accountRegistered: settlement.status !== "PAYMENT_HOLD_INFO",
    histories: {
      content: histories,
      number: 0,
      size: 12,
      totalElements: histories.length,
      totalPages: 1,
    },
    profile: {
      accountId: `demo_${settlement.selectorsId}`,
      followerCount: 18_000 + settlement.selectorsId * 1_370,
      lastCollectedAt: settlement.updatedAt,
      profileImageUrl: null,
      selectorsCode: settlement.selectorsCode,
      selectorsId: settlement.selectorsId,
      selectorsNickname: settlement.selectorsNickname,
      snsCode: settlement.selectorsId % 2 === 0 ? "YOUTUBE" : "INSTAGRAM",
    },
    settlementSummary: {
      cumulativePaidCommission: histories.reduce(
        (total, history) => total + (history.status === "SETTLED" ? history.settlementAmount : 0),
        0,
      ),
      cumulativePurchaseConversionCount: histories.reduce(
        (total, history) => total + history.confirmedPurchaseCount,
        0,
      ),
      cumulativeSalesAmount: histories.reduce(
        (total, history) => total + history.confirmedSalesAmount,
        0,
      ),
      currentMonth: settlement.activityMonth,
      currentMonthPurchaseConversionCount: settlement.confirmedPurchaseCount,
      nextMonthScheduledCommission: scheduledForPayment ? settlement.settlementAmount : 0,
      nextPaymentMonth,
      nextPaymentSettlementStatus,
    },
  };
}
