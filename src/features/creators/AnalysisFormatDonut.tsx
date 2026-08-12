import { useState } from "react";

export interface AnalysisFormatSegment {
  color: string;
  count: number;
  label: string;
  percentage: number;
  start: number;
}

export function AnalysisFormatDonut({
  segments,
  total,
}: {
  segments: readonly AnalysisFormatSegment[];
  total: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const activeSegment = activeIndex === null ? null : segments[activeIndex];

  return (
    <div
      aria-label={`콘텐츠 형식 총 ${total.toLocaleString("ko-KR")}건`}
      className="fuma-analysis-format-breakdown__donut"
      role="group"
    >
      <svg className="fuma-analysis-format-breakdown__chart" viewBox="0 0 100 100">
        <circle className="fuma-analysis-format-breakdown__track" cx="50" cy="50" r={radius} />
        {segments.map((segment, index) => {
          const length = (segment.percentage / 100) * circumference;
          const offset = -(segment.start / 100) * circumference;

          return (
            <circle
              aria-label={`${segment.label} ${segment.count}건, ${segment.percentage.toFixed(1)}%`}
              className="fuma-analysis-format-breakdown__segment"
              cx="50"
              cy="50"
              key={segment.label}
              onBlur={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              r={radius}
              role="img"
              stroke={segment.color}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={offset}
              tabIndex={0}
            />
          );
        })}
      </svg>
      <div>
        <strong>{total.toLocaleString("ko-KR")}건</strong>
        <span>전체 콘텐츠</span>
      </div>
      {activeSegment ? (
        <span className="fuma-analysis-format-breakdown__tooltip" role="tooltip">
          <i aria-hidden="true" style={{ backgroundColor: activeSegment.color }} />
          <strong>{activeSegment.label}</strong>
          <span>{activeSegment.count}건 · {activeSegment.percentage.toFixed(1)}%</span>
        </span>
      ) : null}
    </div>
  );
}
