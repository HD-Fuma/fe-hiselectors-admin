import { describe, expect, test } from "vitest";
import type { CampaignPerformanceDetail } from "../../entities/campaign";
import {
  createCampaignPerformancePreview,
  createCampaignPerformancePreviewSelectorDetail,
  isEmptyCampaignPerformance,
} from "./campaignPerformancePreview";

const EMPTY_PERFORMANCE: CampaignPerformanceDetail = {
  campaignId: 42,
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  summary: {
    confirmedSales: 0,
    confirmedOrderCount: 0,
    soldQuantity: 0,
    contributingSelectorCount: 0,
    canceledOrReturnedOrderCount: 0,
    canceledOrReturnedRate: 0,
  },
  daily: [],
  products: [],
  selectors: [],
};

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0);
}

describe("campaign performance preview", () => {
  test("recognizes an empty API result", () => {
    expect(isEmptyCampaignPerformance(EMPTY_PERFORMANCE)).toBe(true);
  });

  test("keeps summary, trend, product, and selector totals reconciled", () => {
    const preview = createCampaignPerformancePreview(EMPTY_PERFORMANCE);

    expect(preview.daily).toHaveLength(7);
    expect(preview.daily[0].date).toBe("2026-08-01");
    expect(preview.daily.at(-1)?.date).toBe("2026-08-31");
    expect(sum(preview.daily.map((metric) => metric.confirmedSales)))
      .toBe(preview.summary.confirmedSales);
    expect(sum(preview.daily.map((metric) => metric.confirmedOrderCount)))
      .toBe(preview.summary.confirmedOrderCount);
    expect(sum(preview.daily.map((metric) => metric.soldQuantity)))
      .toBe(preview.summary.soldQuantity);
    expect(sum(preview.products.map((product) => product.confirmedSales)))
      .toBe(preview.summary.confirmedSales);
    expect(sum(preview.selectors.map((selector) => selector.confirmedSales)))
      .toBe(preview.summary.confirmedSales);
    expect(preview.selectors.every((selector) => Boolean(selector.profileImageUrl)))
      .toBe(true);

    const selectorDetail = createCampaignPerformancePreviewSelectorDetail(preview.selectors[0]);
    expect(selectorDetail.nickname).toBe(preview.selectors[0].nickname);
    expect(selectorDetail.snsAccount?.profileImageUrl)
      .toBe(preview.selectors[0].profileImageUrl);
  });
});
