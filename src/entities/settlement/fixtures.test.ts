import { expect, test } from "vitest";
import {
  getDemoSettlementPage,
  getDemoSettlementSelectorDetail,
} from "./fixtures";

test("keeps demo payout summaries consistent with backend status semantics", () => {
  const settlements = getDemoSettlementPage({
    activityMonth: "2026-08",
    page: 0,
    size: 100,
  }).content;
  const settled = settlements.find((settlement) => settlement.status === "SETTLED");
  const pending = settlements.find((settlement) => settlement.status === "PAYMENT_PENDING");
  const carryover = settlements.find((settlement) => settlement.status === "PAYMENT_CARRYOVER");

  expect(settled).toBeDefined();
  expect(pending).toBeDefined();
  expect(carryover).toBeDefined();
  if (!settled || !pending || !carryover) throw new Error("demo statuses are incomplete");

  const settledDetail = getDemoSettlementSelectorDetail(settled);
  expect(settledDetail.settlementSummary).toMatchObject({
    nextMonthScheduledCommission: 0,
    nextPaymentMonth: null,
    nextPaymentSettlementStatus: null,
  });
  expect(settledDetail.settlementSummary.cumulativePaidCommission).toBe(
    settledDetail.histories.content.reduce(
      (total, history) => total + (history.status === "SETTLED" ? history.settlementAmount : 0),
      0,
    ),
  );

  expect(getDemoSettlementSelectorDetail(pending).settlementSummary).toMatchObject({
    nextMonthScheduledCommission: pending.settlementAmount,
    nextPaymentMonth: pending.paymentMonth,
    nextPaymentSettlementStatus: "PAYMENT_PENDING",
  });
  expect(getDemoSettlementSelectorDetail(carryover).settlementSummary).toMatchObject({
    nextMonthScheduledCommission: carryover.settlementAmount,
    nextPaymentMonth: null,
    nextPaymentSettlementStatus: "PAYMENT_CARRYOVER",
  });
});
