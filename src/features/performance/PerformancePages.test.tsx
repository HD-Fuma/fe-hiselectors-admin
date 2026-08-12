import {
  CAMPAIGN_PERFORMANCE,
  CONTENT_INFLUENCE,
  SELECTOR_PERFORMANCE,
  formatCount,
  formatRate,
} from "../../entities/performance";

test("formats counts and conversion rates", () => {
  expect(formatCount(0)).toBe("0");
  expect(formatCount(42200)).toBe("42,200");
  expect(formatRate(0, 0)).toBe("0.00%");
  expect(formatRate(829, 24820)).toBe("3.34%");
});

test("keeps campaign totals equal to canonical content attribution", () => {
  for (const campaign of CAMPAIGN_PERFORMANCE) {
    const contents = CONTENT_INFLUENCE.filter((content) => content.campaignId === campaign.id);
    expect(contents.reduce((total, content) => total + content.clicks, 0)).toBe(campaign.clicks);
    expect(contents.reduce((total, content) => total + content.conversions, 0)).toBe(
      campaign.conversions,
    );
  }
});

test("keeps selector totals equal to canonical content groups", () => {
  for (const selector of SELECTOR_PERFORMANCE) {
    const contents = CONTENT_INFLUENCE.filter((content) => content.selectorId === selector.id);
    expect(contents.reduce((total, content) => total + content.clicks, 0)).toBe(selector.clicks);
    expect(contents.reduce((total, content) => total + content.conversions, 0)).toBe(
      selector.conversions,
    );
  }
});
