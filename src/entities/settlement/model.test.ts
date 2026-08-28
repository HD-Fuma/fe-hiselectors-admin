import { describe, expect, test } from "vitest";
import {
  apiStatusesForFilter,
  primarySettlementPaymentStatus,
  settlementHoldReason,
  settlementStatusLabel,
  settlementStatusTone,
} from "./model";

describe("settlement payment status", () => {
  test("prefers blacklist hold over pending", () => {
    expect(primarySettlementPaymentStatus([
      "PAYMENT_PENDING",
      "PAYMENT_HOLD_BLACK",
    ])).toBe("PAYMENT_HOLD_BLACK");
  });

  test("explains hold reasons", () => {
    expect(settlementHoldReason("PAYMENT_HOLD_BLACK")).toBe("블랙리스트");
    expect(settlementHoldReason("PAYMENT_HOLD_INFO")).toBe("정산 계좌 정보 없음");
    expect(settlementHoldReason("PAYMENT_PENDING")).toBeNull();
  });

  test("uses settled when there is no active payout", () => {
    expect(primarySettlementPaymentStatus([null, "SETTLED"])).toBe("SETTLED");
  });

  test("keeps list labels as 정산 보류", () => {
    expect(settlementStatusLabel("PAYMENT_HOLD_INFO")).toBe("정산 보류");
  });

  test("presents calculating payments as 집계 예정", () => {
    expect(settlementStatusLabel("CALCULATING")).toBe("집계 예정");
  });

  test("presents and filters carried-over payments", () => {
    expect(settlementStatusLabel("PAYMENT_CARRYOVER")).toBe("지급 이월");
    expect(settlementStatusTone("PAYMENT_CARRYOVER")).toBe("pending");
    expect(apiStatusesForFilter("PAYMENT_CARRYOVER")).toEqual(["PAYMENT_CARRYOVER"]);
    expect(primarySettlementPaymentStatus([
      "PAYMENT_PENDING",
      "PAYMENT_CARRYOVER",
    ])).toBe("PAYMENT_PENDING");
  });
});
