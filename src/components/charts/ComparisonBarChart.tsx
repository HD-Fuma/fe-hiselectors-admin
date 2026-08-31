import { useMemo } from "react";
import { HsECharts, type EChartsOption } from "./HsECharts";
import { ECHARTS_TOOLTIP_STYLE, resolveChartColor } from "./chartColors";

export interface ComparisonBarCategory {
  hint?: string;
  label: string;
  muted?: boolean;
}

export interface ComparisonBarSeries {
  color: string;
  data: readonly number[];
  mutedColor?: string;
  name: string;
}

interface ComparisonBarChartProps {
  ariaLabel: string;
  categories: readonly ComparisonBarCategory[];
  formatValue: (value: number) => string;
  height?: number;
  series: readonly ComparisonBarSeries[];
}

export function ComparisonBarChart({
  ariaLabel,
  categories,
  formatValue,
  height = 220,
  series,
}: ComparisonBarChartProps) {
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    grid: {
      bottom: 8,
      containLabel: true,
      left: 8,
      right: 8,
      top: 28,
    },
    tooltip: {
      ...ECHARTS_TOOLTIP_STYLE,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const items = (Array.isArray(params) ? params : [params]) as Array<{
          dataIndex?: number;
          marker?: string;
          seriesName?: string;
          value?: unknown;
        }>;
        const category = categories[items[0]?.dataIndex ?? 0];
        if (!category) return "";
        const lines = items.map((item) => (
          `${item.marker ?? ""}${item.seriesName} ${formatValue(Number(item.value ?? 0))}`
        ));
        return [category.label, category.hint, ...lines].filter(Boolean).join("<br/>");
      },
    },
    xAxis: {
      type: "category",
      data: categories.map((category) => category.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#4b5752",
        fontSize: 12,
        fontWeight: 700,
        hideOverlap: true,
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      splitNumber: 2,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#4b5752",
        fontSize: 12,
        fontWeight: 700,
        formatter: (value: number) => formatValue(value),
      },
      splitLine: {
        lineStyle: { color: "#e7ecea", width: 1 },
      },
    },
    series: series.map((item) => ({
      type: "bar" as const,
      name: item.name,
      barMaxWidth: 14,
      data: item.data.map((value, index) => ({
        value,
        itemStyle: {
          color: resolveChartColor(
            categories[index]?.muted ? item.mutedColor ?? item.color : item.color,
          ),
        },
      })),
      emphasis: { focus: "series" as const },
    })),
  }), [categories, formatValue, series]);

  return (
    <div
      aria-label={ariaLabel}
      className="fuma-comparison-bar-chart"
      role="img"
      style={{ height, width: "100%" }}
    >
      <HsECharts height={height} option={option} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
