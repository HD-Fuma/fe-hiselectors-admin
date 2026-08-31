import type { CSSProperties } from "react";
import { HsECharts, type EChartsOption } from "./HsECharts";
import { ECHARTS_TOOLTIP_STYLE } from "./chartColors";

export interface PeriodLineSeries {
  color: string;
  data: readonly number[];
  id: string;
  name: string;
}

interface PeriodLineChartProps {
  animated?: boolean;
  ariaLabel: string;
  categories: readonly string[];
  categoryLabels: readonly string[];
  className?: string;
  formatValue?: (value: number) => string;
  height: number;
  labelColor?: string;
  modeClass?: string;
  series: readonly PeriodLineSeries[];
  showValueLabels?: boolean;
  style?: CSSProperties;
  width: number;
}

export function PeriodLineChart({
  animated = false,
  ariaLabel,
  categories,
  categoryLabels,
  className = "",
  formatValue = (value) => value.toLocaleString("ko-KR"),
  height,
  labelColor = "#4b5752",
  modeClass = "all",
  series,
  showValueLabels = false,
  style,
  width,
}: PeriodLineChartProps) {
  const option: EChartsOption = {
    animation: animated,
    animationDuration: animated ? 700 : 0,
    animationEasing: "cubicOut",
    grid: {
      bottom: 28,
      left: 18,
      right: 18,
      top: 28,
      containLabel: false,
    },
    tooltip: {
      ...ECHARTS_TOOLTIP_STYLE,
      appendTo: (chartContainer: HTMLElement) => (
        chartContainer.closest<HTMLElement>(".fuma-content-period-chart__viewport")
        ?? document.body
      ),
      trigger: "axis",
      formatter: (params: unknown) => {
        const items = (Array.isArray(params) ? params : [params]) as Array<{
          axisValueLabel?: string;
          seriesName?: string;
          value?: unknown;
        }>;
        return [
          items[0]?.axisValueLabel ?? "",
          ...items.map((item) => {
            const color = series.find((entry) => entry.name === item.seriesName)?.color ?? labelColor;
            return `<span style="display:inline-block;width:8px;height:8px;margin-right:6px;border-radius:50%;background:${color}"></span>${item.seriesName ?? ""} ${formatValue(Number(item.value ?? 0))}`;
          }),
        ].filter(Boolean).join("<br/>");
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: [...categoryLabels],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: labelColor,
        fontSize: 12,
        fontWeight: 700,
        margin: 12,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      splitNumber: 2,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: {
        lineStyle: {
          color: "#e7ecea",
          type: "solid",
          width: 1,
        },
      },
    },
    series: series.map((item) => ({
      type: "line" as const,
      name: item.name,
      data: [...item.data],
      showSymbol: true,
      symbol: "circle",
      symbolSize: height < 100 ? 5 : 7,
      smooth: 0.35,
      lineStyle: {
        color: item.color,
        width: modeClass === "all" && series.length > 1 ? 2 : 3,
        opacity: seriesOpacity(modeClass, item.id, series.length),
      },
      itemStyle: {
        color: "#ffffff",
        borderColor: item.color,
        borderWidth: 2.5,
      },
      label: showValueLabels
        ? {
            show: true,
            position: "top" as const,
            color: labelColor,
            fontSize: 12,
            fontWeight: 700,
            formatter: (params: { value: unknown }) => formatValue(Number(params.value ?? 0)),
          }
        : { show: false },
      emphasis: { focus: "series" as const },
    })) as EChartsOption["series"],
  };

  return (
    <div
      aria-label={ariaLabel}
      className={`fuma-content-cohort-chart__plot fuma-echarts-period-plot is-${modeClass}${className ? ` ${className}` : ""}`}
      role="img"
      style={{ width, height, ...style }}
    >
      <HsECharts
        height={height}
        option={option}
        style={{ width: "100%", height: "100%" }}
        width={width}
      />
      {series.map((item) => (
        <span
          aria-hidden="true"
          className={`fuma-content-cohort-chart__series is-${item.id}`}
          data-series={item.id}
          key={item.id}
        >
          {categories.map((category, index) => (
            <span
              data-metric-date={category}
              data-metric-value={item.data[index] ?? 0}
              key={`${item.id}-${category}`}
            />
          ))}
        </span>
      ))}
      {categories.map((category, index) => (
        <span
          aria-hidden="true"
          className="fuma-content-cohort-chart__label"
          data-period-date={category}
          key={category}
        >
          {categoryLabels[index]}
        </span>
      ))}
    </div>
  );
}

function seriesOpacity(modeClass: string, seriesId: string, seriesCount: number) {
  if (modeClass !== "all" || seriesCount <= 1) {
    return 1;
  }
  if (seriesId === "contentCount" || seriesId === "confirmedSales") {
    return 1;
  }
  if (seriesId === "views" || seriesId === "confirmedOrderCount") {
    return 0.72;
  }
  if (seriesId === "likes" || seriesId === "soldQuantity") {
    return 0.58;
  }
  return 0.48;
}
