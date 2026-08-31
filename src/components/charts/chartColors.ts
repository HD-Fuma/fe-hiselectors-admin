const CSS_VAR_COLOR_FALLBACKS: Record<string, string> = {
  "var(--fuma-content-format-1)": "#238b78",
  "var(--fuma-content-format-2)": "#6ba99d",
  "var(--fuma-content-format-3)": "#a9cbc4",
  "var(--fuma-content-format-4)": "#536963",
  "var(--fuma-content-format-5)": "#a8b1ae",
};

/** ECharts canvas cannot paint CSS variables; map known tokens to hex. */
export function resolveChartColor(color: string): string {
  return CSS_VAR_COLOR_FALLBACKS[color] ?? color;
}

export const COHORT_SERIES_COLORS = {
  contentCount: "#536963",
  views: "#6ba99d",
  likes: "#9bc6bd",
  comments: "#bfd8d2",
  confirmedSales: "#536963",
  confirmedOrderCount: "#6ba99d",
  soldQuantity: "#9bc6bd",
} as const;

export const ECHARTS_FONT_FAMILY =
  '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", Arial, sans-serif';

/** Axis/legend label size — below body (13) and table (14), readable for demos. */
export const ECHARTS_LABEL_FONT_SIZE = 12;

export const ECHARTS_TOOLTIP_STYLE = {
  backgroundColor: "#303030",
  borderColor: "#303030",
  borderRadius: 7,
  textStyle: {
    color: "#fff",
    fontFamily: ECHARTS_FONT_FAMILY,
    fontSize: ECHARTS_LABEL_FONT_SIZE,
  },
} as const;

export type CohortSeriesColorKey = keyof typeof COHORT_SERIES_COLORS;
