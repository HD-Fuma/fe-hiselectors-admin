import { useMemo } from "react";
import { HsECharts, type EChartsOption } from "./HsECharts";
import { ECHARTS_TOOLTIP_STYLE, resolveChartColor } from "./chartColors";

export interface BoxplotCategory {
  color: string;
  label: string;
  outliers: readonly number[];
  value: readonly [number, number, number, number, number];
}

interface BoxplotChartProps {
  ariaLabel: string;
  categories: readonly BoxplotCategory[];
  formatValue: (value: number) => string;
  height?: number;
}

export function BoxplotChart({
  ariaLabel,
  categories,
  formatValue,
  height = 220,
}: BoxplotChartProps) {
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    grid: {
      bottom: 8,
      containLabel: true,
      left: 8,
      right: 8,
      top: 16,
    },
    tooltip: {
      ...ECHARTS_TOOLTIP_STYLE,
      trigger: "item",
      formatter: (params: unknown) => {
        const item = params as {
          dataIndex?: number;
          seriesType?: string;
          value?: unknown;
        };
        const category = categories[item.dataIndex ?? -1];
        if (item.seriesType === "scatter") {
          const point = Array.isArray(item.value) ? item.value : [];
          const outlierCategory = categories[Number(point[0])];
          if (!outlierCategory) return "";
          return `${outlierCategory.label}<br/>이상치 ${formatValue(Number(point[1] ?? 0))}`;
        }
        const value = Array.isArray(item.value) ? item.value.map(Number) : [];
        const box = value.length >= 6 ? value.slice(1, 6) : value;
        if (!category || box.length < 5) return "";
        return [
          category.label,
          `최소 ${formatValue(box[0] ?? 0)}`,
          `1사분위 ${formatValue(box[1] ?? 0)}`,
          `중앙 ${formatValue(box[2] ?? 0)}`,
          `3사분위 ${formatValue(box[3] ?? 0)}`,
          `최대 ${formatValue(box[4] ?? 0)}`,
        ].join("<br/>");
      },
    },
    xAxis: {
      type: "category",
      data: categories.map((category) => category.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#4b5752",
        fontSize: 9,
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
        fontSize: 9,
        fontWeight: 700,
        formatter: (value: number) => formatValue(value),
      },
      splitLine: {
        lineStyle: { color: "#e7ecea", width: 1 },
      },
    },
    series: [
      {
        type: "boxplot" as const,
        name: "매출 분포",
        data: categories.map((category) => ({
          value: [...category.value],
          itemStyle: {
            borderColor: resolveChartColor(category.color),
            color: resolveChartColor(category.color),
          },
        })),
      },
      {
        type: "scatter" as const,
        name: "이상치",
        symbolSize: 7,
        data: categories.flatMap((category, index) => (
          category.outliers.map((value) => ({
            value: [index, value],
            itemStyle: {
              color: resolveChartColor(category.color),
            },
          }))
        )),
      },
    ],
  }), [categories, formatValue]);

  return (
    <div
      aria-label={ariaLabel}
      className="fuma-boxplot-chart"
      role="img"
      style={{ height, width: "100%" }}
    >
      <HsECharts height={height} option={option} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
