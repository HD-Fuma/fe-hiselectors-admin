import { HsECharts, type EChartsOption } from "./HsECharts";
import { COHORT_SERIES_COLORS } from "./chartColors";

interface SparklineSeries {
  data: readonly number[];
  id: "views" | "likes";
  name: string;
}

interface SparklineChartProps {
  ariaLabel: string;
  categories: readonly string[];
  categoryLabels: readonly string[];
  endLabel: string;
  series: readonly SparklineSeries[];
  startLabel: string;
}

export function SparklineChart({
  ariaLabel,
  categories,
  categoryLabels,
  endLabel,
  series,
  startLabel,
}: SparklineChartProps) {
  const accessibleSummary = categories.map((category, index) => {
    const label = categoryLabels[index] || category;
    const values = series
      .map((item) => `${item.name} ${Number(item.data[index] ?? 0).toLocaleString("ko-KR")}`)
      .join(", ");
    return `${label}: ${values}`;
  }).join(". ");

  const option: EChartsOption = {
    animation: false,
    grid: {
      bottom: 16,
      left: 8,
      right: 8,
      top: 8,
      containLabel: false,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: series[0]?.data.map((_, index) => String(index)) ?? [],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        interval: (index: number) => (
          index === 0 || index === (series[0]?.data.length ?? 1) - 1
        ),
        formatter: (value: string) => {
          const index = Number(value);
          if (index === 0) return startLabel;
          if (index === (series[0]?.data.length ?? 1) - 1) return endLabel;
          return "";
        },
        color: "#4b5752",
        fontSize: 8,
        fontWeight: 700,
        margin: 4,
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
      symbolSize: 5,
      smooth: 0.35,
      lineStyle: {
        color: COHORT_SERIES_COLORS[item.id],
        width: 2,
      },
      itemStyle: {
        color: "#ffffff",
        borderColor: COHORT_SERIES_COLORS[item.id],
        borderWidth: 2,
      },
    })) as EChartsOption["series"],
  };

  return (
    <div
      aria-label={accessibleSummary ? `${ariaLabel}. ${accessibleSummary}` : ariaLabel}
      className="fuma-content-cohort-chart__plot fuma-content-table-trend__plot fuma-echarts-period-plot is-all"
      role="img"
    >
      <HsECharts height={56} option={option} style={{ width: "100%", height: "56px" }} width={220} />
      {series.map((item) => (
        <span
          aria-hidden="true"
          className={`fuma-content-cohort-chart__series is-${item.id}`}
          data-series={item.id}
          key={item.id}
        />
      ))}
    </div>
  );
}
