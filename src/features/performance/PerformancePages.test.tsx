import {
  buildContentVisualData,
  buildCreatorVisualData,
  buildDashboardVisualData,
} from "./PerformancePages";
import {
  CAMPAIGN_PERFORMANCE,
  CONTENT_INFLUENCE,
  CREATOR_INFLUENCE,
  SELECTOR_PERFORMANCE,
  formatCount,
  formatRate,
} from "./fixtures";

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

test("keeps creator and selector totals equal to canonical content groups", () => {
  for (const creator of CREATOR_INFLUENCE) {
    const contents = CONTENT_INFLUENCE.filter((content) => content.creatorId === creator.id);
    expect(contents.reduce((total, content) => total + content.conversions, 0)).toBe(
      creator.conversions,
    );
    expect(contents.reduce((total, content) => total + content.views, 0)).toBe(creator.views);
  }

  for (const selector of SELECTOR_PERFORMANCE) {
    const contents = CONTENT_INFLUENCE.filter((content) => content.selectorId === selector.id);
    expect(contents.reduce((total, content) => total + content.clicks, 0)).toBe(selector.clicks);
    expect(contents.reduce((total, content) => total + content.conversions, 0)).toBe(
      selector.conversions,
    );
  }
});

test("builds explicit empty summaries", () => {
  expect(buildDashboardVisualData([], [], []).kpis.map(({ value }) => value)).toEqual([
    "-",
    "-",
    "-",
    "-",
  ]);
  expect(buildCreatorVisualData([]).kpis.map(({ value }) => value)).toEqual(["-", "-", "-", "-"]);
  expect(buildContentVisualData([]).kpis.map(({ value }) => value)).toEqual(["-", "-", "-", "-"]);
});
