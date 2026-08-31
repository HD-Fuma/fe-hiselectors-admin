import { useMemo } from "react";
import { HsECharts, type EChartsOption } from "./HsECharts";
import { ECHARTS_TOOLTIP_STYLE, resolveChartColor } from "./chartColors";

export interface CategoryBarDatum {
  color: string;
  label: string;
  value: number;
}

interface CategoryBarChartProps {
  ariaLabel: string;
  bars: readonly CategoryBarDatum[];
  formatValue?: (value: number) => string;
  height?: number;
  name?: string;
  /** 축 라벨과 달리 값을 그대로 보여 줄 형식. tooltip과 hover 라벨에 쓴다. */
  formatDetailValue?: (value: number) => string;
  /** "hover"면 막대 위 값을 마우스를 올렸을 때만 보여 준다. */
  valueLabel?: "always" | "hover";
}

export function CategoryBarChart({
  ariaLabel,
  bars,
  formatDetailValue,
  formatValue = (value) => value.toLocaleString("ko-KR"),
  height = 200,
  name = "인원",
  valueLabel = "always",
}: CategoryBarChartProps) {
  const formatDetail = formatDetailValue ?? formatValue;
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    grid: {
      bottom: 4,
      containLabel: true,
      left: 8,
      right: 8,
      top: 24,
    },
    tooltip: {
      ...ECHARTS_TOOLTIP_STYLE,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const item = (Array.isArray(params) ? params[0] : params) as {
          name?: string;
          value?: unknown;
        };
        return `${item.name}<br/>${name} ${formatDetail(Number(item.value ?? 0))}`;
      },
    },
    xAxis: {
      type: "category",
      data: bars.map((bar) => bar.label),
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
      minInterval: 1,
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
    series: [
      {
        type: "bar" as const,
        name,
        barMaxWidth: 28,
        data: bars.map((bar) => ({
          value: bar.value,
          itemStyle: {
            borderRadius: [2, 2, 0, 0],
            color: resolveChartColor(bar.color),
          },
        })),
        label: {
          show: valueLabel === "always",
          position: "top" as const,
          color: "#65716c",
          fontSize: 12,
          fontWeight: 700,
          formatter: ({ value }: { value: unknown }) => formatValue(Number(value ?? 0)),
        },
        emphasis: {
          focus: "series" as const,
          label: {
            show: true,
            position: "top" as const,
            color: "#34423d",
            fontSize: 12,
            fontWeight: 700,
            formatter: ({ value }: { value: unknown }) => formatDetail(Number(value ?? 0)),
          },
        },
      },
    ],
  }), [bars, formatDetail, formatValue, name, valueLabel]);

  return (
    <div
      aria-label={ariaLabel}
      className="fuma-category-bar-chart"
      role="img"
      style={{ height, width: "100%" }}
    >
      <HsECharts height={height} option={option} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
