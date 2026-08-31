import { useMemo, type CSSProperties } from "react";
import { HsECharts, type EChartsOption } from "./HsECharts";
import { ECHARTS_TOOLTIP_STYLE } from "./chartColors";

export interface PeriodComboSeries {
  color: string;
  data: readonly number[];
  formatValue: (value: number) => string;
  id: string;
  name: string;
  type: "bar" | "line";
}

interface PeriodComboChartProps {
  ariaLabel: string;
  categories: readonly string[];
  categoryLabels: readonly string[];
  className?: string;
  height?: number;
  series: readonly PeriodComboSeries[];
  style?: CSSProperties;
}

const SLIDER_AFTER = 14;

export function PeriodComboChart({
  ariaLabel,
  categories,
  categoryLabels,
  className = "",
  height = 246,
  series,
  style,
}: PeriodComboChartProps) {
  const hasBar = series.some((item) => item.type === "bar");
  const hasLine = series.some((item) => item.type === "line");
  const dualAxis = hasBar && hasLine;
  const showSlider = categories.length > SLIDER_AFTER;
  const option = useMemo<EChartsOption>(() => {
    const formatById = new Map(series.map((item) => [item.id, item.formatValue]));
    const yAxisBase = {
      type: "value" as const,
      min: 0,
      splitNumber: 2,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#4b5752",
        fontSize: 12,
        fontWeight: 700,
        hideOverlap: true,
      },
      splitLine: {
        lineStyle: {
          color: "#e7ecea",
          type: "solid" as const,
          width: 1,
        },
      },
    };

    const barSeries = series.find((item) => item.type === "bar");
    const lineSeries = series.find((item) => item.type === "line");
    const axisNameStyle = {
      color: "#4b5752",
      fontSize: 12,
      fontWeight: 700,
    };

    return {
      animation: false,
      grid: {
        bottom: showSlider ? 52 : 28,
        containLabel: true,
        left: 8,
        right: dualAxis ? 8 : 12,
        top: 28,
      },
      tooltip: {
        ...ECHARTS_TOOLTIP_STYLE,
        axisPointer: { type: hasBar ? "shadow" : "line" },
        trigger: "axis",
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]) as Array<{
            axisValueLabel?: string;
            marker?: string;
            seriesId?: string;
            seriesName?: string;
            value?: unknown;
          }>;
          const title = items[0]?.axisValueLabel ?? "";
          const lines = items.map((item) => {
            const format = formatById.get(String(item.seriesId))
              ?? ((value: number) => value.toLocaleString("ko-KR"));
            return `${item.marker ?? ""}${item.seriesName} ${format(Number(item.value ?? 0))}`;
          });
          return [title, ...lines].join("<br/>");
        },
      },
      dataZoom: showSlider
        ? [
            {
              type: "inside",
              filterMode: "none",
              zoomOnMouseWheel: false,
              moveOnMouseMove: true,
              preventDefaultMouseMove: true,
            },
            {
              type: "slider",
              borderColor: "#e1e3e3",
              brushSelect: false,
              fillerColor: "rgba(35, 139, 120, 0.16)",
              handleStyle: { color: "#238b78" },
              height: 16,
              bottom: 8,
              textStyle: { color: "#4b5752", fontSize: 12 },
            },
          ]
        : undefined,
      xAxis: {
        type: "category",
        boundaryGap: hasBar,
        data: [...categoryLabels],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#4b5752",
          fontSize: 12,
          fontWeight: 700,
          hideOverlap: true,
          margin: 10,
        },
        splitLine: { show: false },
      },
      yAxis: dualAxis
        ? [
            {
              ...yAxisBase,
              name: barSeries?.name ?? "",
              nameGap: 8,
              nameLocation: "end",
              nameTextStyle: axisNameStyle,
              axisLabel: {
                ...yAxisBase.axisLabel,
                formatter: (value: number) => barSeries?.formatValue(value) ?? String(value),
              },
            },
            {
              ...yAxisBase,
              name: lineSeries?.name ?? "",
              nameGap: 8,
              nameLocation: "end",
              nameTextStyle: axisNameStyle,
              splitLine: { show: false },
              axisLabel: {
                ...yAxisBase.axisLabel,
                formatter: (value: number) => lineSeries?.formatValue(value) ?? String(value),
              },
            },
          ]
        : {
            ...yAxisBase,
            name: series[0]?.name ?? "",
            nameGap: 8,
            nameLocation: "end",
            nameTextStyle: axisNameStyle,
            axisLabel: {
              ...yAxisBase.axisLabel,
              formatter: (value: number) => series[0]?.formatValue(value) ?? String(value),
            },
          },
      series: series.map((item) => {
        const yAxisIndex = dualAxis && item.type === "line" ? 1 : 0;
        if (item.type === "bar") {
          return {
            type: "bar" as const,
            id: item.id,
            name: item.name,
            data: [...item.data],
            yAxisIndex,
            barMaxWidth: 16,
            itemStyle: {
              borderRadius: [2, 2, 0, 0],
              color: item.color,
            },
            emphasis: { focus: "series" as const },
          };
        }
        return {
          type: "line" as const,
          id: item.id,
          name: item.name,
          data: [...item.data],
          yAxisIndex,
          showSymbol: true,
          symbol: "circle",
          symbolSize: 6,
          smooth: 0.35,
          z: 3,
          lineStyle: { color: item.color, width: 3 },
          itemStyle: {
            color: "#ffffff",
            borderColor: item.color,
            borderWidth: 2.5,
          },
          emphasis: { focus: "series" as const },
        };
      }) as EChartsOption["series"],
    };
  }, [categoryLabels, dualAxis, hasBar, series, showSlider]);

  return (
    <div
      aria-label={ariaLabel}
      className={`fuma-echarts-period-plot fuma-period-combo-chart${className ? ` ${className}` : ""}`}
      role="img"
      style={{ height, width: "100%", ...style }}
    >
      <HsECharts height={height} option={option} style={{ width: "100%", height: "100%" }} />
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
    </div>
  );
}
