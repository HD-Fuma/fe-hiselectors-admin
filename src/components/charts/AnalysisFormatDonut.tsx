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
  animated?: boolean;
  segments: readonly AnalysisFormatSegment[];
  /** 조각마다 지시선을 뽑아 형식 이름과 비율을 적는다. 도넛에 여백이 있을 때만 켠다. */
  showSegmentLabels?: boolean;
  showTotal?: boolean;
  total: number | null;
  totalLabel?: string;
}

export function AnalysisFormatDonut({
  animated = false,
  segments,
  showSegmentLabels = false,
  showTotal = true,
  total,
  totalLabel = "전체 콘텐츠",
}: AnalysisFormatDonutProps) {
  const option = useMemo<EChartsOption>(() => ({
    animation: animated,
    animationDuration: animated ? 700 : 0,
    animationEasing: "cubicOut",
    tooltip: {
      ...ECHARTS_TOOLTIP_STYLE,
      appendTo: "body",
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
        radius: showSegmentLabels ? ["44%", "62%"] : ["62%", "86%"],
        center: ["50%", "50%"],
        startAngle: 90,
        silent: false,
        label: showSegmentLabels
          ? {
            show: true,
            color: "#4b5752",
            fontSize: 12,
            fontWeight: 700,
            formatter: "{b}\n{d}%",
            lineHeight: 16,
          }
          : { show: false },
        labelLine: showSegmentLabels
          ? { show: true, length: 12, length2: 12, lineStyle: { color: "#c6d0cc" } }
          : { show: false },
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
  }), [animated, segments, showSegmentLabels]);

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
