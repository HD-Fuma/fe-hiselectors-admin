import { useMemo } from "react";
import { HsECharts, type EChartsOption } from "./HsECharts";
import { ECHARTS_TOOLTIP_STYLE, resolveChartColor } from "./chartColors";

export interface AnalysisFormatSegment {
  color: string;
  count: number;
  label: string;
  percentage: number;
  start: number;
}

export interface AnalysisFormatDonutProps {
  segments: readonly AnalysisFormatSegment[];
  showTotal?: boolean;
  total: number | null;
  totalLabel?: string;
}

export function AnalysisFormatDonut({
  segments,
  showTotal = true,
  total,
  totalLabel = "전체 콘텐츠",
}: AnalysisFormatDonutProps) {
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    tooltip: {
      ...ECHARTS_TOOLTIP_STYLE,
      trigger: "item",
      formatter: (params: unknown) => {
        const item = (Array.isArray(params) ? params[0] : params) as {
          data?: { name: string; value: number; percentage: number };
        };
        const data = item.data;
        if (!data) {
          return "";
        }
        return `${data.name}<br/>${data.value.toLocaleString("ko-KR")}건 · ${data.percentage.toFixed(1)}%`;
      },
    },
    series: [
      {
        type: "pie",
        radius: ["62%", "86%"],
        center: ["50%", "50%"],
        startAngle: 90,
        silent: false,
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          scale: false,
        },
        data: segments.map((segment) => ({
          name: segment.label,
          value: segment.count,
          percentage: segment.percentage,
          itemStyle: {
            color: resolveChartColor(segment.color),
          },
        })),
      },
    ],
  }), [segments]);

  return (
    <div
      aria-label={total === null
        ? "콘텐츠 형식 합계 미수집"
        : `콘텐츠 형식 총 ${total.toLocaleString("ko-KR")}건`}
      className="fuma-analysis-format-breakdown__donut"
      role="group"
    >
      <HsECharts
        className="fuma-analysis-format-breakdown__chart"
        option={option}
        style={{ width: "100%", height: "100%" }}
      />
      {showTotal ? (
        <div className="fuma-analysis-format-breakdown__center">
          <strong>{total === null ? "-" : `${total.toLocaleString("ko-KR")}건`}</strong>
          <span>{totalLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
